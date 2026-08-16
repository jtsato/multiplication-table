import { useEffect, useRef, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CapsuleCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier';
import { Vector3, type Group } from 'three';
import { touchAxes } from '../../shared/input';
import { useHeldKeys } from '../../shared/keyboard';
import { palette } from '../../shared/palette';
import {
  PLAYER,
  axesToDirection,
  facingAngle,
  followCameraTarget,
  lerpAngle,
  smoothingFactor,
  type MoveInput,
} from './player.logic';
import { playerTransform } from './playerTransform';

/**
 * Vetores reaproveitados entre quadros.
 *
 * Alocar `Vector3` dentro de `useFrame` gera lixo 60 vezes por segundo e leva a
 * pausas de coleta perceptiveis como engasgo.
 */
const cameraTarget = new Vector3();
const lookAtTarget = new Vector3();

/**
 * Mapa de teclas do jogo inteiro.
 *
 * WASD anda e as setas laterais giram a camera. Q/E ficam de fora de proposito:
 * E e a tecla de interagir (Fatia 2) e B a de construir (Fatia 4) — girar a
 * camera com a mesma tecla que coleta recurso seria um conflito silencioso.
 */
const MOVE_KEYS = {
  forward: ['KeyW'],
  back: ['KeyS'],
  left: ['KeyA'],
  right: ['KeyD'],
} as const;

const ROTATE_LEFT_KEYS = ['ArrowLeft'];
const ROTATE_RIGHT_KEYS = ['ArrowRight'];

function readMoveInput(held: Set<string>): MoveInput {
  return {
    forward: MOVE_KEYS.forward.some((code) => held.has(code)),
    back: MOVE_KEYS.back.some((code) => held.has(code)),
    left: MOVE_KEYS.left.some((code) => held.has(code)),
    right: MOVE_KEYS.right.some((code) => held.has(code)),
  };
}

/**
 * Gira a camera arrastando o mouse.
 *
 * O arrasto so comeca sobre o proprio canvas — assim clicar num botao do HUD ou
 * no painel de desafio (Fatia 3) nao gira a cena junto.
 */
function usePointerYaw(yawRef: RefObject<number>) {
  useEffect(() => {
    // Guarda o dedo/ponteiro que iniciou o arrasto. Sem isso, no celular o
    // polegar do joystick tambem giraria a camera: os dois dedos emitem
    // `pointermove` na janela e o segundo sobrescreveria a referencia do
    // primeiro, fazendo a camera saltar a cada movimento.
    let dragPointerId: number | null = null;
    let lastX = 0;

    const onPointerDown = (event: PointerEvent) => {
      // So o canvas gira a camera; o joystick e os botoes ficam de fora.
      if (!(event.target instanceof HTMLCanvasElement)) return;
      if (dragPointerId !== null) return;
      dragPointerId = event.pointerId;
      lastX = event.clientX;
    };
    const onPointerMove = (event: PointerEvent) => {
      if (dragPointerId !== event.pointerId) return;
      // O dedo percorre menos pixels que o mouse: o toque precisa girar mais
      // por pixel para a camera nao parecer travada.
      const sensitivity =
        event.pointerType === 'touch'
          ? PLAYER.touchYawSensitivity
          : PLAYER.pointerYawSensitivity;
      yawRef.current += (event.clientX - lastX) * sensitivity;
      lastX = event.clientX;
    };
    const stop = (event: PointerEvent) => {
      if (dragPointerId !== event.pointerId) return;
      dragPointerId = null;
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);

    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
    };
  }, [yawRef]);
}

/** Boneco low poly: capsula, cabeca e uma aba que marca a frente. */
function PlayerAvatar() {
  return (
    <group>
      <mesh position={[0, 0, 0]} castShadow>
        <capsuleGeometry args={[PLAYER.radius, PLAYER.halfHeight * 2, 4, 8]} />
        <meshLambertMaterial color={palette.playerBody} flatShading />
      </mesh>
      {/*
        A cabeca fica acima do topo da capsula.

        A capsula tem meia-altura 0.8 (0.4 de raio + 0.4 de meia-altura do
        cilindro). Na primeira versao a cabeca estava em y = 0.72, ou seja
        *dentro* do corpo — o personagem aparecia como uma garrafa sem cabeca.
      */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <icosahedronGeometry args={[0.32, 0]} />
        <meshLambertMaterial color={palette.playerHead} flatShading />
      </mesh>
      {/* Aba do chapeu apontando para +Z: mostra para onde o personagem encara. */}
      <mesh position={[0, 1.22, 0.16]} castShadow>
        <boxGeometry args={[0.56, 0.09, 0.42]} />
        <meshLambertMaterial color={palette.fire} flatShading />
      </mesh>
    </group>
  );
}

export function PlayerView() {
  const bodyRef = useRef<RapierRigidBody>(null);
  const avatarRef = useRef<Group>(null);
  const yawRef = useRef(0);

  const heldKeys = useHeldKeys();
  const camera = useThree((state) => state.camera);

  usePointerYaw(yawRef);

  useFrame((_, rawDelta) => {
    const body = bodyRef.current;
    if (!body) return;

    // Um `delta` gigante (aba que voltou do background) teleportaria o jogador.
    const delta = Math.min(rawDelta, 0.05);
    const held = heldKeys.current;

    // 1. Giro da camera pelo teclado (o arrasto do mouse ja escreveu no ref).
    if (ROTATE_LEFT_KEYS.some((code) => held.has(code))) {
      yawRef.current += PLAYER.keyboardYawSpeed * delta;
    }
    if (ROTATE_RIGHT_KEYS.some((code) => held.has(code))) {
      yawRef.current -= PLAYER.keyboardYawSpeed * delta;
    }
    const yaw = yawRef.current;

    // 2. Movimento: teclado e toque somados no mesmo par de eixos, entao os dois
    //    passam pela mesma conversao. `axesToDirection` limita a magnitude a 1,
    //    logo usar os dois ao mesmo tempo nao anda mais rapido.
    const move = readMoveInput(held);
    const axisX = (move.right ? 1 : 0) - (move.left ? 1 : 0) + touchAxes.x;
    const axisZ = (move.back ? 1 : 0) - (move.forward ? 1 : 0) + touchAxes.z;
    const direction = axesToDirection(axisX, axisZ, yaw);
    const velocity = body.linvel();
    body.setLinvel(
      { x: direction.x * PLAYER.speed, y: velocity.y, z: direction.z * PLAYER.speed },
      true,
    );

    // 3. Publica a posicao viva para as demais slices lerem no mesmo quadro.
    const translation = body.translation();
    playerTransform.x = translation.x;
    playerTransform.y = translation.y;
    playerTransform.z = translation.z;
    playerTransform.yaw = yaw;

    // 4. O avatar encara a direcao do movimento (o corpo fisico tem rotacao travada).
    if (avatarRef.current && (direction.x !== 0 || direction.z !== 0)) {
      avatarRef.current.rotation.y = lerpAngle(
        avatarRef.current.rotation.y,
        facingAngle(direction),
        smoothingFactor(12, delta),
      );
    }

    // 5. Camera seguidora com suavizacao independente de framerate.
    const desired = followCameraTarget(playerTransform, yaw);
    cameraTarget.set(desired.x, desired.y, desired.z);
    camera.position.lerp(cameraTarget, smoothingFactor(PLAYER.cameraStiffness, delta));
    lookAtTarget.set(
      playerTransform.x,
      playerTransform.y + PLAYER.cameraLookAtHeight,
      playerTransform.z,
    );
    camera.lookAt(lookAtTarget);
  });

  return (
    <RigidBody
      ref={bodyRef}
      position={[0, 2, 0]}
      colliders={false}
      // Sem isto o corpo tomba ao esbarrar em qualquer coisa.
      lockRotations
      // O personagem para na hora em que a tecla e solta; o atrito do solver
      // deixaria um deslize residual.
      linearDamping={0.6}
      friction={0.2}
      mass={1}
    >
      <CapsuleCollider args={[PLAYER.halfHeight, PLAYER.radius]} />
      <group ref={avatarRef}>
        <PlayerAvatar />
      </group>
    </RigidBody>
  );
}

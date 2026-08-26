import { useEffect, useRef, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CapsuleCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier';
import { Vector3, type Group } from 'three';
import { useGameStore } from '../../app/store';
import { CLOTHES_COLORS, SKIN_TONES } from '../avatar/avatar.logic';
import { touchAxes } from '../../shared/input';
import { playSound } from '../../shared/audio';
import { STEP_DISTANCE_METERS, stepSoundFor } from '../../shared/terrain';
import { useHeldKeys } from '../../shared/keyboard';
import { palette } from '../../shared/palette';
import { regionAt } from '../regions/regions.logic';
import {
  PLAYER,
  axesToDirection,
  facingAngle,
  followCameraTarget,
  lerpAngle,
  playerSpeed,
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
      // por pixel para a camera nao parecer travada. A preferência do jogador
      // multiplica os dois.
      const baseSensitivity =
        event.pointerType === 'touch' ? PLAYER.touchYawSensitivity : PLAYER.pointerYawSensitivity;
      const sensitivity = baseSensitivity * useGameStore.getState().cameraSensitivity;
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

/**
 * Boneco low poly, vestido conforme a escolha da crianca.
 *
 * Tudo e cor de material e primitiva do Three — nenhum asset novo. A silhueta
 * muda so a forma do corpo e o cabelo; **nenhum acessorio depende dela**, o que
 * tem teste proprio na slice de avatar.
 *
 * Passa pelo React de proposito: a aparencia muda quando a crianca escolhe, o
 * que e raro, e nao a cada quadro.
 */
function PlayerAvatar() {
  const avatar = useGameStore((state) => state.avatar);
  const pele = SKIN_TONES[avatar.skin];
  const roupa = CLOTHES_COLORS[avatar.clothes];
  const menina = avatar.silhouette === 'menina';

  return (
    <group>
      {/* Corpo. A silhueta "menina" e um tronco levemente mais estreito com uma
          saia curta na base; a diferenca e de leitura, nao de capacidade. */}
      <mesh position={[0, 0, 0]} castShadow>
        <capsuleGeometry
          args={[PLAYER.radius * (menina ? 0.92 : 1), PLAYER.halfHeight * 2, 4, 8]}
        />
        <meshLambertMaterial color={roupa} flatShading />
      </mesh>
      {menina && (
        <mesh position={[0, -0.42, 0]} castShadow>
          <coneGeometry args={[PLAYER.radius * 1.5, 0.5, 8]} />
          <meshLambertMaterial color={roupa} flatShading />
        </mesh>
      )}

      {/*
        A cabeca fica acima do topo da capsula.

        A capsula tem meia-altura 0.8 (0.4 de raio + 0.4 de meia-altura do
        cilindro). Na primeira versao a cabeca estava em y = 0.72, ou seja
        *dentro* do corpo — o personagem aparecia como uma garrafa sem cabeca.
      */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <icosahedronGeometry args={[0.32, 0]} />
        <meshLambertMaterial color={pele} flatShading />
      </mesh>

      {/* Rosto: dois olhos e um sorriso low-poly. Sem isto o personagem era um
          manequim; com isto ele tem expressão e a criança se reconhece nele. */}
      <mesh position={[-0.11, 1.1, 0.27]}>
        <boxGeometry args={[0.06, 0.07, 0.02]} />
        <meshLambertMaterial color={palette.glasses} flatShading />
      </mesh>
      <mesh position={[0.11, 1.1, 0.27]}>
        <boxGeometry args={[0.06, 0.07, 0.02]} />
        <meshLambertMaterial color={palette.glasses} flatShading />
      </mesh>
      <mesh position={[0, 1.0, 0.29]} rotation={[0, 0, 0.08]}>
        <boxGeometry args={[0.17, 0.03, 0.02]} />
        <meshLambertMaterial color={palette.trunk} flatShading />
      </mesh>

      {/* Cabelo: mais volume na silhueta "menina", mesma cor nas duas. */}
      <mesh position={[0, 1.16, menina ? -0.06 : 0]} castShadow>
        <sphereGeometry args={[menina ? 0.36 : 0.3, 8, 6, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
        <meshLambertMaterial color={palette.playerHair} flatShading />
      </mesh>

      {/* Acessorio de cabeca. */}
      {avatar.head === 'bone' && (
        <group position={[0, 1.3, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.3, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshLambertMaterial color={roupa} flatShading />
          </mesh>
          <mesh position={[0, -0.02, 0.28]} castShadow>
            <boxGeometry args={[0.5, 0.07, 0.34]} />
            <meshLambertMaterial color={roupa} flatShading />
          </mesh>
        </group>
      )}
      {avatar.head === 'chapeu' && (
        <group position={[0, 1.32, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.24, 0.26, 0.3, 8]} />
            <meshLambertMaterial color={palette.trunk} flatShading />
          </mesh>
          <mesh position={[0, -0.14, 0]} castShadow>
            <cylinderGeometry args={[0.48, 0.48, 0.05, 10]} />
            <meshLambertMaterial color={palette.trunk} flatShading />
          </mesh>
        </group>
      )}
      {avatar.head === 'coroa' && (
        <group position={[0, 1.36, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.29, 0.29, 0.14, 8, 1, true]} />
            <meshLambertMaterial color={palette.crown} flatShading side={2} />
          </mesh>
          {[0, 1, 2, 3, 4].map((i) => {
            const angulo = (i / 5) * Math.PI * 2;
            return (
              <mesh
                key={i}
                position={[Math.cos(angulo) * 0.29, 0.13, Math.sin(angulo) * 0.29]}
                castShadow
              >
                <coneGeometry args={[0.07, 0.16, 4]} />
                <meshLambertMaterial color={palette.crown} flatShading />
              </mesh>
            );
          })}
        </group>
      )}

      {/* Oculos: duas lentes e a ponte, na frente do rosto (+Z). */}
      {avatar.face === 'oculos' && (
        <group position={[0, 1.06, 0.28]}>
          {[-0.13, 0.13].map((offset) => (
            <mesh key={offset} position={[offset, 0, 0]}>
              <boxGeometry args={[0.18, 0.14, 0.04]} />
              <meshBasicMaterial color={palette.glasses} />
            </mesh>
          ))}
          <mesh>
            <boxGeometry args={[0.1, 0.03, 0.03]} />
            <meshBasicMaterial color={palette.glasses} />
          </mesh>
        </group>
      )}
    </group>
  );
}

export function PlayerView() {
  const bodyRef = useRef<RapierRigidBody>(null);
  const avatarRef = useRef<Group>(null);
  const yawRef = useRef(0);
  const stepDistanceRef = useRef(0);

  const heldKeys = useHeldKeys();
  const camera = useThree((state) => state.camera);

  usePointerYaw(yawRef);

  /**
   * Registra o teleporte na ponte de depuracao.
   *
   * `PlayerView` e o unico lugar com acesso ao corpo do Rapier. Zera a
   * velocidade junto: sem isso o corpo chegaria no destino ainda deslizando.
   */
  useEffect(() => {
    if (typeof window === 'undefined' || !window.__tabuada) return;
    window.__tabuada.teleportar = (x, z) => {
      const groundY = regionAt({ x, y: 0, z })?.groundY ?? 0;
      bodyRef.current?.setTranslation({ x, y: groundY + 1.2, z }, true);
      bodyRef.current?.setLinvel({ x: 0, y: 0, z: 0 }, true);
    };
  }, []);

  useFrame((_, rawDelta) => {
    const body = bodyRef.current;
    if (!body) return;

    // Um `delta` gigante (aba que voltou do background) teleportaria o jogador.
    const delta = Math.min(rawDelta, 0.05);
    const held = heldKeys.current;

    // 1. Giro da camera pelo teclado (o arrasto do mouse ja escreveu no ref).
    const sensitivity = useGameStore.getState().cameraSensitivity;
    if (ROTATE_LEFT_KEYS.some((code) => held.has(code))) {
      yawRef.current += PLAYER.keyboardYawSpeed * sensitivity * delta;
    }
    if (ROTATE_RIGHT_KEYS.some((code) => held.has(code))) {
      yawRef.current -= PLAYER.keyboardYawSpeed * sensitivity * delta;
    }
    const yaw = yawRef.current;

    // 2. Movimento: teclado e toque somados no mesmo par de eixos, entao os dois
    //    passam pela mesma conversao. `axesToDirection` limita a magnitude a 1,
    //    logo usar os dois ao mesmo tempo nao anda mais rapido.
    const move = readMoveInput(held);
    const axisX = (move.right ? 1 : 0) - (move.left ? 1 : 0) + touchAxes.x;
    const axisZ = (move.back ? 1 : 0) - (move.forward ? 1 : 0) + touchAxes.z;
    const direction = axesToDirection(axisX, axisZ, yaw);
    // Lido do store dentro do quadro, como manda a regra: `getState()`, nunca
    // hook seletor. As botas mudam uma vez na partida, mas ler aqui evita mais
    // um assinante do store nesta view.
    const speed = playerSpeed(useGameStore.getState().owned.includes('botas'));
    const velocity = body.linvel();
    body.setLinvel({ x: direction.x * speed, y: velocity.y, z: direction.z * speed }, true);

    // 3. Publica a posicao viva para as demais slices lerem no mesmo quadro.
    const translation = body.translation();
    playerTransform.x = translation.x;
    playerTransform.y = translation.y;
    playerTransform.z = translation.z;
    playerTransform.yaw = yaw;

    // 3b. Passos: a cada `STEP_DISTANCE_METERS` andados, toca o som da
    //     superficie atual (areia, grama, madeira ou pedra).
    if (direction.x !== 0 || direction.z !== 0) {
      stepDistanceRef.current += speed * delta;
      if (stepDistanceRef.current >= STEP_DISTANCE_METERS) {
        stepDistanceRef.current = 0;
        const surface = stepSoundFor(regionAt(playerTransform)?.id ?? null);
        if (surface) playSound(surface);
      }
    } else {
      stepDistanceRef.current = 0;
    }

    // 4. O avatar encara a direcao do movimento (o corpo fisico tem rotacao travada).
    if (avatarRef.current && (direction.x !== 0 || direction.z !== 0)) {
      avatarRef.current.rotation.y = lerpAngle(
        avatarRef.current.rotation.y,
        facingAngle(direction),
        smoothingFactor(12, delta),
      );
    }

    // 5. Camera seguidora com suavizacao independente de framerate.
    const zoom = useGameStore.getState().cameraZoom;
    const desired = followCameraTarget(playerTransform, yaw, PLAYER.cameraDistance * zoom);
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

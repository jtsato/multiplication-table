import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { useGameStore } from '../../app/store';
import { useGameAction } from '../../shared/input';
import { palette } from '../../shared/palette';
import { playerTransform } from '../player/playerTransform';
import { BridgeGuardView } from './BridgeGuardView';
import {
  BRIDGES,
  bridgeAnchors,
  bridgeById,
  bridgeChallengeTarget,
  type Bridge,
} from './bridges.logic';
import { regionAt } from './regions.logic';

/** Publicacao para o HUD: 4 Hz basta para "voce esta no Bosque". */
const PUBLISH_INTERVAL = 0.25;

/** Distancia para a ponte se oferecer a ser comprada. */
const BRIDGE_RANGE = 4.5;

/** Largura do tabuleiro. Larga o bastante para nao dar medo de cair. */
const DECK_WIDTH = 3.2;

interface Traçado {
  ponte: Bridge;
  /** Meio do vao, onde o tabuleiro e a placa ficam. */
  meio: readonly [number, number, number];
  comprimento: number;
  angulo: number;
  /** Inclinacao, quando as duas margens tem alturas diferentes. */
  rampa: number;
}

function tracar(ponte: Bridge): Traçado {
  const { from, to } = bridgeAnchors(ponte);
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const vao = Math.hypot(dx, dz);

  return {
    ponte,
    meio: [(from.x + to.x) / 2, (from.y + to.y) / 2, (from.z + to.z) / 2] as const,
    comprimento: vao,
    angulo: Math.atan2(dz, dx),
    // Angulo da subida: a ponte e a rampa que vence o desnivel entre margens.
    rampa: Math.atan2(to.y - from.y, vao),
  };
}

/**
 * Uma ponte fechada continua visivel — so que como duas pilastras e nada entre
 * elas.
 *
 * Esconder a ponte que ainda nao se pode comprar deixaria a agua parecendo o fim
 * do mundo. Vendo a pilastra do outro lado, a crianca sabe que ha para onde ir,
 * e o portao vira promessa em vez de parede.
 */
function ClosedBridge({ tracado }: { tracado: Traçado }) {
  const { meio, comprimento, angulo } = tracado;

  return (
    <group position={meio} rotation={[0, -angulo, 0]}>
      {[-1, 1].map((lado) => (
        <mesh key={lado} position={[(lado * comprimento) / 2, 0.4, 0]} castShadow>
          <boxGeometry args={[1, 1.6, 1.4]} />
          <meshLambertMaterial color={palette.rock} flatShading />
        </mesh>
      ))}
    </group>
  );
}

/** A ponte aberta: tabuleiro, guardas e o colisor que sustenta quem atravessa. */
function OpenBridge({ tracado }: { tracado: Traçado }) {
  const { meio, comprimento, angulo, rampa } = tracado;
  // O tabuleiro inclinado e mais longo que o vao no plano.
  const deck = comprimento / Math.cos(rampa);

  return (
    <RigidBody type="fixed" colliders={false} position={meio} rotation={[0, -angulo, -rampa]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[deck, 0.3, DECK_WIDTH]} />
        <meshLambertMaterial color={palette.bridgeDeck} flatShading />
      </mesh>

      {/* Guardas baixas e finas. Na primeira versao eram altas e grossas, e a
          ponte lia como um cocho: de dentro dela a crianca via duas paredes em
          vez de um caminho por cima da agua. */}
      {[-1, 1].map((lado) => (
        <mesh key={lado} position={[0, 0.32, (lado * (DECK_WIDTH - 0.14)) / 2]} castShadow>
          <boxGeometry args={[deck, 0.34, 0.14]} />
          <meshLambertMaterial color={palette.bridgeRail} flatShading />
        </mesh>
      ))}

      {/* O colisor cobre o tabuleiro; as guardas sao so enfeite, para nao
          transformar a travessia num corredor apertado de fisica. */}
      <CuboidCollider args={[deck / 2, 0.15, DECK_WIDTH / 2]} />
    </RigidBody>
  );
}

/**
 * As pontes e a leitura de onde a crianca esta.
 *
 * A regiao atual **nao** e derivada da posicao durante o render: `playerTransform`
 * vive fora do React, e ler dele num seletor faria o HUD re-renderizar 60 vezes
 * por segundo. Aqui a posicao e lida dentro do `useFrame` e publicada a 4 Hz,
 * com guarda de igualdade no store.
 */
export function RegionsView() {
  const openBridges = useGameStore((state) => state.openBridges);
  const tracados = useMemo(() => BRIDGES.map(tracar), []);

  // Ref, e nao variavel do corpo do componente: uma variavel comum voltaria a
  // zero a cada render e a publicacao passaria a acontecer quase todo quadro,
  // que e exatamente o que o intervalo existe para evitar.
  const publishTimerRef = useRef(0);

  useFrame((_, delta) => {
    publishTimerRef.current += delta;
    if (publishTimerRef.current < PUBLISH_INTERVAL) return;
    publishTimerRef.current = 0;

    const state = useGameStore.getState();

    const regiao = regionAt(playerTransform);
    if (regiao) state.publishRegion(regiao.id);

    // A ponte mais proxima que ainda nao foi comprada — as compradas nao tem
    // mais nada a oferecer.
    let perto: string | null = null;
    let menorDistancia = BRIDGE_RANGE;
    for (const { ponte, meio } of tracados) {
      if (state.openBridges.includes(ponte.id)) continue;
      const distancia = Math.hypot(playerTransform.x - meio[0], playerTransform.z - meio[2]);
      if (distancia < menorDistancia) {
        menorDistancia = distancia;
        perto = ponte.id;
      }
    }
    state.setNearbyBridge(perto);
  });

  useGameAction('interagir', () => {
    const state = useGameStore.getState();
    // Recurso, movel e fogueira vem antes: a ponte e a unica coisa que se compra
    // no meio do nada, entao ela cede a vez para tudo que estiver junto.
    if (state.activeChallenge || state.highlightedNodeId || state.nearbySpot) return;
    if (!state.nearbyBridge) return;
    const ponte = bridgeById(state.nearbyBridge);
    if (!ponte) return;
    // A guardia cobra uma conta antes de liberar a compra; errar nao custa nada.
    state.startChallenge(bridgeChallengeTarget(ponte), 'pedagio');
  });

  return (
    <>
      {tracados.map((tracado) =>
        openBridges.includes(tracado.ponte.id) ? (
          <OpenBridge key={tracado.ponte.id} tracado={tracado} />
        ) : (
          <group key={tracado.ponte.id}>
            <ClosedBridge tracado={tracado} />
            {/* A guardia so existe enquanto ha pedagio a cobrar. */}
            <BridgeGuardView ponte={tracado.ponte} />
          </group>
        ),
      )}
    </>
  );
}

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Instance, Instances } from '@react-three/drei';
import type { Mesh } from 'three';
import { useGameStore } from '../../app/store';
import { useGameAction } from '../../shared/input';
import { palette } from '../../shared/palette';
import { distanceSqXZ } from '../../shared/vec';
import { playerTransform } from '../player';
import {
  ITEM_COLOR,
  ITEM_SHAPE,
  NODE_BASE,
  type FormaDeBase,
  type FormaDeItem,
} from './resources.look';
import { BASE_RADIUS } from './resources.logic';
import {
  RESOURCES,
  RESOURCE_KINDS,
  itemPlacements,
  nearestNodeInRange,
  type ResourceKind,
  type ResourceNode,
} from './resources.logic';

/** Pre-calculado: a comparacao roda uma vez por quadro. */
const CANCEL_RANGE_SQ = RESOURCES.cancelRange * RESOURCES.cancelRange;

/** A geometria do item contavel, escolhida pela forma do tipo. */
function GeometriaDoItem({ forma }: { forma: FormaDeItem }) {
  switch (forma) {
    case 'graveto':
      return <boxGeometry args={[0.12, 0.34, 0.12]} />;
    case 'bolinha':
      return <icosahedronGeometry args={[0.16, 0]} />;
    case 'pedrinha':
      return <dodecahedronGeometry args={[0.16, 0]} />;
    case 'lasca':
      return <octahedronGeometry args={[0.17, 0]} />;
    case 'pote':
      return <cylinderGeometry args={[0.12, 0.14, 0.24, 6]} />;
    case 'chapeu':
      return <coneGeometry args={[0.17, 0.26, 7]} />;
    default:
      return <icosahedronGeometry args={[0.16, 0]} />;
  }
}

/**
 * A geometria sai do mesmo `BASE_RADIUS` que posiciona os itens.
 *
 * Se a base fosse desenhada com um raio proprio, ela poderia crescer e voltar a
 * engolir os itens sem nenhum teste perceber — o teste mede posicao, nao pixel.
 */
function GeometriaDaBase({ forma, raio }: { forma: FormaDeBase; raio: number }) {
  switch (forma) {
    case 'moita':
      return <icosahedronGeometry args={[raio, 0]} />;
    case 'rocha':
      return <dodecahedronGeometry args={[raio, 0]} />;
    case 'monte':
      return <coneGeometry args={[raio, 0.7, 7]} />;
    case 'barril':
      return <cylinderGeometry args={[raio * 0.9, raio, 0.9, 8]} />;
    case 'cristal':
      return <octahedronGeometry args={[raio, 0]} />;
    default:
      return <icosahedronGeometry args={[raio, 0]} />;
  }
}

/** Base (tronco, moita, rocha, barril...) de um no. */
function NodeBase({ node, highlighted }: { node: ResourceNode; highlighted: boolean }) {
  const { x, y, z } = node.position;
  const emissive = highlighted ? palette.highlight : '#000000';
  const emissiveIntensity = highlighted ? 0.45 : 0;
  const look = NODE_BASE[node.kind];

  // A arvore e o unico tipo com duas pecas: tronco e copa.
  if (look.forma === 'arvore') {
    return (
      <group position={[x, y, z]}>
        <mesh position={[0, look.altura, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.18, 0.26, 1.8, 6]} />
          <meshLambertMaterial
            color={look.cor}
            flatShading
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
        <mesh position={[0, 2.1, 0]} castShadow>
          <icosahedronGeometry args={[0.95, 0]} />
          <meshLambertMaterial color={palette.leaves} flatShading />
        </mesh>
      </group>
    );
  }

  return (
    <mesh position={[x, y + look.altura, z]} castShadow receiveShadow>
      <GeometriaDaBase forma={look.forma} raio={BASE_RADIUS[node.kind]} />
      <meshLambertMaterial
        color={look.cor}
        flatShading
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
      />
    </mesh>
  );
}

/**
 * Anel pulsante no chao sob o no em destaque.
 *
 * Um unico anel reaproveitado para todos os nos: e mais barato que dar um anel
 * proprio a cada um, e so um no fica em destaque por vez.
 */
function HighlightRing({ node }: { node: ResourceNode }) {
  const ringRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (!ringRef.current) return;
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.08;
    ringRef.current.scale.setScalar(pulse);
  });

  return (
    <mesh
      ref={ringRef}
      position={[node.position.x, node.position.y + 0.06, node.position.z]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <ringGeometry args={[1.15, 1.45, 24]} />
      <meshBasicMaterial color={palette.highlight} transparent opacity={0.75} />
    </mesh>
  );
}

export function ResourcesView() {
  const nodes = useGameStore((state) => state.nodes);
  const highlightedNodeId = useGameStore((state) => state.highlightedNodeId);
  const setHighlightedNodeId = useGameStore((state) => state.setHighlightedNodeId);
  const restoreNode = useGameStore((state) => state.restoreNode);

  const readyNodes = useMemo(() => nodes.filter((node) => !node.depleted), [nodes]);
  const highlighted = readyNodes.find((node) => node.id === highlightedNodeId) ?? null;

  /**
   * Itens contaveis de todos os nos, agrupados por tipo.
   *
   * Instanciados por tipo: sao ate 21 nos x 20 itens, o que como malhas
   * separadas viraria centenas de draw calls. Como `InstancedMesh`, sao tres.
   */
  const itemsByKind = useMemo(() => {
    type ItemInstanciado = { key: string; position: [number, number, number] };
    const grouped = Object.fromEntries(
      RESOURCE_KINDS.map((kind) => [kind, [] as ItemInstanciado[]]),
    ) as Record<ResourceKind, ItemInstanciado[]>;

    for (const node of readyNodes) {
      for (const placement of itemPlacements(node)) {
        grouped[node.kind].push({
          key: `${node.id}-${placement.groupIndex}-${placement.itemIndex}`,
          position: [placement.position.x, placement.position.y, placement.position.z],
        });
      }
    }

    return grouped;
  }, [readyNodes]);

  /**
   * Realce e cancelamento por distancia.
   *
   * Roda por quadro mas so escreve no store quando o alvo muda de fato. O
   * desafio aberto e cancelado ao se afastar: como o jogo nao pausa, sair de
   * perto e a forma natural de desistir da conta.
   */
  useFrame(() => {
    const state = useGameStore.getState();
    const nearest = nearestNodeInRange(playerTransform, state.nodes);
    setHighlightedNodeId(nearest?.id ?? null);

    // So cancela desafio de colheita: o de abastecer a fogueira tem alvo proprio
    // e nao deve morrer porque um recurso saiu de alcance. A distancia usada e
    // `cancelRange`, maior que a de abrir — ver o comentario em RESOURCES.
    const active = state.activeChallenge;
    if (active && active.purpose === 'colher') {
      const alvo = state.nodes.find((node) => node.id === active.targetId);
      const longe = !alvo || distanceSqXZ(playerTransform, alvo.position) > CANCEL_RANGE_SQ;
      if (longe) state.cancelChallenge();
    }
  });

  // Interagir nao coleta direto: abre o desafio ancorado no recurso. A colheita
  // acontece quando a crianca responde (slice de matematica).
  useGameAction('interagir', () => {
    const state = useGameStore.getState();
    const target = state.nodes.find((node) => node.id === state.highlightedNodeId);
    if (!target || target.depleted) return;
    state.startChallenge(target);
  });

  /**
   * Recuperacao dos nos colhidos.
   *
   * Um timer por no colhido, limpo no desmonte. A alternativa — comparar um
   * `readyAt` com o relogio a cada quadro — obrigaria a recalcular a lista de
   * nos disponiveis durante o render, 60 vezes por segundo.
   */
  const depletedIds = nodes
    .filter((node) => node.depleted)
    .map((node) => node.id)
    .join(',');

  useEffect(() => {
    if (!depletedIds) return;
    const timers = depletedIds
      .split(',')
      .map((id) => setTimeout(() => restoreNode(id), RESOURCES.respawnSeconds * 1000));
    return () => timers.forEach(clearTimeout);
  }, [depletedIds, restoreNode]);

  return (
    <>
      {readyNodes.map((node) => (
        <NodeBase key={node.id} node={node} highlighted={node.id === highlightedNodeId} />
      ))}

      {highlighted && <HighlightRing node={highlighted} />}

      {RESOURCE_KINDS.map((kind) =>
        itemsByKind[kind].length > 0 ? (
          <Instances key={kind} limit={1024} range={itemsByKind[kind].length} castShadow>
            <GeometriaDoItem forma={ITEM_SHAPE[kind]} />
            <meshLambertMaterial color={ITEM_COLOR[kind]} flatShading />
            {itemsByKind[kind].map((item) => (
              <Instance key={item.key} position={item.position} />
            ))}
          </Instances>
        ) : null,
      )}
    </>
  );
}

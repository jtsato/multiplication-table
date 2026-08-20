import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, type BufferAttribute, type BufferGeometry, type PointsMaterial } from 'three';
import { playSound } from '../../shared/audio';
import { vec3, type Vec3 } from '../../shared/vec';
import { useGameStore } from '../../app/store';
import type { ChallengeFeedback } from '../math/math.store';
import { bridgeAnchors, bridgeById } from '../regions/bridges.logic';
import { npcPosition } from '../npc/npc.logic';
import { playerTransform } from '../player';
import { burstForFeedback, type BurstSpec } from './juice.logic';

/**
 * Partículas e tremor de câmera do feedback sensorial.
 *
 * A view fica dentro do Canvas e assiste ao `feedback` do store. Quando uma
 * resposta fecha, ela descobre onde o alvo está no mundo (nó, fogueira, animal,
 * NPC ou ponte), abre uma explosão de partículas ali e toca o som daquele
 * destino. Errar também treme a câmera de leve — só o suficiente para dizer
 * "não bateu", sem nunca parecer punição.
 *
 * As partículas são um único `Points` reutilizado: o burst é raro e curto, então
 * não justifica criar/desmontar objetos Three por evento.
 *
 * O estado por quadro (partículas, posições, tremor) vive fora do React, como o
 * `playerTransform` e o `dayNightClock`: nada que muda a cada quadro deve passar
 * por re-render.
 */

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

const MAX_PARTICLES = 200;

/** Estado por quadro, fora do React. */
const particles: Particle[] = [];
const particlePositions = new Float32Array(MAX_PARTICLES * 3);
const shakeOffset = new Vector3();
let shake = 0;

function spawnBurst(particles: Particle[], origin: Vec3, spec: BurstSpec): void {
  for (let i = 0; i < spec.count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const elevation = (Math.random() - 0.5) * Math.PI;
    const speed = spec.speed * (0.5 + Math.random() * 0.7);
    particles.push({
      x: origin.x,
      y: origin.y + 0.4,
      z: origin.z,
      vx: Math.cos(angle) * Math.cos(elevation) * speed,
      vy: Math.sin(elevation) * speed * 0.6 + 1.2,
      vz: Math.sin(angle) * Math.cos(elevation) * speed,
      life: 0,
      maxLife: 0.7 + Math.random() * 0.4,
    });
  }
  if (particles.length > MAX_PARTICLES) particles.splice(0, particles.length - MAX_PARTICLES);
}

/** Onde no mundo o alvo do feedback está. Cai para o jogador se não achar. */
function feedbackPosition(
  feedback: ChallengeFeedback,
  state: ReturnType<typeof useGameStore.getState>,
): Vec3 {
  if (feedback.purpose === 'colher') {
    const node = state.nodes.find((candidate) => candidate.id === feedback.targetId);
    if (node) return node.position;
  }
  if (feedback.purpose === 'abastecer') {
    const structure = state.structures.find((candidate) => candidate.id === feedback.targetId);
    if (structure) return structure.position;
  }
  if (feedback.purpose === 'alimentar') {
    const animal = state.animals.find((candidate) => candidate.id === feedback.targetId);
    if (animal) return animal.position;
  }
  if (feedback.purpose === 'encomenda') {
    const order = state.orders.find((candidate) => candidate.id === feedback.targetId);
    if (order) return npcPosition(order.regionId);
  }
  if (feedback.purpose === 'pedagio') {
    const bridge = bridgeById(feedback.targetId);
    if (bridge) {
      const { from, to } = bridgeAnchors(bridge);
      return vec3((from.x + to.x) / 2, (from.y + to.y) / 2, (from.z + to.z) / 2);
    }
  }

  return vec3(playerTransform.x, 0, playerTransform.z);
}

export function JuiceView() {
  const feedback = useGameStore((state) => state.feedback);
  const camera = useThree((state) => state.camera);

  const attributeRef = useRef<BufferAttribute>(null);
  const geometryRef = useRef<BufferGeometry>(null);
  const materialRef = useRef<PointsMaterial>(null);
  const lastFeedbackRef = useRef<ChallengeFeedback | null>(null);

  // Limpa o estado por quadro entre montagens (testes montam a view várias
  // vezes; o app monta uma única vez).
  useEffect(() => {
    particles.length = 0;
    shake = 0;
    return () => {
      particles.length = 0;
      shake = 0;
    };
  }, []);

  // `feedback` é substituído por um objeto novo a cada resposta; a referência
  // anterior evita disparar duas vezes por causa de re-render do seletor.
  useEffect(() => {
    if (!feedback || lastFeedbackRef.current === feedback) return;
    lastFeedbackRef.current = feedback;

    const state = useGameStore.getState();
    const position = feedbackPosition(feedback, state);
    const spec = burstForFeedback(feedback);
    spawnBurst(particles, position, spec);
    playSound(spec.sound);

    if (materialRef.current) {
      materialRef.current.color.set(spec.color);
      materialRef.current.size = spec.size;
    }
    if (!feedback.correct) shake = 1;
  }, [feedback]);

  useFrame((state, delta) => {
    // 1. Atualiza partículas.
    const alive: Particle[] = [];
    for (const particle of particles) {
      particle.life += delta;
      if (particle.life >= particle.maxLife) continue;
      particle.vy -= 4 * delta;
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.z += particle.vz * delta;
      alive.push(particle);
    }
    particles.length = 0;
    particles.push(...alive);

    for (let i = 0; i < alive.length; i += 1) {
      const particle = alive[i];
      particlePositions[i * 3] = particle.x;
      particlePositions[i * 3 + 1] = particle.y;
      particlePositions[i * 3 + 2] = particle.z;
    }
    if (attributeRef.current) attributeRef.current.needsUpdate = true;
    geometryRef.current?.setDrawRange(0, alive.length * 3);

    // 2. Tremor de câmera no erro: decai exponencialmente, some em ~0,5 s.
    if (shake > 0.005) {
      const intensity = shake * shake * 0.08;
      shakeOffset.set(
        Math.sin(state.clock.elapsedTime * 43) * intensity,
        Math.cos(state.clock.elapsedTime * 37) * intensity * 0.6,
        0,
      );
      camera.position.add(shakeOffset);
      shake *= Math.exp(-6 * delta);
    }
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          ref={attributeRef}
          args={[particlePositions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        color="#ffe66d"
        size={0.12}
        sizeAttenuation
        transparent
        opacity={0.9}
        depthWrite={false}
      />
    </points>
  );
}

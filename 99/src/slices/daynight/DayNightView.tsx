import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Color, type DirectionalLight, type HemisphereLight } from 'three';
import { useGameStore } from '../../app/store';
import { ISLAND } from '../world/world.logic';
import { dayNightClock } from './dayNightClock';
import {
  advanceClock,
  cyclePosition,
  dayNumber,
  phaseFor,
  secondsUntilNextPhase,
  skyConfigFor,
} from './daynight.logic';

/** Cor reaproveitada entre quadros — `new Color()` por quadro geraria lixo. */
const scratchColor = new Color();

/** Intervalo de publicacao para o HUD: 4 Hz, nao por quadro. */
const PUBLISH_INTERVAL = 0.25;

/**
 * Ciclo dia/noite: avanca o relogio e aplica ceu, neblina e luzes.
 *
 * As luzes vivem aqui, e nao em `WorldView`, porque quem manda nelas e o ciclo.
 * `WorldView` ficou responsavel so pela geometria da ilha — a separacao segue a
 * funcionalidade, nao o tipo de objeto.
 */
export function DayNightView({ isTouch = false }: { isTouch?: boolean } = {}) {
  const sunRef = useRef<DirectionalLight>(null);
  const ambientRef = useRef<HemisphereLight>(null);
  const publishTimerRef = useRef(0);
  const lastPhaseRef = useRef(phaseFor(0));

  const scene = useThree((state) => state.scene);
  const publishClock = useGameStore((state) => state.publishClock);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    dayNightClock.seconds = advanceClock(dayNightClock.seconds, delta);

    const position = cyclePosition(dayNightClock.seconds);
    const sky = skyConfigFor(position);

    // Ceu e neblina: mutacao direta nos objetos do Three, sem passar pelo React.
    if (scene.background instanceof Color) {
      scene.background.set(sky.skyColor);
    }
    if (scene.fog) {
      scene.fog.color.set(sky.skyColor);
    }

    if (sunRef.current) {
      const sun = sunRef.current;
      sun.intensity = sky.sunIntensity;
      sun.color.set(sky.sunColor);
      // O sol cruza o ceu junto com o ciclo; a elevacao vem da fase.
      const azimuth = position * Math.PI * 2;
      sun.position.set(Math.cos(azimuth) * 26, 6 + sky.elevation * 34, Math.sin(azimuth) * 26);
    }

    if (ambientRef.current) {
      ambientRef.current.intensity = sky.ambientIntensity;
      // `ambientColor`, e nao `skyColor`: a noite tem um ceu escuro e uma luz
      // clara. Usando a cor do ceu, a hemisferica nao iluminava nada.
      ambientRef.current.color.set(scratchColor.set(sky.ambientColor));
    }

    // Publica com throttle, mas imediatamente na virada de fase: o HUD nao pode
    // anunciar a noite um quarto de segundo depois de ela cair.
    const phase = phaseFor(position);
    publishTimerRef.current += delta;
    const phaseChanged = phase !== lastPhaseRef.current;

    if (phaseChanged || publishTimerRef.current >= PUBLISH_INTERVAL) {
      publishTimerRef.current = 0;
      lastPhaseRef.current = phase;
      const day = dayNumber(dayNightClock.seconds);
      publishClock({
        phase,
        day,
        secondsToNextPhase: secondsUntilNextPhase(dayNightClock.seconds),
      });

      // O dia fecha no amanhecer. A guarda de "uma vez por dia" mora no store,
      // porque a virada de fase e publicada em mais de um quadro seguido.
      if (phase === 'amanhecer') useGameStore.getState().openSummary(day);
    }
  });

  return (
    <>
      <hemisphereLight ref={ambientRef} intensity={1.1} groundColor="#3f8f45" />
      <directionalLight
        ref={sunRef}
        position={[24, 34, 16]}
        intensity={2.1}
        castShadow
        // Mapa de sombra menor no celular: e uma textura de profundidade
        // redesenhada todo quadro, entao 512 custa um quarto de 1024.
        shadow-mapSize={isTouch ? [512, 512] : [1024, 1024]}
        // Frustum apertado em volta da ilha: mapa de sombra pequeno rende mais
        // resolucao por metro e mantem o custo baixo.
        shadow-camera-left={-ISLAND.radius - 6}
        shadow-camera-right={ISLAND.radius + 6}
        shadow-camera-top={ISLAND.radius + 6}
        shadow-camera-bottom={-ISLAND.radius - 6}
        shadow-camera-near={1}
        shadow-camera-far={110}
        shadow-bias={-0.0008}
      />
    </>
  );
}

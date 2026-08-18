import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { PointLight } from 'three';
import { palette } from '../../shared/palette';
import { useGameStore } from '../../app/store';
import { dayNightClock } from '../daynight/dayNightClock';
import { playerTransform } from '../player/playerTransform';
import { LANTERN, chargeRemaining, lanternIntensity } from './lantern.logic';

/** Altura da lanterna em relacao ao chao, na mao do personagem. */
const HEIGHT = 1.1;

/** Mesmo ritmo do relogio: 4 Hz e o suficiente para uma barra no HUD. */
const PUBLISH_INTERVAL = 0.25;

/**
 * A luz que acompanha o jogador.
 *
 * Nada aqui passa pelo React. A posicao vem de `playerTransform` e a carga e
 * derivada do relogio vivo, os dois lidos com `getState()` dentro do `useFrame`
 * — a lanterna esvazia sozinha, sem uma unica escrita no store por quadro.
 *
 * `distance` limita o alcance: sem isso a luz custaria caro na cena inteira, do
 * mesmo jeito que ja acontece com a fogueira.
 */
export function LanternView() {
  const lightRef = useRef<PointLight>(null);
  const publishTimerRef = useRef(0);

  useFrame((_, delta) => {
    const light = lightRef.current;
    if (!light) return;

    const { lantern, publishLanternCharge } = useGameStore.getState();
    const now = dayNightClock.seconds;
    light.intensity = lanternIntensity(lantern, now);

    // Acima da cabeca em vez de na altura do peito: com a luz baixa demais o
    // proprio personagem vira silhueta contra o facho.
    light.position.set(playerTransform.x, playerTransform.y + HEIGHT, playerTransform.z);

    // A barra do HUD precisa esvaziar, mas nao 60 vezes por segundo.
    publishTimerRef.current += delta;
    if (publishTimerRef.current >= PUBLISH_INTERVAL) {
      publishTimerRef.current = 0;
      publishLanternCharge(chargeRemaining(lantern, now));
    }
  });

  return (
    <pointLight
      ref={lightRef}
      color={palette.lanternLight}
      intensity={0}
      distance={LANTERN.radius}
      decay={2}
    />
  );
}

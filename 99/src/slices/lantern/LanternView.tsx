import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { PointLight } from 'three';
import { palette } from '../../shared/palette';
import { useGameStore } from '../../app/store';
import { dayNightClock } from '../daynight/dayNightClock';
import { playerTransform } from '../player/playerTransform';
import { chargeRemaining, lanternIntensity, lanternRadius } from './lantern.logic';

/**
 * Onde a luz fica em relacao ao jogador.
 *
 * Custou duas telas gravadas para acertar, e nenhum teste unitario teria dito
 * qualquer coisa sobre isso:
 *
 * 1. Com `HEIGHT = 1.1` a luz nascia *dentro* da capsula do personagem. O chao
 *    em volta acendia e ele ficava preto — as normais apontam para fora, e a luz
 *    vinha de dentro.
 * 2. Subir e jogar a luz **a frente** piorou: a camera segue atras do jogador,
 *    entao uma lanterna na frente dele o poe em contraluz. Ele continuou preto,
 *    agora com o chao ainda mais claro em volta.
 *
 * A luz fica atras e acima — do lado da camera. Le-se como um lampiao pendurado
 * na mochila, e e o que deixa o personagem visivel dentro da propria luz.
 */
const HEIGHT = 1.8;
const BACKWARD = 0.7;

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
  // Raro o bastante para passar pelo React: muda uma vez, na compra.
  const melhorada = useGameStore((state) => state.owned.includes('lanterna-maior'));
  const publishTimerRef = useRef(0);

  useFrame((_, delta) => {
    const light = lightRef.current;
    if (!light) return;

    const { lantern, publishLanternCharge } = useGameStore.getState();
    const now = dayNightClock.seconds;
    light.intensity = lanternIntensity(lantern, now);

    // Mesma convencao de "frente" do resto do jogo: com yaw = 0, a frente e -Z,
    // entao atras e +Z.
    light.position.set(
      playerTransform.x + Math.sin(playerTransform.yaw) * BACKWARD,
      playerTransform.y + HEIGHT,
      playerTransform.z + Math.cos(playerTransform.yaw) * BACKWARD,
    );

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
      distance={lanternRadius(melhorada)}
      decay={2}
    />
  );
}

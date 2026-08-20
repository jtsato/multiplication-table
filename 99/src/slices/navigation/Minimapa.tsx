import { useEffect, useRef } from 'react';
import { useGameStore } from '../../app/store';
import { playerTransform } from '../player/playerTransform';
import { minimapRegions, projectToMinimap } from './navigation.logic';
import './navigation.css';

/** Lado do painel quadrado do minimapa, em pixels. */
const MINIMAP_SIZE = 150;

/**
 * Minimapa.
 *
 * Regiões são marcadores estáticos (a geografia não muda); o ponto do jogador é
 * atualizado por `requestAnimationFrame` lendo `playerTransform`, sem passar pelo
 * React a cada quadro — mesmo padrão do joystick e do relógio.
 */
export function Minimapa() {
  const labels = useGameStore((state) => state.text.regions);
  const mapLabel = useGameStore((state) => state.text.strings.mapLabel);
  const dotRef = useRef<HTMLDivElement>(null);

  const regions = minimapRegions(MINIMAP_SIZE);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const ponto = projectToMinimap(playerTransform.x, playerTransform.z, MINIMAP_SIZE);
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${ponto.x - 5}px, ${ponto.y - 5}px)`;
      }
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className="minimap"
      style={{ width: MINIMAP_SIZE, height: MINIMAP_SIZE }}
      role="img"
      aria-label={mapLabel}
    >
      {regions.map((regiao) => (
        <div
          key={regiao.id}
          className="minimap__region"
          style={{ left: regiao.x - 20, top: regiao.y - 10, background: regiao.color }}
          title={labels[regiao.id]}
        >
          <span>{labels[regiao.id]}</span>
        </div>
      ))}
      <div ref={dotRef} className="minimap__player" />
    </div>
  );
}

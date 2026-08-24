import { useEffect, useRef } from 'react';
import { useGameStore } from '../../app/store';
import { playerTransform } from '../player/playerTransform';
import { minimapRegions, projectToMinimap } from './navigation.logic';
import './navigation.css';

const WORLD_MAP_SIZE = 560;

export function WorldMap() {
  const open = useGameStore((state) => state.mapOpen);
  const closeMap = useGameStore((state) => state.closeMap);
  const labels = useGameStore((state) => state.text.regions);
  const mapTitle = useGameStore((state) => state.text.strings.mapTitle);
  const closeLabel = useGameStore((state) => state.text.strings.close);
  const currentRegion = useGameStore((state) => state.currentRegion);
  const boardRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  const regions = minimapRegions(WORLD_MAP_SIZE);

  useEffect(() => {
    if (!open) return undefined;
    let raf = 0;
    const update = () => {
      const board = boardRef.current;
      const dot = dotRef.current;
      if (board && dot) {
        const size = board.getBoundingClientRect().width;
        const ponto = projectToMinimap(playerTransform.x, playerTransform.z, size);
        dot.style.transform = `translate(${ponto.x - 7}px, ${ponto.y - 7}px)`;
      }
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="worldmap-overlay"
      role="dialog"
      aria-label={mapTitle}
      aria-modal="true"
      onClick={closeMap}
    >
      <div className="worldmap" onClick={(event) => event.stopPropagation()}>
        <div
          ref={boardRef}
          className="worldmap__board"
          style={{ width: WORLD_MAP_SIZE, height: WORLD_MAP_SIZE }}
          role="img"
          aria-label={mapTitle}
        >
          {regions.map((regiao) => (
            <div
              key={regiao.id}
              className={`worldmap__marker ${
                regiao.id === currentRegion ? 'worldmap__marker--here' : ''
              }`}
              style={{
                left: `${(regiao.x / WORLD_MAP_SIZE) * 100}%`,
                top: `${(regiao.y / WORLD_MAP_SIZE) * 100}%`,
              }}
              title={labels[regiao.id]}
            >
              <span className="worldmap__marker-label">{labels[regiao.id]}</span>
            </div>
          ))}
          <div ref={dotRef} className="worldmap__player" />
        </div>
        <button type="button" className="worldmap__close" onClick={closeMap}>
          {closeLabel}
        </button>
      </div>
    </div>
  );
}

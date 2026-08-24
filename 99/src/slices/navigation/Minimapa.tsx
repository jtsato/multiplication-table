import { useGameStore } from '../../app/store';
import './navigation.css';

/**
 * Botao do mapa.
 *
 * O mapa completo e grande demais para ficar fixo no canto da tela, entao ele
 * virou um botao: a crianca aperta e o arquipelago inteiro abre em tela cheia
 * (`WorldMap`). O nome continua `Minimapa` para nao quebrar a importacao, mas o
 * componente agora e so o disparador.
 */
export function Minimapa() {
  const toggleMap = useGameStore((state) => state.toggleMap);
  const mapLabel = useGameStore((state) => state.text.strings.mapLabel);
  const currentRegion = useGameStore((state) => state.currentRegion);
  const regionName = useGameStore((state) => state.text.regions[currentRegion]);

  return (
    <button
      type="button"
      className="minimap-button"
      onClick={toggleMap}
      aria-label={mapLabel}
      title={regionName}
    >
      <span className="minimap-button__icon" aria-hidden="true" />
      <span className="minimap-button__label">{regionName}</span>
    </button>
  );
}

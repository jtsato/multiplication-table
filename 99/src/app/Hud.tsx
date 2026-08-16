import { useGameStore } from './store';
import { REJECTION_MESSAGES, STRUCTURES, canAfford, formatRecipe } from '../slices/building';
import { PHASE_LABELS } from '../slices/daynight';
import { ENEMIES } from '../slices/enemies';
import { RESOURCE_KINDS, RESOURCE_LABELS } from '../slices/resources';
import './hud.css';

/**
 * Camada de UI em DOM sobre o canvas.
 *
 * Assina apenas valores discretos do store — inventario, destaque, modo de
 * construcao. Nada aqui e atualizado por quadro.
 */
export function Hud({ isTouch = false }: { isTouch?: boolean } = {}) {
  const inventory = useGameStore((state) => state.inventory);
  const highlightedNodeId = useGameStore((state) => state.highlightedNodeId);
  const activeChallenge = useGameStore((state) => state.activeChallenge);
  const buildMode = useGameStore((state) => state.buildMode);
  const buildError = useGameStore((state) => state.buildError);
  const clock = useGameStore((state) => state.clock);
  const health = useGameStore((state) => state.health);
  const enemyCount = useGameStore((state) => state.enemies.length);

  return (
    <div className="hud">
      <div className="hud__panel hud__panel--inventory">
        <span className={`hud__phase hud__phase--${clock.phase}`}>
          <strong>{PHASE_LABELS[clock.phase]}</strong>
          <small>dia {clock.day}</small>
          <em>{Math.ceil(clock.secondsToNextPhase)}s</em>
        </span>

        <span
          className="hud__health"
          role="meter"
          aria-label="Vida"
          aria-valuenow={health}
          aria-valuemin={0}
          aria-valuemax={ENEMIES.maxHealth}
        >
          <i style={{ width: `${(health / ENEMIES.maxHealth) * 100}%` }} />
        </span>

        {enemyCount > 0 && <span className="hud__danger">⚠ {enemyCount} à espreita</span>}
        {RESOURCE_KINDS.map((kind) => (
          <span key={kind} className="hud__resource">
            <i className={`hud__dot hud__dot--${kind}`} aria-hidden="true" />
            {RESOURCE_LABELS[kind].many} <strong>{inventory[kind]}</strong>
          </span>
        ))}
      </div>

      {/* No celular os próprios botões na tela dizem o que fazer; listar teclas
          que não existem só ocuparia espaço precioso. */}
      {!isTouch && (
        <div className="hud__panel hud__panel--controls">
          <strong>Controles</strong>
          <span>WASD — andar</span>
          <span>← → ou arrastar o mouse — girar a câmera</span>
          <span>E — resolver e colher · 1 2 3 — responder</span>
          <span>B — fogueira · C — cerca</span>
          <span>Espaço — construir · Esc — cancelar</span>
        </div>
      )}

      <div className={`hud__bottom ${isTouch ? 'hud__bottom--touch' : ''}`}>
        {/* Receitas: mostradas o tempo todo para a criança saber o que perseguir. */}
        <div className="hud__recipes">
          {Object.values(STRUCTURES).map((spec) => (
            <span
              key={spec.kind}
              className={`hud__recipe ${
                canAfford(inventory, spec.recipe) ? 'hud__recipe--ready' : ''
              } ${buildMode === spec.kind ? 'hud__recipe--active' : ''}`}
            >
              <strong>{spec.label}</strong> {formatRecipe(spec.recipe)}
            </span>
          ))}
        </div>

        {buildError && (
          <div className="hud__prompt hud__prompt--error" role="alert">
            {REJECTION_MESSAGES[buildError]}
          </div>
        )}

        {!buildError && buildMode && !isTouch && (
          <div className="hud__prompt" role="status">
            <kbd>Espaço</kbd> para construir · <kbd>Esc</kbd> para cancelar
          </div>
        )}

        {/* O aviso some enquanto o desafio está aberto: nesse momento o próprio
            painel ancorado no recurso já diz o que fazer. No celular, o botão
            "Colher" aparecendo na tela já cumpre esse papel. */}
        {!buildError && !buildMode && !isTouch && highlightedNodeId && !activeChallenge && (
          <div className="hud__prompt" role="status">
            Aperte <kbd>E</kbd> para colher
          </div>
        )}
      </div>
    </div>
  );
}

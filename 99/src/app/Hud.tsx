import { useGameStore } from './store';
import {
  rejectionMessage,
  structureLabel,
  STRUCTURES,
  canAfford,
  formatRecipe,
} from '../slices/building/building.logic';
import { phaseLabel } from '../slices/daynight/daynight.logic';
import { bridgeMessage, bridgeById } from '../slices/regions/bridges.logic';
import { regionById } from '../slices/regions/regions.logic';
import { LANTERN } from '../slices/lantern/lantern.logic';
import { RESOURCE_KINDS } from '../slices/resources/resources.logic';
import { animalById, canFeedAnimal } from '../slices/wildlife/wildlife.logic';
import { orderQuantity } from '../slices/npc/npc.logic';
import { interpolate } from '../i18n';
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
  const currentRegion = useGameStore((state) => state.currentRegion);
  const nearbyBridge = useGameStore((state) => state.nearbyBridge);
  const bridgeError = useGameStore((state) => state.bridgeError);
  const nearbyAnimalId = useGameStore((state) => state.nearbyAnimalId);
  const animals = useGameStore((state) => state.animals);
  const nearbyOrderId = useGameStore((state) => state.nearbyOrderId);
  const orders = useGameStore((state) => state.orders);
  const texto = useGameStore((state) => state.text);
  const t = texto.strings;

  const animalPerto = nearbyAnimalId ? animalById(animals, nearbyAnimalId) : null;
  const podeAlimentar = animalPerto ? canFeedAnimal(animalPerto, inventory) : false;
  const orderPerto = nearbyOrderId ? orders.find((order) => order.id === nearbyOrderId) : null;
  const podeEntregar = orderPerto ? inventory[orderPerto.kind] >= orderQuantity(orderPerto) : false;

  const colheitaDaqui = regionById(currentRegion).harvest;
  const visiveis = RESOURCE_KINDS.filter(
    (kind) => inventory[kind] > 0 || colheitaDaqui.includes(kind),
  );
  const clock = useGameStore((state) => state.clock);
  const lanternCharge = useGameStore((state) => state.lanternCharge);
  const coins = useGameStore((state) => state.coins);

  /**
   * Moedas em dezenas e unidades.
   *
   * A criança vê "37" e, ao lado, três pilhas e sete soltas. É o reforço
   * passivo da tabuada do 10 descrito na spec: ela conta dezenas a sessão
   * inteira sem que nenhuma pergunta seja feita. Abaixo de dez não há o que
   * decompor, e a linha some.
   */
  const dezenas = Math.floor(coins / 10);
  const unidades = coins % 10;

  const cargaCheia = LANTERN.chargeSeconds * LANTERN.maxCharges;
  const cargaFraca = lanternCharge < LANTERN.lowChargeSeconds;

  return (
    <div className="hud">
      <div className="hud__panel hud__panel--inventory">
        {/* Onde a crianca esta. O nome da regiao e o que liga o lugar a
            tabuada dele — "estou no Pico" e "aqui e a do 9" tem que ser a mesma
            informacao. */}
        <span className="hud__region" data-testid="hud-regiao">
          {texto.regions[currentRegion]}
        </span>

        <span className={`hud__phase hud__phase--${clock.phase}`}>
          <strong>{phaseLabel(clock.phase, t)}</strong>
          <small>{interpolate(t.day, { n: clock.day })}</small>
          <em>{Math.ceil(clock.secondsToNextPhase)}s</em>
        </span>

        <span
          className="hud__lantern"
          role="meter"
          aria-label={t.lanternLabel}
          aria-valuenow={Math.ceil(lanternCharge)}
          aria-valuemin={0}
          aria-valuemax={cargaCheia}
        >
          <i style={{ width: `${Math.min(100, (lanternCharge / cargaCheia) * 100)}%` }} />
        </span>

        <span className="hud__coins" aria-label={interpolate(t.coinsLabel, { n: coins })}>
          <i className="hud__dot hud__dot--moeda" aria-hidden="true" />
          {t.coins} <strong>{coins}</strong>
          {dezenas > 0 && (
            <em className="hud__dezenas" data-testid="hud-dezenas" aria-hidden="true">
              {dezenas}×10 + {unidades}
            </em>
          )}
        </span>

        {/*
          Só o que interessa agora.

          Com nove tipos, listar todos deixaria sete zeros permanentes na tela —
          e a criança lendo mais números que não significam nada do que números
          que significam. Aparece o que ela tem, mais o que dá para colher aqui:
          assim a lista também conta o que esta região oferece.
        */}
        {visiveis.map((kind) => (
          <span key={kind} className="hud__resource">
            <i className={`hud__dot hud__dot--${kind}`} aria-hidden="true" />
            {texto.resources[kind].stock.many} <strong>{inventory[kind]}</strong>
          </span>
        ))}
      </div>

      {/* No celular os próprios botões na tela dizem o que fazer; listar teclas
          que não existem só ocuparia espaço precioso. */}
      {!isTouch && (
        <div className="hud__panel hud__panel--controls" data-testid="hud-controls">
          <strong>{t.controlsTitle}</strong>
          <span>{t.controlsMove}</span>
          <span>{t.controlsCamera}</span>
          <span>{t.controlsSolve}</span>
          <span>{t.controlsBuild}</span>
          <span>{t.controlsSpace}</span>
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
              <strong>{structureLabel(spec.kind, t)}</strong> {formatRecipe(spec.recipe, texto)}
            </span>
          ))}
        </div>

        {/* A recusa da ponte vem antes de tudo: e a unica que diz para a
            crianca ir treinar, e nao ir juntar. */}
        {bridgeError && (
          <div className="hud__prompt hud__prompt--error" role="alert">
            {bridgeMessage(bridgeError, t)}
          </div>
        )}

        {!bridgeError && buildError && (
          <div className="hud__prompt hud__prompt--error" role="alert">
            {rejectionMessage(buildError, t)}
          </div>
        )}

        {!bridgeError && !buildError && nearbyBridge && !isTouch && (
          <div className="hud__prompt" role="status">
            {interpolate(t.bridgePrompt, {
              moedas: bridgeById(nearbyBridge)!.coins,
              receita: formatRecipe(bridgeById(nearbyBridge)!.recipe, texto),
            })}
          </div>
        )}

        {/* Convite do entardecer, não alerta: a noite não ameaça mais nada, e o
            que a criança precisa saber é que dá para levar luz com ela. */}
        {!bridgeError && !buildError && !nearbyBridge && clock.phase === 'entardecer' && (
          <div className="hud__prompt hud__prompt--aviso" role="alert">
            {interpolate(t.duskWarning, { s: Math.ceil(clock.secondsToNextPhase) })}
          </div>
        )}

        {/* Sem exclamação e sem contagem: é informação, não pressão. Ficar sem
            carga não tira nada da criança além do que só aparece no escuro. */}
        {!bridgeError && !buildError && !nearbyBridge && clock.phase === 'noite' && cargaFraca && (
          <div className="hud__prompt" role="status">
            {t.lanternLow}
          </div>
        )}

        {!buildError && clock.phase !== 'entardecer' && buildMode && !isTouch && (
          <div className="hud__prompt" role="status">
            {t.buildPrompt}
          </div>
        )}

        {/* O aviso some enquanto o desafio está aberto: nesse momento o próprio
            painel ancorado no recurso já diz o que fazer. No celular, o botão
            "Colher" aparecendo na tela já cumpre esse papel. */}
        {!buildError &&
          clock.phase !== 'entardecer' &&
          !buildMode &&
          !isTouch &&
          !activeChallenge &&
          (highlightedNodeId || (animalPerto && podeAlimentar) || (orderPerto && podeEntregar)) && (
            <div className="hud__prompt" role="status">
              {highlightedNodeId
                ? t.harvestPrompt
                : animalPerto && podeAlimentar
                  ? t.feedPrompt
                  : t.orderPrompt}
            </div>
          )}
      </div>
    </div>
  );
}

import { useGameStore } from '../../app/store';
import { interpolate } from '../../i18n';
import { useGameAction } from '../../shared/input';
import {
  purchaseMessage,
  SHOP_ITEMS,
  SHOP_ORDER,
  checkPurchase,
  formatShopRecipe,
} from './economy.logic';
import './shop.css';

/**
 * A loja.
 *
 * E um painel, e nao uma personagem no mundo. A comerciante da Fase 6 vai apenas
 * virar mais uma forma de abrir esta mesma tela — construir dialogo e NPC agora
 * seria adiantar trabalho de quatro fases a frente para entregar a mesma coisa.
 *
 * Mesma camada centralizada do painel de desafio: a camada inteira ignora o
 * ponteiro e so o cartao captura, para arrastar a camera continuar funcionando
 * em volta.
 */
export function ShopPanel() {
  const shopOpen = useGameStore((state) => state.shopOpen);
  const coins = useGameStore((state) => state.coins);
  const inventory = useGameStore((state) => state.inventory);
  const owned = useGameStore((state) => state.owned);
  const hints = useGameStore((state) => state.hints);
  const purchaseError = useGameStore((state) => state.purchaseError);
  const buy = useGameStore((state) => state.buy);
  const texto = useGameStore((state) => state.text);
  const t = texto.strings;
  const toggleShop = useGameStore((state) => state.toggleShop);
  const closeShop = useGameStore((state) => state.closeShop);

  useGameAction('loja', toggleShop);
  useGameAction('cancelar', closeShop);

  if (!shopOpen) return null;

  return (
    <div className="shop-overlay">
      <div className="shop" role="dialog" aria-label={t.shopTitle}>
        <header className="shop__head">
          <h2 className="shop__title">{t.shopTitle}</h2>
          <span className="shop__coins">
            {coins} {t.coins}
          </span>
        </header>

        <ul className="shop__items">
          {SHOP_ORDER.map((kind) => {
            const item = SHOP_ITEMS[kind];
            const check = checkPurchase(item, coins, inventory, owned);

            return (
              <li key={kind} className={`shop__item ${check.ok ? 'shop__item--ready' : ''}`}>
                <button
                  type="button"
                  className="shop__buy"
                  disabled={!check.ok}
                  onClick={() => buy(kind)}
                >
                  <strong className="shop__label">{texto.shop[kind].label}</strong>
                  <span className="shop__effect">{texto.shop[kind].effect}</span>
                  <span className="shop__cost">
                    {item.coins} {t.coins} · {formatShopRecipe(item, texto)}
                  </span>
                  {/* Diz o que falta, e não só que não dá: a criança precisa
                      saber o que ir buscar. */}
                  {!check.ok && (
                    <span className="shop__blocked">{purchaseMessage(check.reason, t)}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {hints > 0 && <p className="shop__hints">{interpolate(t.hintsStored, { n: hints })}</p>}

        {purchaseError && (
          <p className="shop__error" role="alert">
            {purchaseMessage(purchaseError, t)}
          </p>
        )}

        <button type="button" className="shop__close" onClick={closeShop}>
          {t.close}
        </button>
      </div>
    </div>
  );
}

import { useGameStore } from '../../app/store';
import { challengeText } from '../math/challengeText';
import './orders.css';

/**
 * O quadro de encomendas da casa.
 *
 * Mostra os pedidos do dia sem exigir andar atras de cada NPC. E um painel de
 * consulta — a entrega continua acontecendo na regiao, com o `ChallengePanel`
 * ancorado no mundo.
 */
export function OrdersPanel() {
  const openSpot = useGameStore((state) => state.openSpot);
  const orders = useGameStore((state) => state.orders);
  const closeSpot = useGameStore((state) => state.closeSpot);
  const bundle = useGameStore((state) => state.text);

  if (openSpot !== 'encomendas') return null;

  return (
    <div className="orders-overlay">
      <div className="orders" role="dialog" aria-label={bundle.strings.ordersTitle}>
        <header className="orders__head">
          <h2 className="orders__title">{bundle.strings.ordersTitle}</h2>
        </header>

        <ul className="orders__list">
          {orders.map((order) => {
            const texto = challengeText(order, bundle);
            return (
              <li key={order.id} className="orders__item">
                <span className="orders__prompt">{texto.prompt}</span>
                <span className="orders__reward">
                  +{order.rewardCoins} {bundle.strings.coins}
                </span>
              </li>
            );
          })}
        </ul>

        <button type="button" className="orders__close" onClick={closeSpot}>
          {bundle.strings.close}
        </button>
      </div>
    </div>
  );
}

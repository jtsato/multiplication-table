import { useGameStore } from '../../app/store';
import { interpolate } from '../../i18n';
import { ANIMAL_KINDS } from './wildlife.logic';
import './animalbook.css';

/**
 * A caderneta dos animais, aberta no quadro dentro da casa.
 *
 * Mostra quem ja foi visto e quem virou amigo, e deixa a crianca escolher o
 * amigo que vai acompanha-la — o pet. Amigo e estado duravel: sobrevive a
 * recarregar a pagina junto com o save.
 */
export function AnimalBookPanel() {
  const openSpot = useGameStore((state) => state.openSpot);
  const animalBook = useGameStore((state) => state.animalBook);
  const pet = useGameStore((state) => state.pet);
  const setPet = useGameStore((state) => state.setPet);
  const closeSpot = useGameStore((state) => state.closeSpot);
  const texto = useGameStore((state) => state.text);
  const t = texto.strings;

  if (openSpot !== 'caderneta') return null;

  return (
    <div className="book-overlay">
      <div className="book" role="dialog" aria-label={t.bookTitle}>
        <header className="book__head">
          <h2 className="book__title">{t.bookTitle}</h2>
          <span className="book__pet">
            {pet ? interpolate(t.bookCurrentPet, { animal: texto.animals[pet] }) : ''}
          </span>
        </header>

        <ul className="book__list">
          {ANIMAL_KINDS.map((kind) => {
            const entry = animalBook.find((candidate) => candidate.kind === kind);
            const visto = entry?.seen ?? false;
            const amigo = entry?.friend ?? false;
            const atual = pet === kind;

            return (
              <li key={kind} className={`book__row ${atual ? 'book__row--atual' : ''}`}>
                <span className="book__name">{texto.animals[kind]}</span>
                <span
                  className={`book__status ${amigo ? 'book__status--amigo' : visto ? '' : 'book__status--novo'}`}
                >
                  {amigo ? t.bookFriend : visto ? t.bookSeen : t.bookNotSeen}
                </span>
                <button
                  type="button"
                  className="book__take"
                  disabled={!amigo || atual}
                  aria-label={`${t.bookTake} ${texto.animals[kind]}`}
                  onClick={() => setPet(kind)}
                >
                  {t.bookTake}
                </button>
              </li>
            );
          })}
        </ul>

        <button type="button" className="book__close" onClick={closeSpot}>
          {t.close}
        </button>
      </div>
    </div>
  );
}

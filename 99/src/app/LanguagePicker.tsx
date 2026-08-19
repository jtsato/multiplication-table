import { useGameStore } from './store';
import { LOCALE_ENDONYMS, SUPPORTED_LOCALES } from '../i18n';
import './language.css';

/**
 * O seletor de idioma.
 *
 * Cada idioma aparece **escrito nele mesmo** — "English", não "Inglês". Quem
 * precisa trocar de idioma é justamente quem não lê o idioma atual, e uma lista
 * traduzida para a língua errada não ajuda ninguém.
 *
 * Fica sempre visível no canto, e não escondido num menu de ajustes: numa tela
 * de criança, o que não está à vista não existe.
 */
export function LanguagePicker() {
  const locale = useGameStore((state) => state.locale);
  const setLocale = useGameStore((state) => state.setLocale);
  const t = useGameStore((state) => state.text).strings;

  // Um idioma só: não há escolha a oferecer, e um botão morto confunde.
  if (SUPPORTED_LOCALES.length < 2) return null;

  return (
    <div className="language" role="group" aria-label={t.language}>
      {SUPPORTED_LOCALES.map((opcao) => (
        <button
          key={opcao}
          type="button"
          className={`language__option ${opcao === locale ? 'language__option--on' : ''}`}
          aria-pressed={opcao === locale}
          onClick={() => setLocale(opcao)}
        >
          {LOCALE_ENDONYMS[opcao]}
        </button>
      ))}
    </div>
  );
}

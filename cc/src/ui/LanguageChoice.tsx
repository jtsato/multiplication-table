import { audioService } from '../audio/audioService';
import { SUPPORTED_LOCALES, type Locale } from '../domain/types';
import { localeMeta } from '../i18n/translate';

interface LanguageChoiceProps {
  /** Rotulo do grupo (o titulo da secao que aparece acima). */
  legend: string;
  value: Locale;
  onChange: (locale: Locale) => void;
}

/**
 * Escolha de idioma como radiogroup, e nao como par de botoes.
 *
 * Com dois botoes lado a lado o idioma ja selecionado ficava verde, igual ao
 * "Continuar" logo abaixo: a crianca clicava em "Portugues", nada mudava de
 * tela e parecia quebrado. A marca de radio diz que ali se ESCOLHE, o estado
 * marcado fica visivel sem depender so da cor, e o unico botao de acao da
 * tela volta a ser o que avanca.
 *
 * Cada opcao aparece escrita no proprio idioma (`lang`), para quem ainda nao
 * le o idioma atual reconhecer o seu.
 */
export function LanguageChoice({ legend, value, onChange }: LanguageChoiceProps) {
  return (
    <div className="language-choice" role="radiogroup" aria-label={legend}>
      {SUPPORTED_LOCALES.map((locale) => {
        const meta = localeMeta(locale);
        const selected = locale === value;
        return (
          <button
            key={locale}
            type="button"
            role="radio"
            aria-checked={selected}
            lang={locale}
            className={`language-option ${selected ? 'language-option--selected' : ''}`}
            onClick={() => {
              audioService.play('click');
              onChange(locale);
            }}
          >
            <span className="language-option__mark" aria-hidden="true" />
            <span className="language-option__flag" aria-hidden="true">
              {meta.flag}
            </span>
            <span className="language-option__name">{meta.name}</span>
          </button>
        );
      })}
    </div>
  );
}

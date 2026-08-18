import { useEffect, useId, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react';
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
 * Seletor de idioma recolhido, com um listbox acessivel ao abrir.
 *
 * O gatilho mostra o codigo regional e o nome nativo. A lista nao usa bandeira:
 * o codigo (`BR`, `US`, ...) e apenas uma pista visual, enquanto o nome e a
 * informacao principal e tambem a que o leitor de tela anuncia.
 */
export function LanguageChoice({ legend, value, onChange }: LanguageChoiceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const typeaheadRef = useRef('');
  const typeaheadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idSeed = useId().replaceAll(':', '');
  const labelId = `language-choice-label-${idSeed}`;
  const listboxId = `language-choice-listbox-${idSeed}`;

  const selectedIndex = Math.max(0, SUPPORTED_LOCALES.indexOf(value));
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const currentMeta = localeMeta(value);

  const closePicker = (restoreFocus = true) => {
    setOpen(false);
    typeaheadRef.current = '';
    if (restoreFocus) {
      triggerRef.current?.focus();
    }
  };

  const selectLocale = (locale: Locale) => {
    audioService.play('click');
    onChange(locale);
    closePicker();
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    listboxRef.current?.focus();

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        closePicker(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  useEffect(
    () => () => {
      if (typeaheadTimerRef.current) {
        clearTimeout(typeaheadTimerRef.current);
      }
    },
    [],
  );

  const moveActive = (nextIndex: number) => {
    setActiveIndex(Math.min(Math.max(nextIndex, 0), SUPPORTED_LOCALES.length - 1));
  };

  const handleTypeahead = (key: string) => {
    const query = `${typeaheadRef.current}${key.toLocaleLowerCase()}`;
    const candidates = SUPPORTED_LOCALES.map((locale, index) => {
      const meta = localeMeta(locale);
      return {
        index,
        name: meta.name.toLocaleLowerCase(),
        regionCode: meta.regionCode.toLocaleLowerCase(),
      };
    });
    const fromActive = candidates
      .slice(activeIndex + 1)
      .concat(candidates.slice(0, activeIndex + 1));
    const match = fromActive.find(
      (candidate) => candidate.name.startsWith(query) || candidate.regionCode.startsWith(query),
    );

    if (match) {
      setActiveIndex(match.index);
      typeaheadRef.current = query;
    } else {
      typeaheadRef.current = key.toLocaleLowerCase();
    }

    if (typeaheadTimerRef.current) {
      clearTimeout(typeaheadTimerRef.current);
    }
    typeaheadTimerRef.current = setTimeout(() => {
      typeaheadRef.current = '';
    }, 700);
  };

  const handleListboxKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        moveActive(activeIndex + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        moveActive(activeIndex - 1);
        break;
      case 'Home':
        event.preventDefault();
        moveActive(0);
        break;
      case 'End':
        event.preventDefault();
        moveActive(SUPPORTED_LOCALES.length - 1);
        break;
      case 'Enter':
      case ' ':
      case 'Space': {
        event.preventDefault();
        const locale = SUPPORTED_LOCALES[activeIndex];
        if (locale) {
          selectLocale(locale);
        }
        break;
      }
      case 'Escape':
        event.preventDefault();
        closePicker();
        break;
      default:
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault();
          handleTypeahead(event.key);
        }
    }
  };

  const handleListboxBlur = (event: FocusEvent<HTMLDivElement>) => {
    const nextFocus = event.relatedTarget;
    if (!nextFocus || !event.currentTarget.contains(nextFocus)) {
      closePicker(false);
    }
  };

  const handleTriggerClick = () => {
    audioService.play('click');
    if (open) {
      closePicker();
      return;
    }
    setActiveIndex(selectedIndex);
    setOpen(true);
  };

  return (
    <div ref={rootRef} className="language-choice">
      <span id={labelId} className="language-choice__label">
        {legend}
      </span>

      <button
        ref={triggerRef}
        type="button"
        className={`language-trigger ${open ? 'language-trigger--open' : ''}`}
        aria-label={`${legend}: ${currentMeta.name}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={handleTriggerClick}
      >
        <span className="language-trigger__code" aria-hidden="true">
          {currentMeta.regionCode}
        </span>
        <span className="language-trigger__name" lang={value}>
          {currentMeta.name}
        </span>
        <span className="language-trigger__chevron" aria-hidden="true" />
      </button>

      {open && (
        <div
          ref={listboxRef}
          id={listboxId}
          className="language-listbox"
          role="listbox"
          aria-label={legend}
          aria-activedescendant={`${listboxId}-option-${SUPPORTED_LOCALES[activeIndex]}`}
          aria-labelledby={labelId}
          tabIndex={0}
          onKeyDown={handleListboxKeyDown}
          onBlur={handleListboxBlur}
        >
          {SUPPORTED_LOCALES.map((locale, index) => {
            const meta = localeMeta(locale);
            const selected = locale === value;
            const active = index === activeIndex;
            const optionId = `${listboxId}-option-${locale}`;
            return (
              <div
                key={locale}
                id={optionId}
                role="option"
                aria-selected={selected}
                className={`language-option ${selected ? 'language-option--selected' : ''} ${active ? 'language-option--active' : ''}`.trim()}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectLocale(locale)}
              >
                <span className="language-option__code" aria-hidden="true">
                  {meta.regionCode}
                </span>
                <span className="language-option__name" lang={locale}>
                  {meta.name}
                </span>
                {selected && (
                  <span className="language-option__check" aria-hidden="true">
                    ✓
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

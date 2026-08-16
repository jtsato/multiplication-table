import type { ReactNode } from 'react';
import { audioService } from '../audio/audioService';

interface OptionPickerProps<T extends string> {
  legend: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  /** Rotulo traduzido de cada opcao. */
  labelFor: (option: T) => string;
  /** Amostra visual opcional (cor, miniatura). */
  renderSwatch?: (option: T) => ReactNode;
}

/**
 * Escolha unica em grupo de botoes (usada na criacao do personagem).
 * Implementado como radiogroup para navegar por teclado.
 */
export function OptionPicker<T extends string>({
  legend,
  options,
  value,
  onChange,
  labelFor,
  renderSwatch,
}: OptionPickerProps<T>) {
  return (
    <fieldset className="picker">
      <legend className="picker__legend">{legend}</legend>
      <div className="picker__options" role="radiogroup" aria-label={legend}>
        {options.map((option) => {
          const selected = option === value;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`picker__option ${selected ? 'picker__option--selected' : ''}`}
              onClick={() => {
                audioService.play('click');
                onChange(option);
              }}
            >
              {renderSwatch && <span className="picker__swatch">{renderSwatch(option)}</span>}
              <span className="picker__text">{labelFor(option)}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

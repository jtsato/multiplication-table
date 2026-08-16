interface Swatch {
  id: string;
  color: string;
}

interface SwatchPickerProps {
  legend: string;
  options: Swatch[];
  value: string;
  onChange: (id: string) => void;
}

/** Seletor de cor acessível: além da cor, o item selecionado ganha marca e borda. */
export function SwatchPicker({ legend, options, value, onChange }: SwatchPickerProps) {
  return (
    <fieldset className="swatches">
      <legend className="swatches__legend">{legend}</legend>
      <div className="swatches__row">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`swatch${option.id === value ? ' is-selected' : ''}`}
            style={{ backgroundColor: option.color }}
            aria-pressed={option.id === value}
            aria-label={`${legend}: ${option.id}`}
            onClick={() => onChange(option.id)}
          >
            {option.id === value && <span aria-hidden="true">✓</span>}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

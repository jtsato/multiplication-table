import { audioService } from '../audio/audioService';

interface ToggleRowProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  onLabel: string;
  offLabel: string;
  icon?: string;
}

/**
 * Interruptor das configuracoes.
 * Usa um checkbox de verdade: teclado e leitores de tela funcionam de graca.
 */
export function ToggleRow({ label, checked, onChange, onLabel, offLabel, icon }: ToggleRowProps) {
  return (
    <label className="toggle-row">
      <span className="toggle-row__label">
        {icon && <span aria-hidden="true">{icon}</span>}
        {label}
      </span>

      <input
        type="checkbox"
        className="toggle-row__input"
        checked={checked}
        onChange={(event) => {
          audioService.play('click');
          onChange(event.target.checked);
        }}
      />

      <span className="toggle-row__control" aria-hidden="true">
        <span className="toggle-row__knob" />
      </span>
      <span className="toggle-row__state">{checked ? onLabel : offLabel}</span>
    </label>
  );
}

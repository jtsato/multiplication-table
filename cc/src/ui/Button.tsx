import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import { audioService } from '../audio/audioService';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Emoji ou SVG mostrado antes do texto. */
  icon?: ReactNode;
  block?: boolean;
  /** React 19 aceita `ref` como prop comum em componentes de funcao. */
  ref?: Ref<HTMLButtonElement>;
}

/**
 * Botao padrao do jogo: area de toque grande, foco visivel e um clique
 * sonoro. O som passa pelo audioService, que respeita as configuracoes.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  block = false,
  className,
  children,
  onClick,
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    block ? 'btn--block' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classes}
      onClick={(event) => {
        audioService.play('click');
        onClick?.(event);
      }}
      {...rest}
    >
      {icon && (
        <span className="btn__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="btn__label">{children}</span>
    </button>
  );
}

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { audioService } from '../audio/audioService';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'answer';

interface BlockButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'md' | 'lg' | 'xl';
  children: ReactNode;
  /** Estado visual usado pelas alternativas: certo/errado. */
  state?: 'idle' | 'correct' | 'wrong';
}

/** Botão-bloco: sombra dura deslocada, sem gradiente, alvo de toque grande. */
export function BlockButton({
  variant = 'primary',
  size = 'md',
  state = 'idle',
  children,
  className = '',
  onClick,
  ...rest
}: BlockButtonProps) {
  return (
    <button
      type="button"
      className={`bbtn bbtn--${variant} bbtn--${size} bbtn--${state} ${className}`}
      onClick={(event) => {
        audioService.unlock();
        onClick?.(event);
      }}
      {...rest}
    >
      <span className="bbtn__label">{children}</span>
    </button>
  );
}

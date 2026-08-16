// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from './Button';

describe('Button variants', () => {
  it.each(['primary', 'secondary', 'ghost', 'danger'] as const)(
    'preserva a classe %s',
    (variant) => {
      render(<Button variant={variant}>Ação</Button>);
      expect(screen.getByRole('button', { name: 'Ação' })).toHaveClass(`btn--${variant}`);
    },
  );
});

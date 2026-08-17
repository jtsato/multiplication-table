// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_AVATAR, DEFAULT_MASCOT_ID } from '../domain/defaultState';
import { I18nProvider } from '../i18n/I18nProvider';
import { OnboardingScreen } from './OnboardingScreen';

function renderEditing(onFinish = vi.fn(), onCancel = vi.fn()) {
  render(
    <I18nProvider locale="en-US">
      <OnboardingScreen
        editing
        locale="en-US"
        initialAvatar={{ ...DEFAULT_AVATAR, base: 'boy' }}
        initialMascotId={DEFAULT_MASCOT_ID}
        onLocaleChange={vi.fn()}
        onFinish={onFinish}
        onCancel={onCancel}
      />
    </I18nProvider>,
  );
  return { onFinish, onCancel };
}

describe('OnboardingScreen em modo edição', () => {
  it('deixa trocar entre menino e menina depois do personagem já criado', async () => {
    const user = userEvent.setup();
    const { onFinish } = renderEditing();

    // O passo de personagem abre primeiro: entrar direto na customizacao
    // deixava a base fora do alcance de quem ja terminou o onboarding.
    expect(screen.getByRole('heading', { name: 'Who is exploring the islands?' })).toBeVisible();

    await user.click(screen.getByRole('button', { name: /Girl/ }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(onFinish).toHaveBeenCalledOnce();
    expect(onFinish.mock.calls[0]?.[0]).toMatchObject({ base: 'girl' });
  });

  it('volta um passo por vez e sai sem salvar no primeiro', async () => {
    const user = userEvent.setup();
    const { onFinish, onCancel } = renderEditing();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('heading', { name: 'Make it yours' })).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('heading', { name: 'Who is exploring the islands?' })).toBeVisible();
    expect(onCancel).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onFinish).not.toHaveBeenCalled();
  });
});

import { enUS } from '../locales/en-US';
import { ptBR } from '../locales/pt-BR';
import { translate } from './index';

describe('internationalization', () => {
  it('keeps both locale catalogues structurally aligned', () => {
    expect(Object.keys(enUS).sort()).toEqual(Object.keys(ptBR).sort());
  });

  it('interpolates values and falls back to pt-BR', () => {
    expect(translate('en-US', 'island.title', { table: 7 })).toBe('Table of 7');
    expect(translate('en-US', 'missing.key')).toBe('missing.key');
  });
});

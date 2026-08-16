import { useGame } from '../state/GameProvider';
import { translate, type TranslationKey } from './index';

export function useI18n() {
  const { state } = useGame();
  return (key: TranslationKey, values?: Record<string, string | number>) =>
    translate(state.settings.locale, key, values);
}

import { useI18n } from '../i18n/useI18n';

export function VisualHint({ groups, size }: { groups: number; size: number }) {
  const t = useI18n();
  return (
    <div className="visual-hint" role="note">
      <span>{t('game.hint', { groups, size })}</span>
      <div className="visual-hint__groups" aria-hidden="true">
        {Array.from({ length: groups }, (_, group) => (
          <div key={group}>
            {Array.from({ length: size }, (_, block) => (
              <i key={block} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

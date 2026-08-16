import type { Accessory, AvatarStyle, HairStyle } from '../domain/types';
import { useI18n } from '../i18n/useI18n';

interface AvatarProps {
  style: AvatarStyle;
  outfitColor: string;
  hairStyle: HairStyle;
  accessory: Accessory;
  celebrating?: boolean;
  size?: 'small' | 'large';
}

export function Avatar({
  style,
  outfitColor,
  hairStyle,
  accessory,
  celebrating = false,
  size = 'large',
}: AvatarProps) {
  const t = useI18n();
  const hairPath =
    hairStyle === 'spiky'
      ? 'M24 42 30 17l12 12 11-18 8 19 15-12 2 26z'
      : hairStyle === 'curly'
        ? 'M22 39c0-17 13-26 28-26s29 10 29 27c-7-7-12-8-18-3-8-8-17-8-25 0-5-3-10-2-14 2z'
        : 'M23 41c0-20 11-28 27-28 17 0 28 10 28 29-15-12-40-13-55-1z';
  return (
    <svg
      className={`avatar avatar--${size} ${celebrating ? 'avatar--celebrating' : ''}`}
      viewBox="0 0 100 140"
      role="img"
      aria-label={t('avatar.preview')}
    >
      <g className="avatar__body">
        <rect
          x="24"
          y="73"
          width="52"
          height="47"
          rx={style === 'explorer' ? 13 : 5}
          fill={outfitColor}
        />
        <rect x="30" y="115" width="17" height="20" rx="4" fill="#3d4670" />
        <rect x="54" y="115" width="17" height="20" rx="4" fill="#3d4670" />
        <rect x="17" y="78" width="13" height="38" rx="6" fill="#a96e53" />
        <rect x="70" y="78" width="13" height="38" rx="6" fill="#a96e53" />
        <rect x="25" y="31" width="51" height="50" rx="17" fill="#c98766" />
        <path d={hairPath} fill="#49352e" />
        <rect x="35" y="52" width="7" height="9" rx="3" fill="#2e294e" />
        <rect x="59" y="52" width="7" height="9" rx="3" fill="#2e294e" />
        <path
          d="M42 68c5 5 12 5 17 0"
          fill="none"
          stroke="#7e3d42"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {accessory === 'glasses' && (
          <g fill="none" stroke="#2e294e" strokeWidth="3">
            <rect x="29" y="47" width="19" height="17" rx="5" />
            <rect x="53" y="47" width="19" height="17" rx="5" />
            <path d="M48 53h5" />
          </g>
        )}
        {accessory === 'cap' && (
          <g>
            <path d="M22 37c4-18 18-25 34-20 13 4 19 13 20 23z" fill="#ffca3a" />
            <path d="M51 38h34" stroke="#e39b17" strokeWidth="7" strokeLinecap="round" />
          </g>
        )}
        <rect x="42" y="83" width="17" height="17" rx="3" fill="#fff" opacity=".25" />
      </g>
    </svg>
  );
}

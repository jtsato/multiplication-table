import { useI18n } from "../shared/i18n/I18nContext";
import { HeroAvatar } from "../art/HeroAvatar";
import { MascotAvatar } from "../art/MascotAvatar";
import {
  AVATARS,
  AVATAR_COLORS,
  avatarSpec,
  mascotForAvatar,
  type AvatarSelection,
} from "../slices/avatar/avatar";
import { MAPS } from "../slices/maps/maps";
import { currentMapIndex, type Progress } from "../slices/progression/progression";

interface MenuScreenProps {
  avatar: AvatarSelection;
  progress: Progress;
  totalXp: number;
  onAvatarChange: (next: AvatarSelection) => void;
  onStart: () => void;
}

export function MenuScreen({
  avatar,
  progress,
  totalXp,
  onAvatarChange,
  onStart,
}: MenuScreenProps) {
  const { t } = useI18n();
  const spec = avatarSpec(avatar.classId);
  const mascot = mascotForAvatar(avatar.classId);
  const current = currentMapIndex(progress);

  return (
    <div className="menu-screen">
      <p>{t("app.welcome")}</p>
      <h2>{t("avatar.title")}</h2>
      <p className="menu-subtitle">{t("avatar.subtitle")}</p>

      <div className="avatar-preview" aria-label={t(spec.nameKey)}>
        <HeroAvatar avatarId={avatar.classId} colorId={avatar.colorId} size={112} />
        <MascotAvatar mascotId={mascot} size={40} className="avatar-preview-mascot" />
        <p className="avatar-preview-name">{t(spec.nameKey)}</p>
        <p>{t("avatar.mascotLabel", { name: t(spec.mascotNameKey) })}</p>
        <p className="menu-total-xp">{t("battle.totalXp", { xp: totalXp })}</p>
      </div>

      <fieldset className="avatar-fieldset">
        <legend>{t("avatar.classGroup")}</legend>
        <div className="avatar-options">
          {AVATARS.map((candidate) => {
            const selected = candidate.id === avatar.classId;
            const candidateMascot = mascotForAvatar(candidate.id);
            return (
              <button
                key={candidate.id}
                type="button"
                aria-pressed={selected}
                className="avatar-option"
                onClick={() =>
                  onAvatarChange({
                    classId: candidate.id,
                    colorId: candidate.defaultColorId,
                  })
                }
              >
                <span className="avatar-option-art">
                  <HeroAvatar
                    avatarId={candidate.id}
                    colorId={selected ? avatar.colorId : candidate.defaultColorId}
                    size={72}
                  />
                  <MascotAvatar mascotId={candidateMascot} size={24} />
                </span>
                <span className="avatar-option-name">{t(candidate.nameKey)}</span>
                <span className="avatar-option-description">{t(candidate.descriptionKey)}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="avatar-fieldset">
        <legend>{t("avatar.colorGroup")}</legend>
        <div className="color-options">
          {AVATAR_COLORS.map((color) => {
            const selected = color.id === avatar.colorId;
            return (
              <button
                key={color.id}
                type="button"
                aria-pressed={selected}
                aria-label={t(color.labelKey)}
                className="color-option"
                onClick={() => onAvatarChange({ classId: avatar.classId, colorId: color.id })}
              >
                <span className="color-swatch" style={{ backgroundColor: color.hex }} />
                <span>{t(color.labelKey)}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <section className="map-path-section" aria-labelledby="map-path-heading">
        <h3 id="map-path-heading">{t("map.title")}</h3>
        <ol className="map-path">
          {MAPS.map((map, index) => {
            const state = index < current ? "done" : index === current ? "current" : "locked";
            return (
              <li
                key={map.table}
                className={`map-path-item map-path-item--${state}`}
                aria-label={`${t("map.currentMap")}: ${t(map.nameKey)} — ${state}`}
              >
                <span className="map-path-table">{map.table}</span>
                <span className="map-path-name">{t(map.nameKey)}</span>
              </li>
            );
          })}
        </ol>
      </section>

      <button type="button" className="button-primary" onClick={onStart}>
        {t("avatar.start")}
      </button>
    </div>
  );
}

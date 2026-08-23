import { useGameStore } from '../../app/store';
import { interpolate } from '../../i18n';
import {
  CLOTHES_COLORS,
  FACE_ACCESSORIES,
  HEAD_ACCESSORIES,
  SILHOUETTES,
  SKIN_TONES,
  unlockedAccessories,
  type AccessorySpec,
} from './avatar.logic';
import './avatar.css';

/** Uma fileira de acessórios já conquistados. */
function AccessoryRow<T extends string>({
  legend,
  specs,
  current,
  rotulo,
  onPick,
}: {
  legend: string;
  specs: AccessorySpec<T>[];
  current: T;
  /** O nome do acessorio no idioma escolhido. */
  rotulo: (id: T) => string;
  onPick: (id: T) => void;
}) {
  return (
    <fieldset className="avatar__group">
      <legend className="avatar__legend">{legend}</legend>
      <div className="avatar__row">
        {specs.map((spec) => (
          <button
            key={spec.id}
            type="button"
            className={`avatar__chip ${current === spec.id ? 'avatar__chip--on' : ''}`}
            aria-pressed={current === spec.id}
            onClick={() => onPick(spec.id)}
          >
            {rotulo(spec.id)}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * O espelho.
 *
 * Só oferece o que já foi conquistado — um acessório trancado simplesmente não
 * aparece, em vez de aparecer cinza com um cadeado. Cadeado é a linguagem de
 * loja; aqui a criança vê o guarda-roupa dela crescer, não o que lhe falta.
 */
export function AvatarPanel() {
  const openSpot = useGameStore((state) => state.openSpot);
  const avatar = useGameStore((state) => state.avatar);
  const knownFacts = useGameStore((state) => state.knownFacts);
  const setAvatar = useGameStore((state) => state.setAvatar);
  const closeSpot = useGameStore((state) => state.closeSpot);
  const t = useGameStore((state) => state.text).strings;

  if (openSpot !== 'espelho') return null;

  const cabeca = unlockedAccessories(HEAD_ACCESSORIES, knownFacts);
  const rosto = unlockedAccessories(FACE_ACCESSORIES, knownFacts);

  return (
    <div className="avatar-overlay">
      <div className="avatar" role="dialog" aria-label={t.mirrorTitle}>
        <h2 className="avatar__title">{t.mirrorTitle}</h2>

        <fieldset className="avatar__group">
          <legend className="avatar__legend">{t.character}</legend>
          <div className="avatar__row">
            {SILHOUETTES.map((silhouette) => (
              <button
                key={silhouette}
                type="button"
                className={`avatar__chip ${
                  avatar.silhouette === silhouette ? 'avatar__chip--on' : ''
                }`}
                aria-pressed={avatar.silhouette === silhouette}
                onClick={() => setAvatar({ silhouette })}
              >
                {silhouette === 'menino' ? t.boy : t.girl}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="avatar__group">
          <legend className="avatar__legend">{t.skin}</legend>
          <div className="avatar__row">
            {SKIN_TONES.map((tone, index) => (
              <button
                key={tone}
                type="button"
                className={`avatar__swatch ${avatar.skin === index ? 'avatar__swatch--on' : ''}`}
                style={{ background: tone }}
                aria-label={interpolate(t.skinTone, { n: index + 1 })}
                aria-pressed={avatar.skin === index}
                onClick={() => setAvatar({ skin: index })}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="avatar__group">
          <legend className="avatar__legend">{t.clothes}</legend>
          <div className="avatar__row">
            {CLOTHES_COLORS.map((color, index) => (
              <button
                key={color}
                type="button"
                className={`avatar__swatch ${avatar.clothes === index ? 'avatar__swatch--on' : ''}`}
                style={{ background: color }}
                aria-label={interpolate(t.clothesColor, { n: index + 1 })}
                aria-pressed={avatar.clothes === index}
                onClick={() => setAvatar({ clothes: index })}
              />
            ))}
          </div>
        </fieldset>

        <AccessoryRow
          legend={t.head}
          specs={cabeca}
          current={avatar.head}
          rotulo={(id) => ({ nenhum: t.noHat, bone: t.cap, chapeu: t.hat, coroa: t.crown })[id]}
          onPick={(head) => setAvatar({ head })}
        />
        <AccessoryRow
          legend={t.face}
          specs={rosto}
          current={avatar.face}
          rotulo={(id) => ({ nenhum: t.noGlasses, oculos: t.glasses })[id]}
          onPick={(face) => setAvatar({ face })}
        />

        <button type="button" className="avatar__close" onClick={closeSpot}>
          {t.ready}
        </button>
      </div>
    </div>
  );
}

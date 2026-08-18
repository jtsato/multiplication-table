import { useGameStore } from '../../app/store';
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
  onPick,
}: {
  legend: string;
  specs: AccessorySpec<T>[];
  current: T;
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
            {spec.label}
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

  if (openSpot !== 'espelho') return null;

  const cabeca = unlockedAccessories(HEAD_ACCESSORIES, knownFacts);
  const rosto = unlockedAccessories(FACE_ACCESSORIES, knownFacts);

  return (
    <div className="avatar-overlay">
      <div className="avatar" role="dialog" aria-label="Espelho">
        <h2 className="avatar__title">Espelho</h2>

        <fieldset className="avatar__group">
          <legend className="avatar__legend">Personagem</legend>
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
                {silhouette === 'menino' ? 'Menino' : 'Menina'}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="avatar__group">
          <legend className="avatar__legend">Pele</legend>
          <div className="avatar__row">
            {SKIN_TONES.map((tone, index) => (
              <button
                key={tone}
                type="button"
                className={`avatar__swatch ${avatar.skin === index ? 'avatar__swatch--on' : ''}`}
                style={{ background: tone }}
                aria-label={`Tom de pele ${index + 1}`}
                aria-pressed={avatar.skin === index}
                onClick={() => setAvatar({ skin: index })}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="avatar__group">
          <legend className="avatar__legend">Roupa</legend>
          <div className="avatar__row">
            {CLOTHES_COLORS.map((color, index) => (
              <button
                key={color}
                type="button"
                className={`avatar__swatch ${avatar.clothes === index ? 'avatar__swatch--on' : ''}`}
                style={{ background: color }}
                aria-label={`Cor de roupa ${index + 1}`}
                aria-pressed={avatar.clothes === index}
                onClick={() => setAvatar({ clothes: index })}
              />
            ))}
          </div>
        </fieldset>

        <AccessoryRow
          legend="Cabeça"
          specs={cabeca}
          current={avatar.head}
          onPick={(head) => setAvatar({ head })}
        />
        <AccessoryRow
          legend="Rosto"
          specs={rosto}
          current={avatar.face}
          onPick={(face) => setAvatar({ face })}
        />

        <button type="button" className="avatar__close" onClick={closeSpot}>
          Pronto
        </button>
      </div>
    </div>
  );
}

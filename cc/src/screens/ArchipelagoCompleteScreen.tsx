import { useEffect, type CSSProperties } from 'react';
import { audioService } from '../audio/audioService';
import { buildJourneySummary } from '../domain/journey';
import { getIsland } from '../domain/islands';
import { getMascotDefinition } from '../domain/mascots';
import type { GameState } from '../domain/types';
import { useTranslation } from '../i18n/I18nProvider';
import { Avatar } from '../art/Avatar';
import { IslandBadge } from '../art/IslandBadge';
import { Mascot } from '../art/Mascot';
import { Button } from '../ui/Button';
import { Stars } from '../ui/Stars';

/**
 * O fechamento da jornada: todas as ilhas concluidas.
 *
 * Duas partes, nesta ordem:
 *  1. a cerimonia — coroa, mascote e o arquipelago inteiro aceso de uma vez;
 *  2. o diploma — o que a crianca de fato fez, em numeros que ela reconhece.
 *
 * A tela nao guarda nada: `buildJourneySummary` deriva tudo do progresso, o
 * que permite reabrir o diploma pela Home quantos dias depois for.
 */

/** Mais papel picado que na conclusao de ilha: este momento acontece uma vez. */
const CONFETTI_PIECES = Array.from({ length: 44 }, (_, index) => ({
  shape: (['strip', 'dot', 'square'] as const)[index % 3],
  left: `${(index * 7 + 3) % 100}%`,
  delay: `${(index % 11) * 0.21}s`,
  duration: `${2.4 + (index % 6) * 0.26}s`,
  rotation: `${(index * 41) % 180}deg`,
  colorIndex: index % 6,
}));

const CONFETTI_COLORS = ['#ffd23f', '#ff5d8f', '#7bc9ff', '#8ce99a', '#ffffff', '#c084fc'];

interface ArchipelagoCompleteScreenProps {
  state: GameState;
  /**
   * De onde a crianca chegou: recem-concluido (mapa) ou revisita (Home).
   * So o rotulo e o icone da saida mudam — o roteador nao escreve texto.
   */
  origin: 'map' | 'home';
  onBack: () => void;
  /** Abre o Modo Desafio, liberado por esta conquista. */
  onChallenge: () => void;
}

export function ArchipelagoCompleteScreen({
  state,
  origin,
  onBack,
  onChallenge,
}: ArchipelagoCompleteScreenProps) {
  const { t } = useTranslation();
  const journey = buildJourneySummary(state);
  const mascot = getMascotDefinition(state.player.mascotId);

  useEffect(() => {
    audioService.play('complete');
  }, []);

  const accuracyPercent = Math.round(journey.accuracy * 100);

  return (
    <div className="finale">
      <div className="finale__confetti" aria-hidden="true">
        {CONFETTI_PIECES.map((piece, index) => (
          <span
            key={index}
            aria-hidden="true"
            className={`confetti confetti--${piece.shape}`}
            style={
              {
                left: piece.left,
                background: CONFETTI_COLORS[piece.colorIndex],
                '--confetti-delay': piece.delay,
                '--confetti-duration': piece.duration,
                '--confetti-rotation': piece.rotation,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="finale__stage">
        <Mascot palette={mascot.colors} kind={mascot.kind} size={78} mood="cheering" />
        {/* A coroa aqui e premio, nao escolha: entra por cima do que a
            crianca montou, sem alterar o personagem salvo. */}
        <Avatar
          avatar={{ ...state.player.avatar, accessory: 'crown' }}
          size={168}
          celebrating
          title={t('archipelagoComplete.avatarAlt')}
        />
      </div>

      <h1 className="finale__title">{t('archipelagoComplete.title')}</h1>
      <p className="finale__subtitle">
        {t('archipelagoComplete.subtitle', { islands: journey.islands.length })}
      </p>

      <section className="finale__islands" aria-label={t('archipelagoComplete.islandsTitle')}>
        {journey.islands.map((island) => {
          const definition = getIsland(island.table);
          return (
            <div key={island.table} className="finale__island">
              <IslandBadge
                biome={definition.biome}
                palette={definition.palette}
                status="completed"
                size={82}
              />
              <span className="finale__island-name">{t(`islands.${island.table}.name`)}</span>
              <Stars count={island.stars} size={15} />
            </div>
          );
        })}
      </section>

      <section className="diploma">
        <h2 className="diploma__title">{t('archipelagoComplete.diplomaTitle')}</h2>
        <p className="diploma__holder">{t('archipelagoComplete.diplomaHolder')}</p>

        <dl className="diploma__grid">
          <div className="diploma__item">
            <dt>{t('archipelagoComplete.stars')}</dt>
            <dd>
              {journey.totalStars}
              <span className="diploma__of">/{journey.maxStars}</span>
            </dd>
          </div>
          <div className="diploma__item">
            <dt>{t('archipelagoComplete.answers')}</dt>
            <dd>{journey.totalQuestions}</dd>
          </div>
          <div className="diploma__item">
            <dt>{t('archipelagoComplete.accuracy')}</dt>
            <dd>{accuracyPercent}%</dd>
          </div>
          <div className="diploma__item">
            <dt>{t('archipelagoComplete.bestStreak')}</dt>
            <dd>{journey.bestStreak}</dd>
          </div>
          <div className="diploma__item">
            <dt>{t('archipelagoComplete.adventures')}</dt>
            <dd>{journey.playSessions}</dd>
          </div>
        </dl>

        {journey.toughestVictory && (
          <p className="diploma__victory">
            <span className="diploma__victory-label">{t('archipelagoComplete.toughest')}</span>
            <strong className="diploma__victory-fact">
              {journey.toughestVictory.fact.a} × {journey.toughestVictory.fact.b}
            </strong>
            <span className="diploma__victory-note">
              {t('archipelagoComplete.toughestNote', {
                mistakes: journey.toughestVictory.mistakes,
              })}
            </span>
          </p>
        )}

        <p className="diploma__share">{t('archipelagoComplete.share')}</p>
      </section>

      {/* A saida nao pode ser so "voltar": este e o momento em que a crianca
          pergunta "e agora?", e a Ilha Lendaria e a resposta. */}
      <div className="finale__actions">
        <Button size="lg" icon="⚔️" onClick={onChallenge}>
          {t('challenge.title')}
        </Button>
        <Button
          variant="secondary"
          size="lg"
          icon={origin === 'map' ? '🗺️' : '🏠'}
          onClick={onBack}
        >
          {t(origin === 'map' ? 'archipelagoComplete.backToMap' : 'archipelagoComplete.backToHome')}
        </Button>
      </div>
    </div>
  );
}

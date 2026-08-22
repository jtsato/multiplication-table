import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { palette } from '../shared/palette';
import { BuildingView } from '../slices/building/BuildingView';
import { CompanionView } from '../slices/companion/CompanionView';
import { DayNightView } from '../slices/daynight';
import { HomeView } from '../slices/home/HomeView';
import { LanternView } from '../slices/lantern/LanternView';
import { NpcView } from '../slices/npc/NpcView';
import { GardenView } from '../slices/garden/GardenView';
import { PlayerView } from '../slices/player';
import { FirefliesView } from '../slices/lantern/FirefliesView';
import { RegionsView } from '../slices/regions/RegionsView';
import { WaterfallView } from '../slices/regions/WaterfallView';
import { ResourcesView } from '../slices/resources/ResourcesView';
import { JuiceView } from '../slices/juice/JuiceView';
import { WhaleView } from '../slices/wildlife/WhaleView';
import { WildlifeView } from '../slices/wildlife/WildlifeView';
import { WorldView } from '../slices/world/WorldView';
import { AmbientView } from '../slices/ambient/AmbientView';
import { DailyEventView } from '../slices/daily/DailyEventView';
import { useGameStore } from './store';
import { FpsProbe } from './FpsProbe';

export function GameCanvas({ isTouch = false }: { isTouch?: boolean }) {
  const worldSeed = useGameStore((state) => state.worldSeed);

  return (
    <Canvas
      // No celular a sombra é a variante mais barata (hardware): mantém o clima
      // low-poly sem o custo do filtro PCF. No desktop fica a suave.
      shadows={isTouch ? 'basic' : 'soft'}
      /**
       * Campo de visao maior no celular.
       *
       * `fov` no Three e vertical. Numa tela em retrato, isso deixa o campo
       * *horizontal* estreitissimo — o personagem enche a tela e nao da para ver
       * os recursos em volta. Abrir para 70 devolve a nocao de onde as coisas
       * estao sem precisar mexer a camera o tempo todo.
       */
      camera={{ position: [0, 8, 14], fov: isTouch ? 70 : 55, near: 0.1, far: 200 }}
      /**
       * Qualidade por tipo de aparelho.
       *
       * Celular tem GPU mais fraca e tela de densidade alta — a combinacao pior
       * possivel, porque o custo cresce com o quadrado do `dpr`. Limitar a 1.5 e
       * dispensar o antialias devolve boa parte do custo de quadro, e no estilo
       * low poly a diferenca visual e pequena.
       */
      dpr={isTouch ? [1, 1.5] : [1, 2]}
      gl={{ antialias: !isTouch, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={[palette.skyDay]} />
      {/* Neblina da cor do ceu: esconde a borda do mar e adianta o clima noturno. */}
      <fog attach="fog" args={[palette.skyDay, 45, 110]} />

      {/* Conta os quadros para o medidor `?fps=1`. Custa uma soma por frame. */}
      <FpsProbe />

      <Physics gravity={[0, -22, 0]}>
        {/*
          A ORDEM IMPORTA. O R3F executa os `useFrame` na ordem de montagem, e
          `PlayerView` e quem escreve `playerTransform` — a posicao que recursos
          e fantasma de construcao leem no mesmo quadro. Com ele por ultimo, como
          estava, todos consumiam a posicao do quadro anterior: o destaque do
          recurso acendia um quadro atrasado e, andando a 7 m/s, isso e quase
          12 cm de erro em cada decisao de alcance.

          O relogio vem antes de tudo pelo mesmo motivo: o combustivel da
          fogueira depende dele.
        */}
        <DayNightView isTouch={isTouch} />
        <PlayerView />

        {/* Depois de `PlayerView`: a lanterna le `playerTransform`, e montada
            antes ela ficaria um quadro atras do jogador — meio metro a 7 m/s,
            e num facho de luz isso se ve. */}
        <LanternView />

        {/* O pet tambem le a posicao do jogador no mesmo quadro. */}
        <CompanionView />

        <WorldView seed={worldSeed} />
        <AmbientView seed={worldSeed} />
        <DailyEventView />
        <RegionsView />
        <WaterfallView />
        <WhaleView />
        <FirefliesView seed={worldSeed} />
        <HomeView />
        <WildlifeView />
        <NpcView />
        <GardenView />
        <ResourcesView />
        <BuildingView />
        <JuiceView />
      </Physics>
    </Canvas>
  );
}

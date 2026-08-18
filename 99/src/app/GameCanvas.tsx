import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { palette } from '../shared/palette';
import { BuildingView } from '../slices/building';
import { DayNightView } from '../slices/daynight';
import { PlayerView } from '../slices/player';
import { ResourcesView } from '../slices/resources';
import { WorldView } from '../slices/world';
import { useGameStore } from './store';

export function GameCanvas({ isTouch = false }: { isTouch?: boolean }) {
  const worldSeed = useGameStore((state) => state.worldSeed);

  return (
    <Canvas
      shadows
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

        <WorldView seed={worldSeed} />
        <ResourcesView />
        <BuildingView />
      </Physics>
    </Canvas>
  );
}

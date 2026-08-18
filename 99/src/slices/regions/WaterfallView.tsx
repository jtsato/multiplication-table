import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import { palette } from '../../shared/palette';
import { WATERFALL, WATERFALLS, dropletHeight, splashPosition } from './waterfalls.logic';

/**
 * As cachoeiras dos desniveis.
 *
 * Caixas low poly descendo em laco, como o resto da arte do jogo — nenhum asset
 * externo, nenhum sistema de particulas.
 *
 * **Malhas simples, e nao `Instances`.** A primeira versao instanciava as gotas,
 * e na tela apareciam duas lajotas boiando em vez de uma cortina: as instancias
 * nao chegavam a existir. Para as poucas dezenas de caixas de todo o
 * arquipelago, instanciar economiza quase nada e custa exatamente a confianca de
 * que o que esta no codigo e o que aparece.
 *
 * A altura de cada gota sai de `dropletHeight`, que le o relogio. Mover somando
 * `delta` quadro a quadro acumularia erro e, depois de alguns minutos de jogo
 * aberto, as gotas escapariam da queda.
 */
export function WaterfallView() {
  const refs = useRef<(Mesh | null)[]>([]);

  const gotas = useMemo(
    () =>
      WATERFALLS.flatMap((queda) =>
        Array.from({ length: WATERFALL.droplets }, (_, index) => ({
          key: `${queda.id}-${index}`,
          index,
          queda,
        })),
      ),
    [],
  );

  useFrame((state) => {
    const tempo = state.clock.elapsedTime;
    for (let i = 0; i < gotas.length; i += 1) {
      const malha = refs.current[i];
      if (!malha) continue;
      const { queda, index } = gotas[i];
      malha.position.y = dropletHeight(tempo, index, queda.topY, queda.bottomY);
    }
  });

  return (
    <>
      {gotas.map(({ key, queda, index }, i) => (
        <mesh
          key={key}
          ref={(malha) => {
            refs.current[i] = malha;
          }}
          position={[queda.x, dropletHeight(0, index, queda.topY, queda.bottomY), queda.z]}
          rotation={[0, -queda.angle, 0]}
        >
          <boxGeometry args={[WATERFALL.width, 0.8, WATERFALL.thickness]} />
          {/* Sem `flatShading`: a agua e a unica coisa do jogo que nao deve ler
              como faceta dura. Transparente para a rocha aparecer por tras. */}
          <meshLambertMaterial color={palette.water} transparent opacity={0.75} />
        </mesh>
      ))}

      {/* Espuma na base: um disco claro que so marca onde a agua bate. */}
      {WATERFALLS.map((queda) => {
        const espuma = splashPosition(queda);
        return (
          <mesh
            key={`espuma-${queda.id}`}
            position={[espuma.x, espuma.y, espuma.z]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <circleGeometry args={[WATERFALL.width * 0.8, 12]} />
            <meshBasicMaterial color={palette.foam} transparent opacity={0.65} />
          </mesh>
        );
      })}
    </>
  );
}

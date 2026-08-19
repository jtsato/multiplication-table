import { useGameStore } from '../../app/store';
import { palette } from '../../shared/palette';
import {
  HOME_DECORATION_KINDS,
  HOME_DECORATION_OFFSETS,
  type HomeDecorationKind,
} from './home.logic';

/**
 * As decorações compradas na loja, desenhadas dentro da casa.
 *
 * A promessa da categoria `casa` é "poder mostrar": cada peça comprada precisa
 * aparecer. Sem isto, a criança paga moedas e recursos e não vê nada mudar —
 * exatamente o oposto do que a loja promete.
 *
 * A slice `home/` não importa a economia: ela recebe `owned` do store composto
 * e decide o que desenhar pela lista local `HOME_DECORATION_KINDS`. Um teste
 * cruza essa lista com o catálogo da loja para garantir que nenhum item de
 * categoria `casa` fique sem visual.
 */

function Tapete() {
  return (
    <mesh position={[0, 0, 0]} receiveShadow>
      <boxGeometry args={[2.2, 0.05, 1.5]} />
      <meshLambertMaterial color={palette.shell} flatShading />
    </mesh>
  );
}

function Aquario() {
  return (
    <group>
      {/* A água: base baixa e sólida, para o aquário não parecer flutuando. */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[0.78, 0.2, 0.48]} />
        <meshLambertMaterial color={palette.fish} flatShading />
      </mesh>
      {/* O vidro, meio transparente. */}
      <mesh position={[0, 0.58, 0]} castShadow>
        <boxGeometry args={[0.8, 0.72, 0.5]} />
        <meshLambertMaterial color={palette.crystal} flatShading transparent opacity={0.45} />
      </mesh>
      {/* Dois peixes pequenos, para o efeito da loja dizer a verdade. */}
      <mesh position={[-0.22, 0.55, 0]}>
        <icosahedronGeometry args={[0.09, 0]} />
        <meshLambertMaterial color={palette.honey} flatShading />
      </mesh>
      <mesh position={[0.2, 0.68, 0.12]}>
        <icosahedronGeometry args={[0.07, 0]} />
        <meshLambertMaterial color={palette.fire} flatShading />
      </mesh>
    </group>
  );
}

function Vaso() {
  return (
    <group>
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.3, 0.44, 8]} />
        <meshLambertMaterial color={palette.homeWall} flatShading />
      </mesh>
      {/* Três cogumelos saindo do vaso. */}
      <mesh position={[-0.14, 0.48, 0]} castShadow>
        <coneGeometry args={[0.12, 0.2, 6]} />
        <meshLambertMaterial color={palette.mushroom} flatShading />
      </mesh>
      <mesh position={[0.16, 0.5, -0.02]} castShadow>
        <coneGeometry args={[0.1, 0.16, 6]} />
        <meshLambertMaterial color={palette.mushroom} flatShading />
      </mesh>
      <mesh position={[0.02, 0.62, 0.1]} castShadow>
        <coneGeometry args={[0.09, 0.14, 6]} />
        <meshLambertMaterial color={palette.mushroom} flatShading />
      </mesh>
    </group>
  );
}

function Lustre() {
  return (
    <group>
      {/* Braçadeira do teto e o corpo do lustre. */}
      <mesh position={[0, -0.05, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.18, 0.12, 8]} />
        <meshLambertMaterial color={palette.honey} flatShading />
      </mesh>
      {/* Pingentes de cristal: a luz colorida que a loja promete. */}
      <mesh position={[0.22, -0.3, 0]} castShadow>
        <octahedronGeometry args={[0.09, 0]} />
        <meshLambertMaterial color={palette.crystal} flatShading />
      </mesh>
      <mesh position={[-0.22, -0.32, 0.05]} castShadow>
        <octahedronGeometry args={[0.08, 0]} />
        <meshLambertMaterial color={palette.crystal} flatShading />
      </mesh>
      <mesh position={[0, -0.36, 0.2]} castShadow>
        <octahedronGeometry args={[0.07, 0]} />
        <meshLambertMaterial color={palette.crystal} flatShading />
      </mesh>
      <mesh position={[0.05, -0.34, -0.2]} castShadow>
        <octahedronGeometry args={[0.08, 0]} />
        <meshLambertMaterial color={palette.crystal} flatShading />
      </mesh>
    </group>
  );
}

function Prateleira() {
  return (
    <group>
      <mesh position={[0, 0.04, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.18, 0.06, 0.9]} />
        <meshLambertMaterial color={palette.bridgeDeck} flatShading />
      </mesh>
      {/* Potinhos de mel: a prateleira "cheira bem de longe". */}
      <mesh position={[0, 0.26, -0.2]}>
        <cylinderGeometry args={[0.09, 0.09, 0.18, 6]} />
        <meshLambertMaterial color={palette.honey} flatShading />
      </mesh>
      <mesh position={[0, 0.26, 0.15]}>
        <cylinderGeometry args={[0.07, 0.07, 0.14, 6]} />
        <meshLambertMaterial color={palette.honey} flatShading />
      </mesh>
      <mesh position={[0, 0.4, -0.05]}>
        <boxGeometry args={[0.06, 0.08, 0.06]} />
        <meshLambertMaterial color={palette.homeWall} flatShading />
      </mesh>
    </group>
  );
}

function Escultura() {
  return (
    <group>
      {/* Base de gelo, para a escultura ficar na altura dos olhos. */}
      <mesh position={[0, 0.32, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.42, 0.64, 6]} />
        <meshLambertMaterial color={palette.iceBase} flatShading />
      </mesh>
      {/* O cristal: octaedro, a mesma forma dos cristais da cachoeira. */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <octahedronGeometry args={[0.42, 0]} />
        <meshLambertMaterial color={palette.ice} flatShading />
      </mesh>
    </group>
  );
}

function Peca({ kind }: { kind: HomeDecorationKind }) {
  switch (kind) {
    case 'tapete':
      return <Tapete />;
    case 'aquario':
      return <Aquario />;
    case 'vaso':
      return <Vaso />;
    case 'lustre':
      return <Lustre />;
    case 'prateleira':
      return <Prateleira />;
    case 'escultura':
      return <Escultura />;
  }
}

/**
 * Lê `owned` do store e desenha as decorações compradas.
 *
 * Retorna `null` quando não há nenhuma: sem isso a cena ganharia um grupo vazio
 * para toda criança que ainda não comprou nada — custo pequeno, mas evitável.
 */
export function HomeDecorations() {
  const owned = useGameStore((state) => state.owned);
  const compradas = HOME_DECORATION_KINDS.filter((kind) => owned.includes(kind));

  if (compradas.length === 0) return null;

  return (
    <group name="decoracoes">
      {compradas.map((kind) => {
        const offset = HOME_DECORATION_OFFSETS[kind];
        return (
          <group key={kind} name={kind} position={[offset.x, offset.y, offset.z]}>
            <Peca kind={kind} />
          </group>
        );
      })}
    </group>
  );
}

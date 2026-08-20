import { REGIONS } from './regions.logic';
import { REGION_PALETTE, palette } from '../../shared/palette';

/**
 * Placas de navegação 3D.
 *
 * Um poste com uma placa pintada da cor da região, no centro de cada ilha. Sem
 * texto em 3D (zero asset de fonte): a criança associa a placa à cor da região
 * no minimapa e no chão. O minimapa traz o nome; a placa marca o lugar.
 */
export function RegionSignposts() {
  return (
    <group name="placas-de-regiao">
      {REGIONS.map((regiao) => (
        <group
          key={regiao.id}
          name={`placa-${regiao.id}`}
          position={[regiao.center.x, 0, regiao.center.z]}
        >
          <mesh position={[0, 1, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.1, 2, 6]} />
            <meshLambertMaterial color={palette.trunk} flatShading />
          </mesh>
          <mesh position={[0, 1.7, 0]} castShadow>
            <boxGeometry args={[1.1, 0.55, 0.08]} />
            <meshLambertMaterial color={REGION_PALETTE[regiao.id].ground} flatShading />
          </mesh>
          {/* Face clara: a cor da região continua aparecendo na moldura. */}
          <mesh position={[0, 1.7, 0.05]}>
            <boxGeometry args={[1.0, 0.45, 0.02]} />
            <meshBasicMaterial color="#fff8e8" />
          </mesh>
          <mesh position={[0, 2.05, 0]} castShadow>
            <sphereGeometry args={[0.12, 8, 6]} />
            <meshLambertMaterial color={palette.crown} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
}

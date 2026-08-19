import { palette } from '../../shared/palette';
import { bridgeGuardPosition, type Bridge } from './bridges.logic';
import { regionById } from './regions.logic';

/**
 * A guardia da ponte, visivel na margem de origem.
 *
 * Ela e a cara do pedagio: a crianca ve quem vai cobrar a conta antes de apertar
 * `E`. A posicao vem de `bridgeGuardPosition` — a mesma regra pura que os testes
 * conferem — e o corpo reaproveita as primitivas dos outros NPCs, com uma
 * lanterna para se distinguir de longe.
 */
export function BridgeGuardView({ ponte }: { ponte: Bridge }) {
  const pos = bridgeGuardPosition(ponte);
  const origem = regionById(ponte.from);

  // Fica de frente para quem se aproxima pelo centro da regiao de origem.
  const facing = Math.atan2(origem.center.x - pos.x, origem.center.z - pos.z);

  return (
    <group name={`guard-${ponte.id}`} position={[pos.x, pos.y, pos.z]} rotation={[0, facing, 0]}>
      {/* Corpo */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[0.6, 0.9, 0.4]} />
        <meshLambertMaterial color={palette.homeBed} flatShading />
      </mesh>
      {/* Cabeca */}
      <mesh position={[0, 1.35, 0]} castShadow>
        <sphereGeometry args={[0.28, 6, 5]} />
        <meshLambertMaterial color={palette.playerHead} flatShading />
      </mesh>
      {/* Lanterna: o simbolo da guardia, acesa para se ver de longe. */}
      <mesh position={[0.5, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.9, 6]} />
        <meshLambertMaterial color={palette.trunk} flatShading />
      </mesh>
      <mesh position={[0.5, 1.65, 0]} castShadow>
        <sphereGeometry args={[0.14, 6, 5]} />
        <meshLambertMaterial color={palette.honey} flatShading />
      </mesh>
      {/* Placa de pedagio, como os outros NPCs carregam a sua. */}
      <mesh position={[0, 1.0, 0.45]} castShadow>
        <boxGeometry args={[0.5, 0.34, 0.06]} />
        <meshLambertMaterial color={palette.homeChart} flatShading />
      </mesh>
    </group>
  );
}

/**
 * Vetor 3D simples, sem dependencia do Three.
 *
 * A logica pura das slices trabalha com este tipo para poder ser testada em
 * ambiente node, sem importar o motor grafico. A conversao para `THREE.Vector3`
 * acontece so na fronteira dos componentes R3F.
 */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export function vec3(x = 0, y = 0, z = 0): Vec3 {
  return { x, y, z };
}

/** Distancia ao quadrado no plano XZ — evita a raiz quadrada em comparacoes. */
export function distanceSqXZ(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return dx * dx + dz * dz;
}

/** Distancia no plano XZ, ignorando altura. */
export function distanceXZ(a: Vec3, b: Vec3): number {
  return Math.sqrt(distanceSqXZ(a, b));
}

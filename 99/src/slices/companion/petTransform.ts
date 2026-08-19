/**
 * Posicao viva do pet, fora do React.
 *
 * Mesmo motivo de `playerTransform`: o pet anda todo quadro, e escrever no
 * store a 60 Hz re-renderizaria a arvore. `CompanionView` escreve aqui dentro
 * do `useFrame`; o E2E le pela ponte de depuracao.
 */
export const petTransform = {
  x: 0,
  y: 0,
  z: 0,
};

export function resetPetTransform(): void {
  petTransform.x = 0;
  petTransform.y = 0;
  petTransform.z = 0;
}

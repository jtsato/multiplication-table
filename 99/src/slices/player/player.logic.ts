import { type Vec3, vec3 } from '../../shared/vec';

/** Teclas de movimento pressionadas em um dado quadro. */
export interface MoveInput {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
}

export const PLAYER = {
  speed: 7,
  /** Altura do corpo (capsula): 2 * halfHeight + 2 * radius. */
  radius: 0.4,
  halfHeight: 0.4,
  /** Camera seguidora. */
  cameraDistance: 11,
  cameraHeight: 6.5,
  /** Ponto que a camera mira: um pouco acima do centro do corpo. */
  cameraLookAtHeight: 1.4,
  /** Suavizacao exponencial da camera (maior = mais rigida). */
  cameraStiffness: 8,
  /** Velocidade de giro da camera pelas setas, em radianos por segundo. */
  keyboardYawSpeed: 2.2,
  /** Sensibilidade do giro por arrasto do mouse, em radianos por pixel. */
  pointerYawSensitivity: 0.005,
  /** Idem para o dedo: o toque percorre menos pixels e precisa render mais. */
  touchYawSensitivity: 0.009,
} as const;

/**
 * Converte as teclas em uma direcao de movimento no plano XZ, relativa a camera.
 *
 * Convencao de eixos: com `yaw = 0` a camera fica em +Z olhando para -Z, logo
 * "para frente" e -Z. Girar o yaw gira o mundo do jogador junto com a camera,
 * que e o que faz W apontar sempre para o fundo da tela.
 *
 * Devolve sempre um vetor normalizado (ou zero), para que andar na diagonal nao
 * seja mais rapido que andar reto.
 */
export function inputToDirection(input: MoveInput, cameraYaw: number): Vec3 {
  const forwardAxis = (input.forward ? 1 : 0) - (input.back ? 1 : 0);
  const rightAxis = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  return axesToDirection(rightAxis, -forwardAxis, cameraYaw);
}

/**
 * Converte eixos analogicos em direcao no plano XZ, relativa a camera.
 *
 * Caminho comum do teclado e do toque: o teclado entrega eixos de -1/0/1 e o
 * joystick entrega qualquer valor entre -1 e 1. Ter as duas entradas passando
 * pela mesma funcao garante que andar no celular e andar no teclado obedecem
 * exatamente a mesma convencao de eixos.
 *
 * A magnitude e preservada ate 1 e so entao limitada — o joystick pela metade
 * anda pela metade, mas a diagonal nunca anda mais rapido que a reta.
 */
export function axesToDirection(axisX: number, axisZ: number, cameraYaw: number): Vec3 {
  const magnitude = Math.hypot(axisX, axisZ);
  if (magnitude === 0) return vec3();

  // Acima de 1 (diagonal no teclado) normaliza; abaixo, preserva o analogico.
  const scale = magnitude > 1 ? 1 / magnitude : 1;
  const x = axisX * scale;
  const z = axisZ * scale;

  const sin = Math.sin(cameraYaw);
  const cos = Math.cos(cameraYaw);

  // frente = (-sin, 0, -cos); direita = frente x cima = (cos, 0, -sin)
  // Aqui `z` positivo aponta para tras, entao entra com o sinal invertido.
  return vec3(sin * z + cos * x, 0, cos * z - sin * x);
}

/**
 * Posicao desejada da camera: atras do jogador, na direcao definida pelo yaw.
 *
 * Como o terreno desta POC e plano, manter uma altura fixa positiva ja garante
 * que a camera nunca atravesse o chao — nao ha necessidade de raycast.
 */
export function followCameraTarget(
  playerPosition: Vec3,
  cameraYaw: number,
  distance: number = PLAYER.cameraDistance,
  height: number = PLAYER.cameraHeight,
): Vec3 {
  return vec3(
    playerPosition.x + Math.sin(cameraYaw) * distance,
    playerPosition.y + height,
    playerPosition.z + Math.cos(cameraYaw) * distance,
  );
}

/**
 * Fator de suavizacao exponencial independente da taxa de quadros.
 *
 * Um `lerp` com fator fixo por quadro deixa a camera mais rapida a 144 Hz do que
 * a 60 Hz; `1 - e^(-k*dt)` corrige isso.
 */
export function smoothingFactor(stiffness: number, delta: number): number {
  return 1 - Math.exp(-stiffness * delta);
}

/** Angulo de frente do personagem, para ele encarar a direcao em que anda. */
export function facingAngle(direction: Vec3): number {
  return Math.atan2(direction.x, direction.z);
}

/**
 * Interpola dois angulos pelo caminho mais curto, evitando o giro de 360 graus
 * quando o valor cruza -PI/+PI.
 */
export function lerpAngle(from: number, to: number, t: number): number {
  const twoPi = Math.PI * 2;
  let diff = ((to - from + Math.PI) % twoPi) - Math.PI;
  if (diff < -Math.PI) diff += twoPi;
  return from + diff * t;
}

import { useFrame } from '@react-three/fiber';
import { tickFps } from '../shared/fps';

/** Conta quadros do loop do Canvas para o medidor de FPS em modo debug. */
export function FpsProbe() {
  useFrame(() => {
    tickFps();
  });
  return null;
}

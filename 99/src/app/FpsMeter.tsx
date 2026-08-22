import { useEffect, useState } from 'react';
import { currentFps } from '../shared/fps';
import './fps.css';

/**
 * Medidor de FPS em DOM.
 *
 * Só aparece com `?fps=1` na URL. O número é lido do contador que o `FpsProbe`
 * alimenta dentro do `useFrame`; este componente apenas agenda o `setState`
 * duas vezes por segundo.
 */
export function FpsMeter() {
  const [fps, setFps] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setFps(currentFps()), 500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fps-meter" role="status">
      {fps} fps
    </div>
  );
}

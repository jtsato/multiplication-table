interface HintGridProps {
  a: number;
  b: number;
  title: string;
  result: string;
}

/**
 * Ajuda visual: `a` grupos de `b` blocos. Aparece depois de um erro para que a
 * criança consiga contar em vez de adivinhar.
 */
export function HintGrid({ a, b, title, result }: HintGridProps) {
  return (
    <div className="hint" role="note">
      <p className="hint__title">{title}</p>
      <div className="hint__groups">
        {Array.from({ length: a }, (_, groupIndex) => (
          <div className="hint__group" key={groupIndex}>
            {Array.from({ length: b }, (_, dotIndex) => (
              <span className="hint__dot" key={dotIndex} />
            ))}
          </div>
        ))}
      </div>
      <p className="hint__result">{result}</p>
    </div>
  );
}

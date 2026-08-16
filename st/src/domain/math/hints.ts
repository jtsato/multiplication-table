import type { MultiplicationFact } from "./facts";

export type Hint = {
  level: 0 | 1 | 2 | 3 | 4;
  text: string;
};

export function getHint(fact: MultiplicationFact, errorCount: number): Hint {
  const level = Math.max(0, Math.min(4, Math.floor(errorCount))) as Hint["level"];
  switch (level) {
    case 0:
      return { level, text: "" };
    case 1:
      return { level, text: "Confira a quantidade e o preço de cada item." };
    case 2:
      return { level, text: `${fact.a} produtos · R$ ${fact.b} cada` };
    case 3:
      return { level, text: Array.from({ length: fact.a }, () => fact.b).join(" + ") };
    default:
      return { level: 4, text: `${fact.a} × ${fact.b} = ${fact.answer}` };
  }
}

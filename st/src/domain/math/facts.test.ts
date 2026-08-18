import { describe, expect, it } from "vitest";
import { bandForFact, commutativeKey, createFact, factKey, listFacts } from "./facts";

describe("multiplication facts", () => {
  it("creates a valid fact with its calculated answer", () => {
    expect(createFact(6, 7)).toEqual({ a: 6, b: 7, answer: 42 });
  });

  it("rejects factors outside the learning range", () => {
    expect(() => createFact(0, 7)).toThrow("Fatores devem estar entre 1 e 10");
    expect(() => createFact(11, 7)).toThrow("Fatores devem estar entre 1 e 10");
    expect(() => createFact(7, 0)).toThrow("Fatores devem estar entre 1 e 10");
    expect(() => createFact(7, 11)).toThrow("Fatores devem estar entre 1 e 10");
    expect(() => createFact(1.5, 7)).toThrow("Fatores devem estar entre 1 e 10");
    expect(() => createFact(-1, 7)).toThrow("Fatores devem estar entre 1 e 10");
  });

  it("lists every ordered pair up to the given max factor", () => {
    expect(listFacts(1)).toHaveLength(1);
    expect(listFacts(2)).toHaveLength(4);
    expect(listFacts()).toHaveLength(100);
    expect(
      listFacts(2)
        .map((fact) => fact.answer)
        .sort((a, b) => a - b),
    ).toEqual([1, 2, 2, 4]);
  });

  it("builds directional and commutative keys", () => {
    expect(factKey(createFact(3, 4))).toBe("3x4");
    expect(factKey(createFact(4, 3))).toBe("4x3");
    expect(commutativeKey(createFact(3, 4))).toBe("3x4");
    expect(commutativeKey(createFact(4, 3))).toBe("3x4");
    expect(commutativeKey(createFact(7, 7))).toBe("7x7");
  });

  it("assigns bands by the largest factor", () => {
    expect(bandForFact(createFact(2, 2))).toBe("A");
    expect(bandForFact(createFact(4, 1))).toBe("B");
    expect(bandForFact(createFact(6, 1))).toBe("C");
    expect(bandForFact(createFact(9, 1))).toBe("D");
    expect(bandForFact(createFact(10, 1))).toBe("E");
    expect(bandForFact(createFact(5, 1))).toBe("D");
    expect(bandForFact(createFact(3, 2))).toBe("B");
  });
});

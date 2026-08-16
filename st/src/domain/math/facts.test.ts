import { describe, expect, it } from "vitest";
import { createFact } from "./facts";

describe("multiplication facts", () => {
  it("creates a valid fact with its calculated answer", () => {
    expect(createFact(6, 7)).toEqual({ a: 6, b: 7, answer: 42 });
  });

  it("rejects factors outside the learning range", () => {
    expect(() => createFact(0, 7)).toThrow("Fatores devem estar entre 1 e 10");
    expect(() => createFact(11, 7)).toThrow("Fatores devem estar entre 1 e 10");
  });
});

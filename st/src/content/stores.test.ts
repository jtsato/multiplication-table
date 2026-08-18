import { describe, expect, it } from "vitest";
import { CUSTOMERS, STORES } from "./stores";

describe("store content", () => {
  it("defines four stores with three initial and three unlockable products", () => {
    expect(STORES).toHaveLength(4);
    for (const store of STORES) {
      expect(store.products).toHaveLength(6);
      expect(store.products.filter((product) => product.initiallyAvailable)).toHaveLength(3);
      expect(store.products.every((product) => product.price >= 1 && product.price <= 10)).toBe(
        true,
      );
    }
  });

  it("has a recurring cast with distinct customer identities", () => {
    expect(CUSTOMERS.map((customer) => customer.name)).toEqual([
      "Lia",
      "Caio",
      "Bia",
      "Theo",
      "Nina",
      "Davi",
    ]);
    expect(new Set(CUSTOMERS.map((customer) => customer.id)).size).toBe(CUSTOMERS.length);
  });
});

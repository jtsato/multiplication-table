import { describe, expect, it } from "vitest";
import { calculateSale, purchaseProduct } from "./economy";

describe("shop economy", () => {
  it("calculates revenue from quantity times unit price", () => {
    expect(calculateSale(6, 7)).toEqual({ quantity: 6, unitPrice: 7, total: 42 });
  });

  it("does not allow a purchase that costs more than the cash", () => {
    expect(purchaseProduct(79, 80)).toEqual({ ok: false, cash: 79, reason: "Saldo insuficiente" });
    expect(purchaseProduct(100, 80)).toEqual({ ok: true, cash: 20, reason: undefined });
  });
});

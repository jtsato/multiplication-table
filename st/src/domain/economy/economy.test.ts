import { describe, expect, it } from "vitest";
import { calculateSale, purchaseProduct } from "./economy";

describe("shop economy", () => {
  it("calculates revenue from quantity times unit price", () => {
    expect(calculateSale(6, 7)).toEqual({ quantity: 6, unitPrice: 7, total: 42 });
  });

  it("accepts boundary values for quantity and unit price", () => {
    expect(calculateSale(1, 1)).toEqual({ quantity: 1, unitPrice: 1, total: 1 });
    expect(calculateSale(10, 10)).toEqual({ quantity: 10, unitPrice: 10, total: 100 });
  });

  it("rejects non-integer quantities and quantities below one", () => {
    expect(() => calculateSale(1.5, 7)).toThrow("Quantidade inválida");
    expect(() => calculateSale(0, 7)).toThrow("Quantidade inválida");
    expect(() => calculateSale(-3, 7)).toThrow("Quantidade inválida");
  });

  it("rejects invalid unit prices", () => {
    expect(() => calculateSale(6, 1.5)).toThrow("Preço inválido");
    expect(() => calculateSale(6, 0)).toThrow("Preço inválido");
    expect(() => calculateSale(6, 11)).toThrow("Preço inválido");
    expect(() => calculateSale(6, -2)).toThrow("Preço inválido");
  });

  it("does not allow a purchase that costs more than the cash", () => {
    expect(purchaseProduct(79, 80)).toEqual({ ok: false, cash: 79, reason: "Saldo insuficiente" });
    expect(purchaseProduct(100, 80)).toEqual({ ok: true, cash: 20, reason: undefined });
  });

  it("allows a purchase that exactly matches the cash", () => {
    expect(purchaseProduct(80, 80)).toEqual({ ok: true, cash: 0, reason: undefined });
  });

  it("allows a free purchase without changing the cash", () => {
    expect(purchaseProduct(50, 0)).toEqual({ ok: true, cash: 50, reason: undefined });
  });
});

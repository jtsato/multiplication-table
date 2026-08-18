export type Sale = {
  quantity: number;
  unitPrice: number;
  total: number;
};

export type PurchaseResult = {
  ok: boolean;
  cash: number;
  reason?: string;
};

export function calculateSale(quantity: number, unitPrice: number): Sale {
  if (!Number.isInteger(quantity) || quantity < 1) throw new RangeError("Quantidade inválida");
  if (!Number.isInteger(unitPrice) || unitPrice < 1 || unitPrice > 10)
    throw new RangeError("Preço inválido");
  return { quantity, unitPrice, total: quantity * unitPrice };
}

export function purchaseProduct(cash: number, cost: number): PurchaseResult {
  if (cost > cash) return { ok: false, cash, reason: "Saldo insuficiente" };
  return { ok: true, cash: cash - cost, reason: undefined };
}

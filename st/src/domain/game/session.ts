import { CUSTOMERS, type Product, type StoreDefinition } from "../../content/stores";
import { calculateSale, type Sale } from "../economy/economy";
import { createFact, type MultiplicationFact } from "../math/facts";
import { seededRandom, seededShuffle } from "../math/rng";

export type ServiceMode = "direct" | "product-select";

export type CustomerVisit = {
  customer: (typeof CUSTOMERS)[number];
  product: Product;
  quantity: number;
  mode: ServiceMode;
  fact: MultiplicationFact;
  sale: Sale;
};

export type SessionPhase = "customer" | "product-select" | "question" | "feedback" | "summary";

export type SessionFeedback = {
  kind: "correct" | "incorrect";
  answer: number;
};

export type DaySession = {
  day: number;
  seed: number;
  visits: CustomerVisit[];
  currentIndex: number;
  phase: SessionPhase;
  selectedQuantity: number;
  errorsForCurrent: number;
  revenue: number;
  completedVisits: number;
  feedback?: SessionFeedback;
};

export function createDaySession(store: StoreDefinition, day: number, seed: number, unlockedProductIds?: string[]): DaySession {
  const availableProducts = store.products.filter(
    (product) => product.initiallyAvailable || unlockedProductIds?.includes(product.id),
  );
  const count = seededRandom(seed + day) > 0.45 ? 6 : 5;
  const customers = seededShuffle(CUSTOMERS, seed + day).slice(0, count);
  const visits = customers.map((customer, index) => {
    const product = seededShuffle(availableProducts, seed + index * 19)[0];
    const quantity = 1 + Math.floor(seededRandom(seed + index * 29 + day) * 10);
    const mode: ServiceMode = seededRandom(seed + index * 31) > 0.5 ? "product-select" : "direct";
    const fact = createFact(quantity, product.price);
    return { customer, product, quantity, mode, fact, sale: calculateSale(quantity, product.price) };
  });

  return {
    day,
    seed,
    visits,
    currentIndex: 0,
    phase: visits[0]?.mode === "product-select" ? "product-select" : "customer",
    selectedQuantity: 0,
    errorsForCurrent: 0,
    revenue: 0,
    completedVisits: 0,
  };
}

export function getCurrentVisit(session: DaySession): CustomerVisit {
  const visit = session.visits[session.currentIndex];
  if (!visit) throw new Error("A sessão do dia já foi concluída");
  return visit;
}

export function selectQuantity(session: DaySession, quantity: number): DaySession {
  const visit = getCurrentVisit(session);
  const boundedQuantity = Math.max(0, Math.min(visit.quantity, Math.floor(quantity)));
  return { ...session, selectedQuantity: boundedQuantity, phase: boundedQuantity === visit.quantity ? "question" : "product-select" };
}

export function submitAnswer(session: DaySession, value: number): DaySession {
  const visit = getCurrentVisit(session);
  if (value !== visit.fact.answer) {
    return {
      ...session,
      phase: "feedback",
      errorsForCurrent: session.errorsForCurrent + 1,
      feedback: { kind: "incorrect", answer: visit.fact.answer },
    };
  }

  return {
    ...session,
    phase: "feedback",
    revenue: session.revenue + visit.sale.total,
    completedVisits: session.completedVisits + 1,
    feedback: { kind: "correct", answer: visit.fact.answer },
  };
}

export function retryQuestion(session: DaySession): DaySession {
  return { ...session, phase: "question", feedback: undefined };
}

export function continueAfterFeedback(session: DaySession): DaySession {
  if (!session.feedback) return session;
  if (session.feedback.kind === "incorrect") return retryQuestion(session);

  const nextIndex = session.currentIndex + 1;
  const nextVisit = session.visits[nextIndex];
  return {
    ...session,
    currentIndex: nextIndex,
    phase: nextVisit ? (nextVisit.mode === "product-select" ? "product-select" : "customer") : "summary",
    selectedQuantity: 0,
    errorsForCurrent: 0,
    feedback: undefined,
  };
}

import { describe, expect, it } from "vitest";
import { getStore } from "../../content/stores";
import { createFact, listFacts } from "../math/facts";
import { createFactProgress, type FactProgress } from "../math/mastery";
import { chooseNextFact } from "../math/scheduler";
import { createDaySession, continueAfterFeedback, getCurrentVisit, submitAnswer } from "./session";

describe("shop day session", () => {
  it("creates five or six deterministic customer visits", () => {
    const first = createDaySession(getStore("bookstore"), 1, 20);
    const second = createDaySession(getStore("bookstore"), 1, 20);

    expect(first).toEqual(second);
    expect(first.visits.length).toBeGreaterThanOrEqual(5);
    expect(first.visits.length).toBeLessThanOrEqual(6);
    expect(first.visits.every((visit) => visit.quantity >= 1 && visit.quantity <= 10)).toBe(true);
  });

  it("starts at the first customer with a contextual multiplication fact", () => {
    const session = createDaySession(getStore("art"), 1, 8);
    const visit = getCurrentVisit(session);

    expect(session.phase).toBe("customer");
    expect(visit.product.name).toBeTruthy();
    expect(visit.fact.answer).toBe(visit.quantity * visit.product.price);
  });

  it("holds a correct feedback step before the next customer", () => {
    const session = createDaySession(getStore("art"), 1, 8);
    const question = { ...session, phase: "question" as const };
    const answered = submitAnswer(question, getCurrentVisit(question).fact.answer);

    expect(answered.phase).toBe("feedback");
    expect(answered.revenue).toBe(getCurrentVisit(question).sale.total);
    expect(answered.completedVisits).toBe(1);
    expect(continueAfterFeedback(answered).currentIndex).toBe(1);
  });

  it("uses the adaptive scheduler to contextualize a due fact in a visit", () => {
    const target = createFact(5, 7);
    const progress: FactProgress[] = listFacts().map((fact) => fact.a === target.a && fact.b === target.b
      ? createFactProgress(fact)
      : {
          ...createFactProgress(fact),
          state: "mastered",
          mastery: 1,
          independentCorrect: 3,
          independentDays: [1, 2],
          lastSeenDay: 1,
        });
    const scheduled = chooseNextFact(progress, 1, 10, 37);
    const session = createDaySession(getStore("bookstore"), 1, 37, undefined, progress);

    expect(scheduled).toEqual(target);
    expect(session.visits.some((visit) => visit.fact.a === target.a && visit.fact.b === target.b)).toBe(true);
  });
});

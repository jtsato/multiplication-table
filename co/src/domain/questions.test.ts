import {
  generateQuestion,
  getReviewWeight,
  selectAdaptiveFactor,
  selectQuestionFact,
} from './questions';
import type { FactMastery } from './types';

const fact = (score: number, incorrect = 0): FactMastery => ({
  attempts: 10,
  correct: 10 - incorrect,
  incorrect,
  lastSeenAt: '2026-08-15T12:00:00.000Z',
  masteryScore: score,
});

describe('question generation', () => {
  it('creates unique plausible alternatives containing the correct answer', () => {
    const question = generateQuestion(7, 6, () => 0.42);
    expect(question.answer).toBe(42);
    expect(question.options).toHaveLength(4);
    expect(new Set(question.options).size).toBe(4);
    expect(question.options).toContain(42);
    expect(question.options.every((option) => option > 0 && Math.abs(option - 42) <= 14)).toBe(
      true,
    );
  });

  it('moves the correct answer when the random source changes', () => {
    const first = generateQuestion(4, 6, () => 0);
    const last = generateQuestion(4, 6, () => 0.99);
    expect(first.options.indexOf(24)).not.toBe(last.options.indexOf(24));
  });
});

describe('adaptive review', () => {
  it('gives weak and incorrect facts more weight than mastered facts', () => {
    expect(getReviewWeight(undefined)).toBeGreaterThan(getReviewWeight(fact(0.95)));
    expect(getReviewWeight(fact(0.2, 7))).toBeGreaterThan(getReviewWeight(fact(0.95)) * 3);
  });

  it('avoids repeating the immediately previous fact when alternatives exist', () => {
    const mastery = { '7x1': fact(0.1, 9), '7x2': fact(0.2, 8) };
    expect(selectAdaptiveFactor(7, mastery, '7x1', () => 0)).toBe(2);
  });

  it('uses a review slot for a weak fact from a completed table', () => {
    const mastery = { '2x7': fact(0.2, 8) };
    expect(selectQuestionFact(3, mastery, [2], true, null, () => 0)).toEqual({
      table: 2,
      factor: 7,
    });
    expect(selectQuestionFact(3, mastery, [2], false, null, () => 0)).toEqual({
      table: 3,
      factor: 1,
    });
  });

  it('does not keep an old error boost forever on a mastered fact', () => {
    const oldMastered = { ...fact(0.95, 9), lastSeenAt: '2025-01-01T00:00:00.000Z' };
    expect(
      getReviewWeight(oldMastered, new Date('2026-08-15T00:00:00.000Z').getTime()),
    ).toBeLessThan(getReviewWeight(undefined));
  });
});

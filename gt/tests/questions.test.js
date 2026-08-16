import test from 'node:test';
import assert from 'node:assert/strict';
import { factKey, generateChoices, pickAdaptiveFact } from '../src/domain/questions.js';

test('generateChoices includes one correct answer and unique plausible distractors', () => {
  const choices = generateChoices(42, () => 0.37);
  assert.equal(choices.filter((value) => value === 42).length, 1);
  assert.equal(new Set(choices).size, choices.length);
  assert.equal(choices.length, 4);
  assert.ok(choices.every((value) => value > 0 && Math.abs(value - 42) <= 14));
});

test('factKey is stable', () => {
  assert.equal(factKey(7, 3), '7x3');
});

test('pickAdaptiveFact avoids recent facts and favors weak facts', () => {
  const stats = {
    '7x1': { attempts: 10, correct: 10, incorrect: 0, masteryScore: 1, lastSeenAt: null },
    '7x2': { attempts: 8, correct: 2, incorrect: 6, masteryScore: 0.25, lastSeenAt: null },
  };
  const picked = pickAdaptiveFact(7, stats, ['7x1'], () => 0.01);
  assert.equal(picked.key, '7x2');
});

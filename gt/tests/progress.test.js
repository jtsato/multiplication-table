import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultState } from '../src/domain/defaultState.js';
import { completeMission, recordAnswer } from '../src/domain/progress.js';

test('recordAnswer updates fact mastery and global streaks', () => {
  let state = createDefaultState();
  state = recordAnswer(state, { table: 2, multiplier: 3, key: '2x3', answer: 6 }, true, '2026-08-15T12:00:00.000Z');
  state = recordAnswer(state, { table: 2, multiplier: 3, key: '2x3', answer: 6 }, false, '2026-08-15T12:01:00.000Z');

  assert.equal(state.statistics.totalQuestions, 2);
  assert.equal(state.statistics.totalCorrect, 1);
  assert.equal(state.statistics.totalIncorrect, 1);
  assert.equal(state.statistics.currentStreak, 0);
  assert.equal(state.statistics.bestStreak, 1);
  assert.deepEqual(state.statistics.facts['2x3'], {
    attempts: 2,
    correct: 1,
    incorrect: 1,
    masteryScore: 0.5,
    lastSeenAt: '2026-08-15T12:01:00.000Z',
  });
});

test('completeMission marks current table completed and unlocks only the next table', () => {
  const state = completeMission(createDefaultState(), 2, 0.8, '2026-08-15T12:00:00.000Z');
  assert.equal(state.progress.islands['2'].status, 'completed');
  assert.equal(state.progress.islands['3'].status, 'available');
  assert.equal(state.progress.islands['4'].status, 'locked');
});

test('recordAnswer derives core achievements', () => {
  let state = createDefaultState();
  for (let index = 0; index < 10; index += 1) {
    state = recordAnswer(state, { table: 2, multiplier: 1, key: '2x1', answer: 2 }, true);
  }
  assert.ok(state.achievements.includes('first-correct'));
  assert.ok(state.achievements.includes('five-streak'));
  assert.ok(state.achievements.includes('ten-correct'));
});

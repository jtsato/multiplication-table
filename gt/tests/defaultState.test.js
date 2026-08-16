import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultState } from '../src/domain/defaultState.js';

test('default state starts in pt-BR with only table 2 available', () => {
  const state = createDefaultState();
  assert.equal(state.settings.locale, 'pt-BR');
  assert.equal(state.progress.islands['2'].status, 'available');
  assert.equal(state.progress.islands['3'].status, 'locked');
  assert.equal(state.progress.islands['10'].status, 'locked');
});

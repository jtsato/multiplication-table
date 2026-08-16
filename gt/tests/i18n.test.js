import test from 'node:test';
import assert from 'node:assert/strict';
import { t } from '../src/i18n/index.js';

test('translator returns PT-BR and EN-US copy', () => {
  assert.equal(t('pt-BR', 'home.play'), 'Jogar');
  assert.equal(t('en-US', 'home.play'), 'Play');
});

test('translator interpolates variables', () => {
  assert.equal(t('pt-BR', 'question.label', { a: 7, b: 6 }), 'Quanto é 7 × 6?');
  assert.equal(t('en-US', 'question.label', { a: 7, b: 6 }), 'What is 7 × 6?');
});

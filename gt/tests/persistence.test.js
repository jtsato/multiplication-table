import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultState } from '../src/domain/defaultState.js';
import { LocalStorageProgressRepository } from '../src/persistence/localStorageRepository.js';

class MemoryStorage {
  #values = new Map();
  getItem(key) { return this.#values.has(key) ? this.#values.get(key) : null; }
  setItem(key, value) { this.#values.set(key, String(value)); }
  removeItem(key) { this.#values.delete(key); }
}

test('repository returns default state when storage is empty', async () => {
  const repo = new LocalStorageProgressRepository(new MemoryStorage());
  const state = await repo.load();
  assert.equal(state.schemaVersion, 1);
  assert.equal(state.progress.islands['2'].status, 'available');
});

test('repository saves and loads state', async () => {
  const storage = new MemoryStorage();
  const repo = new LocalStorageProgressRepository(storage);
  const state = createDefaultState();
  state.player.created = true;
  state.player.avatar = 'boy';
  await repo.save(state);
  const loaded = await repo.load();
  assert.equal(loaded.player.created, true);
  assert.equal(loaded.player.avatar, 'boy');
});

test('repository falls back safely when payload is corrupt', async () => {
  const storage = new MemoryStorage();
  storage.setItem('tabuada-em-blocos:v1', '{broken json');
  const repo = new LocalStorageProgressRepository(storage);
  const state = await repo.load();
  assert.equal(state.player.created, false);
});

test('repository reset clears stored progress', async () => {
  const storage = new MemoryStorage();
  const repo = new LocalStorageProgressRepository(storage);
  const state = createDefaultState();
  state.player.created = true;
  await repo.save(state);
  await repo.reset();
  assert.equal((await repo.load()).player.created, false);
});

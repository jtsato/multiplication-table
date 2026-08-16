/**
 * Repository contract used by the app. A future API repository can implement
 * the same async methods without changing game logic.
 */
export class ProgressRepository {
  async load() { throw new Error('Not implemented'); }
  async save(_state) { throw new Error('Not implemented'); }
  async reset() { throw new Error('Not implemented'); }
}

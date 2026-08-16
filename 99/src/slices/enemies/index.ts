export { EnemiesView } from './EnemiesView';
export { createEnemiesSlice, type EnemiesSlice, type EnemySpawn } from './enemies.store';
export {
  ENEMIES,
  applyContactDamage,
  evaluateOutcome,
  isInFireSafeZone,
  spawnPointsFor,
  stepToward,
  type Outcome,
} from './enemies.logic';

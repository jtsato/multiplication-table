export { createPedagogySlice, type PedagogySlice } from './pedagogy.store';
export {
  SMALL_REVIEW,
  buildFactCandidates,
  createFactProgress,
  factPriority,
  factProgressToCounts,
  factProgressToKnownFacts,
  isValidFactKey,
  masteryLevel,
  migrateToProgress,
  recordAnswer,
  reviewInterval,
  selectNextFact,
  type FactProgress,
  type FactProgressMap,
  type MasteryLevel,
} from './pedagogy.logic';

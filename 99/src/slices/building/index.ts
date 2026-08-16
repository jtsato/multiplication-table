export { BuildingView } from './BuildingView';
export { createBuildingSlice, type BuildingSlice } from './building.store';
export {
  BUILDING,
  REJECTION_MESSAGES,
  STRUCTURES,
  canAfford,
  checkPlacement,
  formatRecipe,
  fuelRemaining,
  isLit,
  nearestRefuelable,
  payCost,
  placementPosition,
  refuelUntil,
  type PlacementRejection,
  type Structure,
  type StructureKind,
} from './building.logic';

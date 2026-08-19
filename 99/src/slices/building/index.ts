export { BuildingView } from './BuildingView';
export { createBuildingSlice, type BuildingSlice } from './building.store';
export {
  BUILDING,
  rejectionMessage,
  STRUCTURES,
  canAfford,
  checkPlacement,
  formatRecipe,
  structureLabel,
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

export { WaterfallView } from './WaterfallView';
export {
  WATERFALL,
  WATERFALLS,
  dropletHeight,
  hasWaterfall,
  waterfallsFor,
} from './waterfalls.logic';
export { RegionsView } from './RegionsView';
export { createRegionsSlice, unlockedRegions, type RegionsSlice } from './regions.store';
export {
  BRIDGES,
  BRIDGE_GUARD,
  BRIDGE_FACTS_REQUIRED,
  BRIDGE_MASTERY,
  bridgeMessage,
  bridgeAnchors,
  bridgeById,
  bridgeFor,
  bridgeGuardPosition,
  checkBridge,
  openingsFor,
  reachableFrom,
  requiredTables,
  type Bridge,
  type BridgeRejection,
} from './bridges.logic';
export {
  EDGE_MARGIN,
  REGIONS,
  REGION_ORDER,
  fitsOnLand,
  isOnLand,
  neighbours,
  randomGroundPositionIn,
  regionAt,
  regionById,
  WORLD_BOUNDS,
  WORLD_SHADOW_EXTENT,
  type Region,
  type RegionId,
} from './regions.logic';

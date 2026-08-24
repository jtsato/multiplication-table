import { type Vec3, vec3 } from '../../shared/vec';
import type { ResourceKind } from '../resources/resources.logic';
import { REGIONS, regionAt, type RegionId } from '../regions/regions.logic';

export const GARDEN = {
  interactRange: 2.2,
  yield: 6,
  bedMargin: 1.1,
  spacing: 3.2,
} as const;

const GARDEN_OFFSETS: Record<RegionId, Vec3> = {
  praia: vec3(6, 0, 5),
  porto: vec3(-5, 0, -4),
  bosque: vec3(-5, 0, -4),
  cachoeira: vec3(-5, 0, -4),
  pomar: vec3(-4, 0, 2),
  pico: vec3(-5, 0, -4),
  vale: vec3(-5, 0, -4),
  montanha: vec3(-5, 0, -4),
  observatorio: vec3(-5, 0, -4),
};

export interface GardenPlot {
  id: string;
  position: Vec3;
  planted: boolean;
  plantedDay: number;
  crop: ResourceKind;
  table: number;
}

export type GardenState = GardenPlot[];
export type GardenStatus = 'empty' | 'growing' | 'ready';

export function gardenPosition(regionId: RegionId = 'pomar'): Vec3 {
  const region = REGIONS.find((candidate) => candidate.id === regionId)!;
  const offset = GARDEN_OFFSETS[regionId];
  return vec3(region.center.x + offset.x, region.groundY, region.center.z + offset.z);
}

export function gardenPlantingPosition(player: Vec3, yaw: number, distance = 3.4): Vec3 {
  const x = player.x - Math.sin(yaw) * distance;
  const z = player.z - Math.cos(yaw) * distance;
  const region = regionAt(vec3(x, 0, z));
  return vec3(x, region?.groundY ?? player.y, z);
}

export function defaultCropFor(regionId: RegionId): ResourceKind {
  return REGIONS.find((candidate) => candidate.id === regionId)!.harvest[0];
}

export function defaultTableFor(regionId: RegionId): number {
  return REGIONS.find((candidate) => candidate.id === regionId)!.tables[0];
}

export function gardenPlotForRegion(regionId: RegionId, id = `canteiro-${regionId}`): GardenPlot {
  return {
    id,
    position: gardenPosition(regionId),
    planted: false,
    plantedDay: 0,
    crop: defaultCropFor(regionId),
    table: defaultTableFor(regionId),
  };
}

export function initialGardenState(): GardenState {
  return [gardenPlotForRegion('pomar')];
}

export function gardenStatus(plot: GardenPlot, currentDay: number): GardenStatus {
  if (!plot.planted) return 'empty';
  return plot.plantedDay < currentDay ? 'ready' : 'growing';
}

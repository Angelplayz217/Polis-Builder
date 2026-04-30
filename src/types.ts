/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum BuildingType {
  RESIDENTIAL = 'residential',
  COMMERCIAL = 'commercial',
  INDUSTRIAL = 'industrial',
  ROAD = 'road',
  RESEARCH = 'research',
  POWER = 'power',
}

export interface Building {
  id: string;
  type: BuildingType;
  x: number;
  y: number;
  level: number;
}

export interface ResourceState {
  money: number;
  population: number;
  researchPoints: number;
  unlockedTech: string[];
}

export interface GameSave {
  id: string;
  name: string;
  resources: ResourceState;
  buildings: Building[];
  rebirthLevel: number;
  lastPlayed: number;
}

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  isMuted: boolean;
}

export interface Citizen {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  progress: number; // 0 to 1
}

export type ViewState = 'menu' | 'playing' | 'tutorial' | 'load_game' | 'settings';

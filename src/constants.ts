/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BuildingType } from './types';

export const GRID_SIZE = 12;

export const BUILDING_DATA = {
  [BuildingType.RESIDENTIAL]: {
    name: 'Block Apartment',
    cost: 100,
    moneyGen: 0,
    popGen: 10,
    researchCost: 0,
    color: 'bg-blue-500',
    description: 'Provides housing for your citizens.',
  },
  [BuildingType.COMMERCIAL]: {
    name: 'Mini Mart',
    cost: 250,
    moneyGen: 5,
    popGen: 0,
    researchCost: 0,
    color: 'bg-green-500',
    description: 'Generates money when citizens visit.',
  },
  [BuildingType.INDUSTRIAL]: {
    name: 'Small Factory',
    cost: 500,
    moneyGen: 15,
    popGen: -2,
    researchCost: 0,
    color: 'bg-orange-500',
    description: 'Highly productive but slightly lowers population growth.',
  },
  [BuildingType.RESEARCH]: {
    name: 'Tech Lab',
    cost: 1000,
    moneyGen: 0,
    popGen: 0,
    researchCost: 0,
    color: 'bg-purple-500',
    description: 'Generates research points over time.',
  },
  [BuildingType.ROAD]: {
    name: 'Paved Road',
    cost: 10,
    moneyGen: 0,
    popGen: 0,
    researchCost: 0,
    color: 'bg-slate-700',
    description: 'Connects your buildings.',
  },
  [BuildingType.POWER]: {
    name: 'Power Plant',
    cost: 1500,
    moneyGen: -10,
    popGen: 0,
    researchCost: 0,
    color: 'bg-yellow-400',
    description: 'Required for advanced structures.',
  },
};

export const TECH_TREE = [
  {
    id: 'T1',
    name: 'Civic Planning',
    cost: 50,
    unlocks: 'Unlocks Parks and better roads.',
    required: [],
  },
  {
    id: 'T2',
    name: 'Industrialization',
    cost: 200,
    unlocks: 'Unlocks Factory level 2.',
    required: ['T1'],
  },
  {
    id: 'T3',
    name: 'High-Density Living',
    cost: 500,
    unlocks: 'Unlocks Skyscrapers.',
    required: ['T2'],
  },
];

export const REBIRTH_PERKS = [
  { id: 'P1', name: 'Golden Profit', multiplier: 1.2, description: '20% more money generation.' },
  { id: 'P2', name: 'Rapid Growth', multiplier: 1.5, description: '50% faster population growth.' },
];

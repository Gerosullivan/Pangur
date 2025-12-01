import baseMice from './initialMice.json';
import easyMice from './initialMice.easy.json';
import hardMice from './initialMice.hard.json';
import type { InitialMiceConfig, ModeId } from '../types';

export interface ModeConfig {
  id: ModeId;
  label: string;
  description?: string;
  initialMice: InitialMiceConfig;
}

const modeMap: Record<ModeId, ModeConfig> = {
  tutorial: {
    id: 'tutorial',
    label: 'Tutorial',
    description: 'Guided start with the base mouse layout.',
    initialMice: baseMice as InitialMiceConfig,
  },
  classic: {
    id: 'classic',
    label: 'Classic',
    description: 'Standard run using the base mouse layout.',
    initialMice: baseMice as InitialMiceConfig,
  },
  easy: {
    id: 'easy',
    label: 'Easy Perimeter',
    description: 'A thinner perimeter ring with a few gaps.',
    initialMice: easyMice as InitialMiceConfig,
  },
  hard: {
    id: 'hard',
    label: 'Hard Perimeter',
    description: 'Mice on every edge to start.',
    initialMice: hardMice as InitialMiceConfig,
  },
};

export function getModeConfig(modeId: ModeId): ModeConfig {
  return modeMap[modeId] ?? modeMap.tutorial;
}

export function listModes(): ModeConfig[] {
  return Object.values(modeMap);
}

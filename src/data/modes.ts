import baseBoardLayout from './boardLayout.json';
import monasteryBoardLayout from './boardLayout_monastery.json';
import baseMice from './initialMice.json';
import easyMice from './initialMice.easy.json';
import hardMice from './initialMice.hard.json';
import type { BoardLayoutConfig, InitialMiceConfig, ModeId } from '../types';

export interface ModeConfig {
  id: ModeId;
  label: string;
  description?: string;
  initialMice: InitialMiceConfig;
  boardLayout: BoardLayoutConfig;
}

const modeMap: Record<ModeId, ModeConfig> = {
  tutorial: {
    id: 'tutorial',
    label: 'Tutorial',
    description: 'Guided start with the base mouse layout.',
    initialMice: baseMice as InitialMiceConfig,
    boardLayout: baseBoardLayout as BoardLayoutConfig,
  },
  classic: {
    id: 'classic',
    label: 'Classic',
    description: 'Standard run using the base mouse layout.',
    initialMice: baseMice as InitialMiceConfig,
    boardLayout: baseBoardLayout as BoardLayoutConfig,
  },
  easy: {
    id: 'easy',
    label: 'Easy Perimeter',
    description: 'A thinner perimeter ring with a few gaps.',
    initialMice: easyMice as InitialMiceConfig,
    boardLayout: baseBoardLayout as BoardLayoutConfig,
  },
  hard: {
    id: 'hard',
    label: 'Hard Perimeter',
    description: 'Mice on every edge to start.',
    initialMice: hardMice as InitialMiceConfig,
    boardLayout: baseBoardLayout as BoardLayoutConfig,
  },
  monastery: {
    id: 'monastery',
    label: 'Monastery Siege',
    description: 'Three dispersed gates and the hard perimeter mouse layout.',
    initialMice: hardMice as InitialMiceConfig,
    boardLayout: monasteryBoardLayout as BoardLayoutConfig,
  },
};

export function getModeConfig(modeId: ModeId): ModeConfig {
  return modeMap[modeId] ?? modeMap.tutorial;
}

export function listModes(): ModeConfig[] {
  return Object.values(modeMap);
}

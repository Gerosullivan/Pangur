import type { ModeId } from '../types';

export type ScoringWeights = {
  waveCeiling: number;
  waveWeight: number;
  grainWeight: number;
  fullHealthWeight: number;
};

const baseWeights: ScoringWeights = {
  waveCeiling: 10,
  waveWeight: 500,
  grainWeight: 15,
  fullHealthWeight: 50,
};

const scoringByMode: Record<ModeId, ScoringWeights> = {
  tutorial: baseWeights,
  classic: baseWeights,
  easy: baseWeights,
  hard: {
    ...baseWeights,
    waveCeiling: 12,
    waveWeight: 550,
  },
  monastery: {
    ...baseWeights,
    waveCeiling: 12,
    waveWeight: 550,
  },
};

export function getScoringWeights(modeId: ModeId): ScoringWeights {
  return scoringByMode[modeId] ?? baseWeights;
}

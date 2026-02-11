import type { ModeId } from '../types';

export type ScoringWeights = {
  waveWeight: number;
  grainWeight: number;
  fullHealthWeight: number;
};

const baseWeights: ScoringWeights = {
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
    waveWeight: 550,
  },
  monastery: {
    ...baseWeights,
    waveWeight: 550,
  },
};

export function getScoringWeights(modeId: ModeId): ScoringWeights {
  return scoringByMode[modeId] ?? baseWeights;
}

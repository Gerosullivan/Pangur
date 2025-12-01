import { CAT_STARTING_HEARTS } from './cats';
import { getScoringWeights } from '../data/scoring';
import type { GameState, ScoreEntry } from '../types';

type ScorableState = Pick<GameState, 'status' | 'modeId' | 'wave' | 'grainLoss' | 'cats'>;

export type ScoreResult = Pick<ScoreEntry, 'score' | 'finishWave' | 'grainSaved' | 'catsFullHealth'>;
export type ScoreBreakdown = ScoreResult & {
  waveScore: number;
  grainBonus: number;
  fullHealthBonus: number;
};

export function computeScore(state: ScorableState): ScoreResult | undefined {
  const breakdown = computeScoreBreakdown(state);
  if (!breakdown) return undefined;
  const { score, finishWave, grainSaved, catsFullHealth } = breakdown;
  return { score, finishWave, grainSaved, catsFullHealth };
}

export function computeScoreBreakdown(state: ScorableState): ScoreBreakdown | undefined {
  if (state.status.state !== 'won') return undefined;
  const weights = getScoringWeights(state.modeId);

  const wavesUsed = Math.max(1, state.wave - 1);
  const waveScore = Math.max(0, (weights.waveCeiling - wavesUsed) * weights.waveWeight);

  const grainSaved = Math.max(0, 32 - state.grainLoss);
  const grainBonus = grainSaved * weights.grainWeight;

  const catsFullHealth = Object.values(state.cats).filter((cat) => cat.hearts >= CAT_STARTING_HEARTS).length;
  const fullHealthBonus = catsFullHealth * weights.fullHealthWeight;

  const score = Math.max(0, Math.round(waveScore + grainBonus + fullHealthBonus));

  return {
    score,
    finishWave: wavesUsed,
    grainSaved,
    catsFullHealth,
    waveScore,
    grainBonus,
    fullHealthBonus,
  };
}

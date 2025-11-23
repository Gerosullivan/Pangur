import type { CatState } from '../types';
import { isShadowBonus } from './board';

export function updateShadowBonusOnMove(cat: CatState, destinationIsShadow: boolean): void {
  if (!destinationIsShadow) {
    cat.shadowBonusPrimed = false;
    cat.shadowBonusActive = false;
    return;
  }
  if (!cat.attackCommitted) {
    cat.shadowBonusPrimed = true;
  }
}

export function maybeActivateShadowBonus(cat: CatState): void {
  const eligible = cat.shadowBonusPrimed && cat.position && isShadowBonus(cat.position);
  if (eligible && !cat.shadowBonusActive) {
    cat.shadowBonusActive = true;
  }
  cat.shadowBonusPrimed = false;
}

export function resetShadowBonusForTurn(cat: CatState): void {
  cat.shadowBonusActive = false;
  cat.shadowBonusPrimed = !!(cat.position && isShadowBonus(cat.position));
}

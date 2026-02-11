import type { GameState, LogEvent, EventPhase } from '../types';

let sequence = 0;

export function resetLogSequence(): void {
  sequence = 0;
}

export function logEvent(state: GameState, event: Omit<LogEvent, 'seq' | 'turn' | 'phase'> & { phase?: EventPhase; turn?: number }): void {
  const full: LogEvent = {
    seq: ++sequence,
    turn: event.turn ?? state.turn,
    phase: event.phase ?? state.phase,
    ...event,
  };
  state.log.push(full);
  if (import.meta.env.DEV) {
    console.log('[PANGUR]', full);
  }
}

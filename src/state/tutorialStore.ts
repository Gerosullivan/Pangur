import { create } from 'zustand';
import tutorialData from '../../context/tutorial.json';
import type { LogEvent, TutorialAction, TutorialState, TutorialStep } from '../types';

type TutorialStore = TutorialState & {
  latestLog: LogEvent[];
  start: () => void;
  next: () => void;
  exit: () => void;
  markCompleted: (stepId: string) => void;
  syncWithLog: (log: LogEvent[]) => void;
  canPerformAction: (action: TutorialAction) => boolean;
  clearGuard: () => void;
};

interface TutorialFile {
  title: string;
  version: number;
  steps: TutorialStep[];
}

const parsedTutorial = tutorialData as TutorialFile;
const sortedSteps = [...parsedTutorial.steps].sort((a, b) => a.order - b.order);

const initialState: TutorialState = {
  active: false,
  steps: sortedSteps,
  index: 0,
  locked: false,
  completedStepIds: new Set<string>(),
  guardMessage: undefined,
};

function toActionList(step: TutorialStep | undefined): TutorialAction[] {
  if (!step?.completeOn) return [];
  return Array.isArray(step.completeOn) ? step.completeOn : [step.completeOn];
}

function matchesAction(event: TutorialAction, trigger: TutorialAction): boolean {
  if (event.action !== trigger.action) return false;
  if (trigger.actorId && event.actorId !== trigger.actorId) return false;
  if (trigger.targetId && event.targetId !== trigger.targetId) return false;
  if (trigger.from && event.from !== trigger.from) return false;
  if (trigger.to && event.to !== trigger.to) return false;
  if (trigger.phase && event.phase !== trigger.phase) return false;
  return true;
}

function isStepComplete(step: TutorialStep | undefined, log: LogEvent[]): boolean {
  if (!step) return true;
  const triggers = toActionList(step);
  if (triggers.length === 0) return true;
  return triggers.every((trigger) => {
    const required = trigger.count ?? 1;
    const hits = log.filter((entry) => matchesAction(entry, trigger)).length;
    return hits >= required;
  });
}

export const useTutorialStore = create<TutorialStore>((set, get) => ({
  ...initialState,
  latestLog: [],

  start: () => {
    const log = get().latestLog;
    set(() => ({
      ...initialState,
      active: true,
      latestLog: log,
      locked: !isStepComplete(sortedSteps[0], log),
      guardMessage: undefined,
    }));
  },

  next: () => {
    set((state) => {
      const nextIndex = Math.min(state.index + 1, state.steps.length - 1);
      const nextStep = state.steps[nextIndex];
      const log = state.latestLog;
      return {
        ...state,
        index: nextIndex,
        locked: !isStepComplete(nextStep, log),
        guardMessage: undefined,
      };
    });
  },

  exit: () => {
    set(() => ({
      ...initialState,
    }));
  },

  markCompleted: (stepId: string) => {
    set((state) => {
      const completedStepIds = new Set(state.completedStepIds);
      completedStepIds.add(stepId);
      return { ...state, completedStepIds, locked: false, guardMessage: undefined };
    });
  },

  syncWithLog: (log: LogEvent[]) => {
    const state = get();
    if (!state.active) return;
    const step = state.steps[state.index];
    if (!step) return;
    const complete = isStepComplete(step, log);
    const latestLog = log;
    if (complete && !state.completedStepIds.has(step.id)) {
      const completedStepIds = new Set(state.completedStepIds);
      completedStepIds.add(step.id);
      const locked = false;
      let index = state.index;
      // Auto-advance if the tutorial step does not have its own Next button.
      if (step.showNext === false && state.index < state.steps.length - 1) {
        index = state.index + 1;
      }
      set({ completedStepIds, locked, index, latestLog, guardMessage: undefined });
    } else if (state.locked !== !complete) {
      set({ locked: !complete, latestLog, guardMessage: undefined });
    } else {
      set({ latestLog });
    }
  },

  canPerformAction: (action) => {
    const state = get();
    if (!state.active) return true;
    const step = state.steps[state.index];
    if (!step) return true;

    if (step.lockBoard) {
      if (state.guardMessage !== step.instruction) {
        set({ guardMessage: step.instruction ?? 'Follow the current tutorial step.' });
      }
      return false;
    }

    const triggers = toActionList(step);
    if (triggers.length === 0) return true;

    const allowed = triggers.some((trigger) => matchesAction(action, trigger));
    if (!allowed) {
      set({ guardMessage: step.instruction ?? 'Follow the highlighted action.' });
    } else if (state.guardMessage) {
      set({ guardMessage: undefined });
    }
    return allowed;
  },

  clearGuard: () => set({ guardMessage: undefined }),
}));

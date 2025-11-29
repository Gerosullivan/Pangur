import { create } from 'zustand';
import tutorialData from '../../context/tutorial.json';
import type { LogEvent, TutorialState, TutorialStep } from '../types';

type TutorialStore = TutorialState & {
  latestLog: LogEvent[];
  start: () => void;
  next: () => void;
  prev: () => void;
  exit: () => void;
  markCompleted: (stepId: string) => void;
  syncWithLog: (log: LogEvent[]) => void;
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
};

function isStepComplete(step: TutorialStep | undefined, log: LogEvent[]): boolean {
  if (!step) return true;
  if (!step.logSeq || step.logSeq.length === 0) return true;
  const seqSet = new Set(log.map((entry) => entry.seq));
  return step.logSeq.every((seq) => seqSet.has(seq));
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
      };
    });
  },

  prev: () => {
    set((state) => {
      const prevIndex = Math.max(state.index - 1, 0);
      const prevStep = state.steps[prevIndex];
      const log = state.latestLog;
      return {
        ...state,
        index: prevIndex,
        locked: !isStepComplete(prevStep, log),
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
      return { ...state, completedStepIds, locked: false };
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
      set({ completedStepIds, locked, index, latestLog });
    } else if (state.locked !== !complete) {
      set({ locked: !complete, latestLog });
    } else {
      set({ latestLog });
    }
  },
}));

'use client';

import { create } from 'zustand';
import type { TrialSession, TrialStep } from '@/types/trial';

const steps: TrialStep[] = ['overview', 'library', 'scene', 'handoff'];

interface TrialState {
  session: TrialSession | null;
  lastEndedProjectName: string | null;
  lastEndedAt: string | null;
  startTrial: (phone: string, projectName: string) => void;
  endTrial: () => void;
  setStep: (step: TrialStep) => void;
  nextStep: () => void;
  previousStep: () => void;
  setDevicePosition: (position: { x: number; z: number }) => void;
}

function makeProjectId(): string {
  return `trial-${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}`;
}

export const useTrialStore = create<TrialState>()((set, get) => ({
  session: null,
  lastEndedProjectName: null,
  lastEndedAt: null,
  startTrial: (phone, projectName) =>
    set({
      session: {
        phone,
        projectId: makeProjectId(),
        projectName,
        startedAt: new Date().toISOString(),
        step: 'overview',
        deviceX: 0.6,
        deviceZ: 0.2,
      },
      lastEndedProjectName: null,
      lastEndedAt: null,
    }),
  endTrial: () => {
    const { session } = get();
    set({
      session: null,
      lastEndedProjectName: session?.projectName ?? null,
      lastEndedAt: new Date().toISOString(),
    });
  },
  setStep: (step) =>
    set((state) => ({
      session: state.session ? { ...state.session, step } : null,
    })),
  nextStep: () =>
    set((state) => {
      if (!state.session) return state;
      const currentIndex = steps.indexOf(state.session.step);
      const next = steps[Math.min(steps.length - 1, currentIndex + 1)];
      return { session: { ...state.session, step: next } };
    }),
  previousStep: () =>
    set((state) => {
      if (!state.session) return state;
      const currentIndex = steps.indexOf(state.session.step);
      const previous = steps[Math.max(0, currentIndex - 1)];
      return { session: { ...state.session, step: previous } };
    }),
  setDevicePosition: ({ x, z }) => {
    const clampedX = Math.max(-1.6, Math.min(1.6, x));
    const clampedZ = Math.max(-1, Math.min(1, z));
    const { session } = get();
    if (!session) return;
    set({
      session: {
        ...session,
        deviceX: clampedX,
        deviceZ: clampedZ,
      },
    });
  },
}));

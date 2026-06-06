export type TrialStep = 'overview' | 'library' | 'scene' | 'handoff';

export interface TrialSession {
  phone: string;
  projectId: string;
  projectName: string;
  startedAt: string;
  step: TrialStep;
  deviceX: number;
  deviceZ: number;
}

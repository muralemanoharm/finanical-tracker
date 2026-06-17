export type RiskProfileLevel = 'Conservative' | 'Moderate' | 'Moderately Aggressive' | 'Aggressive';

export interface RiskQuestionOption {
  label: string;
  points: number; // 1-4
}

export interface RiskQuestion {
  id: string;
  text: string;
  options: RiskQuestionOption[];
}

/** questionId -> selected option's points (1-4) */
export type RiskAnswers = Record<string, number>;

export interface TargetAllocation {
  equity: number;
  debt: number;
  gold: number;
  cash: number;
}

export interface RiskProfileStorage {
  answers: RiskAnswers;
  completedAt: string | null;
}

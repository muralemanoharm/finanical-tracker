import type { RiskAnswers, RiskProfileLevel, RiskQuestion, TargetAllocation } from '../types/riskProfile';

// Each question's options are ordered from lowest to highest risk capacity/tolerance, scored
// 1-4. Q1 has 5 age brackets mapped onto the same 1-4 scale (two brackets share a score) so the
// total across all 5 questions still sums to 5-20.
export const RISK_QUESTIONS: RiskQuestion[] = [
  {
    id: 'age',
    text: 'What is your age bracket?',
    options: [
      { label: 'Under 25', points: 4 },
      { label: '25-35', points: 3 },
      { label: '35-45', points: 3 },
      { label: '45-55', points: 2 },
      { label: 'Above 55', points: 1 },
    ],
  },
  {
    id: 'horizon',
    text: 'What is your investment horizon for this money?',
    options: [
      { label: 'Less than 3 years', points: 1 },
      { label: '3-7 years', points: 2 },
      { label: '7-15 years', points: 3 },
      { label: 'More than 15 years', points: 4 },
    ],
  },
  {
    id: 'drawdownReaction',
    text: 'If your portfolio drops 30% in a market crash, what would you do?',
    options: [
      { label: 'Sell everything', points: 1 },
      { label: 'Sell some', points: 2 },
      { label: 'Hold', points: 3 },
      { label: 'Buy more', points: 4 },
    ],
  },
  {
    id: 'primaryGoal',
    text: 'What is your primary investment goal?',
    options: [
      { label: 'Capital preservation', points: 1 },
      { label: 'Steady income', points: 2 },
      { label: 'Balanced growth', points: 3 },
      { label: 'Aggressive growth', points: 4 },
    ],
  },
  {
    id: 'incomeStability',
    text: 'How stable is your income?',
    options: [
      { label: 'Very stable (govt/PSU)', points: 4 },
      { label: 'Stable (large corporate)', points: 3 },
      { label: 'Moderate (startup/freelance)', points: 2 },
      { label: 'Variable (business)', points: 1 },
    ],
  },
];

export function computeRiskScore(answers: RiskAnswers): number {
  return RISK_QUESTIONS.reduce((sum, q) => sum + (answers[q.id] || 0), 0);
}

export function riskLevelForScore(score: number): RiskProfileLevel {
  if (score <= 8) return 'Conservative';
  if (score <= 12) return 'Moderate';
  if (score <= 16) return 'Moderately Aggressive';
  return 'Aggressive';
}

// Gold-Cash is one combined bucket per the product spec; since this app doesn't model a
// dedicated "cash in hand" instrument (see useNetWorth's allocation.cash, always 0), the full
// bucket is assigned to `gold` here and `cash` is kept at 0 for consistency with that allocation.
export function targetAllocationForLevel(level: RiskProfileLevel): TargetAllocation {
  switch (level) {
    case 'Conservative':
      return { equity: 20, debt: 60, gold: 20, cash: 0 };
    case 'Moderate':
      return { equity: 40, debt: 45, gold: 15, cash: 0 };
    case 'Moderately Aggressive':
      return { equity: 65, debt: 25, gold: 10, cash: 0 };
    case 'Aggressive':
      return { equity: 80, debt: 15, gold: 5, cash: 0 };
  }
}

export function explanationForLevel(level: RiskProfileLevel): string {
  const t = targetAllocationForLevel(level);
  return `Based on your answers, you should hold ${t.equity}% equity, ${t.debt}% debt, and ${t.gold}% gold/cash for a ${level} risk profile.`;
}

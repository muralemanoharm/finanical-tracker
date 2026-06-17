import { useCallback, useEffect, useState } from 'react';
import type { RiskProfileStorage } from '../types/riskProfile';
import { computeRiskScore, riskLevelForScore, targetAllocationForLevel } from '../utils/riskProfile';

export const RISK_PROFILE_STORAGE_KEY = 'nw_risk';

const DEFAULT_DATA: RiskProfileStorage = { answers: {}, completedAt: null };

function loadRiskProfileData(): RiskProfileStorage {
  try {
    const raw = localStorage.getItem(RISK_PROFILE_STORAGE_KEY);
    if (!raw) return DEFAULT_DATA;
    return { ...DEFAULT_DATA, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_DATA;
  }
}

export function useRiskProfile() {
  const [data, setData] = useState<RiskProfileStorage>(loadRiskProfileData);

  useEffect(() => {
    localStorage.setItem(RISK_PROFILE_STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const setAnswer = useCallback((questionId: string, points: number) => {
    setData((prev) => ({ ...prev, answers: { ...prev.answers, [questionId]: points } }));
  }, []);

  const submit = useCallback(() => {
    setData((prev) => ({ ...prev, completedAt: new Date().toISOString() }));
  }, []);

  const reset = useCallback(() => {
    setData(DEFAULT_DATA);
  }, []);

  const isComplete = data.completedAt !== null;
  const score = computeRiskScore(data.answers);
  const level = isComplete ? riskLevelForScore(score) : null;
  const targetAllocation = level ? targetAllocationForLevel(level) : null;

  return { data, setAnswer, submit, reset, isComplete, score, level, targetAllocation };
}

export type UseRiskProfile = ReturnType<typeof useRiskProfile>;

import { useCallback, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { CareerData, HumanCapitalInputs, JobSwitchInputs, IncomeStream, SkillInvestment } from '../types/career';
import type { Profile } from '../types/financial';
import { todayISO } from '../utils/calculations';

const STORAGE_KEY = 'nw_career';

const DEFAULT_CAREER_DATA: CareerData = {
  humanCapital: { currentAnnualCTC: 0, salaryGrowthPercent: 8, discountRatePercent: 7, currentAge: 30, retirementAge: 60 },
  jobSwitch: { currentCTC: 0, targetCTC: 0, currentGrowthPercent: 6, targetGrowthPercent: 12, investmentRatePercent: 12, yearsToCompare: 5 },
  incomeStreams: [],
  skills: [],
};

function loadCareerData(profile: Profile): CareerData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const annualCTC = profile.monthlyIncome * 12;
      return {
        ...DEFAULT_CAREER_DATA,
        humanCapital: { ...DEFAULT_CAREER_DATA.humanCapital, currentAnnualCTC: annualCTC, currentAge: profile.age, retirementAge: profile.retirementAge },
        jobSwitch: { ...DEFAULT_CAREER_DATA.jobSwitch, currentCTC: annualCTC, targetCTC: annualCTC },
      };
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CAREER_DATA,
      ...parsed,
      humanCapital: { ...DEFAULT_CAREER_DATA.humanCapital, ...parsed.humanCapital },
      jobSwitch: { ...DEFAULT_CAREER_DATA.jobSwitch, ...parsed.jobSwitch },
    };
  } catch {
    return DEFAULT_CAREER_DATA;
  }
}

export function useCareerData(profile: Profile) {
  const [data, setData] = useState<CareerData>(() => loadCareerData(profile));

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const updateHumanCapitalInputs = useCallback((updates: Partial<HumanCapitalInputs>) => {
    setData((prev) => ({ ...prev, humanCapital: { ...prev.humanCapital, ...updates } }));
  }, []);

  const updateJobSwitchInputs = useCallback((updates: Partial<JobSwitchInputs>) => {
    setData((prev) => ({ ...prev, jobSwitch: { ...prev.jobSwitch, ...updates } }));
  }, []);

  const addIncomeStream = useCallback((stream: Omit<IncomeStream, 'id'>) => {
    setData((prev) => ({ ...prev, incomeStreams: [...prev.incomeStreams, { ...stream, id: uuidv4() }] }));
  }, []);

  const updateIncomeStream = useCallback((id: string, updates: Partial<IncomeStream>) => {
    setData((prev) => ({ ...prev, incomeStreams: prev.incomeStreams.map((s) => (s.id === id ? { ...s, ...updates } : s)) }));
  }, []);

  const deleteIncomeStream = useCallback((id: string) => {
    setData((prev) => ({ ...prev, incomeStreams: prev.incomeStreams.filter((s) => s.id !== id) }));
  }, []);

  const addSkill = useCallback((skill: Omit<SkillInvestment, 'id' | 'createdAt'>) => {
    setData((prev) => ({ ...prev, skills: [...prev.skills, { ...skill, id: uuidv4(), createdAt: todayISO() }] }));
  }, []);

  const updateSkill = useCallback((id: string, updates: Partial<SkillInvestment>) => {
    setData((prev) => ({ ...prev, skills: prev.skills.map((s) => (s.id === id ? { ...s, ...updates } : s)) }));
  }, []);

  const deleteSkill = useCallback((id: string) => {
    setData((prev) => ({ ...prev, skills: prev.skills.filter((s) => s.id !== id) }));
  }, []);

  return {
    data,
    updateHumanCapitalInputs,
    updateJobSwitchInputs,
    addIncomeStream,
    updateIncomeStream,
    deleteIncomeStream,
    addSkill,
    updateSkill,
    deleteSkill,
  };
}

export type UseCareerData = ReturnType<typeof useCareerData>;

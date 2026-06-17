import { useCallback, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type {
  FinancialData,
  MutualFund,
  FD,
  LifeInsurance,
  ULIP,
  HealthInsurance,
  EPFPPF,
  Stock,
  Gold,
  Liability,
  Goal,
  Profile,
  NetWorthSnapshot,
  InstrumentCategory,
  CashFlowProfile,
  DebtPlannerSettings,
  FIInputs,
  TaxInputs,
  XirrCashflowEntry,
} from '../types/financial';
import { todayISO } from '../utils/calculations';

const STORAGE_KEY = 'finplan_data';

const DEFAULT_PROFILE: Profile = {
  name: '',
  monthlyIncome: 0,
  age: 30,
  retirementAge: 60,
  monthlyExpenseTarget: 0,
};

export const DEFAULT_DATA: FinancialData = {
  profile: DEFAULT_PROFILE,
  mutualFunds: [],
  fixedDeposits: [],
  lifeInsurance: [],
  ulips: [],
  healthInsurance: [],
  epfPpf: [],
  stocks: [],
  gold: [],
  liabilities: [],
  goals: [],
  snapshots: [],
  dismissedRecommendationKeys: [],
  reviewedRecommendationKeys: [],
  cashFlow: {
    salaryInHand: 0,
    freelanceIncome: 0,
    rentalIncome: 0,
    otherIncome: 0,
    rentOrEmi: 0,
    groceries: 0,
    subscriptions: 0,
    dining: 0,
    travel: 0,
    entertainment: 0,
    miscellaneous: 0,
    emergencyFundBalance: 0,
  },
  sipStepUps: {},
  debtPlanner: { method: 'Avalanche', extraMonthlyPayment: 0 },
  fiInputs: { inflationRate: 6, safeWithdrawalRate: 4, postRetirementReturn: 7 },
  xirrTracker: {},
  taxInputs: { grossSalary: 0, hra: 0, niftyAssumedXirr: 12 },
};

function loadData(): FinancialData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DATA;
    const parsed = JSON.parse(raw);
    // merge with defaults so newly added fields don't break older saved data
    return { ...DEFAULT_DATA, ...parsed, profile: { ...DEFAULT_PROFILE, ...parsed.profile } };
  } catch {
    return DEFAULT_DATA;
  }
}

type EntityMap = {
  mutualFunds: MutualFund;
  fixedDeposits: FD;
  lifeInsurance: LifeInsurance;
  ulips: ULIP;
  healthInsurance: HealthInsurance;
  epfPpf: EPFPPF;
  stocks: Stock;
  gold: Gold;
  liabilities: Liability;
};

export function useFinancialData() {
  const [data, setData] = useState<FinancialData>(loadData);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const updateProfile = useCallback((profile: Partial<Profile>) => {
    setData((prev) => ({ ...prev, profile: { ...prev.profile, ...profile } }));
  }, []);

  const addEntity = useCallback(<K extends keyof EntityMap>(category: K, entity: Omit<EntityMap[K], 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newEntity = { ...entity, id: uuidv4(), createdAt: now, updatedAt: now } as EntityMap[K];
    setData((prev) => ({ ...prev, [category]: [...(prev[category] as EntityMap[K][]), newEntity] }));
    return newEntity;
  }, []);

  const updateEntity = useCallback(<K extends keyof EntityMap>(category: K, id: string, updates: Partial<EntityMap[K]>) => {
    setData((prev) => ({
      ...prev,
      [category]: (prev[category] as EntityMap[K][]).map((item) =>
        item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item,
      ),
    }));
  }, []);

  const deleteEntity = useCallback(<K extends keyof EntityMap>(category: K, id: string) => {
    setData((prev) => ({
      ...prev,
      [category]: (prev[category] as EntityMap[K][]).filter((item) => item.id !== id),
    }));
  }, []);

  const addGoal = useCallback((goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    setData((prev) => ({ ...prev, goals: [...prev.goals, { ...goal, id: uuidv4(), createdAt: now, updatedAt: now }] }));
  }, []);

  const updateGoal = useCallback((id: string, updates: Partial<Goal>) => {
    setData((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => (g.id === id ? { ...g, ...updates, updatedAt: new Date().toISOString() } : g)),
    }));
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setData((prev) => ({ ...prev, goals: prev.goals.filter((g) => g.id !== id) }));
  }, []);

  const addSnapshot = useCallback((snapshot: NetWorthSnapshot) => {
    setData((prev) => {
      const withoutSameDate = prev.snapshots.filter((s) => s.date !== snapshot.date);
      return { ...prev, snapshots: [...withoutSameDate, snapshot].sort((a, b) => a.date.localeCompare(b.date)) };
    });
  }, []);

  const recordSnapshotNow = useCallback((netWorth: number, totalAssets?: number, totalLiabilities?: number) => {
    addSnapshot({ date: todayISO(), netWorth, totalAssets, totalLiabilities });
  }, [addSnapshot]);

  const deleteSnapshot = useCallback((date: string) => {
    setData((prev) => ({ ...prev, snapshots: prev.snapshots.filter((s) => s.date !== date) }));
  }, []);

  const updateCashFlow = useCallback((updates: Partial<CashFlowProfile>) => {
    setData((prev) => ({ ...prev, cashFlow: { ...prev.cashFlow, ...updates } }));
  }, []);

  const updateSipStepUp = useCallback((mutualFundId: string, stepUpPercent: number) => {
    setData((prev) => ({ ...prev, sipStepUps: { ...prev.sipStepUps, [mutualFundId]: { stepUpPercent } } }));
  }, []);

  const updateDebtPlanner = useCallback((updates: Partial<DebtPlannerSettings>) => {
    setData((prev) => ({ ...prev, debtPlanner: { ...prev.debtPlanner, ...updates } }));
  }, []);

  const updateFIInputs = useCallback((updates: Partial<FIInputs>) => {
    setData((prev) => ({ ...prev, fiInputs: { ...prev.fiInputs, ...updates } }));
  }, []);

  const updateTaxInputs = useCallback((updates: Partial<TaxInputs>) => {
    setData((prev) => ({ ...prev, taxInputs: { ...prev.taxInputs, ...updates } }));
  }, []);

  const addXirrCashflowEntry = useCallback((instrumentId: string, entry: XirrCashflowEntry) => {
    setData((prev) => ({
      ...prev,
      xirrTracker: { ...prev.xirrTracker, [instrumentId]: [...(prev.xirrTracker[instrumentId] || []), entry] },
    }));
  }, []);

  const removeXirrCashflowEntry = useCallback((instrumentId: string, index: number) => {
    setData((prev) => ({
      ...prev,
      xirrTracker: {
        ...prev.xirrTracker,
        [instrumentId]: (prev.xirrTracker[instrumentId] || []).filter((_, i) => i !== index),
      },
    }));
  }, []);

  const dismissRecommendation = useCallback((key: string) => {
    setData((prev) => ({ ...prev, dismissedRecommendationKeys: [...prev.dismissedRecommendationKeys, key] }));
  }, []);

  const markRecommendationReviewed = useCallback((key: string) => {
    setData((prev) => ({ ...prev, reviewedRecommendationKeys: [...prev.reviewedRecommendationKeys, key] }));
  }, []);

  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finplan-export-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  const importData = useCallback((json: string): { success: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(json);
      if (typeof parsed !== 'object' || parsed === null) throw new Error('Invalid file');
      setData({ ...DEFAULT_DATA, ...parsed, profile: { ...DEFAULT_PROFILE, ...parsed.profile } });
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Failed to import file' };
    }
  }, []);

  const resetAllData = useCallback(() => {
    setData(DEFAULT_DATA);
  }, []);

  const categoryLabels: Record<InstrumentCategory, string> = {
    mutualFunds: 'Mutual Funds / SIP',
    fixedDeposits: 'Fixed Deposits',
    lifeInsurance: 'Life Insurance',
    ulips: 'ULIP',
    healthInsurance: 'Health Insurance',
    epfPpf: 'EPF / PPF',
    stocks: 'Stocks',
    gold: 'Gold',
    liabilities: 'Liabilities',
  };

  return {
    data,
    updateProfile,
    addEntity,
    updateEntity,
    deleteEntity,
    addGoal,
    updateGoal,
    deleteGoal,
    addSnapshot,
    recordSnapshotNow,
    deleteSnapshot,
    dismissRecommendation,
    markRecommendationReviewed,
    exportData,
    importData,
    resetAllData,
    categoryLabels,
    updateCashFlow,
    updateSipStepUp,
    updateDebtPlanner,
    updateFIInputs,
    updateTaxInputs,
    addXirrCashflowEntry,
    removeXirrCashflowEntry,
  };
}

export type UseFinancialData = ReturnType<typeof useFinancialData>;

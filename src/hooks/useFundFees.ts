import { useCallback, useEffect, useState } from 'react';
import type { FundFeeSettings, PlanType } from '../types/fees';

export const FUND_FEES_STORAGE_KEY = 'nw_fees';

const DEFAULT_DATA: FundFeeSettings = {};

function loadFundFeesData(): FundFeeSettings {
  try {
    const raw = localStorage.getItem(FUND_FEES_STORAGE_KEY);
    if (!raw) return DEFAULT_DATA;
    return { ...DEFAULT_DATA, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_DATA;
  }
}

export function useFundFees() {
  const [data, setData] = useState<FundFeeSettings>(loadFundFeesData);

  useEffect(() => {
    localStorage.setItem(FUND_FEES_STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const setPlanType = useCallback((fundId: string, planType: PlanType) => {
    setData((prev) => ({ ...prev, [fundId]: { ...prev[fundId], planType } }));
  }, []);

  const setExpenseRatio = useCallback((fundId: string, expenseRatio: number | undefined) => {
    setData((prev) => ({ ...prev, [fundId]: { planType: prev[fundId]?.planType || 'Regular', expenseRatio } }));
  }, []);

  return { data, setPlanType, setExpenseRatio };
}

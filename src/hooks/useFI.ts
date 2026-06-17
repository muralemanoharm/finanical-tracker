import { useMemo } from 'react';
import type { FinancialData } from '../types/financial';
import { STOCK_EXPECTED_RETURN_DEFAULT, requiredMonthlySavings } from '../utils/calculations';
import { useNetWorth } from './useNetWorth';
import { projectNetWorth } from './useProjections';

export interface FIBreakdown {
  yearsToRetirement: number;
  futureAnnualExpense: number;
  fiNumber: number;
  currentPortfolio: number;
  gap: number;
  monthlySipToCloseGap: number;
  progressPercent: number;
  projectedFiAge: number | null;
  coastFiNumber: number;
  coastFiReached: boolean;
}

const MAX_SEARCH_YEARS = 60;

/** Pre-retirement portfolio growth isn't a field the spec defines (only a post-retirement
 * return is captured), so the gap-closing SIP and "projected FI age" search both assume the
 * same long-term equity growth rate already used elsewhere for retirement projections. */
export function useFI(data: FinancialData): FIBreakdown {
  const netWorth = useNetWorth(data);
  return useMemo(() => {
    const { age, retirementAge, monthlyExpenseTarget } = data.profile;
    const { inflationRate, safeWithdrawalRate, postRetirementReturn } = data.fiInputs;
    const yearsToRetirement = Math.max(0, retirementAge - age);

    const futureAnnualExpense = monthlyExpenseTarget * 12 * Math.pow(1 + inflationRate / 100, yearsToRetirement);
    const fiNumber = safeWithdrawalRate > 0 ? futureAnnualExpense / (safeWithdrawalRate / 100) : 0;
    const currentPortfolio = netWorth.totalAssets;
    const gap = Math.max(0, fiNumber - currentPortfolio);

    const monthlySipToCloseGap = gap > 0 ? requiredMonthlySavings(gap, STOCK_EXPECTED_RETURN_DEFAULT, yearsToRetirement * 12) : 0;

    const progressPercent = fiNumber > 0 ? Math.min(100, (currentPortfolio / fiNumber) * 100) : 0;

    let projectedFiAge: number | null = null;
    for (let y = 0; y <= MAX_SEARCH_YEARS; y++) {
      if (projectNetWorth(data, y) >= fiNumber) {
        projectedFiAge = age + y;
        break;
      }
    }

    const coastFiNumber = fiNumber / Math.pow(1 + postRetirementReturn / 100, yearsToRetirement);
    const coastFiReached = currentPortfolio >= coastFiNumber;

    return { yearsToRetirement, futureAnnualExpense, fiNumber, currentPortfolio, gap, monthlySipToCloseGap, progressPercent, projectedFiAge, coastFiNumber, coastFiReached };
  }, [data, netWorth.totalAssets]);
}

import { useMemo } from 'react';
import type { FinancialData } from '../types/financial';

export interface CashFlowBreakdown {
  totalIncome: number;
  insurancePremiumsMonthly: number;
  sipInvestmentsMonthly: number;
  totalExpenses: number;
  surplus: number;
  savingsRatePercent: number;
  investmentRatePercent: number;
  emergencyFundMonthsCovered: number;
  incomeBreakdown: { label: string; value: number }[];
  expenseBreakdown: { label: string; value: number }[];
}

export type SavingsRateLevel = 'Red' | 'Yellow' | 'Green';

export function savingsRateLevel(savingsRatePercent: number): SavingsRateLevel {
  if (savingsRatePercent < 10) return 'Red';
  if (savingsRatePercent < 20) return 'Yellow';
  return 'Green';
}

/** Insurance premiums and SIP contributions are auto-pulled from existing instrument data rather
 * than re-entered, since the cash flow tracker should derive from state the user already maintains. */
export function useCashFlow(data: FinancialData): CashFlowBreakdown {
  return useMemo(() => {
    const cf = data.cashFlow;
    const totalIncome = cf.salaryInHand + cf.freelanceIncome + cf.rentalIncome + cf.otherIncome;

    const insurancePremiumsMonthly =
      (data.lifeInsurance.reduce((s, li) => s + li.annualPremium, 0) +
        data.healthInsurance.reduce((s, hi) => s + hi.annualPremium, 0) +
        data.ulips.reduce((s, u) => s + u.annualPremium, 0)) /
      12;

    const sipInvestmentsMonthly = data.mutualFunds
      .filter((mf) => mf.investmentMode === 'SIP')
      .reduce((s, mf) => s + (mf.monthlySipAmount || 0), 0);

    const epfPpfContributionsMonthly = data.epfPpf.reduce((s, e) => s + e.monthlyContribution, 0);

    const manualExpenses = cf.rentOrEmi + cf.groceries + cf.subscriptions + cf.dining + cf.travel + cf.entertainment + cf.miscellaneous;

    const totalExpenses = manualExpenses + insurancePremiumsMonthly + sipInvestmentsMonthly;

    const surplus = totalIncome - totalExpenses;
    const savingsRatePercent = totalIncome > 0 ? (surplus / totalIncome) * 100 : 0;
    const investmentRatePercent = totalIncome > 0 ? ((sipInvestmentsMonthly + epfPpfContributionsMonthly) / totalIncome) * 100 : 0;
    const emergencyFundMonthsCovered = totalExpenses > 0 ? cf.emergencyFundBalance / totalExpenses : 0;

    const incomeBreakdown = [
      { label: 'Salary in Hand', value: cf.salaryInHand },
      { label: 'Freelance / Side Income', value: cf.freelanceIncome },
      { label: 'Rental Income', value: cf.rentalIncome },
      { label: 'Other Income', value: cf.otherIncome },
    ];

    const expenseBreakdown = [
      { label: 'Rent / EMI', value: cf.rentOrEmi },
      { label: 'Groceries', value: cf.groceries },
      { label: 'Subscriptions', value: cf.subscriptions },
      { label: 'Dining', value: cf.dining },
      { label: 'Travel', value: cf.travel },
      { label: 'Entertainment', value: cf.entertainment },
      { label: 'Insurance Premiums', value: insurancePremiumsMonthly },
      { label: 'SIP Investments', value: sipInvestmentsMonthly },
      { label: 'Miscellaneous', value: cf.miscellaneous },
    ];

    return {
      totalIncome,
      insurancePremiumsMonthly,
      sipInvestmentsMonthly,
      totalExpenses,
      surplus,
      savingsRatePercent,
      investmentRatePercent,
      emergencyFundMonthsCovered,
      incomeBreakdown,
      expenseBreakdown,
    };
  }, [data]);
}

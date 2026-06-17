import { useMemo } from 'react';
import type { FinancialData } from '../types/financial';
import {
  sipFutureValue,
  lumpsumFutureValue,
  fdMaturityValue,
  ulipProjectedValue,
  epfPpfProjectedValue,
  realValue,
  monthsBetween,
  todayISO,
  requiredMonthlySavings,
  STOCK_EXPECTED_RETURN_DEFAULT,
  GOLD_EXPECTED_RETURN_DEFAULT,
  RETIREMENT_CORPUS_MULTIPLE,
  INFLATION_RATE,
} from '../utils/calculations';
import { summarizeMutualFund, summarizeFD, summarizeULIP, summarizeEPFPPF } from './useNetWorth';

export const PROJECTION_MILESTONES = [1, 3, 5, 10, 20] as const;

export interface MilestoneProjection {
  years: number;
  nominalValue: number;
  realValue: number;
}

export interface InstrumentMaturityProjection {
  category: string;
  name: string;
  maturityDate: string | null;
  projectedValueAtMaturity: number;
}

export interface RetirementEstimate {
  yearsToRetirement: number;
  futureMonthlyExpense: number;
  requiredCorpus: number;
  projectedCorpus: number;
  onTrack: boolean;
  shortfall: number;
  additionalMonthlySipNeeded: number;
}

/** Projects the nominal value of a single mutual fund holding `years` from today. */
function projectMutualFund(mf: FinancialData['mutualFunds'][number], years: number): number {
  const monthsElapsed = Math.max(0, monthsBetween(mf.startDate, todayISO()));
  const totalMonths = monthsElapsed + Math.round(years * 12);
  if (mf.investmentMode === 'SIP') {
    return sipFutureValue(mf.monthlySipAmount || 0, mf.expectedAnnualReturn, totalMonths);
  }
  const currentValue = mf.currentNav * mf.unitsHeld;
  return lumpsumFutureValue(currentValue, mf.expectedAnnualReturn, years);
}

/** Projects an FD forward, assuming reinvestment at the same rate if `years` extends past maturity. */
function projectFD(fd: FinancialData['fixedDeposits'][number], years: number): number {
  const monthsElapsed = Math.max(0, monthsBetween(fd.startDate, todayISO()));
  const totalMonths = monthsElapsed + Math.round(years * 12);
  return fdMaturityValue(fd.principalAmount, fd.interestRate, totalMonths);
}

function projectULIP(u: FinancialData['ulips'][number], years: number): number {
  return ulipProjectedValue(u.currentFundValue, u.expectedReturn, u.mortalityCharges, u.fundManagementCharges, years);
}

function projectEPFPPF(ep: FinancialData['epfPpf'][number], years: number): number {
  return epfPpfProjectedValue(ep.currentBalance, ep.monthlyContribution, ep.expectedReturn, years);
}

function projectStock(stock: FinancialData['stocks'][number], years: number): number {
  return lumpsumFutureValue(stock.quantity * stock.currentPrice, STOCK_EXPECTED_RETURN_DEFAULT, years);
}

function projectGold(gold: FinancialData['gold'][number], years: number): number {
  return lumpsumFutureValue(gold.quantityGrams * gold.currentPricePerGram, GOLD_EXPECTED_RETURN_DEFAULT, years);
}

/** Liabilities are assumed to amortize roughly linearly to zero over their remaining tenure. */
function projectLiabilities(data: FinancialData, years: number): number {
  const months = years * 12;
  return data.liabilities.reduce((sum, l) => {
    if (l.remainingTenureMonths <= 0) return sum;
    const remainingFraction = Math.max(0, 1 - months / l.remainingTenureMonths);
    return sum + l.outstandingPrincipal * remainingFraction;
  }, 0);
}

export function projectTotalAssets(data: FinancialData, years: number): number {
  const mf = data.mutualFunds.reduce((s, m) => s + projectMutualFund(m, years), 0);
  const fd = data.fixedDeposits.reduce((s, f) => s + projectFD(f, years), 0);
  const ulip = data.ulips.reduce((s, u) => s + projectULIP(u, years), 0);
  const epf = data.epfPpf.reduce((s, e) => s + projectEPFPPF(e, years), 0);
  const stocks = data.stocks.reduce((s, st) => s + projectStock(st, years), 0);
  const gold = data.gold.reduce((s, g) => s + projectGold(g, years), 0);
  return mf + fd + ulip + epf + stocks + gold;
}

export function useProjections(data: FinancialData) {
  const milestones: MilestoneProjection[] = useMemo(
    () =>
      PROJECTION_MILESTONES.map((years) => {
        const assets = projectTotalAssets(data, years);
        const liabilities = projectLiabilities(data, years);
        const nominalValue = assets - liabilities;
        return { years, nominalValue, realValue: realValue(nominalValue, years) };
      }),
    [data],
  );

  const maturityProjections: InstrumentMaturityProjection[] = useMemo(() => {
    const rows: InstrumentMaturityProjection[] = [];
    data.mutualFunds.forEach((mf) => {
      const summary = summarizeMutualFund(mf);
      const yearsToMaturity = summary.maturityDate ? Math.max(0, monthsBetween(todayISO(), summary.maturityDate) / 12) : 5;
      rows.push({ category: 'Mutual Fund / SIP', name: mf.fundName, maturityDate: summary.maturityDate, projectedValueAtMaturity: projectMutualFund(mf, yearsToMaturity) });
    });
    data.fixedDeposits.forEach((fd) => {
      const summary = summarizeFD(fd);
      rows.push({ category: 'Fixed Deposit', name: fd.bankName, maturityDate: summary.maturityDate, projectedValueAtMaturity: fdMaturityValue(fd.principalAmount, fd.interestRate, fd.tenureMonths) });
    });
    data.ulips.forEach((u) => {
      const summary = summarizeULIP(u);
      const yearsToMaturity = summary.maturityDate ? Math.max(0, monthsBetween(todayISO(), summary.maturityDate) / 12) : u.policyTermYears;
      rows.push({ category: 'ULIP', name: u.policyName, maturityDate: summary.maturityDate, projectedValueAtMaturity: projectULIP(u, yearsToMaturity) });
    });
    data.epfPpf.forEach((ep) => {
      const summary = summarizeEPFPPF(ep);
      const yearsToMaturity = Math.max(0, ep.maturityYear - new Date().getFullYear());
      rows.push({ category: 'EPF / PPF', name: summary.name, maturityDate: summary.maturityDate, projectedValueAtMaturity: projectEPFPPF(ep, yearsToMaturity) });
    });
    return rows;
  }, [data]);

  const getRetirementEstimate = (retirementAge: number, age: number, monthlyExpenseTarget: number): RetirementEstimate => {
    const yearsToRetirement = Math.max(0, retirementAge - age);
    const futureMonthlyExpense = monthlyExpenseTarget * Math.pow(1 + INFLATION_RATE / 100, yearsToRetirement);
    const requiredCorpus = futureMonthlyExpense * 12 * RETIREMENT_CORPUS_MULTIPLE;
    const projectedAssets = projectTotalAssets(data, yearsToRetirement);
    const projectedLiabilitiesAtRetirement = projectLiabilities(data, yearsToRetirement);
    const projectedCorpus = projectedAssets - projectedLiabilitiesAtRetirement;
    const onTrack = projectedCorpus >= requiredCorpus;
    const shortfall = Math.max(0, requiredCorpus - projectedCorpus);
    const additionalMonthlySipNeeded = shortfall > 0 ? requiredMonthlySavings(shortfall, STOCK_EXPECTED_RETURN_DEFAULT, yearsToRetirement * 12) : 0;
    return { yearsToRetirement, futureMonthlyExpense, requiredCorpus, projectedCorpus, onTrack, shortfall, additionalMonthlySipNeeded };
  };

  return { milestones, maturityProjections, getRetirementEstimate };
}

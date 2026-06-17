import { useMemo } from 'react';
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
  InstrumentSummary,
} from '../types/financial';
import {
  fdCurrentValue,
  addMonthsISO,
  addYearsISO,
  monthsBetween,
  todayISO,
  simpleReturnsPercent,
} from '../utils/calculations';
import { scoreMutualFund, scoreFD, scoreULIP, scoreLifeInsurance, scoreHealthInsurance, scoreEPFPPF, scoreStock, scoreGold, scoreLevel } from '../utils/scoring';

// --- Per-instrument derivations ---
// Note: Term Life and Health Insurance are protection products with no tracked surrender/cash
// value, so their "current value" displayed in tables is the coverage amount (sum assured /
// sum insured) for context, and they are intentionally excluded from Net Worth asset totals.
// EPF/PPF "invested" is taken as the current balance itself since no separate contribution
// history is tracked — returns% for these is therefore always 0 by design.

export function summarizeMutualFund(mf: MutualFund): InstrumentSummary {
  const currentValue = mf.currentNav * mf.unitsHeld;
  const monthsElapsed = Math.max(0, monthsBetween(mf.startDate, todayISO()));
  const invested = mf.investmentMode === 'SIP' ? (mf.monthlySipAmount || 0) * monthsElapsed : mf.lumpsumAmount || 0;
  return {
    id: mf.id,
    name: mf.fundName,
    invested,
    currentValue,
    returnsPercent: simpleReturnsPercent(invested, currentValue),
    maturityDate: mf.lockInEndDate || null,
    healthScore: scoreMutualFund(mf),
    healthScoreLevel: scoreLevel(scoreMutualFund(mf)),
  };
}

export function summarizeFD(fd: FD): InstrumentSummary {
  const currentValue = fdCurrentValue(fd.principalAmount, fd.interestRate, fd.tenureMonths, fd.startDate);
  return {
    id: fd.id,
    name: fd.bankName,
    invested: fd.principalAmount,
    currentValue,
    returnsPercent: simpleReturnsPercent(fd.principalAmount, currentValue),
    maturityDate: addMonthsISO(fd.startDate, fd.tenureMonths),
    healthScore: scoreFD(fd),
    healthScoreLevel: scoreLevel(scoreFD(fd)),
  };
}

export function summarizeULIP(u: ULIP): InstrumentSummary {
  const yearsElapsed = Math.max(0, monthsBetween(u.policyStartDate, todayISO()) / 12);
  const invested = u.annualPremium * yearsElapsed;
  const score = scoreULIP(u);
  return {
    id: u.id,
    name: u.policyName,
    invested,
    currentValue: u.currentFundValue,
    returnsPercent: simpleReturnsPercent(invested, u.currentFundValue),
    maturityDate: addYearsISO(u.policyStartDate, u.policyTermYears),
    healthScore: score,
    healthScoreLevel: scoreLevel(score),
  };
}

export function summarizeLifeInsurance(li: LifeInsurance, annualIncome: number): InstrumentSummary {
  const yearsElapsed = Math.max(0, monthsBetween(li.policyStartDate, todayISO()) / 12);
  const invested = li.annualPremium * yearsElapsed;
  const score = scoreLifeInsurance(li, annualIncome);
  return {
    id: li.id,
    name: li.policyName,
    invested,
    currentValue: li.sumAssured,
    returnsPercent: 0,
    maturityDate: addYearsISO(li.policyStartDate, li.policyTermYears),
    healthScore: score,
    healthScoreLevel: scoreLevel(score),
  };
}

export function summarizeHealthInsurance(hi: HealthInsurance): InstrumentSummary {
  const yearsElapsed = Math.max(0, monthsBetween(hi.policyStartDate, todayISO()) / 12);
  const invested = hi.annualPremium * yearsElapsed;
  const score = scoreHealthInsurance(hi);
  return {
    id: hi.id,
    name: hi.planName,
    invested,
    currentValue: hi.sumInsured,
    returnsPercent: 0,
    maturityDate: hi.renewalDate,
    healthScore: score,
    healthScoreLevel: scoreLevel(score),
  };
}

export function summarizeEPFPPF(ep: EPFPPF): InstrumentSummary {
  const score = scoreEPFPPF(ep);
  return {
    id: ep.id,
    name: `${ep.accountType} Account`,
    invested: ep.currentBalance,
    currentValue: ep.currentBalance,
    returnsPercent: 0,
    maturityDate: `${ep.maturityYear}-12-31`,
    healthScore: score,
    healthScoreLevel: scoreLevel(score),
  };
}

export function summarizeStock(stock: Stock): InstrumentSummary {
  const invested = stock.quantity * stock.buyPrice;
  const currentValue = stock.quantity * stock.currentPrice;
  const score = scoreStock(stock);
  return {
    id: stock.id,
    name: stock.stockName,
    invested,
    currentValue,
    returnsPercent: simpleReturnsPercent(invested, currentValue),
    maturityDate: null,
    healthScore: score,
    healthScoreLevel: scoreLevel(score),
  };
}

export function summarizeGold(gold: Gold): InstrumentSummary {
  const invested = gold.quantityGrams * gold.buyPricePerGram;
  const currentValue = gold.quantityGrams * gold.currentPricePerGram;
  const score = scoreGold(gold);
  return {
    id: gold.id,
    name: gold.assetName,
    invested,
    currentValue,
    returnsPercent: simpleReturnsPercent(invested, currentValue),
    maturityDate: null,
    healthScore: score,
    healthScoreLevel: scoreLevel(score),
  };
}

export function summarizeLiability(l: Liability): InstrumentSummary {
  const maturityDate = addMonthsISO(todayISO(), l.remainingTenureMonths);
  // Liabilities don't get a "wealth score" in the same sense; lower interest rate + shorter
  // remaining tenure is healthier, so we approximate with an inverse scale.
  const healthScore = Math.max(0, Math.min(100, 100 - l.interestRate * 4 - l.remainingTenureMonths / 6));
  return {
    id: l.id,
    name: `${l.loanType} Loan — ${l.lender}`,
    invested: l.outstandingPrincipal,
    currentValue: l.outstandingPrincipal,
    returnsPercent: 0,
    maturityDate,
    healthScore,
    healthScoreLevel: scoreLevel(healthScore),
  };
}

export interface AssetAllocation {
  equity: number;
  debt: number;
  insurance: number;
  gold: number;
  cash: number;
}

export interface NetWorthBreakdown {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  totalInvested: number;
  totalCurrentValue: number;
  totalReturnsPercent: number;
  allocation: AssetAllocation;
  allocationPercent: AssetAllocation;
  summaries: {
    mutualFunds: InstrumentSummary[];
    fixedDeposits: InstrumentSummary[];
    lifeInsurance: InstrumentSummary[];
    ulips: InstrumentSummary[];
    healthInsurance: InstrumentSummary[];
    epfPpf: InstrumentSummary[];
    stocks: InstrumentSummary[];
    gold: InstrumentSummary[];
    liabilities: InstrumentSummary[];
  };
}

export function useNetWorth(data: FinancialData): NetWorthBreakdown {
  return useMemo(() => {
    const annualIncome = data.profile.monthlyIncome * 12;

    const mfSummaries = data.mutualFunds.map(summarizeMutualFund);
    const fdSummaries = data.fixedDeposits.map(summarizeFD);
    const ulipSummaries = data.ulips.map(summarizeULIP);
    const liSummaries = data.lifeInsurance.map((li) => summarizeLifeInsurance(li, annualIncome));
    const hiSummaries = data.healthInsurance.map(summarizeHealthInsurance);
    const epfSummaries = data.epfPpf.map(summarizeEPFPPF);
    const stockSummaries = data.stocks.map(summarizeStock);
    const goldSummaries = data.gold.map(summarizeGold);
    const liabilitySummaries = data.liabilities.map(summarizeLiability);

    const sumCurrent = (items: InstrumentSummary[]) => items.reduce((s, i) => s + i.currentValue, 0);
    const sumInvested = (items: InstrumentSummary[]) => items.reduce((s, i) => s + i.invested, 0);

    // Equity bucket: equity/ELSS mutual funds + stocks. Hybrid funds split 50/50 equity/debt.
    const equityMF = data.mutualFunds.filter((mf) => mf.fundType === 'Equity' || mf.fundType === 'ELSS');
    const hybridMF = data.mutualFunds.filter((mf) => mf.fundType === 'Hybrid');
    const debtMF = data.mutualFunds.filter((mf) => mf.fundType === 'Debt');
    const equityMFValue = sumCurrent(equityMF.map(summarizeMutualFund));
    const hybridMFValue = sumCurrent(hybridMF.map(summarizeMutualFund));
    const debtMFValue = sumCurrent(debtMF.map(summarizeMutualFund));

    const equity = equityMFValue + hybridMFValue / 2 + sumCurrent(stockSummaries);
    const debt = debtMFValue + hybridMFValue / 2 + sumCurrent(fdSummaries) + sumCurrent(epfSummaries);
    const insurance = sumCurrent(ulipSummaries);
    const gold = sumCurrent(goldSummaries);
    const cash = 0; // no dedicated "cash in hand" instrument is modeled in this app yet

    const totalAssets = equity + debt + insurance + gold + cash;
    const totalLiabilities = data.liabilities.reduce((s, l) => s + l.outstandingPrincipal, 0);
    const netWorth = totalAssets - totalLiabilities;

    const totalInvested = sumInvested(mfSummaries) + sumInvested(fdSummaries) + sumInvested(ulipSummaries) + sumInvested(epfSummaries) + sumInvested(stockSummaries) + sumInvested(goldSummaries);
    const totalCurrentValue = totalAssets;
    const totalReturnsPercent = simpleReturnsPercent(totalInvested, totalCurrentValue);

    const allocation: AssetAllocation = { equity, debt, insurance, gold, cash };
    const allocationTotal = equity + debt + insurance + gold + cash || 1;
    const allocationPercent: AssetAllocation = {
      equity: (equity / allocationTotal) * 100,
      debt: (debt / allocationTotal) * 100,
      insurance: (insurance / allocationTotal) * 100,
      gold: (gold / allocationTotal) * 100,
      cash: (cash / allocationTotal) * 100,
    };

    return {
      totalAssets,
      totalLiabilities,
      netWorth,
      totalInvested,
      totalCurrentValue,
      totalReturnsPercent,
      allocation,
      allocationPercent,
      summaries: {
        mutualFunds: mfSummaries,
        fixedDeposits: fdSummaries,
        lifeInsurance: liSummaries,
        ulips: ulipSummaries,
        healthInsurance: hiSummaries,
        epfPpf: epfSummaries,
        stocks: stockSummaries,
        gold: goldSummaries,
        liabilities: liabilitySummaries,
      },
    };
  }, [data]);
}

import { useMemo } from 'react';
import type { FinancialData } from '../types/financial';
import { xirrApprox, todayISO, INFLATION_RATE } from '../utils/calculations';
import { summarizeMutualFund, summarizeFD, summarizeULIP, summarizeStock, summarizeGold } from './useNetWorth';

export interface XirrCashflowPoint {
  date: string;
  amount: number;
}

export interface XirrInstrument {
  id: string;
  name: string;
  category: string;
  xirr: number | null; // null when there isn't enough cashflow data to compute one
  cashflows: XirrCashflowPoint[];
  usingManualCashflows: boolean;
}

export interface XirrAnalysis {
  instruments: XirrInstrument[];
  portfolioXirr: number | null;
  niftyBenchmark: number;
  bestFdRate: number;
  inflationBenchmark: number;
}

interface InvestableItem {
  id: string;
  name: string;
  category: string;
  startDate: string | null;
  invested: number;
  currentValue: number;
}

export function useXirr(data: FinancialData): XirrAnalysis {
  return useMemo(() => {
    const today = todayISO();

    // EPF/PPF is excluded: no contribution history is tracked, so invested === currentValue
    // and any XIRR computed from it would be meaningless (always ~0%).
    const items: InvestableItem[] = [
      ...data.mutualFunds.map((mf) => {
        const s = summarizeMutualFund(mf);
        return { id: mf.id, name: mf.fundName, category: 'Mutual Fund / SIP', startDate: mf.startDate, invested: s.invested, currentValue: s.currentValue };
      }),
      ...data.fixedDeposits.map((fd) => {
        const s = summarizeFD(fd);
        return { id: fd.id, name: fd.bankName, category: 'Fixed Deposit', startDate: fd.startDate, invested: s.invested, currentValue: s.currentValue };
      }),
      ...data.ulips.map((u) => {
        const s = summarizeULIP(u);
        return { id: u.id, name: u.policyName, category: 'ULIP', startDate: u.policyStartDate, invested: s.invested, currentValue: s.currentValue };
      }),
      // Stocks and Gold have no tracked purchase date, so they only get an XIRR once the user
      // adds manual cash flow entries for them.
      ...data.stocks.map((st) => {
        const s = summarizeStock(st);
        return { id: st.id, name: st.stockName, category: 'Stock', startDate: null, invested: s.invested, currentValue: s.currentValue };
      }),
      ...data.gold.map((g) => {
        const s = summarizeGold(g);
        return { id: g.id, name: g.assetName, category: 'Gold', startDate: null, invested: s.invested, currentValue: s.currentValue };
      }),
    ];

    const instruments: XirrInstrument[] = items.map((item) => {
      const manualEntries = data.xirrTracker[item.id];
      let cashflows: XirrCashflowPoint[];
      let usingManualCashflows = false;

      if (manualEntries && manualEntries.length > 0) {
        cashflows = [...manualEntries, { date: today, amount: item.currentValue }];
        usingManualCashflows = true;
      } else if (item.startDate) {
        cashflows = [
          { date: item.startDate, amount: -item.invested },
          { date: today, amount: item.currentValue },
        ];
      } else {
        cashflows = [];
      }

      const xirr = cashflows.length >= 2 ? xirrApprox(cashflows) : null;
      return { id: item.id, name: item.name, category: item.category, xirr, cashflows, usingManualCashflows };
    });

    // Portfolio-level XIRR: pool every instrument's cashflows into a single series and solve once,
    // so the result is naturally weighted by each instrument's invested amount and timing.
    const combinedCashflows = instruments.flatMap((i) => i.cashflows);
    const portfolioXirr = combinedCashflows.length >= 2 ? xirrApprox(combinedCashflows) : null;

    const bestFdRate = data.fixedDeposits.length > 0 ? Math.max(...data.fixedDeposits.map((fd) => fd.interestRate)) : 0;

    return {
      instruments,
      portfolioXirr,
      niftyBenchmark: data.taxInputs.niftyAssumedXirr,
      bestFdRate,
      inflationBenchmark: INFLATION_RATE,
    };
  }, [data]);
}

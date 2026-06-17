import { useMemo } from 'react';
import type { FinancialData, Liability, DebtPayoffMethod } from '../types/financial';
import { addMonthsISO, todayISO } from '../utils/calculations';

export interface DebtPayoffResult {
  months: number | null; // null if not paid off within MAX_MONTHS
  totalInterestPaid: number;
  debtFreeDate: string | null;
  perLoanPayoffMonths: Record<string, number>;
}

export interface LoanTimelineEntry {
  id: string;
  name: string;
  payoffMonth: number | null;
  payoffDate: string | null;
}

export interface DebtPayoffComparison {
  avalanche: DebtPayoffResult;
  snowball: DebtPayoffResult;
  selected: DebtPayoffResult;
  timeline: LoanTimelineEntry[];
}

const MAX_MONTHS = 600; // 50-year cap to detect non-converging payoff plans

/** Simulates month-by-month payoff: minimum EMI on every loan, plus a single priority-ordered
 * extra payment pool (configured extra + EMIs freed from already-paid-off loans) cascaded onto
 * whichever loan is highest-priority for the chosen method (avalanche = highest rate first,
 * snowball = smallest balance first). */
function simulate(liabilities: Liability[], method: DebtPayoffMethod, extraMonthlyPayment: number): DebtPayoffResult {
  if (liabilities.length === 0) {
    return { months: 0, totalInterestPaid: 0, debtFreeDate: todayISO(), perLoanPayoffMonths: {} };
  }

  const order = method === 'Avalanche' ? [...liabilities].sort((a, b) => b.interestRate - a.interestRate) : [...liabilities].sort((a, b) => a.outstandingPrincipal - b.outstandingPrincipal);

  const balances = new Map<string, number>(order.map((l) => [l.id, l.outstandingPrincipal]));
  const perLoanPayoffMonths: Record<string, number> = {};
  let totalInterestPaid = 0;
  let month = 0;

  while (month < MAX_MONTHS) {
    const remaining = order.filter((l) => (balances.get(l.id) ?? 0) > 0.5);
    if (remaining.length === 0) break;
    month++;

    const freedEmi = order.filter((l) => (balances.get(l.id) ?? 0) <= 0.5).reduce((s, l) => s + l.emiAmount, 0);
    const extraPool = extraMonthlyPayment + freedEmi;
    const topPriorityId = remaining[0].id;

    for (const l of order) {
      const bal = balances.get(l.id) ?? 0;
      if (bal <= 0.5) continue;
      const interest = bal * (l.interestRate / 100 / 12);
      totalInterestPaid += interest;
      const payment = l.emiAmount + (l.id === topPriorityId ? extraPool : 0);
      const newBal = Math.max(0, bal + interest - payment);
      balances.set(l.id, newBal);
      if (newBal <= 0.5 && !(l.id in perLoanPayoffMonths)) perLoanPayoffMonths[l.id] = month;
    }
  }

  const allPaid = order.every((l) => (balances.get(l.id) ?? 0) <= 0.5);
  return {
    months: allPaid ? month : null,
    totalInterestPaid,
    debtFreeDate: allPaid ? addMonthsISO(todayISO(), month) : null,
    perLoanPayoffMonths,
  };
}

export function useDebtPayoff(data: FinancialData): DebtPayoffComparison {
  return useMemo(() => {
    const { liabilities, debtPlanner } = data;
    const avalanche = simulate(liabilities, 'Avalanche', debtPlanner.extraMonthlyPayment);
    const snowball = simulate(liabilities, 'Snowball', debtPlanner.extraMonthlyPayment);
    const selected = debtPlanner.method === 'Avalanche' ? avalanche : snowball;

    const timeline: LoanTimelineEntry[] = liabilities.map((l) => {
      const payoffMonth = selected.perLoanPayoffMonths[l.id] ?? null;
      return {
        id: l.id,
        name: `${l.loanType} — ${l.lender}`,
        payoffMonth,
        payoffDate: payoffMonth !== null ? addMonthsISO(todayISO(), payoffMonth) : null,
      };
    });

    return { avalanche, snowball, selected, timeline };
  }, [data]);
}

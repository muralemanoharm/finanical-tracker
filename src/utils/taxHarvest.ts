import type { NetWorthBreakdown } from '../hooks/useNetWorth';
import { EQUITY_LTCG_RATE, todayISO } from './calculations';

export interface LossPosition {
  category: 'Mutual Fund / SIP' | 'Stock';
  name: string;
  invested: number;
  currentValue: number;
  unrealisedLoss: number;
}

export function findLossPositions(summaries: NetWorthBreakdown['summaries']): LossPosition[] {
  const positions: LossPosition[] = [];
  summaries.mutualFunds.forEach((s) => {
    if (s.currentValue < s.invested) {
      positions.push({ category: 'Mutual Fund / SIP', name: s.name, invested: s.invested, currentValue: s.currentValue, unrealisedLoss: s.invested - s.currentValue });
    }
  });
  summaries.stocks.forEach((s) => {
    if (s.currentValue < s.invested) {
      positions.push({ category: 'Stock', name: s.name, invested: s.invested, currentValue: s.currentValue, unrealisedLoss: s.invested - s.currentValue });
    }
  });
  return positions;
}

/** Harvesting window: Jan 1 through Mar 20 (60 days before FY end on Mar 31). */
export function isWithinHarvestWindow(dateISO: string = todayISO()): boolean {
  const d = new Date(dateISO);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return month === 1 || month === 2 || (month === 3 && day <= 20);
}

export function daysUntilWindowOpens(dateISO: string = todayISO()): number {
  const d = new Date(dateISO);
  const nextJan1 = new Date(d.getFullYear() + 1, 0, 1);
  const startOfToday = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.ceil((nextJan1.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));
}

export interface HarvestOpportunity {
  totalUnrealisedLoss: number;
  offsetAmount: number;
  estimatedTaxSaved: number;
}

/** Tax saved is approximated using the equity LTCG rate, consistent with the audited tax-rate
 * constants — actual savings depend on the holding period and asset class of the specific lot. */
export function computeHarvestOpportunity(positions: LossPosition[], realisedGainsThisFY: number): HarvestOpportunity {
  const totalUnrealisedLoss = positions.reduce((s, p) => s + p.unrealisedLoss, 0);
  const offsetAmount = Math.max(0, Math.min(totalUnrealisedLoss, realisedGainsThisFY));
  const estimatedTaxSaved = (offsetAmount * EQUITY_LTCG_RATE) / 100;
  return { totalUnrealisedLoss, offsetAmount, estimatedTaxSaved };
}

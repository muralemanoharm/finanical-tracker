import type { FinancialData } from '../types/financial';
import type { LifeEvent } from '../types/lifeTimeline';
import type { InstrumentMaturityProjection } from '../hooks/useProjections';
import type { FIBreakdown } from '../hooks/useFI';
import { addMonthsISO, isWithinNextDays, todayISO } from './calculations';

export type FinancialEventType = 'FD Maturity' | 'ULIP Maturity' | 'Loan Payoff' | 'SIP Goal' | 'Insurance Renewal' | 'FI Reached';

export interface FinancialEvent {
  id: string;
  type: FinancialEventType;
  title: string;
  date: string;
  amount?: number;
  isSpecial?: boolean;
}

export function dateToYearFraction(iso: string): number {
  const d = new Date(iso);
  return d.getFullYear() + d.getMonth() / 12;
}

/** Derives financial milestones fresh on every render from live instrument/goal/insurance data —
 * these are never persisted, unlike manually added LifeEvents. */
export function deriveFinancialEvents(data: FinancialData, maturityProjections: InstrumentMaturityProjection[], fi: FIBreakdown): FinancialEvent[] {
  const events: FinancialEvent[] = [];

  maturityProjections.forEach((m, i) => {
    if (!m.maturityDate) return;
    if (m.category === 'Fixed Deposit') {
      events.push({ id: `fd-${i}`, type: 'FD Maturity', title: 'FD Matures', date: m.maturityDate, amount: m.projectedValueAtMaturity });
    } else if (m.category === 'ULIP') {
      events.push({ id: `ulip-${i}`, type: 'ULIP Maturity', title: 'ULIP Matures', date: m.maturityDate, amount: m.projectedValueAtMaturity });
    }
  });

  data.liabilities.forEach((l) => {
    if (l.remainingTenureMonths <= 0) return;
    const payoffDate = addMonthsISO(todayISO(), l.remainingTenureMonths);
    events.push({ id: `loan-${l.id}`, type: 'Loan Payoff', title: `Loan Free: ${l.loanType}`, date: payoffDate });
  });

  data.goals.forEach((g) => {
    events.push({ id: `goal-${g.id}`, type: 'SIP Goal', title: `SIP Goal: ${g.goalName}`, date: g.targetDate, amount: g.targetAmount });
  });

  data.healthInsurance.forEach((h) => {
    if (isWithinNextDays(h.renewalDate, 730)) {
      events.push({ id: `renew-${h.id}`, type: 'Insurance Renewal', title: `Renew: ${h.planName}`, date: h.renewalDate });
    }
  });

  if (fi.projectedFiAge !== null) {
    const fiYear = new Date().getFullYear() + (fi.projectedFiAge - data.profile.age);
    events.push({ id: 'fi-reached', type: 'FI Reached', title: 'Financial Independence', date: `${fiYear}-01-01`, isSpecial: true });
  }

  return events;
}

export interface NetWorthYearPoint {
  year: number;
  netWorth: number;
}

/** Samples projectNetWorth at each whole year from startYear to endYear, applying a one-time
 * visual dip at years containing a costed life event (does not carry into later years' base calc,
 * since projectNetWorth always recomputes independently from current real data). */
export function buildNetWorthArc(
  startYear: number,
  endYear: number,
  currentYear: number,
  projectNetWorthFn: (years: number) => number,
  lifeEvents: LifeEvent[],
): NetWorthYearPoint[] {
  const costByYear = new Map<number, number>();
  lifeEvents.forEach((e) => {
    if (e.estimatedCost) costByYear.set(e.year, (costByYear.get(e.year) || 0) + e.estimatedCost);
  });

  const points: NetWorthYearPoint[] = [];
  for (let year = startYear; year <= endYear; year++) {
    const yearsFromNow = year - currentYear;
    const base = projectNetWorthFn(Math.max(0, yearsFromNow));
    const dip = costByYear.get(year) || 0;
    points.push({ year, netWorth: base - dip });
  }
  return points;
}

export function cumulativeCostByYear(lifeEvents: LifeEvent[]): { year: number; cumulativeCost: number }[] {
  const costed = lifeEvents.filter((e) => e.estimatedCost && e.estimatedCost > 0).sort((a, b) => a.year - b.year);
  let running = 0;
  return costed.map((e) => {
    running += e.estimatedCost || 0;
    return { year: e.year, cumulativeCost: running };
  });
}

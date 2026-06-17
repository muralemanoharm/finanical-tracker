import { differenceInCalendarMonths, differenceInCalendarDays, addMonths, addYears, parseISO } from 'date-fns';

export const INFLATION_RATE = 6; // percent, used for real-value projections
export const RETURN_BENCHMARK = 7; // percent, baseline used in wealth score
export const ULIP_CHARGE_ALERT_THRESHOLD = 2.5; // percent
export const MEDICAL_INFLATION_RATE = 14; // percent
export const MIN_HEALTH_COVER_INDIVIDUAL = 1_000_000; // ₹10L
export const MIN_HEALTH_COVER_FAMILY = 1_500_000; // ₹15L
export const ULIP_NET_RETURN_ALERT_THRESHOLD = 8; // percent; below this, term + direct MF is usually more efficient
export const INSURANCE_PREMIUM_INCOME_ALERT_PERCENT = 10; // percent of annual income
export const LIFE_COVER_INCOME_MULTIPLE = 10;
export const LIFE_COVER_EXPENSE_MULTIPLE = 5;
// No expected-return field is captured for Stocks/Gold, so projections fall back to these
// long-term assumptions (broad equity market average, long-term gold appreciation).
export const STOCK_EXPECTED_RETURN_DEFAULT = 12;
export const GOLD_EXPECTED_RETURN_DEFAULT = 8;
// Rule-of-thumb retirement corpus multiple (~4% safe withdrawal rate) applied to the
// inflation-adjusted annual expense at retirement.
export const RETIREMENT_CORPUS_MULTIPLE = 25;

// --- Income tax (India, FY2025-26 / AY2026-27) ---
// Simplifications: no senior-citizen slabs, no surcharge, no marginal relief on the new-regime
// rebate, and the `hra` tax input is treated as an already-computed HRA exemption amount rather
// than being derived from rent/basic-salary/city rules.
export const SECTION_80C_LIMIT = 150_000;
export const SECTION_80D_LIMIT_NON_SENIOR = 25_000;
export const SECTION_80D_LIMIT_SENIOR = 50_000;
export const NPS_80CCD_1B_LIMIT = 50_000;
export const OLD_REGIME_STANDARD_DEDUCTION = 50_000;
export const NEW_REGIME_STANDARD_DEDUCTION = 75_000;
export const OLD_REGIME_REBATE_THRESHOLD = 500_000; // Section 87A
export const NEW_REGIME_REBATE_THRESHOLD = 1_200_000; // Section 87A
export const CESS_RATE = 4; // percent, Health & Education Cess on tax payable, both regimes

export interface TaxSlab {
  upTo: number; // inclusive upper bound of this slab; Infinity for the top slab
  rate: number; // percent
}

export const OLD_REGIME_SLABS: TaxSlab[] = [
  { upTo: 250_000, rate: 0 },
  { upTo: 500_000, rate: 5 },
  { upTo: 1_000_000, rate: 20 },
  { upTo: Infinity, rate: 30 },
];

export const NEW_REGIME_SLABS: TaxSlab[] = [
  { upTo: 400_000, rate: 0 },
  { upTo: 800_000, rate: 5 },
  { upTo: 1_200_000, rate: 10 },
  { upTo: 1_600_000, rate: 15 },
  { upTo: 2_000_000, rate: 20 },
  { upTo: 2_400_000, rate: 25 },
  { upTo: Infinity, rate: 30 },
];

/** Tax payable on taxableIncome under a slab schedule (each slab's rate applies only to the
 * portion of income within that slab). */
export function slabTax(taxableIncome: number, slabs: TaxSlab[]): number {
  let tax = 0;
  let lastCap = 0;
  for (const slab of slabs) {
    if (taxableIncome <= lastCap) break;
    const slabAmount = Math.min(taxableIncome, slab.upTo) - lastCap;
    tax += slabAmount * (slab.rate / 100);
    lastCap = slab.upTo;
  }
  return tax;
}

/** Months between two ISO dates (b - a). Negative if b is before a. */
export function monthsBetween(aISO: string, bISO: string): number {
  return differenceInCalendarMonths(parseISO(bISO), parseISO(aISO));
}

export function daysBetween(aISO: string, bISO: string): number {
  return differenceInCalendarDays(parseISO(bISO), parseISO(aISO));
}

export function addMonthsISO(iso: string, months: number): string {
  return addMonths(parseISO(iso), months).toISOString().slice(0, 10);
}

export function addYearsISO(iso: string, years: number): string {
  return addYears(parseISO(iso), years).toISOString().slice(0, 10);
}

/**
 * Future value of a monthly SIP (ordinary annuity due, contribution at start of month).
 * FV = P x [((1+r)^n - 1) / r] x (1+r)
 */
export function sipFutureValue(monthlyAmount: number, annualReturnPercent: number, months: number): number {
  if (!monthlyAmount || months <= 0) return 0;
  const r = annualReturnPercent / 100 / 12;
  if (r === 0) return monthlyAmount * months;
  return monthlyAmount * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
}

/** Future value of a SIP whose monthly contribution increases by `stepUpPercent` at the start of
 * every 12th month (annual step-up), contribution at start of month (annuity due). */
export function stepUpSipFutureValue(monthlyAmount: number, annualReturnPercent: number, months: number, stepUpPercent: number): number {
  if (!monthlyAmount || months <= 0) return 0;
  if (!stepUpPercent) return sipFutureValue(monthlyAmount, annualReturnPercent, months);
  const r = annualReturnPercent / 100 / 12;
  let fv = 0;
  let currentMonthly = monthlyAmount;
  for (let m = 1; m <= months; m++) {
    if (m > 1 && (m - 1) % 12 === 0) currentMonthly *= 1 + stepUpPercent / 100;
    fv += currentMonthly * Math.pow(1 + r, months - m + 1);
  }
  return fv;
}

/** Current accumulated value of a SIP that has been running since startDate, valued as of today. */
export function sipCurrentValue(monthlyAmount: number, annualReturnPercent: number, startDateISO: string, asOfISO: string = todayISO()): number {
  const monthsElapsed = Math.max(0, monthsBetween(startDateISO, asOfISO));
  return sipFutureValue(monthlyAmount, annualReturnPercent, monthsElapsed);
}

/** Lumpsum compound growth: FV = P x (1+r)^n, r annual rate, n years (can be fractional). */
export function lumpsumFutureValue(principal: number, annualReturnPercent: number, years: number): number {
  if (!principal || years <= 0) return principal || 0;
  const r = annualReturnPercent / 100;
  return principal * Math.pow(1 + r, years);
}

/** FD maturity value with quarterly compounding: M = P x (1 + r/4)^(4t), t in years. */
export function fdMaturityValue(principal: number, annualRatePercent: number, tenureMonths: number): number {
  if (!principal) return 0;
  const t = tenureMonths / 12;
  const r = annualRatePercent / 100;
  return principal * Math.pow(1 + r / 4, 4 * t);
}

/** Current accrued value of an FD as of a given date (quarterly compounding, capped at maturity). */
export function fdCurrentValue(principal: number, annualRatePercent: number, tenureMonths: number, startDateISO: string, asOfISO: string = todayISO()): number {
  const elapsedMonths = Math.max(0, monthsBetween(startDateISO, asOfISO));
  const cappedMonths = Math.min(elapsedMonths, tenureMonths);
  return fdMaturityValue(principal, annualRatePercent, cappedMonths);
}

/** ULIP effective annual growth rate after mortality + fund management charges. */
export function ulipEffectiveReturn(expectedReturnPercent: number, mortalityChargesPercent: number, fundManagementChargesPercent: number): number {
  return expectedReturnPercent - mortalityChargesPercent - fundManagementChargesPercent;
}

/** Projects a ULIP's current fund value forward by `years` using the effective compound growth rate. */
export function ulipProjectedValue(
  currentFundValue: number,
  expectedReturnPercent: number,
  mortalityChargesPercent: number,
  fundManagementChargesPercent: number,
  years: number,
): number {
  const effectiveRate = ulipEffectiveReturn(expectedReturnPercent, mortalityChargesPercent, fundManagementChargesPercent);
  return lumpsumFutureValue(currentFundValue, effectiveRate, years);
}

/** Years from now until a ULIP's projected fund value first exceeds total premiums paid (since
 * inception through that point). Returns null if it doesn't happen within maxSearchYears. */
export function ulipBreakEvenYear(
  currentFundValue: number,
  expectedReturnPercent: number,
  mortalityChargesPercent: number,
  fundManagementChargesPercent: number,
  annualPremium: number,
  yearsElapsedSoFar: number,
  maxSearchYears = 30,
): number | null {
  for (let y = 0; y <= maxSearchYears; y++) {
    const fundValue = ulipProjectedValue(currentFundValue, expectedReturnPercent, mortalityChargesPercent, fundManagementChargesPercent, y);
    const premiumsPaid = annualPremium * (yearsElapsedSoFar + y);
    if (fundValue >= premiumsPaid) return y;
  }
  return null;
}

/** EPF/PPF projected balance: current balance grows + monthly contributions grow as a SIP, both at expectedReturn, over `years`. */
export function epfPpfProjectedValue(currentBalance: number, monthlyContribution: number, expectedReturnPercent: number, years: number): number {
  const months = Math.round(years * 12);
  return lumpsumFutureValue(currentBalance, expectedReturnPercent, years) + sipFutureValue(monthlyContribution, expectedReturnPercent, months);
}

/** Deflates a future nominal value to today's purchasing power. */
export function realValue(nominalValue: number, years: number, inflationPercent: number = INFLATION_RATE): number {
  if (years <= 0) return nominalValue;
  return nominalValue / Math.pow(1 + inflationPercent / 100, years);
}

/**
 * Approximate XIRR using a single cashflow-in / value-out series via Newton-Raphson.
 * cashflows: array of { date: ISO string, amount: number } where outflows (investments) are negative
 * and the final value (current worth) is a positive amount as of "today".
 * Falls back to a simple CAGR-style approximation if Newton-Raphson does not converge.
 */
export function xirrApprox(cashflows: { date: string; amount: number }[]): number {
  if (cashflows.length < 2) return 0;
  const sorted = [...cashflows].sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
  const t0 = parseISO(sorted[0].date).getTime();
  const yearsFromStart = sorted.map((cf) => (parseISO(cf.date).getTime() - t0) / (365.25 * 24 * 3600 * 1000));

  const npv = (rate: number) => sorted.reduce((sum, cf, i) => sum + cf.amount / Math.pow(1 + rate, yearsFromStart[i]), 0);
  const dNpv = (rate: number) =>
    sorted.reduce((sum, cf, i) => (yearsFromStart[i] === 0 ? sum : sum - (yearsFromStart[i] * cf.amount) / Math.pow(1 + rate, yearsFromStart[i] + 1)), 0);

  let rate = 0.1;
  for (let i = 0; i < 50; i++) {
    const f = npv(rate);
    const df = dNpv(rate);
    if (Math.abs(df) < 1e-9) break;
    const next = rate - f / df;
    if (!Number.isFinite(next)) break;
    if (Math.abs(next - rate) < 1e-7) {
      rate = next;
      break;
    }
    rate = next;
  }

  if (!Number.isFinite(rate) || rate < -0.99 || rate > 10) {
    // fallback: simple CAGR between first outflow and last inflow
    const invested = -sorted.filter((cf) => cf.amount < 0).reduce((s, cf) => s + cf.amount, 0);
    const value = sorted.filter((cf) => cf.amount > 0).reduce((s, cf) => s + cf.amount, 0);
    const years = yearsFromStart[yearsFromStart.length - 1] || 1;
    if (invested <= 0 || years <= 0) return 0;
    return (Math.pow(value / invested, 1 / years) - 1) * 100;
  }

  return rate * 100;
}

export function simpleReturnsPercent(invested: number, currentValue: number): number {
  if (!invested) return 0;
  return ((currentValue - invested) / invested) * 100;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isWithinNextDays(dateISO: string, days: number, fromISO: string = todayISO()): boolean {
  const diff = daysBetween(fromISO, dateISO);
  return diff >= 0 && diff <= days;
}

/** Monthly savings (ordinary annuity, contribution at start of month) required to reach a target FV. */
export function requiredMonthlySavings(targetFv: number, annualReturnPercent: number, months: number): number {
  if (months <= 0) return targetFv;
  const r = annualReturnPercent / 100 / 12;
  if (r === 0) return targetFv / months;
  const factor = ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
  return targetFv / factor;
}

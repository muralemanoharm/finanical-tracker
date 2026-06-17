import { differenceInCalendarMonths, differenceInCalendarDays, addMonths, addYears, parseISO } from 'date-fns';

// Bumped whenever the tax/interest calculation logic below is materially revised, so older
// exported data or screenshots can be cross-checked against the rules version that produced them.
export const BUSINESS_LOGIC_VERSION = 'FY2025-26 v2.0';

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
// Simplifications: no senior-citizen slabs, and the `hra` tax input is treated as an
// already-computed HRA exemption amount rather than being derived from rent/basic-salary/city
// rules. Surcharge + marginal relief are now modeled (see computeSurcharge below).
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

export interface SurchargeSlab {
  above: number; // surcharge applies to taxable income strictly above this amount
  rate: number; // percent, applied to the base tax (before cess)
}

// FIXED: surcharge was previously not modeled at all (totalTax only ever included slab tax +
// cess), so high-income taxable amounts were understated. Old regime keeps the statutory 37% top
// slab (income > 5Cr). New regime surcharge is capped at 25% — the 37% slab was removed for new
// regime taxpayers by Budget 2023, so income > 2Cr in the new regime pays 25%, not 37%.
export const OLD_REGIME_SURCHARGE_SLABS: SurchargeSlab[] = [
  { above: 50_00_000, rate: 10 },
  { above: 1_00_00_000, rate: 15 },
  { above: 2_00_00_000, rate: 25 },
  { above: 5_00_00_000, rate: 37 },
];

export const NEW_REGIME_SURCHARGE_SLABS: SurchargeSlab[] = [
  { above: 50_00_000, rate: 10 },
  { above: 1_00_00_000, rate: 15 },
  { above: 2_00_00_000, rate: 25 },
];

export interface SurchargeResult {
  ratePercent: number;
  surcharge: number;
  marginalReliefApplied: boolean;
}

/**
 * Surcharge on base tax (before cess), with marginal relief: total tax + surcharge can never
 * increase by more than the amount taxable income exceeds the slab threshold it just crossed.
 * `slabs` must be sorted ascending by `above`. `slabTaxFn` recomputes base tax at the threshold
 * income (same slab schedule as `baseTax` was computed with) to evaluate the relief.
 */
export function computeSurcharge(taxableIncome: number, baseTax: number, slabs: SurchargeSlab[], slabTaxFn: (income: number) => number): SurchargeResult {
  let applicable: SurchargeSlab | null = null;
  for (const slab of slabs) {
    if (taxableIncome > slab.above) applicable = slab;
  }
  if (!applicable) return { ratePercent: 0, surcharge: 0, marginalReliefApplied: false };

  const rawSurcharge = baseTax * (applicable.rate / 100);
  const taxAtThreshold = slabTaxFn(applicable.above);
  const maxTotalAtIncome = taxAtThreshold + (taxableIncome - applicable.above);
  if (baseTax + rawSurcharge > maxTotalAtIncome) {
    return { ratePercent: applicable.rate, surcharge: Math.max(0, maxTotalAtIncome - baseTax), marginalReliefApplied: true };
  }
  return { ratePercent: applicable.rate, surcharge: rawSurcharge, marginalReliefApplied: false };
}

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

/**
 * EPF projected balance. EPF interest is computed monthly on the running balance and credited at
 * FY end (rule: monthly_interest = running_balance x rate/12), which is mathematically equivalent
 * to compounding the lump sum and the monthly contribution stream at the monthly rate — exactly
 * what lumpsumFutureValue + sipFutureValue already do, so no change needed here.
 */
function epfProjectedValue(currentBalance: number, monthlyContribution: number, expectedReturnPercent: number, years: number): number {
  const months = Math.round(years * 12);
  return lumpsumFutureValue(currentBalance, expectedReturnPercent, years) + sipFutureValue(monthlyContribution, expectedReturnPercent, months);
}

// FIXED: PPF was compounding contributions like a monthly SIP (sipFutureValue), but PPF interest
// is compounded annually and credited once a year (March 31) — annual deposits should each
// compound at the full annual rate from when they're added, not at a monthly rate. Replaced with
// a year-by-year loop: balance = (balance + annual_deposit) x (1 + rate), matching the rule's
// simplified annual formula instead of naively doing balance x rate^years.
function ppfProjectedValue(currentBalance: number, monthlyContribution: number, expectedReturnPercent: number, years: number): number {
  const r = 1 + expectedReturnPercent / 100;
  const annualDeposit = monthlyContribution * 12;
  let balance = currentBalance;
  const wholeYears = Math.floor(years);
  for (let y = 0; y < wholeYears; y++) {
    balance = (balance + annualDeposit) * r;
  }
  const partialYear = years - wholeYears;
  if (partialYear > 0) {
    balance = (balance + annualDeposit * partialYear) * Math.pow(r, partialYear);
  }
  return balance;
}

/** EPF/PPF projected balance over `years`, using the compounding convention appropriate to the account type. */
export function epfPpfProjectedValue(
  currentBalance: number,
  monthlyContribution: number,
  expectedReturnPercent: number,
  years: number,
  accountType: 'EPF' | 'PPF' = 'EPF',
): number {
  return accountType === 'PPF'
    ? ppfProjectedValue(currentBalance, monthlyContribution, expectedReturnPercent, years)
    : epfProjectedValue(currentBalance, monthlyContribution, expectedReturnPercent, years);
}

/** Deflates a future nominal value to today's purchasing power. */
export function realValue(nominalValue: number, years: number, inflationPercent: number = INFLATION_RATE): number {
  if (years <= 0) return nominalValue;
  return nominalValue / Math.pow(1 + inflationPercent / 100, years);
}

// FIXED: previously fell back to a simple CAGR approximation whenever Newton-Raphson failed to
// converge (or produced an out-of-range rate), silently presenting an inaccurate number as if it
// were the XIRR. Now returns null on non-convergence and on extreme-loss results (< -95%), with no
// fallback approximation — callers must show an explicit "not available" state instead. Iteration
// count raised 50 -> 100 to match the reference implementation and reduce spurious non-convergence.
/**
 * XIRR via Newton-Raphson on a cashflow-in / value-out series.
 * cashflows: array of { date: ISO string, amount: number } where outflows (investments) are negative
 * and the final value (current worth) is a positive amount as of "today".
 * Returns null if Newton-Raphson does not converge within 100 iterations, or if the converged
 * rate represents an extreme loss (< -95%).
 */
export function xirrApprox(cashflows: { date: string; amount: number }[]): number | null {
  if (cashflows.length < 2) return null;
  const sorted = [...cashflows].sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
  const t0 = parseISO(sorted[0].date).getTime();
  const yearsFromStart = sorted.map((cf) => (parseISO(cf.date).getTime() - t0) / (365.25 * 24 * 3600 * 1000));

  const npv = (rate: number) => sorted.reduce((sum, cf, i) => sum + cf.amount / Math.pow(1 + rate, yearsFromStart[i]), 0);
  const dNpv = (rate: number) =>
    sorted.reduce((sum, cf, i) => (yearsFromStart[i] === 0 ? sum : sum - (yearsFromStart[i] * cf.amount) / Math.pow(1 + rate, yearsFromStart[i] + 1)), 0);

  let rate = 0.1;
  let converged = false;
  for (let i = 0; i < 100; i++) {
    const f = npv(rate);
    const df = dNpv(rate);
    if (Math.abs(df) < 1e-9) break;
    const next = rate - f / df;
    if (!Number.isFinite(next) || next < -0.999) break;
    if (Math.abs(next - rate) < 1e-7) {
      rate = next;
      converged = true;
      break;
    }
    rate = next;
  }

  if (!converged || !Number.isFinite(rate)) return null;
  if (rate * 100 < -95) return null;
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

// --- Equity capital gains (Section 111A / 112A, Finance Act 2024, pivot date July 23 2024) ---
// Not wired into any existing feature (this app does not track purchase lots/holding periods for
// capital-gains purposes), so these exist purely as audited, correct reference formulas — used by
// verifyCalculations() below — without changing any UI or instrument data model.
export const EQUITY_STCG_RATE = 20.8; // percent, 20% + 4% cess, holding < 12 months
export const EQUITY_LTCG_RATE = 12.5; // percent, holding >= 12 months
export const EQUITY_LTCG_EXEMPTION = 125_000; // Section 112A annual exemption

export function equityStcgTax(gains: number): number {
  return Math.max(0, gains) * (EQUITY_STCG_RATE / 100);
}

export function equityLtcgTax(gains: number): number {
  return Math.max(0, gains - EQUITY_LTCG_EXEMPTION) * (EQUITY_LTCG_RATE / 100) * (1 + CESS_RATE / 100);
}

/**
 * Smoke test for the calculation fixes above. Logs PASS/FAIL with actual vs. expected to the
 * console for a handful of known reference values; does not throw or affect the UI.
 */
export function verifyCalculations(): void {
  const cases: { label: string; actual: number | null; expected: number; tolerancePercent: number }[] = [
    { label: 'EPF: ₹10,000/mo for 10y @ 8.25%', actual: epfPpfProjectedValue(0, 10_000, 8.25, 10, 'EPF'), expected: 18_30_000, tolerancePercent: 5 },
    { label: 'PPF: ₹1,50,000/yr for 15y @ 7.1%', actual: epfPpfProjectedValue(0, 12_500, 7.1, 15, 'PPF'), expected: 40_70_000, tolerancePercent: 2 },
    { label: 'FD: ₹1,00,000 @ 7% quarterly for 3y', actual: fdMaturityValue(100_000, 7, 36), expected: 1_23_144, tolerancePercent: 1 },
    { label: 'Equity STCG tax on ₹1,00,000 gain', actual: equityStcgTax(100_000), expected: 20_800, tolerancePercent: 1 },
    { label: 'Equity LTCG tax on ₹2,00,000 gain (₹75,000 taxable)', actual: equityLtcgTax(200_000), expected: 9_750, tolerancePercent: 1 },
  ];

  console.log(`--- verifyCalculations (${BUSINESS_LOGIC_VERSION}) ---`);
  for (const c of cases) {
    if (c.actual === null) {
      console.log(`FAIL  ${c.label}: actual=null expected=${c.expected}`);
      continue;
    }
    const diffPercent = (Math.abs(c.actual - c.expected) / c.expected) * 100;
    const pass = diffPercent <= c.tolerancePercent;
    console.log(`${pass ? 'PASS' : 'FAIL'}  ${c.label}: actual=${c.actual.toFixed(2)} expected=${c.expected} (diff ${diffPercent.toFixed(2)}%)`);
  }
}

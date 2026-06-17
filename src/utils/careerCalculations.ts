import type { HumanCapitalInputs, JobSwitchInputs, IncomeStream, SkillInvestment } from '../types/career';
import { addMonthsISO, monthsBetween, todayISO } from './calculations';

/** Present value of all remaining projected salary: HC = Sum_{t=1..years} CTC*(1+g)^t / (1+d)^t. */
export function humanCapitalValue(inputs: HumanCapitalInputs): number {
  const years = Math.max(0, inputs.retirementAge - inputs.currentAge);
  const g = inputs.salaryGrowthPercent / 100;
  const d = inputs.discountRatePercent / 100;
  let hc = 0;
  for (let t = 1; t <= years; t++) {
    hc += (inputs.currentAnnualCTC * Math.pow(1 + g, t)) / Math.pow(1 + d, t);
  }
  return hc;
}

/** Lost lifetime-earnings PV from having one fewer working year (delaying by a year). */
export function humanCapitalDecayPerYear(inputs: HumanCapitalInputs): number {
  return humanCapitalValue(inputs) - humanCapitalValue({ ...inputs, currentAge: inputs.currentAge + 1 });
}

export interface JobSwitchYearRow {
  year: number;
  currentSalary: number;
  targetSalary: number;
  cumulativeCurrentIncome: number;
  cumulativeTargetIncome: number;
  wealthCurrent: number;
  wealthTarget: number;
}

/** Year-by-year salary + compounding-wealth comparison between staying vs switching jobs.
 * Each year's full salary is treated as invested at `investmentRatePercent`, so the gap between
 * the two wealth series is equivalent to compounding just the salary delta. */
export function computeJobSwitchProjection(inputs: JobSwitchInputs): JobSwitchYearRow[] {
  const rows: JobSwitchYearRow[] = [];
  const r = inputs.investmentRatePercent / 100;
  let cumulativeCurrentIncome = 0;
  let cumulativeTargetIncome = 0;
  let wealthCurrent = 0;
  let wealthTarget = 0;
  for (let year = 1; year <= inputs.yearsToCompare; year++) {
    const currentSalary = inputs.currentCTC * Math.pow(1 + inputs.currentGrowthPercent / 100, year - 1);
    const targetSalary = inputs.targetCTC * Math.pow(1 + inputs.targetGrowthPercent / 100, year - 1);
    cumulativeCurrentIncome += currentSalary;
    cumulativeTargetIncome += targetSalary;
    wealthCurrent = wealthCurrent * (1 + r) + currentSalary;
    wealthTarget = wealthTarget * (1 + r) + targetSalary;
    rows.push({ year, currentSalary, targetSalary, cumulativeCurrentIncome, cumulativeTargetIncome, wealthCurrent, wealthTarget });
  }
  return rows;
}

export interface IncomeStreamPoint {
  date: string;
  value: number;
  isProjected: boolean;
}

/** Full historical (back-cast from current value) + projected monthly series for an income stream,
 * assuming constant `growthRatePercentPerMonth` since `monthStarted`. */
export function incomeStreamSeries(stream: IncomeStream, monthsAheadProjection = 24): IncomeStreamPoint[] {
  const monthsElapsed = Math.max(0, monthsBetween(stream.monthStarted, todayISO()));
  const g = stream.growthRatePercentPerMonth / 100;
  const startValue = g === 0 || monthsElapsed === 0 ? stream.monthlyIncomeCurrent : stream.monthlyIncomeCurrent / Math.pow(1 + g, monthsElapsed);
  const totalMonths = monthsElapsed + monthsAheadProjection;
  const points: IncomeStreamPoint[] = [];
  for (let m = 0; m <= totalMonths; m++) {
    points.push({ date: addMonthsISO(stream.monthStarted, m), value: startValue * Math.pow(1 + g, m), isProjected: m > monthsElapsed });
  }
  return points;
}

/** Months from today until the stream's projected value first reaches its target; null if it never will. */
export function monthsToReachTarget(stream: IncomeStream): number | null {
  if (stream.monthlyIncomeCurrent >= stream.targetMonthlyIncome) return 0;
  const g = stream.growthRatePercentPerMonth / 100;
  if (g <= 0) return null;
  const months = Math.log(stream.targetMonthlyIncome / stream.monthlyIncomeCurrent) / Math.log(1 + g);
  return Number.isFinite(months) ? Math.ceil(months) : null;
}

export function dateToReachTarget(stream: IncomeStream): string | null {
  const months = monthsToReachTarget(stream);
  return months === null ? null : addMonthsISO(todayISO(), months);
}

/** Sum of this stream's actual (non-projected) income within the current Indian financial year (Apr-Mar). */
export function incomeThisFinancialYear(stream: IncomeStream): number {
  const today = new Date();
  const fyStartYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1; // month is 0-indexed; April = 3
  const fyStart = `${fyStartYear}-04-01`;
  const fyEnd = `${fyStartYear + 1}-03-31`;
  return incomeStreamSeries(stream, 0)
    .filter((p) => !p.isProjected && p.date >= fyStart && p.date <= fyEnd)
    .reduce((sum, p) => sum + p.value, 0);
}

export function cumulativeIncomeSinceStart(stream: IncomeStream): number {
  return incomeStreamSeries(stream, 0)
    .filter((p) => !p.isProjected)
    .reduce((sum, p) => sum + p.value, 0);
}

/** Combined projected side income (sum of all streams) at each month ahead, used to find the
 * "financial independence from job" crossover date against monthly expenses. */
export function combinedSideIncomeAt(streams: IncomeStream[], monthsAhead: number): number {
  return streams.reduce((sum, s) => sum + s.monthlyIncomeCurrent * Math.pow(1 + s.growthRatePercentPerMonth / 100, monthsAhead), 0);
}

/** First future date (ISO) at which combined side income exceeds monthly expenses, searching up to 20 years; null if never. */
export function fiFromJobDate(streams: IncomeStream[], monthlyExpenseTarget: number, maxMonths = 240): string | null {
  if (monthlyExpenseTarget <= 0) return null;
  for (let m = 0; m <= maxMonths; m++) {
    if (combinedSideIncomeAt(streams, m) >= monthlyExpenseTarget) return addMonthsISO(todayISO(), m);
  }
  return null;
}

export function skillRoiPercent(skill: SkillInvestment): number {
  if (!skill.cost) return 0;
  return (skill.expectedAnnualUplift / skill.cost) * 100;
}

/** Months to recoup the cost from the monthly-equivalent salary uplift; null if no uplift. */
export function skillPaybackMonths(skill: SkillInvestment): number | null {
  const monthlyUplift = skill.expectedAnnualUplift / 12;
  return monthlyUplift > 0 ? skill.cost / monthlyUplift : null;
}

export function totalSkillInvestmentThisYear(skills: SkillInvestment[]): number {
  const currentYear = new Date().getFullYear();
  return skills.filter((s) => new Date(s.createdAt).getFullYear() === currentYear).reduce((sum, s) => sum + s.cost, 0);
}

/** Only counts uplift from skills marked Completed — Planned/In Progress uplift hasn't been realized yet. */
export function totalRealizedSalaryImpact(skills: SkillInvestment[]): number {
  return skills.filter((s) => s.status === 'Completed').reduce((sum, s) => sum + s.expectedAnnualUplift, 0);
}

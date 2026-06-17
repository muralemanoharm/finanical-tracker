import type { FundFeeOverride } from '../types/fees';

export const FEE_IMPACT_YEARS = 20;
export const DEFAULT_REGULAR_TER = 1.5;
export const DEFAULT_DIRECT_TER = 0.5;

export function effectiveExpenseRatio(override: FundFeeOverride | undefined): number {
  if (!override) return DEFAULT_REGULAR_TER;
  if (override.expenseRatio !== undefined) return override.expenseRatio;
  return override.planType === 'Direct' ? DEFAULT_DIRECT_TER : DEFAULT_REGULAR_TER;
}

export interface FundFeeImpact {
  expenseRatio: number;
  corpusWithoutFees: number;
  corpusWithFees: number;
  corpusAtDirectTER: number;
  feeDrag: number;
  annualFeeCost: number;
  directPlanSavings: number;
}

/** `grossReturn` is the fund's own expected-return assumption, treated as the pre-fee return
 * (the only return figure tracked per fund), consistent with the spec's gross_return term. */
export function computeFundFeeImpact(invested: number, currentValue: number, grossReturn: number, expenseRatio: number, years = FEE_IMPACT_YEARS): FundFeeImpact {
  const corpusWithoutFees = invested * Math.pow(1 + grossReturn / 100, years);
  const corpusWithFees = invested * Math.pow(1 + (grossReturn - expenseRatio) / 100, years);
  const corpusAtDirectTER = invested * Math.pow(1 + (grossReturn - DEFAULT_DIRECT_TER) / 100, years);
  const feeDrag = corpusWithoutFees - corpusWithFees;
  const annualFeeCost = (currentValue * expenseRatio) / 100;
  const directPlanSavings = Math.max(0, corpusAtDirectTER - corpusWithFees);
  return { expenseRatio, corpusWithoutFees, corpusWithFees, corpusAtDirectTER, feeDrag, annualFeeCost, directPlanSavings };
}

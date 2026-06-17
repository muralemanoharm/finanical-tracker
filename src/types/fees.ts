export type PlanType = 'Direct' | 'Regular';

export interface FundFeeOverride {
  planType: PlanType;
  expenseRatio?: number; // percent; if omitted, defaults based on planType
}

/** Per mutual-fund-id fee overrides for the Fee Impact calculator. */
export type FundFeeSettings = Record<string, FundFeeOverride>;

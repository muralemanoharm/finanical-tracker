// All monetary values are in INR. All dates are stored as ISO date strings (YYYY-MM-DD).

export type FundType = 'Equity' | 'Debt' | 'Hybrid' | 'ELSS';
export type InvestmentMode = 'SIP' | 'Lumpsum';
export type InterestPayoutType = 'Cumulative' | 'Monthly';
export type LifePolicyType = 'Term' | 'Endowment' | 'Money-back';
export type ULIPFundType = 'Equity' | 'Debt' | 'Balanced';
export type CoverageType = 'Individual' | 'Family Floater';
export type EPFPPFAccountType = 'EPF' | 'PPF';
export type LoanType = 'Home' | 'Car' | 'Personal' | 'Education';

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface MutualFund extends BaseEntity {
  fundName: string;
  fundType: FundType;
  investmentMode: InvestmentMode;
  monthlySipAmount?: number; // present when investmentMode === 'SIP'
  lumpsumAmount?: number; // present when investmentMode === 'Lumpsum'
  startDate: string;
  currentNav: number;
  unitsHeld: number;
  expectedAnnualReturn: number; // percent
  lockInEndDate?: string; // ELSS only
}

export interface FD extends BaseEntity {
  bankName: string;
  principalAmount: number;
  interestRate: number; // percent annual
  tenureMonths: number;
  startDate: string;
  payoutType: InterestPayoutType;
}

export interface LifeInsurance extends BaseEntity {
  policyName: string;
  sumAssured: number;
  annualPremium: number;
  policyStartDate: string;
  policyTermYears: number;
  premiumPaymentTermYears: number;
  policyType: LifePolicyType;
}

export interface ULIP extends BaseEntity {
  policyName: string;
  insurer: string;
  annualPremium: number;
  policyStartDate: string;
  policyTermYears: number;
  lockInPeriodYears: number; // default 5
  currentFundValue: number;
  fundType: ULIPFundType;
  expectedReturn: number; // percent
  mortalityCharges: number; // percent
  fundManagementCharges: number; // percent
}

export interface HealthInsurance extends BaseEntity {
  insurerName: string;
  planName: string;
  sumInsured: number;
  annualPremium: number;
  policyStartDate: string;
  renewalDate: string;
  coverageType: CoverageType;
  membersCovered: string[];
  noClaimBonusPercent: number;
  waitingPeriodMonths: number;
}

export interface EPFPPF extends BaseEntity {
  accountType: EPFPPFAccountType;
  currentBalance: number;
  monthlyContribution: number;
  expectedReturn: number; // percent
  maturityYear: number;
}

export interface Stock extends BaseEntity {
  stockName: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  sector: string;
}

export interface Gold extends BaseEntity {
  assetName: string;
  quantityGrams: number;
  buyPricePerGram: number;
  currentPricePerGram: number;
}

export interface Liability extends BaseEntity {
  loanType: LoanType;
  lender: string;
  outstandingPrincipal: number;
  emiAmount: number;
  interestRate: number; // percent annual
  remainingTenureMonths: number;
}

export interface Goal extends BaseEntity {
  goalName: string;
  targetAmount: number;
  targetDate: string;
  linkedInstrumentIds: string[];
  reviewed?: boolean;
}

export interface NetWorthSnapshot {
  date: string;
  netWorth: number;
}

export interface Profile {
  name: string;
  monthlyIncome: number;
  age: number;
  retirementAge: number;
  monthlyExpenseTarget: number;
}

export interface FinancialData {
  profile: Profile;
  mutualFunds: MutualFund[];
  fixedDeposits: FD[];
  lifeInsurance: LifeInsurance[];
  ulips: ULIP[];
  healthInsurance: HealthInsurance[];
  epfPpf: EPFPPF[];
  stocks: Stock[];
  gold: Gold[];
  liabilities: Liability[];
  goals: Goal[];
  snapshots: NetWorthSnapshot[];
  dismissedRecommendationKeys: string[];
  reviewedRecommendationKeys: string[];
}

export type InstrumentCategory =
  | 'mutualFunds'
  | 'fixedDeposits'
  | 'lifeInsurance'
  | 'ulips'
  | 'healthInsurance'
  | 'epfPpf'
  | 'stocks'
  | 'gold'
  | 'liabilities';

export type HealthScoreLevel = 'Green' | 'Yellow' | 'Red';

export interface InstrumentSummary {
  id: string;
  name: string;
  invested: number;
  currentValue: number;
  returnsPercent: number;
  maturityDate: string | null;
  healthScore: number;
  healthScoreLevel: HealthScoreLevel;
}

export type Severity = 'High' | 'Medium' | 'Low';

export interface Recommendation {
  key: string;
  condition: string;
  message: string;
  severity: Severity;
}

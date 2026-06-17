export interface HumanCapitalInputs {
  currentAnnualCTC: number;
  salaryGrowthPercent: number;
  discountRatePercent: number;
  currentAge: number;
  retirementAge: number;
}

export interface JobSwitchInputs {
  currentCTC: number;
  targetCTC: number;
  currentGrowthPercent: number;
  targetGrowthPercent: number;
  investmentRatePercent: number;
  yearsToCompare: number;
}

export interface IncomeStream {
  id: string;
  name: string;
  monthlyIncomeCurrent: number;
  monthStarted: string; // ISO date
  targetMonthlyIncome: number;
  growthRatePercentPerMonth: number;
}

export type SkillStatus = 'In Progress' | 'Completed' | 'Planned';

export interface SkillInvestment {
  id: string;
  name: string;
  cost: number;
  hoursInvested: number;
  expectedAnnualUplift: number;
  status: SkillStatus;
  createdAt: string; // ISO date, used to bucket "this year" spend
}

export interface CareerData {
  humanCapital: HumanCapitalInputs;
  jobSwitch: JobSwitchInputs;
  incomeStreams: IncomeStream[];
  skills: SkillInvestment[];
}

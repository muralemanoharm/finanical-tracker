import { useMemo } from 'react';
import type { FinancialData } from '../types/financial';
import {
  SECTION_80C_LIMIT,
  SECTION_80D_LIMIT_NON_SENIOR,
  SECTION_80D_LIMIT_SENIOR,
  NPS_80CCD_1B_LIMIT,
  OLD_REGIME_STANDARD_DEDUCTION,
  NEW_REGIME_STANDARD_DEDUCTION,
  OLD_REGIME_REBATE_THRESHOLD,
  NEW_REGIME_REBATE_THRESHOLD,
  CESS_RATE,
  OLD_REGIME_SLABS,
  NEW_REGIME_SLABS,
  slabTax,
} from '../utils/calculations';

export interface Section80CBreakdown {
  ppf: number;
  epf: number;
  elss: number;
  lifeInsurancePremiums: number;
  otherManualEntries: number;
  total: number;
  limit: number;
  eligible: number;
  remainingRoom: number;
}

export interface Section80DBreakdown {
  healthInsurancePremiums: number;
  limit: number;
  eligible: number;
  remainingRoom: number;
}

export interface NpsBreakdown {
  contribution: number;
  limit: number;
  eligible: number;
  remainingRoom: number;
}

export interface RegimeResult {
  taxableIncome: number;
  taxBeforeCess: number;
  cess: number;
  totalTax: number;
  rebateApplied: boolean;
}

export interface TaxPlanningResult {
  section80C: Section80CBreakdown;
  section80D: Section80DBreakdown;
  nps: NpsBreakdown;
  oldRegime: RegimeResult;
  newRegime: RegimeResult;
  recommendedRegime: 'Old' | 'New';
  taxSavingsWithRecommended: number;
}

export function useTaxPlanning(data: FinancialData): TaxPlanningResult {
  return useMemo(() => {
    const { taxInputs, profile } = data;
    const grossSalary = taxInputs.grossSalary || 0;
    const hra = taxInputs.hra || 0;
    const other80CInvestments = taxInputs.other80CInvestments || 0;
    const npsContribution = taxInputs.npsContribution || 0;

    const ppf = data.epfPpf.filter((e) => e.accountType === 'PPF').reduce((s, e) => s + e.monthlyContribution * 12, 0);
    const epf = data.epfPpf.filter((e) => e.accountType === 'EPF').reduce((s, e) => s + e.monthlyContribution * 12, 0);
    const elss = data.mutualFunds
      .filter((m) => m.fundType === 'ELSS')
      .reduce((s, m) => s + (m.investmentMode === 'SIP' ? (m.monthlySipAmount ?? 0) * 12 : (m.lumpsumAmount ?? 0)), 0);
    const lifeInsurancePremiums = data.lifeInsurance.reduce((s, li) => s + li.annualPremium, 0);
    const total80C = ppf + epf + elss + lifeInsurancePremiums + other80CInvestments;
    const section80C: Section80CBreakdown = {
      ppf,
      epf,
      elss,
      lifeInsurancePremiums,
      otherManualEntries: other80CInvestments,
      total: total80C,
      limit: SECTION_80C_LIMIT,
      eligible: Math.min(total80C, SECTION_80C_LIMIT),
      remainingRoom: Math.max(0, SECTION_80C_LIMIT - total80C),
    };

    const healthInsurancePremiums = data.healthInsurance.reduce((s, hi) => s + hi.annualPremium, 0);
    const limit80D = profile.age >= 60 ? SECTION_80D_LIMIT_SENIOR : SECTION_80D_LIMIT_NON_SENIOR;
    const section80D: Section80DBreakdown = {
      healthInsurancePremiums,
      limit: limit80D,
      eligible: Math.min(healthInsurancePremiums, limit80D),
      remainingRoom: Math.max(0, limit80D - healthInsurancePremiums),
    };

    const nps: NpsBreakdown = {
      contribution: npsContribution,
      limit: NPS_80CCD_1B_LIMIT,
      eligible: Math.min(npsContribution, NPS_80CCD_1B_LIMIT),
      remainingRoom: Math.max(0, NPS_80CCD_1B_LIMIT - npsContribution),
    };

    const oldTaxableIncome = Math.max(0, grossSalary - OLD_REGIME_STANDARD_DEDUCTION - hra - section80C.eligible - section80D.eligible - nps.eligible);
    const oldRebateApplied = oldTaxableIncome <= OLD_REGIME_REBATE_THRESHOLD;
    const oldTaxBeforeCess = oldRebateApplied ? 0 : slabTax(oldTaxableIncome, OLD_REGIME_SLABS);
    const oldCess = oldTaxBeforeCess * (CESS_RATE / 100);
    const oldRegime: RegimeResult = { taxableIncome: oldTaxableIncome, taxBeforeCess: oldTaxBeforeCess, cess: oldCess, totalTax: oldTaxBeforeCess + oldCess, rebateApplied: oldRebateApplied };

    // New regime allows no 80C/80D/HRA deductions, only the (higher) standard deduction.
    const newTaxableIncome = Math.max(0, grossSalary - NEW_REGIME_STANDARD_DEDUCTION);
    const newRebateApplied = newTaxableIncome <= NEW_REGIME_REBATE_THRESHOLD;
    const newTaxBeforeCess = newRebateApplied ? 0 : slabTax(newTaxableIncome, NEW_REGIME_SLABS);
    const newCess = newTaxBeforeCess * (CESS_RATE / 100);
    const newRegime: RegimeResult = { taxableIncome: newTaxableIncome, taxBeforeCess: newTaxBeforeCess, cess: newCess, totalTax: newTaxBeforeCess + newCess, rebateApplied: newRebateApplied };

    const recommendedRegime: 'Old' | 'New' = oldRegime.totalTax <= newRegime.totalTax ? 'Old' : 'New';
    const taxSavingsWithRecommended = Math.abs(oldRegime.totalTax - newRegime.totalTax);

    return { section80C, section80D, nps, oldRegime, newRegime, recommendedRegime, taxSavingsWithRecommended };
  }, [data]);
}

import { useMemo } from 'react';
import type { FinancialData, Recommendation } from '../types/financial';
import type { NetWorthBreakdown } from './useNetWorth';
import {
  ULIP_CHARGE_ALERT_THRESHOLD,
  MIN_HEALTH_COVER_INDIVIDUAL,
  LIFE_COVER_INCOME_MULTIPLE,
  INFLATION_RATE,
  monthsBetween,
  todayISO,
} from '../utils/calculations';

const SIP_LOW_RETURN_THRESHOLD = 8;
const SIP_MIN_YEARS_HELD = 3;
const CONCENTRATION_THRESHOLD_PERCENT = 60;
const ELSS_LOCKIN_WARNING_MONTHS = 3;
const NET_WORTH_GROWTH_THRESHOLD_PERCENT = 10;

/**
 * Pure rule engine: always derives recommendations fresh from current data + net worth
 * breakdown, never from cached/stored state, so it reflects edits immediately.
 */
export function deriveRecommendations(data: FinancialData, netWorth: NetWorthBreakdown): Recommendation[] {
  const recs: Recommendation[] = [];
  const annualIncome = data.profile.monthlyIncome * 12;

  // 1. SIP underperformance (proxied by expected annual return since no transaction-level XIRR is tracked)
  data.mutualFunds
    .filter((mf) => mf.investmentMode === 'SIP')
    .forEach((mf) => {
      const yearsHeld = Math.max(0, monthsBetween(mf.startDate, todayISO())) / 12;
      if (yearsHeld >= SIP_MIN_YEARS_HELD && mf.expectedAnnualReturn < SIP_LOW_RETURN_THRESHOLD) {
        recs.push({
          key: `sip-low-return-${mf.id}`,
          condition: 'SIP expected return < 8% for 3+ years',
          message: `"${mf.fundName}" has an expected return below 8% after ${yearsHeld.toFixed(1)} years — consider switching to a better-performing fund.`,
          severity: 'Medium',
        });
      }
    });

  // 2. ULIP high charges
  data.ulips.forEach((u) => {
    const totalCharges = u.mortalityCharges + u.fundManagementCharges;
    if (totalCharges > ULIP_CHARGE_ALERT_THRESHOLD) {
      recs.push({
        key: `ulip-charges-${u.id}`,
        condition: 'ULIP charges > 2.5%',
        message: `"${u.policyName}" has combined charges of ${totalCharges.toFixed(2)}% — high cost. Consider a term plan + direct mutual fund combo instead.`,
        severity: 'High',
      });
    }
  });

  // 3. Underinsurance (term life)
  const termPlans = data.lifeInsurance.filter((li) => li.policyType === 'Term');
  const totalTermCover = termPlans.reduce((s, li) => s + li.sumAssured, 0);
  if (annualIncome > 0 && (termPlans.length === 0 || totalTermCover < annualIncome * LIFE_COVER_INCOME_MULTIPLE)) {
    recs.push({
      key: 'underinsured-life',
      condition: 'No term insurance or sum assured < 10x income',
      message: `Your term cover (₹${totalTermCover.toLocaleString('en-IN')}) is below 10x your annual income — you are underinsured. Consider adding/increasing a term plan.`,
      severity: 'High',
    });
  }

  // 4. FD losing real value
  data.fixedDeposits.forEach((fd) => {
    if (fd.interestRate < INFLATION_RATE) {
      recs.push({
        key: `fd-real-loss-${fd.id}`,
        condition: 'FD rate < inflation',
        message: `"${fd.bankName}" FD rate (${fd.interestRate}%) is below inflation (${INFLATION_RATE}%) — it is losing real value. Consider a debt mutual fund.`,
        severity: 'Medium',
      });
    }
  });

  // 5. Portfolio concentration
  const allocationEntries = Object.entries(netWorth.allocationPercent) as [string, number][];
  allocationEntries.forEach(([assetClass, pct]) => {
    if (pct > CONCENTRATION_THRESHOLD_PERCENT) {
      recs.push({
        key: `concentration-${assetClass}`,
        condition: 'Single asset class > 60% of portfolio',
        message: `${pct.toFixed(0)}% of your portfolio is concentrated in ${assetClass} — consider diversifying.`,
        severity: 'Medium',
      });
    }
  });

  // 6. Health cover inadequacy
  if (data.healthInsurance.length === 0) {
    recs.push({
      key: 'health-cover-missing',
      condition: 'No health insurance',
      message: `You have no health insurance on record — medical inflation runs ~14%/yr. Consider getting covered.`,
      severity: 'High',
    });
  } else {
    data.healthInsurance.forEach((hi) => {
      if (hi.sumInsured < MIN_HEALTH_COVER_INDIVIDUAL) {
        recs.push({
          key: `health-cover-low-${hi.id}`,
          condition: 'Health cover < ₹10L',
          message: `"${hi.planName}" cover (₹${hi.sumInsured.toLocaleString('en-IN')}) is below ₹10L — increase health cover given ~14%/yr medical inflation.`,
          severity: 'Medium',
        });
      }
    });
  }

  // 7. ELSS lock-in ending soon
  data.mutualFunds
    .filter((mf) => mf.fundType === 'ELSS' && mf.lockInEndDate)
    .forEach((mf) => {
      const monthsRemaining = monthsBetween(todayISO(), mf.lockInEndDate!);
      if (monthsRemaining >= 0 && monthsRemaining <= ELSS_LOCKIN_WARNING_MONTHS) {
        recs.push({
          key: `elss-lockin-${mf.id}`,
          condition: 'ELSS lock-in ending soon',
          message: `"${mf.fundName}" ELSS lock-in ends in ${monthsRemaining} month(s) — decide whether to hold or redeem.`,
          severity: 'Low',
        });
      }
    });

  // 8. Slow net worth growth (YoY, requires a snapshot from ~12 months ago)
  if (data.snapshots.length > 0) {
    const sorted = [...data.snapshots].sort((a, b) => a.date.localeCompare(b.date));
    const latest = sorted[sorted.length - 1];
    const referenceSnapshot = sorted.find((s) => {
      const monthsDiff = monthsBetween(s.date, latest.date);
      return monthsDiff >= 11 && monthsDiff <= 13;
    });
    if (referenceSnapshot && referenceSnapshot.netWorth > 0) {
      const growthPercent = ((latest.netWorth - referenceSnapshot.netWorth) / referenceSnapshot.netWorth) * 100;
      if (growthPercent < NET_WORTH_GROWTH_THRESHOLD_PERCENT) {
        recs.push({
          key: 'networth-growth-slow',
          condition: 'Net worth growing < 10% YoY',
          message: `Net worth grew ${growthPercent.toFixed(1)}% over the last year — review high-charge instruments to improve growth.`,
          severity: 'Low',
        });
      }
    }
  }

  return recs;
}

export function useRecommendations(data: FinancialData, netWorth: NetWorthBreakdown) {
  const all = useMemo(() => deriveRecommendations(data, netWorth), [data, netWorth]);
  const active = all.filter((r) => !data.dismissedRecommendationKeys.includes(r.key));
  return { all, active };
}

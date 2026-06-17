import type { HealthScoreLevel, MutualFund, FD, ULIP, LifeInsurance, HealthInsurance, EPFPPF, Stock, Gold } from '../types/financial';
import { RETURN_BENCHMARK, ulipEffectiveReturn, monthsBetween, todayISO, MIN_HEALTH_COVER_INDIVIDUAL, LIFE_COVER_INCOME_MULTIPLE } from './calculations';

// Wealth Creation Score (0-100). Each instrument type weighs return-vs-benchmark, liquidity,
// charges, and (for insurance) coverage adequacy differently since the levers that create or
// destroy wealth differ per instrument.
export function scoreLevel(score: number): HealthScoreLevel {
  if (score >= 70) return 'Green';
  if (score >= 40) return 'Yellow';
  return 'Red';
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

/** Returns 0-60 points scaled by how far above/below the inflation benchmark a return sits. */
function returnScore(annualReturnPercent: number, weight = 60): number {
  const delta = annualReturnPercent - RETURN_BENCHMARK;
  // +7 points above benchmark over baseline maps to full weight; below benchmark scales down to 0.
  const ratio = clamp(0.5 + delta / 14, 0, 1);
  return ratio * weight;
}

export function scoreMutualFund(mf: MutualFund): number {
  const liquidity = mf.fundType === 'ELSS' ? 15 : 25; // equity/debt/hybrid are liquid, ELSS has lock-in
  const diversification = mf.fundType === 'Equity' || mf.fundType === 'ELSS' ? 15 : 10;
  return clamp(returnScore(mf.expectedAnnualReturn) + liquidity + diversification);
}

export function scoreFD(fd: FD): number {
  const liquidity = 5; // locked until maturity, lowest liquidity
  const diversification = 10; // debt instrument, modest diversification value
  return clamp(returnScore(fd.interestRate) + liquidity + diversification);
}

export function scoreULIP(u: ULIP): number {
  const effective = ulipEffectiveReturn(u.expectedReturn, u.mortalityCharges, u.fundManagementCharges);
  const totalCharges = u.mortalityCharges + u.fundManagementCharges;
  const chargesPenalty = clamp(totalCharges * 8, 0, 30); // charges directly eat into the score
  const liquidity = 10; // 5yr lock-in
  return clamp(returnScore(effective, 60) + liquidity - chargesPenalty + 20);
}

export function scoreLifeInsurance(li: LifeInsurance, annualIncome: number): number {
  const adequacyRatio = annualIncome > 0 ? li.sumAssured / (annualIncome * LIFE_COVER_INCOME_MULTIPLE) : 0;
  const adequacyScore = clamp(adequacyRatio * 80, 0, 80);
  const typeBonus = li.policyType === 'Term' ? 20 : 10; // term plans give more cover per premium rupee
  return clamp(adequacyScore + typeBonus);
}

export function scoreHealthInsurance(hi: HealthInsurance): number {
  const adequacyRatio = hi.sumInsured / MIN_HEALTH_COVER_INDIVIDUAL;
  const adequacyScore = clamp(adequacyRatio * 70, 0, 70);
  const bonusScore = clamp(hi.noClaimBonusPercent, 0, 30);
  return clamp(adequacyScore + bonusScore);
}

export function scoreEPFPPF(ep: EPFPPF): number {
  const liquidity = 10; // long lock-in, low liquidity
  const diversification = 20; // safe debt allocation, valuable for diversification
  return clamp(returnScore(ep.expectedReturn) + liquidity + diversification);
}

export function scoreStock(stock: Stock): number {
  const returnsPercent = stock.buyPrice > 0 ? ((stock.currentPrice - stock.buyPrice) / stock.buyPrice) * 100 : 0;
  const liquidity = 30; // most liquid instrument
  const diversification = 10;
  return clamp(returnScore(returnsPercent, 50) + liquidity + diversification);
}

export function scoreGold(gold: Gold): number {
  const returnsPercent = gold.buyPricePerGram > 0 ? ((gold.currentPricePerGram - gold.buyPricePerGram) / gold.buyPricePerGram) * 100 : 0;
  const liquidity = 20;
  const diversification = 20; // hedge value
  return clamp(returnScore(returnsPercent, 40) + liquidity + diversification);
}

export function elssLockInRemainingMonths(lockInEndDate?: string): number | null {
  if (!lockInEndDate) return null;
  return monthsBetween(todayISO(), lockInEndDate);
}

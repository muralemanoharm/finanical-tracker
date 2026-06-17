import type { AssetAllocation } from '../hooks/useNetWorth';
import type { TargetAllocation } from '../types/riskProfile';

export type DriftStatus = 'Green' | 'Yellow' | 'Red';

export interface DriftRow {
  assetClass: 'Equity' | 'Debt' | 'Gold' | 'Cash';
  target: number;
  current: number;
  drift: number; // absolute percentage points
  status: DriftStatus;
  statusLabel: string;
}

export const DRIFT_YELLOW_THRESHOLD = 5;
export const DRIFT_RED_THRESHOLD = 10;

function statusForDrift(drift: number): { status: DriftStatus; statusLabel: string } {
  if (drift > DRIFT_RED_THRESHOLD) return { status: 'Red', statusLabel: 'Significant drift — rebalancing recommended' };
  if (drift > DRIFT_YELLOW_THRESHOLD) return { status: 'Yellow', statusLabel: 'Minor drift, review on next investment' };
  return { status: 'Green', statusLabel: 'On track' };
}

export function computeDriftRows(current: AssetAllocation, target: TargetAllocation): DriftRow[] {
  const pairs: { assetClass: DriftRow['assetClass']; target: number; current: number }[] = [
    { assetClass: 'Equity', target: target.equity, current: current.equity },
    { assetClass: 'Debt', target: target.debt, current: current.debt },
    { assetClass: 'Gold', target: target.gold, current: current.gold },
    { assetClass: 'Cash', target: target.cash, current: current.cash },
  ];
  return pairs.map(({ assetClass, target: t, current: c }) => {
    const drift = Math.abs(c - t);
    const { status, statusLabel } = statusForDrift(drift);
    return { assetClass, target: t, current: c, drift, status, statusLabel };
  });
}

export interface RebalanceAction {
  assetClass: DriftRow['assetClass'];
  direction: 'invest more in' | 'reduce exposure to';
  amount: number;
}

/** required_rebalance = |drift%| * total_assets / 100, for each asset class with drift > 5%. */
export function computeRebalanceActions(rows: DriftRow[], totalAssets: number): RebalanceAction[] {
  return rows
    .filter((r) => r.drift > DRIFT_YELLOW_THRESHOLD)
    .map((r) => ({
      assetClass: r.assetClass,
      direction: r.current < r.target ? ('invest more in' as const) : ('reduce exposure to' as const),
      amount: (r.drift * totalAssets) / 100,
    }));
}

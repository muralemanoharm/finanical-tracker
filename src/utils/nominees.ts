import type { NetWorthBreakdown } from '../hooks/useNetWorth';
import type { NomineeEntry } from '../types/nominees';
import { monthsBetween, todayISO } from './calculations';

export interface NomineeAsset {
  id: string;
  category: string;
  name: string;
  currentValue: number;
}

const ASSET_CATEGORIES: { key: keyof NetWorthBreakdown['summaries']; label: string }[] = [
  { key: 'mutualFunds', label: 'Mutual Fund / SIP' },
  { key: 'fixedDeposits', label: 'Fixed Deposit' },
  { key: 'lifeInsurance', label: 'Life Insurance' },
  { key: 'ulips', label: 'ULIP' },
  { key: 'healthInsurance', label: 'Health Insurance' },
  { key: 'epfPpf', label: 'EPF / PPF' },
  { key: 'stocks', label: 'Stock' },
  { key: 'gold', label: 'Gold' },
];

/** Auto-pulls the asset list from existing instrument summaries — liabilities are excluded since
 * nomination doesn't apply to them. */
export function buildNomineeAssetList(summaries: NetWorthBreakdown['summaries']): NomineeAsset[] {
  const result: NomineeAsset[] = [];
  ASSET_CATEGORIES.forEach(({ key, label }) => {
    summaries[key].forEach((s) => {
      result.push({ id: s.id, category: label, name: s.name, currentValue: s.currentValue });
    });
  });
  return result;
}

export type NomineeStatus = 'Green' | 'Yellow' | 'Red';

const NOMINATION_STALE_AFTER_MONTHS = 36;

export function nomineeStatusForAsset(entries: NomineeEntry[] | undefined): NomineeStatus {
  if (!entries || entries.length === 0) return 'Red';
  const mostRecent = entries.reduce((latest, e) => (e.updatedDate > latest ? e.updatedDate : latest), entries[0].updatedDate);
  const monthsSinceUpdate = monthsBetween(mostRecent, todayISO());
  return monthsSinceUpdate <= NOMINATION_STALE_AFTER_MONTHS ? 'Green' : 'Yellow';
}

export function totalSharePercent(entries: NomineeEntry[] | undefined): number {
  return (entries || []).reduce((s, e) => s + e.sharePercent, 0);
}

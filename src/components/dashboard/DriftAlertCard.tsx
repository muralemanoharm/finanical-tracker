import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { useFinancialDataContext } from '../../context/FinancialDataContext';
import { useNetWorth } from '../../hooks/useNetWorth';
import { useRiskProfile } from '../../hooks/useRiskProfile';
import { computeDriftRows, computeRebalanceActions, type DriftStatus } from '../../utils/drift';
import { formatPercent, formatINR } from '../../utils/formatters';

const statusClasses: Record<DriftStatus, string> = {
  Green: 'text-emerald-400',
  Yellow: 'text-amber-400',
  Red: 'text-rose-400',
};

export function DriftAlertCard() {
  const { data } = useFinancialDataContext();
  const netWorth = useNetWorth(data);
  const { isComplete, targetAllocation } = useRiskProfile();

  if (!isComplete || !targetAllocation) {
    return (
      <Card>
        <h3 className="text-white font-medium mb-2">Drift Alert</h3>
        <p className="text-sm text-slate-400">
          Complete your risk profile in{' '}
          <Link to="/settings" className="text-cyan-accent hover:underline">
            Settings
          </Link>{' '}
          to enable drift monitoring.
        </p>
      </Card>
    );
  }

  const rows = computeDriftRows(netWorth.allocationPercent, targetAllocation);
  const actions = computeRebalanceActions(rows, netWorth.totalAssets);

  return (
    <Card>
      <h3 className="text-white font-medium mb-4">Drift Alert</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400">
              <th className="py-1.5 pr-4 font-medium">Asset Class</th>
              <th className="py-1.5 pr-4 font-medium">Target</th>
              <th className="py-1.5 pr-4 font-medium">Current</th>
              <th className="py-1.5 pr-4 font-medium">Drift</th>
              <th className="py-1.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-700">
            {rows.map((r) => (
              <tr key={r.assetClass}>
                <td className="py-2 pr-4 text-slate-200">{r.assetClass}</td>
                <td className="py-2 pr-4 text-slate-300">{formatPercent(r.target)}</td>
                <td className="py-2 pr-4 text-slate-300">{formatPercent(r.current)}</td>
                <td className="py-2 pr-4 text-slate-300">{formatPercent(r.drift)}</td>
                <td className={`py-2 font-medium ${statusClasses[r.status]}`}>{r.statusLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {actions.length > 0 && (
        <div className="mt-4 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10">
          <p className="text-sm font-medium text-amber-300 mb-1">To rebalance</p>
          <ul className="text-sm text-slate-300 list-disc pl-4 space-y-0.5">
            {actions.map((a) => (
              <li key={a.assetClass}>
                {a.direction === 'invest more in' ? 'Invest' : 'Reduce'} {formatINR(a.amount)} {a.direction === 'invest more in' ? 'more in' : 'exposure to'}{' '}
                {a.assetClass}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

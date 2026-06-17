import { useMemo } from 'react';
import { Header } from '../components/layout/Header';
import { Card, KpiCard } from '../components/ui/Card';
import { AllocationDonut } from '../components/charts/AllocationDonut';
import { NetWorthChart } from '../components/charts/NetWorthChart';
import { AssetLiabilityBar } from '../components/charts/AssetLiabilityBar';
import { useFinancialDataContext } from '../context/FinancialDataContext';
import { useCareerDataContext } from '../context/CareerDataContext';
import { useNetWorth } from '../hooks/useNetWorth';
import { useRiskProfile } from '../hooks/useRiskProfile';
import { projectNetWorth } from '../hooks/useProjections';
import { humanCapitalValue } from '../utils/careerCalculations';
import { addMonthsISO, todayISO } from '../utils/calculations';
import { formatINR, formatINRCompact, formatPercent, formatDate } from '../utils/formatters';
import { DriftAlertCard } from '../components/dashboard/DriftAlertCard';
import { TaxHarvestAlert } from '../components/dashboard/TaxHarvestAlert';
import { Camera, Trash2 } from 'lucide-react';

const PROJECTION_MONTHS_AHEAD = 12;

export default function Dashboard() {
  const { data, recordSnapshotNow, deleteSnapshot } = useFinancialDataContext();
  const { data: careerData } = useCareerDataContext();
  const netWorth = useNetWorth(data);
  const riskProfile = useRiskProfile();
  const humanCapital = humanCapitalValue(careerData.humanCapital);
  const totalWealth = netWorth.netWorth + humanCapital;
  const today = todayISO();

  const projection = useMemo(
    () =>
      Array.from({ length: PROJECTION_MONTHS_AHEAD }, (_, i) => {
        const monthsAhead = i + 1;
        return { date: addMonthsISO(today, monthsAhead), netWorth: projectNetWorth(data, monthsAhead / 12) };
      }),
    [data, today],
  );

  const sortedSnapshots = useMemo(() => [...data.snapshots].sort((a, b) => b.date.localeCompare(a.date)), [data.snapshots]);
  const [latest, previous] = sortedSnapshots;
  const momDelta = latest && previous ? latest.netWorth - previous.netWorth : null;
  const momDeltaPercent = momDelta !== null && previous.netWorth !== 0 ? (momDelta / previous.netWorth) * 100 : null;

  return (
    <div>
      <Header title="Net Worth Overview" subtitle="Your complete financial picture at a glance" />
      <div className="px-8 py-6 space-y-6">
        {riskProfile.isComplete && riskProfile.level && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border bg-cyan-accent/10 text-cyan-accent border-cyan-accent/30">
            Risk Profile: {riskProfile.level}
          </span>
        )}
        <Card className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400 mb-1">Total Net Worth</p>
            <p className="text-4xl font-bold text-white">{formatINR(netWorth.netWorth)}</p>
            <p className="text-sm text-slate-400 mt-1">{formatINRCompact(netWorth.netWorth)}</p>
            {momDelta !== null && momDeltaPercent !== null && (
              <p className={`text-sm mt-2 ${momDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {momDelta >= 0 ? '+' : ''}
                {formatINRCompact(momDelta)} ({momDeltaPercent >= 0 ? '+' : ''}
                {formatPercent(momDeltaPercent)}) since last snapshot ({formatDate(previous.date, 'MMM yy')})
              </p>
            )}
            <p className="text-sm text-slate-400 mt-3">
              Net Worth: <span className="text-slate-200 font-medium">{formatINRCompact(netWorth.netWorth)}</span> | Human Capital:{' '}
              <span className="text-slate-200 font-medium">{formatINRCompact(humanCapital)}</span> | Total Wealth:{' '}
              <span className="text-cyan-accent font-medium">{formatINRCompact(totalWealth)}</span>
            </p>
          </div>
          <button
            onClick={() => recordSnapshotNow(netWorth.netWorth, netWorth.totalAssets, netWorth.totalLiabilities)}
            className="flex items-center gap-2 self-start md:self-auto bg-navy-700 text-slate-200 rounded-lg px-4 py-2.5 text-sm hover:bg-navy-600 transition-colors"
          >
            <Camera size={16} /> Record Snapshot
          </button>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard label="Total Invested" value={formatINR(netWorth.totalInvested)} />
          <KpiCard label="Total Current Value" value={formatINR(netWorth.totalCurrentValue)} />
          <KpiCard label="Total Returns" value={formatPercent(netWorth.totalReturnsPercent)} accent={netWorth.totalReturnsPercent >= 0 ? 'positive' : 'negative'} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <h3 className="text-white font-medium mb-3">Assets vs Liabilities</h3>
            <AssetLiabilityBar totalAssets={netWorth.totalAssets} totalLiabilities={netWorth.totalLiabilities} />
          </Card>
          <Card>
            <h3 className="text-white font-medium mb-3">Asset Allocation</h3>
            <AllocationDonut allocation={netWorth.allocation} />
          </Card>
        </div>

        <DriftAlertCard />

        <TaxHarvestAlert />

        <Card>
          <h3 className="text-white font-medium mb-3">Net Worth Trend</h3>
          <p className="text-xs text-slate-500 mb-2">Solid line: recorded snapshots. Dashed line: {PROJECTION_MONTHS_AHEAD}-month projection.</p>
          <NetWorthChart snapshots={data.snapshots} projection={projection} currentNetWorth={netWorth.netWorth} currentDate={today} />
        </Card>

        {sortedSnapshots.length > 0 && (
          <Card>
            <h3 className="text-white font-medium mb-3">Snapshot History</h3>
            <div className="divide-y divide-navy-700">
              {sortedSnapshots.map((s) => (
                <div key={s.date} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-slate-400">{formatDate(s.date)}</span>
                  <span className="text-slate-200 font-medium">{formatINR(s.netWorth)}</span>
                  <button
                    onClick={() => deleteSnapshot(s.date)}
                    className="text-slate-500 hover:text-rose-400 transition-colors"
                    aria-label={`Delete snapshot from ${s.date}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

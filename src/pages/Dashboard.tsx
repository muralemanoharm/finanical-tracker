import { Header } from '../components/layout/Header';
import { Card, KpiCard } from '../components/ui/Card';
import { AllocationDonut } from '../components/charts/AllocationDonut';
import { NetWorthChart } from '../components/charts/NetWorthChart';
import { AssetLiabilityBar } from '../components/charts/AssetLiabilityBar';
import { useFinancialDataContext } from '../context/FinancialDataContext';
import { useNetWorth } from '../hooks/useNetWorth';
import { formatINR, formatINRCompact, formatPercent } from '../utils/formatters';
import { Camera } from 'lucide-react';

export default function Dashboard() {
  const { data, recordSnapshotNow } = useFinancialDataContext();
  const netWorth = useNetWorth(data);

  return (
    <div>
      <Header title="Net Worth Overview" subtitle="Your complete financial picture at a glance" />
      <div className="px-8 py-6 space-y-6">
        <Card className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400 mb-1">Total Net Worth</p>
            <p className="text-4xl font-bold text-white">{formatINR(netWorth.netWorth)}</p>
            <p className="text-sm text-slate-400 mt-1">{formatINRCompact(netWorth.netWorth)}</p>
          </div>
          <button
            onClick={() => recordSnapshotNow(netWorth.netWorth)}
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

        <Card>
          <h3 className="text-white font-medium mb-3">Net Worth Trend</h3>
          <NetWorthChart snapshots={data.snapshots} />
        </Card>
      </div>
    </div>
  );
}

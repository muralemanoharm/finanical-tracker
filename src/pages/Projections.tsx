import { useState } from 'react';
import { Header } from '../components/layout/Header';
import { Card, KpiCard } from '../components/ui/Card';
import { DataTable, type Column } from '../components/ui/DataTable';
import { useFinancialDataContext } from '../context/FinancialDataContext';
import { useProjections, PROJECTION_MILESTONES, type InstrumentMaturityProjection } from '../hooks/useProjections';
import { formatINR, formatDate } from '../utils/formatters';

export default function Projections() {
  const { data } = useFinancialDataContext();
  const { milestones, maturityProjections, getRetirementEstimate } = useProjections(data);
  const [selectedYears, setSelectedYears] = useState<number>(5);
  const [showReal, setShowReal] = useState(false);

  const selectedMilestone = milestones.find((m) => m.years === selectedYears) || milestones[0];
  const retirement = getRetirementEstimate(data.profile.retirementAge, data.profile.age, data.profile.monthlyExpenseTarget);

  const maturityColumns: Column<InstrumentMaturityProjection>[] = [
    { header: 'Category', render: (r) => r.category },
    { header: 'Name', render: (r) => <span className="font-medium text-white">{r.name}</span> },
    { header: 'Maturity Date', render: (r) => formatDate(r.maturityDate) },
    { header: 'Projected Value at Maturity', render: (r) => formatINR(r.projectedValueAtMaturity) },
  ];

  return (
    <div>
      <Header title="Future Projections" subtitle="See where your portfolio is headed" />
      <div className="px-8 py-6 space-y-6">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h3 className="text-white font-medium">Projection Timeline</h3>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={showReal} onChange={(e) => setShowReal(e.target.checked)} className="accent-cyan-500" />
              Show inflation-adjusted (real) value
            </label>
          </div>
          <div className="flex gap-2 mb-6">
            {PROJECTION_MILESTONES.map((y) => (
              <button
                key={y}
                onClick={() => setSelectedYears(y)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedYears === y ? 'bg-cyan-accent text-navy-950' : 'bg-navy-700 text-slate-300 hover:bg-navy-600'
                }`}
              >
                {y}Y
              </button>
            ))}
          </div>
          <KpiCard
            label={`Projected Portfolio Value in ${selectedYears} Year${selectedYears > 1 ? 's' : ''}${showReal ? ' (Real)' : ''}`}
            value={formatINR(showReal ? selectedMilestone.realValue : selectedMilestone.nominalValue)}
          />
        </Card>

        <Card>
          <h3 className="text-white font-medium mb-4">Per-Instrument Projection at Maturity</h3>
          {maturityProjections.length === 0 ? (
            <p className="text-sm text-slate-400">Add mutual funds, FDs, ULIPs or EPF/PPF accounts to see maturity projections.</p>
          ) : (
            <DataTable rows={maturityProjections} columns={maturityColumns} keyFor={(r) => `${r.category}-${r.name}`} />
          )}
        </Card>

        <Card>
          <h3 className="text-white font-medium mb-4">Retirement Corpus Estimator</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <KpiCard label="Years to Retirement" value={retirement.yearsToRetirement} />
            <KpiCard label="Required Corpus" value={formatINR(retirement.requiredCorpus)} />
            <KpiCard label="Projected Corpus" value={formatINR(retirement.projectedCorpus)} />
            <KpiCard
              label="Status"
              value={retirement.onTrack ? 'On Track' : `Shortfall: ${formatINR(retirement.shortfall)}`}
              accent={retirement.onTrack ? 'positive' : 'negative'}
            />
          </div>
          {!retirement.onTrack && retirement.shortfall > 0 && (
            <p className="text-sm text-amber-400">
              To close this gap, consider an additional SIP of ~{formatINR(retirement.additionalMonthlySipNeeded)}/month assuming a 12% expected return.
            </p>
          )}
          {data.profile.monthlyExpenseTarget === 0 && (
            <p className="text-sm text-slate-400 mt-2">Set your target monthly expense in Settings to get an accurate estimate.</p>
          )}
        </Card>
      </div>
    </div>
  );
}

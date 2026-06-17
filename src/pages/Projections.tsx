import { useMemo, useState } from 'react';
import { Header } from '../components/layout/Header';
import { Card, KpiCard } from '../components/ui/Card';
import { DataTable, type Column } from '../components/ui/DataTable';
import { Field, Input } from '../components/ui/FormField';
import { useFinancialDataContext } from '../context/FinancialDataContext';
import { useProjections, PROJECTION_MILESTONES, projectTotalAssets, type InstrumentMaturityProjection } from '../hooks/useProjections';
import { formatINR, formatDate } from '../utils/formatters';
import type { SipStepUpSettings } from '../types/financial';

export default function Projections() {
  const { data } = useFinancialDataContext();
  const { milestones, maturityProjections, getRetirementEstimate } = useProjections(data);
  const [selectedYears, setSelectedYears] = useState<number>(5);
  const [showReal, setShowReal] = useState(false);
  const [stepUpEnabled, setStepUpEnabled] = useState(false);
  const [globalStepUpPercent, setGlobalStepUpPercent] = useState(10);

  const selectedMilestone = milestones.find((m) => m.years === selectedYears) || milestones[0];
  const retirement = getRetirementEstimate(data.profile.retirementAge, data.profile.age, data.profile.monthlyExpenseTarget);

  const stepUpComparison = useMemo(() => {
    const noStepUp: SipStepUpSettings = {};
    const uniformStepUp: SipStepUpSettings = Object.fromEntries(data.mutualFunds.map((mf) => [mf.id, { stepUpPercent: globalStepUpPercent }]));
    return {
      withoutStepUp: projectTotalAssets(data, selectedYears, noStepUp),
      withStepUp: projectTotalAssets(data, selectedYears, uniformStepUp),
    };
  }, [data, selectedYears, globalStepUpPercent]);

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
          <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
            <div>
              <h3 className="text-white font-medium mb-1">SIP Step-Up Scenario</h3>
              <p className="text-xs text-slate-500">What if you stepped up every SIP's monthly contribution by a fixed percentage each year?</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={stepUpEnabled} onChange={(e) => setStepUpEnabled(e.target.checked)} className="accent-cyan-500" />
              Apply step-up to all SIPs
            </label>
          </div>
          {stepUpEnabled && (
            <>
              <div className="w-48 mb-4">
                <Field label="Annual Step-Up (%)">
                  <Input type="number" step="1" min="0" value={globalStepUpPercent || ''} onChange={(e) => setGlobalStepUpPercent(parseFloat(e.target.value) || 0)} />
                </Field>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <KpiCard label={`Portfolio in ${selectedYears}Y — No Step-Up`} value={formatINR(stepUpComparison.withoutStepUp)} />
                <KpiCard
                  label={`Portfolio in ${selectedYears}Y — ${globalStepUpPercent}% Annual Step-Up`}
                  value={formatINR(stepUpComparison.withStepUp)}
                  accent="positive"
                />
              </div>
              <p className="text-sm text-emerald-400 mt-3">
                Stepping up all SIPs by {globalStepUpPercent}% annually grows your {selectedYears}-year portfolio by an extra{' '}
                {formatINR(stepUpComparison.withStepUp - stepUpComparison.withoutStepUp)}.
              </p>
            </>
          )}
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

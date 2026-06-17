import { useState } from 'react';
import { Header } from '../components/layout/Header';
import { Card, KpiCard } from '../components/ui/Card';
import { Field, Input } from '../components/ui/FormField';
import { useFinancialDataContext } from '../context/FinancialDataContext';
import { useFI } from '../hooks/useFI';
import { formatINR, formatINRCompact, formatPercent } from '../utils/formatters';
import type { FIInputs } from '../types/financial';

const MILESTONES = [25, 50, 75, 100];

export default function FI() {
  const { data, updateFIInputs } = useFinancialDataContext();
  const [draft, setDraft] = useState<FIInputs>(data.fiInputs);
  const fi = useFI({ ...data, fiInputs: draft });

  const setField = (key: keyof FIInputs) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDraft((prev) => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateFIInputs(draft);
  };

  return (
    <div>
      <Header title="FI / Retirement" subtitle="Your Financial Independence number and progress toward it" />
      <div className="px-8 py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KpiCard label="FI Number" value={formatINRCompact(fi.fiNumber)} />
          <KpiCard label="Current Portfolio" value={formatINRCompact(fi.currentPortfolio)} />
          <KpiCard label="Gap to FI" value={formatINRCompact(fi.gap)} accent={fi.gap > 0 ? 'negative' : 'positive'} />
          <KpiCard label="Additional Monthly SIP Needed" value={formatINR(fi.monthlySipToCloseGap)} accent={fi.monthlySipToCloseGap > 0 ? 'warning' : 'positive'} />
        </div>

        <Card>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white font-medium">Progress to FI</h3>
            <span className="text-sm text-slate-400">{formatPercent(fi.progressPercent, 1)}</span>
          </div>
          <div className="h-3 rounded-full bg-navy-700 overflow-hidden relative">
            <div className="h-full bg-cyan-accent rounded-full" style={{ width: `${fi.progressPercent}%` }} />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            {MILESTONES.map((m) => (
              <span key={m} className={fi.progressPercent >= m ? 'text-cyan-accent' : ''}>
                {m}%
              </span>
            ))}
          </div>
          <p className="text-sm text-slate-400 mt-4">
            {fi.projectedFiAge !== null
              ? `At your current trajectory, you're projected to reach FI by age ${fi.projectedFiAge}.`
              : `At your current trajectory, FI isn't projected within the next 60 years — consider increasing your SIP contributions.`}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            Years to retirement: <span className="text-slate-200 font-medium">{fi.yearsToRetirement}</span> · Future annual expense:{' '}
            <span className="text-slate-200 font-medium">{formatINRCompact(fi.futureAnnualExpense)}</span>
          </p>
        </Card>

        <Card>
          <h3 className="text-white font-medium mb-2">Coast FI</h3>
          <p className="text-sm text-slate-400 mb-1">
            Coast FI number (corpus needed today to coast to FI without further contributions):{' '}
            <span className="text-slate-200 font-medium">{formatINRCompact(fi.coastFiNumber)}</span>
          </p>
          {fi.coastFiReached ? (
            <p className="text-sm text-emerald-400">
              You've reached Coast FI — even with zero further contributions, your current portfolio is on track to hit your FI number by age{' '}
              {data.profile.retirementAge}.
            </p>
          ) : (
            <p className="text-sm text-amber-400">
              You're {formatINRCompact(fi.coastFiNumber - fi.currentPortfolio)} short of Coast FI — continued contributions are needed to stay on track.
            </p>
          )}
        </Card>

        <form onSubmit={handleSave}>
          <Card className="max-w-xl">
            <h3 className="text-white font-medium mb-1">Assumptions</h3>
            <p className="text-xs text-slate-500 mb-4">
              Age, retirement age, and monthly retirement expense come from your Profile in Settings. Update them there to change the inputs below.
            </p>
            <Field label="Inflation Rate (% per year)">
              <Input type="number" step="0.1" value={draft.inflationRate || ''} onChange={setField('inflationRate')} />
            </Field>
            <Field label="Safe Withdrawal Rate (% per year)">
              <Input type="number" step="0.1" value={draft.safeWithdrawalRate || ''} onChange={setField('safeWithdrawalRate')} />
            </Field>
            <Field label="Post-Retirement Return (% per year)">
              <Input type="number" step="0.1" value={draft.postRetirementReturn || ''} onChange={setField('postRetirementReturn')} />
            </Field>
            <button type="submit" className="bg-cyan-accent text-navy-950 font-medium rounded-lg px-5 py-2.5 text-sm hover:bg-cyan-300 transition-colors">
              Save Assumptions
            </button>
          </Card>
        </form>
      </div>
    </div>
  );
}

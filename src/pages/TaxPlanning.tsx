import { useState } from 'react';
import { Header } from '../components/layout/Header';
import { Card, KpiCard } from '../components/ui/Card';
import { Field, Input } from '../components/ui/FormField';
import { useFinancialDataContext } from '../context/FinancialDataContext';
import { useTaxPlanning } from '../hooks/useTaxPlanning';
import { TaxHarvestAlert } from '../components/dashboard/TaxHarvestAlert';
import { formatINR, formatINRCompact } from '../utils/formatters';
import type { TaxInputs } from '../types/financial';

function DeductionRow({ label, value, eligible, limit }: { label: string; value: number; eligible: number; limit: number }) {
  const percent = limit > 0 ? Math.min(100, (eligible / limit) * 100) : 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-400">
          {formatINR(eligible)} / {formatINR(limit)}
        </span>
      </div>
      <div className="h-2 rounded-full bg-navy-700 overflow-hidden">
        <div className={`h-full rounded-full ${eligible >= limit ? 'bg-emerald-400' : 'bg-cyan-accent'}`} style={{ width: `${percent}%` }} />
      </div>
      {value > limit && <p className="text-xs text-slate-500 mt-1">Total contributed: {formatINR(value)} (capped at the section limit)</p>}
    </div>
  );
}

function RegimeCard({ title, regime, recommended }: { title: string; regime: { taxableIncome: number; taxBeforeCess: number; cess: number; totalTax: number; rebateApplied: boolean }; recommended: boolean }) {
  return (
    <Card className={recommended ? 'border border-emerald-500/40' : ''}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-medium">{title}</h3>
        {recommended && <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400">Recommended</span>}
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-400">Taxable income</span>
          <span className="text-slate-200">{formatINR(regime.taxableIncome)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Tax before cess</span>
          <span className="text-slate-200">{formatINR(regime.taxBeforeCess)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Health &amp; Education Cess (4%)</span>
          <span className="text-slate-200">{formatINR(regime.cess)}</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-navy-700">
          <span className="text-white font-medium">Total tax payable</span>
          <span className="text-white font-semibold">{formatINR(regime.totalTax)}</span>
        </div>
        {regime.rebateApplied && <p className="text-xs text-emerald-400 mt-1">Section 87A rebate applied — zero tax payable.</p>}
      </div>
    </Card>
  );
}

export default function TaxPlanning() {
  const { data, updateTaxInputs } = useFinancialDataContext();
  const [draft, setDraft] = useState<TaxInputs>(data.taxInputs);
  const tax = useTaxPlanning({ ...data, taxInputs: draft });

  const setField = (key: keyof TaxInputs) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDraft((prev) => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateTaxInputs(draft);
  };

  return (
    <div>
      <Header title="Tax Optimisation" subtitle="Section 80C/80D/NPS utilisation and Old vs New regime comparison (FY2025-26)" />
      <div className="px-8 py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard label="Recommended Regime" value={tax.recommendedRegime} accent="positive" />
          <KpiCard label="Tax Saved by Choosing It" value={formatINRCompact(tax.taxSavingsWithRecommended)} accent="positive" />
          <KpiCard
            label="80C Room Remaining"
            value={formatINR(tax.section80C.remainingRoom)}
            accent={tax.section80C.remainingRoom > 0 ? 'warning' : 'positive'}
          />
        </div>

        <Card>
          <h3 className="text-white font-medium mb-4">Deduction Utilisation (Old Regime)</h3>
          <DeductionRow label="Section 80C (PPF, EPF, ELSS, life insurance premiums, others)" value={tax.section80C.total} eligible={tax.section80C.eligible} limit={tax.section80C.limit} />
          <DeductionRow label="Section 80D (health insurance premiums)" value={tax.section80D.healthInsurancePremiums} eligible={tax.section80D.eligible} limit={tax.section80D.limit} />
          <DeductionRow label="NPS — Section 80CCD(1B)" value={tax.nps.contribution} eligible={tax.nps.eligible} limit={tax.nps.limit} />
          <p className="text-xs text-slate-500 mt-2">
            80C breakdown — PPF: {formatINR(tax.section80C.ppf)} · EPF: {formatINR(tax.section80C.epf)} · ELSS: {formatINR(tax.section80C.elss)} · Life
            insurance premiums: {formatINR(tax.section80C.lifeInsurancePremiums)} · Other manual entries: {formatINR(tax.section80C.otherManualEntries)}
          </p>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RegimeCard title="Old Regime" regime={tax.oldRegime} recommended={tax.recommendedRegime === 'Old'} />
          <RegimeCard title="New Regime" regime={tax.newRegime} recommended={tax.recommendedRegime === 'New'} />
        </div>

        <TaxHarvestAlert />

        <form onSubmit={handleSave}>
          <Card className="max-w-xl">
            <h3 className="text-white font-medium mb-1">Tax Inputs</h3>
            <p className="text-xs text-slate-500 mb-4">
              PPF/EPF, ELSS, and life/health insurance premiums are pulled automatically from your existing instruments. Enter amounts here only for
              what isn't tracked elsewhere.
            </p>
            <Field label="Gross Annual Salary (₹)">
              <Input type="number" value={draft.grossSalary || ''} onChange={setField('grossSalary')} />
            </Field>
            <Field label="HRA Exemption (₹ per year)">
              <Input type="number" value={draft.hra || ''} onChange={setField('hra')} />
            </Field>
            <Field label="NPS Contribution — Section 80CCD(1B) (₹ per year)">
              <Input type="number" value={draft.npsContribution || ''} onChange={setField('npsContribution')} />
            </Field>
            <Field label="Other 80C Investments (₹ per year) — home loan principal, NSC, tax-saver FD, etc.">
              <Input type="number" value={draft.other80CInvestments || ''} onChange={setField('other80CInvestments')} />
            </Field>
            <button type="submit" className="bg-cyan-accent text-navy-950 font-medium rounded-lg px-5 py-2.5 text-sm hover:bg-cyan-300 transition-colors">
              Save Tax Inputs
            </button>
          </Card>
        </form>
      </div>
    </div>
  );
}

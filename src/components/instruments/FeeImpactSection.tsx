import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useFinancialDataContext } from '../../context/FinancialDataContext';
import { useFundFees } from '../../hooks/useFundFees';
import { summarizeMutualFund } from '../../hooks/useNetWorth';
import { Card, KpiCard } from '../ui/Card';
import { Select, Input } from '../ui/FormField';
import { formatINR, formatINRCompact, formatPercent } from '../../utils/formatters';
import { computeFundFeeImpact, effectiveExpenseRatio, DEFAULT_DIRECT_TER, FEE_IMPACT_YEARS } from '../../utils/feeImpact';
import type { PlanType } from '../../types/fees';

export function FeeImpactSection() {
  const { data } = useFinancialDataContext();
  const { data: feeData, setPlanType, setExpenseRatio } = useFundFees();

  if (data.mutualFunds.length === 0) {
    return <p className="text-sm text-slate-400">Add mutual funds/SIPs in the MF/SIP tab to see how expense ratios erode their returns over time.</p>;
  }

  const rows = data.mutualFunds.map((mf) => {
    const override = feeData[mf.id];
    const planType: PlanType = override?.planType || 'Regular';
    const ter = effectiveExpenseRatio(override);
    const summary = summarizeMutualFund(mf);
    const impact = computeFundFeeImpact(summary.invested, summary.currentValue, mf.expectedAnnualReturn, ter);
    return { mf, planType, ter, summary, impact };
  });

  const totalAnnualFeeOutflow = rows.reduce((s, r) => s + r.impact.annualFeeCost, 0);
  const totalFeeDrag = rows.reduce((s, r) => s + r.impact.feeDrag, 0);
  const totalDirectSavings = rows.reduce((s, r) => s + r.impact.directPlanSavings, 0);
  const totalCorpusWithFees = rows.reduce((s, r) => s + r.impact.corpusWithFees, 0);
  const totalCorpusAtDirectTER = rows.reduce((s, r) => s + r.impact.corpusAtDirectTER, 0);

  const chartData = [
    { name: 'At Current Fees', corpus: totalCorpusWithFees },
    { name: `At Direct Plan (${formatPercent(DEFAULT_DIRECT_TER)})`, corpus: totalCorpusAtDirectTER },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-white font-medium mb-4">Portfolio Fee Impact Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <KpiCard label="Total Annual Fee Outflow" value={formatINR(totalAnnualFeeOutflow)} accent="warning" />
          <KpiCard label={`${FEE_IMPACT_YEARS}-Year Fee Drag`} value={formatINRCompact(totalFeeDrag)} accent="negative" />
          <KpiCard label="Potential Savings (Direct Plans)" value={formatINRCompact(totalDirectSavings)} accent="positive" />
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2e3950" />
            <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => formatINRCompact(v)} width={70} />
            <Tooltip
              formatter={(value: unknown) => [formatINRCompact(Number(value)), `Projected corpus in ${FEE_IMPACT_YEARS} years`]}
              contentStyle={{ background: '#1a2236', border: '1px solid #2e3950', borderRadius: 8 }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Bar dataKey="corpus" fill="#22d3ee" radius={4} barSize={48} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-slate-500 mt-3">This is illustrative — actual TER from fund factsheet.</p>
      </Card>

      <Card>
        <h3 className="text-white font-medium mb-4">Per-Fund Expense Ratio</h3>
        <div className="divide-y divide-navy-700">
          {rows.map(({ mf, planType, ter, summary, impact }) => (
            <div key={mf.id} className="py-4 first:pt-0">
              <div className="flex flex-wrap items-end gap-4 mb-2">
                <span className="text-white font-medium">{mf.fundName}</span>
                <label className="flex items-center gap-2 text-sm text-slate-400">
                  Plan
                  <Select className="w-28 py-1" value={planType} onChange={(e) => setPlanType(mf.id, e.target.value as PlanType)}>
                    <option value="Regular">Regular</option>
                    <option value="Direct">Direct</option>
                  </Select>
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-400">
                  TER %
                  <Input
                    type="number"
                    step="0.05"
                    min="0"
                    className="w-20 py-1"
                    placeholder={planType === 'Direct' ? '0.5' : '1.5'}
                    value={feeData[mf.id]?.expenseRatio ?? ''}
                    onChange={(e) => setExpenseRatio(mf.id, e.target.value === '' ? undefined : parseFloat(e.target.value) || 0)}
                  />
                </label>
              </div>
              <p className="text-sm text-slate-300">
                You are paying {formatINR(impact.annualFeeCost)}/year in fees ({formatPercent(ter)} TER on {formatINR(summary.currentValue)} current value).
              </p>
              <p className="text-sm text-slate-300">
                Over {FEE_IMPACT_YEARS} years, fees will cost you {formatINR(impact.feeDrag)} compared to a zero-fee scenario.
              </p>
              {impact.directPlanSavings > 0 && (
                <p className="text-sm text-emerald-400">
                  Switching to a direct plan ({formatPercent(DEFAULT_DIRECT_TER)} TER) would save you {formatINR(impact.directPlanSavings)} over {FEE_IMPACT_YEARS}{' '}
                  years.
                </p>
              )}
            </div>
          ))}
        </div>
      </Card>

      {data.ulips.length > 0 && (
        <Card>
          <h3 className="text-white font-medium mb-4">ULIP Charges vs Direct Equity Fund</h3>
          <div className="space-y-3">
            {data.ulips.map((u) => {
              const totalCharge = u.fundManagementCharges + u.mortalityCharges;
              return (
                <div key={u.id} className="flex items-center justify-between gap-4 p-3 rounded-lg border border-navy-700">
                  <div>
                    <p className="text-sm font-medium text-white">{u.policyName}</p>
                    <p className="text-xs text-slate-400">
                      Fund Management {formatPercent(u.fundManagementCharges)} + Mortality {formatPercent(u.mortalityCharges)} ={' '}
                      {formatPercent(totalCharge)} total annual charges
                    </p>
                  </div>
                  <span className={`text-sm font-medium shrink-0 ${totalCharge > DEFAULT_DIRECT_TER ? 'text-rose-400' : 'text-emerald-400'}`}>
                    vs {formatPercent(DEFAULT_DIRECT_TER)} for a direct equity fund
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Header } from '../components/layout/Header';
import { Card, KpiCard } from '../components/ui/Card';
import { Field, Input } from '../components/ui/FormField';
import { CashFlowBar } from '../components/charts/CashFlowBar';
import { useFinancialDataContext } from '../context/FinancialDataContext';
import { useCashFlow, savingsRateLevel } from '../hooks/useCashFlow';
import { formatINR, formatPercent } from '../utils/formatters';
import type { CashFlowProfile } from '../types/financial';

const savingsAccent: Record<ReturnType<typeof savingsRateLevel>, 'negative' | 'warning' | 'positive'> = {
  Red: 'negative',
  Yellow: 'warning',
  Green: 'positive',
};

export default function CashFlow() {
  const { data, updateCashFlow } = useFinancialDataContext();
  const [draft, setDraft] = useState<CashFlowProfile>(data.cashFlow);
  const live = useCashFlow({ ...data, cashFlow: draft });
  const level = savingsRateLevel(live.savingsRatePercent);

  const setField = (key: keyof CashFlowProfile) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDraft((prev) => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateCashFlow(draft);
  };

  return (
    <div>
      <Header title="Cash Flow" subtitle="Monthly income, expenses, and savings rate" />
      <div className="px-8 py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KpiCard label="Monthly Income" value={formatINR(live.totalIncome)} />
          <KpiCard label="Monthly Expenses" value={formatINR(live.totalExpenses)} />
          <KpiCard label="Monthly Surplus" value={formatINR(live.surplus)} accent={live.surplus >= 0 ? 'positive' : 'negative'} />
          <KpiCard label="Savings Rate" value={formatPercent(live.savingsRatePercent)} accent={savingsAccent[level]} />
        </div>

        <Card>
          <h3 className="text-white font-medium mb-3">Income → Expenses → Savings</h3>
          <CashFlowBar expenseBreakdown={live.expenseBreakdown} surplus={live.surplus} />
          <div className="flex flex-wrap gap-6 mt-3 text-sm text-slate-400">
            <span>
              Investment rate: <span className="text-slate-200 font-medium">{formatPercent(live.investmentRatePercent)}</span>
            </span>
            <span>
              Emergency fund covers{' '}
              <span className="text-slate-200 font-medium">{live.emergencyFundMonthsCovered.toFixed(1)} months</span> of expenses
            </span>
          </div>
        </Card>

        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <h3 className="text-white font-medium mb-4">Income</h3>
            <Field label="Salary in Hand (₹/month)">
              <Input type="number" value={draft.salaryInHand || ''} onChange={setField('salaryInHand')} />
            </Field>
            <Field label="Freelance / Side Income (₹/month)">
              <Input type="number" value={draft.freelanceIncome || ''} onChange={setField('freelanceIncome')} />
            </Field>
            <Field label="Rental Income (₹/month)">
              <Input type="number" value={draft.rentalIncome || ''} onChange={setField('rentalIncome')} />
            </Field>
            <Field label="Other Income (₹/month)">
              <Input type="number" value={draft.otherIncome || ''} onChange={setField('otherIncome')} />
            </Field>
            <Field label="Emergency Fund / Cash Balance (₹)">
              <Input type="number" value={draft.emergencyFundBalance || ''} onChange={setField('emergencyFundBalance')} />
            </Field>
          </Card>

          <Card>
            <h3 className="text-white font-medium mb-4">Expenses</h3>
            <Field label="Rent / EMI (₹/month)">
              <Input type="number" value={draft.rentOrEmi || ''} onChange={setField('rentOrEmi')} />
            </Field>
            <Field label="Groceries (₹/month)">
              <Input type="number" value={draft.groceries || ''} onChange={setField('groceries')} />
            </Field>
            <Field label="Subscriptions (₹/month)">
              <Input type="number" value={draft.subscriptions || ''} onChange={setField('subscriptions')} />
            </Field>
            <Field label="Dining (₹/month)">
              <Input type="number" value={draft.dining || ''} onChange={setField('dining')} />
            </Field>
            <Field label="Travel (₹/month)">
              <Input type="number" value={draft.travel || ''} onChange={setField('travel')} />
            </Field>
            <Field label="Entertainment (₹/month)">
              <Input type="number" value={draft.entertainment || ''} onChange={setField('entertainment')} />
            </Field>
            <Field label="Miscellaneous (₹/month)">
              <Input type="number" value={draft.miscellaneous || ''} onChange={setField('miscellaneous')} />
            </Field>
            <p className="text-xs text-slate-500 mb-4">
              Insurance premiums ({formatINR(live.insurancePremiumsMonthly)}/mo) and SIP investments ({formatINR(live.sipInvestmentsMonthly)}/mo) are
              pulled automatically from your Insurance and Mutual Fund entries.
            </p>
            <button type="submit" className="bg-cyan-accent text-navy-950 font-medium rounded-lg px-5 py-2.5 text-sm hover:bg-cyan-300 transition-colors">
              Save Cash Flow
            </button>
          </Card>
        </form>
      </div>
    </div>
  );
}

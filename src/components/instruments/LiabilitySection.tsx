import { useState } from 'react';
import { Plus, Pencil, Trash2, CreditCard } from 'lucide-react';
import { useFinancialDataContext } from '../../context/FinancialDataContext';
import { summarizeLiability } from '../../hooks/useNetWorth';
import { useDebtPayoff } from '../../hooks/useDebtPayoff';
import { DataTable, type Column } from '../ui/DataTable';
import { Drawer } from '../ui/Drawer';
import { EmptyState } from '../ui/EmptyState';
import { Card } from '../ui/Card';
import { Field, Input } from '../ui/FormField';
import { HealthBadge } from '../ui/Badge';
import { AddLiabilityForm } from '../forms/AddLiabilityForm';
import { formatINR, formatPercent, formatDate } from '../../utils/formatters';
import type { Liability, DebtPayoffMethod } from '../../types/financial';

function DebtPayoffPlanner() {
  const { data, updateDebtPlanner } = useFinancialDataContext();
  const { avalanche, snowball, selected, timeline } = useDebtPayoff(data);
  const otherMethodInterest = data.debtPlanner.method === 'Avalanche' ? snowball.totalInterestPaid : avalanche.totalInterestPaid;
  const interestSavedBySelected = otherMethodInterest - selected.totalInterestPaid;

  const setMethod = (method: DebtPayoffMethod) => updateDebtPlanner({ method });

  return (
    <Card className="mb-6">
      <h3 className="text-white font-medium mb-4">Debt Payoff Planner</h3>
      <div className="flex flex-wrap items-end gap-4 mb-5">
        <div className="flex rounded-lg border border-navy-600 overflow-hidden">
          {(['Avalanche', 'Snowball'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                data.debtPlanner.method === m ? 'bg-cyan-accent text-navy-950' : 'bg-navy-800 text-slate-300 hover:bg-navy-700'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="w-48">
          <Field label="Extra Monthly Payment (₹)">
            <Input
              type="number"
              value={data.debtPlanner.extraMonthlyPayment || ''}
              onChange={(e) => updateDebtPlanner({ extraMonthlyPayment: parseFloat(e.target.value) || 0 })}
            />
          </Field>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="bg-navy-900/50 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Debt-free in</p>
          <p className="text-xl font-semibold text-white">{selected.months !== null ? `${selected.months} months` : 'Not within 50 years'}</p>
        </div>
        <div className="bg-navy-900/50 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Debt-free by</p>
          <p className="text-xl font-semibold text-white">{selected.debtFreeDate ? formatDate(selected.debtFreeDate, 'MMM yyyy') : '—'}</p>
        </div>
        <div className="bg-navy-900/50 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Total interest paid</p>
          <p className="text-xl font-semibold text-white">{formatINR(selected.totalInterestPaid)}</p>
          {interestSavedBySelected > 0.5 && (
            <p className="text-xs text-emerald-400 mt-1">{formatINR(interestSavedBySelected)} less than {data.debtPlanner.method === 'Avalanche' ? 'Snowball' : 'Avalanche'}</p>
          )}
        </div>
      </div>

      {timeline.length > 0 && (
        <div className="space-y-3">
          {timeline
            .slice()
            .sort((a, b) => (a.payoffMonth ?? Infinity) - (b.payoffMonth ?? Infinity))
            .map((t) => {
              const maxMonth = Math.max(...timeline.map((x) => x.payoffMonth ?? 0), 1);
              const widthPercent = t.payoffMonth !== null ? Math.max(4, (t.payoffMonth / maxMonth) * 100) : 100;
              return (
                <div key={t.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{t.name}</span>
                    <span className="text-slate-400">{t.payoffDate ? formatDate(t.payoffDate, 'MMM yyyy') : 'Beyond 50 years'}</span>
                  </div>
                  <div className="h-2 rounded-full bg-navy-700 overflow-hidden">
                    <div className="h-full bg-cyan-accent rounded-full" style={{ width: `${widthPercent}%` }} />
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </Card>
  );
}

export function LiabilitySection() {
  const { data, addEntity, updateEntity, deleteEntity } = useFinancialDataContext();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Liability | null>(null);

  const openAdd = () => {
    setEditing(null);
    setDrawerOpen(true);
  };
  const openEdit = (l: Liability) => {
    setEditing(l);
    setDrawerOpen(true);
  };

  const handleSubmit = (values: Omit<Liability, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editing) updateEntity('liabilities', editing.id, values);
    else addEntity('liabilities', values);
    setDrawerOpen(false);
  };

  const columns: Column<Liability>[] = [
    { header: 'Loan', render: (l) => <span className="font-medium text-white">{l.loanType} — {l.lender}</span> },
    { header: 'Outstanding', render: (l) => formatINR(l.outstandingPrincipal) },
    { header: 'EMI', render: (l) => formatINR(l.emiAmount) },
    { header: 'Rate', render: (l) => formatPercent(l.interestRate) },
    { header: 'Payoff Date', render: (l) => formatDate(summarizeLiability(l).maturityDate) },
    {
      header: 'Health',
      render: (l) => {
        const s = summarizeLiability(l);
        return <HealthBadge level={s.healthScoreLevel} score={s.healthScore} />;
      },
    },
    {
      header: '',
      render: (l) => (
        <div className="flex gap-2">
          <button onClick={() => openEdit(l)} className="p-1.5 rounded-md hover:bg-navy-700 text-slate-400 hover:text-white">
            <Pencil size={15} />
          </button>
          <button onClick={() => deleteEntity('liabilities', l.id)} className="p-1.5 rounded-md hover:bg-rose-500/15 text-slate-400 hover:text-rose-400">
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-slate-400">{data.liabilities.length} liability(ies) tracked</p>
        <button onClick={openAdd} className="flex items-center gap-2 bg-cyan-accent text-navy-950 font-medium rounded-lg px-4 py-2 text-sm hover:bg-cyan-300 transition-colors">
          <Plus size={16} /> Add Liability
        </button>
      </div>
      <DebtPayoffPlanner />
      {data.liabilities.length === 0 ? (
        <EmptyState icon={CreditCard} title="No liabilities yet" description="Add loans to see them netted against your assets in your overall net worth." actionLabel="Add your first liability" onAction={openAdd} />
      ) : (
        <DataTable rows={data.liabilities} columns={columns} keyFor={(l) => l.id} />
      )}
      <Drawer open={drawerOpen} title={editing ? 'Edit Liability' : 'Add Liability'} onClose={() => setDrawerOpen(false)}>
        <AddLiabilityForm initial={editing || undefined} onSubmit={handleSubmit} onCancel={() => setDrawerOpen(false)} />
      </Drawer>
    </div>
  );
}

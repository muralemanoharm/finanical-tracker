import { useState } from 'react';
import { Plus, Pencil, Trash2, CreditCard } from 'lucide-react';
import { useFinancialDataContext } from '../../context/FinancialDataContext';
import { summarizeLiability } from '../../hooks/useNetWorth';
import { DataTable, type Column } from '../ui/DataTable';
import { Drawer } from '../ui/Drawer';
import { EmptyState } from '../ui/EmptyState';
import { HealthBadge } from '../ui/Badge';
import { AddLiabilityForm } from '../forms/AddLiabilityForm';
import { formatINR, formatPercent, formatDate } from '../../utils/formatters';
import type { Liability } from '../../types/financial';

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

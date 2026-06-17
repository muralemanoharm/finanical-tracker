import { useState } from 'react';
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import { useFinancialDataContext } from '../../context/FinancialDataContext';
import { summarizeEPFPPF } from '../../hooks/useNetWorth';
import { DataTable, type Column } from '../ui/DataTable';
import { Drawer } from '../ui/Drawer';
import { EmptyState } from '../ui/EmptyState';
import { HealthBadge } from '../ui/Badge';
import { AddEPFPPFForm } from '../forms/AddEPFPPFForm';
import { formatINR, formatPercent, formatDate } from '../../utils/formatters';
import type { EPFPPF } from '../../types/financial';

export function EPFPPFSection() {
  const { data, addEntity, updateEntity, deleteEntity } = useFinancialDataContext();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<EPFPPF | null>(null);

  const openAdd = () => {
    setEditing(null);
    setDrawerOpen(true);
  };
  const openEdit = (ep: EPFPPF) => {
    setEditing(ep);
    setDrawerOpen(true);
  };

  const handleSubmit = (values: Omit<EPFPPF, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editing) updateEntity('epfPpf', editing.id, values);
    else addEntity('epfPpf', values);
    setDrawerOpen(false);
  };

  const columns: Column<EPFPPF>[] = [
    { header: 'Account', render: (ep) => <span className="font-medium text-white">{ep.accountType}</span> },
    { header: 'Current Balance', render: (ep) => formatINR(ep.currentBalance) },
    { header: 'Monthly Contribution', render: (ep) => formatINR(ep.monthlyContribution) },
    { header: 'Expected Return', render: (ep) => formatPercent(ep.expectedReturn) },
    { header: 'Maturity', render: (ep) => formatDate(summarizeEPFPPF(ep).maturityDate) },
    {
      header: 'Health',
      render: (ep) => {
        const s = summarizeEPFPPF(ep);
        return <HealthBadge level={s.healthScoreLevel} score={s.healthScore} />;
      },
    },
    {
      header: '',
      render: (ep) => (
        <div className="flex gap-2">
          <button onClick={() => openEdit(ep)} className="p-1.5 rounded-md hover:bg-navy-700 text-slate-400 hover:text-white">
            <Pencil size={15} />
          </button>
          <button onClick={() => deleteEntity('epfPpf', ep.id)} className="p-1.5 rounded-md hover:bg-rose-500/15 text-slate-400 hover:text-rose-400">
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-slate-400">{data.epfPpf.length} account(s) tracked</p>
        <button onClick={openAdd} className="flex items-center gap-2 bg-cyan-accent text-navy-950 font-medium rounded-lg px-4 py-2 text-sm hover:bg-cyan-300 transition-colors">
          <Plus size={16} /> Add EPF / PPF
        </button>
      </div>
      {data.epfPpf.length === 0 ? (
        <EmptyState icon={Building2} title="No EPF/PPF accounts yet" description="Track your provident fund balances and projected maturity value." actionLabel="Add your first account" onAction={openAdd} />
      ) : (
        <DataTable rows={data.epfPpf} columns={columns} keyFor={(ep) => ep.id} />
      )}
      <Drawer open={drawerOpen} title={editing ? 'Edit EPF / PPF' : 'Add EPF / PPF'} onClose={() => setDrawerOpen(false)}>
        <AddEPFPPFForm initial={editing || undefined} onSubmit={handleSubmit} onCancel={() => setDrawerOpen(false)} />
      </Drawer>
    </div>
  );
}

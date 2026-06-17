import { useState } from 'react';
import { Plus, Pencil, Trash2, Landmark } from 'lucide-react';
import { useFinancialDataContext } from '../../context/FinancialDataContext';
import { summarizeFD } from '../../hooks/useNetWorth';
import { DataTable, type Column } from '../ui/DataTable';
import { Drawer } from '../ui/Drawer';
import { EmptyState } from '../ui/EmptyState';
import { HealthBadge } from '../ui/Badge';
import { AddFDForm } from '../forms/AddFDForm';
import { formatINR, formatPercent, formatDate } from '../../utils/formatters';
import type { FD } from '../../types/financial';

export function FDSection() {
  const { data, addEntity, updateEntity, deleteEntity } = useFinancialDataContext();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<FD | null>(null);

  const openAdd = () => {
    setEditing(null);
    setDrawerOpen(true);
  };
  const openEdit = (fd: FD) => {
    setEditing(fd);
    setDrawerOpen(true);
  };

  const handleSubmit = (values: Omit<FD, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editing) updateEntity('fixedDeposits', editing.id, values);
    else addEntity('fixedDeposits', values);
    setDrawerOpen(false);
  };

  const columns: Column<FD>[] = [
    { header: 'Bank', render: (fd) => <span className="font-medium text-white">{fd.bankName}</span> },
    { header: 'Rate', render: (fd) => formatPercent(fd.interestRate) },
    { header: 'Payout', render: (fd) => fd.payoutType },
    { header: 'Invested', render: (fd) => formatINR(summarizeFD(fd).invested) },
    { header: 'Current Value', render: (fd) => formatINR(summarizeFD(fd).currentValue) },
    {
      header: 'Returns %',
      render: (fd) => {
        const r = summarizeFD(fd).returnsPercent;
        return <span className={r >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{formatPercent(r)}</span>;
      },
    },
    { header: 'Maturity Date', render: (fd) => formatDate(summarizeFD(fd).maturityDate) },
    {
      header: 'Health',
      render: (fd) => {
        const s = summarizeFD(fd);
        return <HealthBadge level={s.healthScoreLevel} score={s.healthScore} />;
      },
    },
    {
      header: '',
      render: (fd) => (
        <div className="flex gap-2">
          <button onClick={() => openEdit(fd)} className="p-1.5 rounded-md hover:bg-navy-700 text-slate-400 hover:text-white">
            <Pencil size={15} />
          </button>
          <button onClick={() => deleteEntity('fixedDeposits', fd.id)} className="p-1.5 rounded-md hover:bg-rose-500/15 text-slate-400 hover:text-rose-400">
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-slate-400">{data.fixedDeposits.length} FD(s) tracked</p>
        <button onClick={openAdd} className="flex items-center gap-2 bg-cyan-accent text-navy-950 font-medium rounded-lg px-4 py-2 text-sm hover:bg-cyan-300 transition-colors">
          <Plus size={16} /> Add Fixed Deposit
        </button>
      </div>
      {data.fixedDeposits.length === 0 ? (
        <EmptyState icon={Landmark} title="No fixed deposits yet" description="Add your FDs to track maturity value and compare rates against inflation." actionLabel="Add your first FD" onAction={openAdd} />
      ) : (
        <DataTable rows={data.fixedDeposits} columns={columns} keyFor={(fd) => fd.id} />
      )}
      <Drawer open={drawerOpen} title={editing ? 'Edit Fixed Deposit' : 'Add Fixed Deposit'} onClose={() => setDrawerOpen(false)}>
        <AddFDForm initial={editing || undefined} onSubmit={handleSubmit} onCancel={() => setDrawerOpen(false)} />
      </Drawer>
    </div>
  );
}

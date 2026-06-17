import { useState } from 'react';
import { Plus, Pencil, Trash2, PiggyBank } from 'lucide-react';
import { useFinancialDataContext } from '../../context/FinancialDataContext';
import { summarizeMutualFund } from '../../hooks/useNetWorth';
import { DataTable, type Column } from '../ui/DataTable';
import { Drawer } from '../ui/Drawer';
import { EmptyState } from '../ui/EmptyState';
import { HealthBadge } from '../ui/Badge';
import { AddMFForm } from '../forms/AddMFForm';
import { formatINR, formatPercent, formatDate } from '../../utils/formatters';
import type { MutualFund } from '../../types/financial';

export function MFSection() {
  const { data, addEntity, updateEntity, deleteEntity } = useFinancialDataContext();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<MutualFund | null>(null);

  const openAdd = () => {
    setEditing(null);
    setDrawerOpen(true);
  };
  const openEdit = (mf: MutualFund) => {
    setEditing(mf);
    setDrawerOpen(true);
  };

  const handleSubmit = (values: Omit<MutualFund, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editing) updateEntity('mutualFunds', editing.id, values);
    else addEntity('mutualFunds', values);
    setDrawerOpen(false);
  };

  const columns: Column<MutualFund>[] = [
    { header: 'Fund Name', render: (mf) => <span className="font-medium text-white">{mf.fundName}</span> },
    { header: 'Type', render: (mf) => mf.fundType },
    { header: 'Mode', render: (mf) => mf.investmentMode },
    { header: 'Invested', render: (mf) => formatINR(summarizeMutualFund(mf).invested) },
    { header: 'Current Value', render: (mf) => formatINR(summarizeMutualFund(mf).currentValue) },
    {
      header: 'Returns %',
      render: (mf) => {
        const r = summarizeMutualFund(mf).returnsPercent;
        return <span className={r >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{formatPercent(r)}</span>;
      },
    },
    { header: 'Maturity / Lock-in', render: (mf) => formatDate(summarizeMutualFund(mf).maturityDate) },
    {
      header: 'Health',
      render: (mf) => {
        const s = summarizeMutualFund(mf);
        return <HealthBadge level={s.healthScoreLevel} score={s.healthScore} />;
      },
    },
    {
      header: '',
      render: (mf) => (
        <div className="flex gap-2">
          <button onClick={() => openEdit(mf)} className="p-1.5 rounded-md hover:bg-navy-700 text-slate-400 hover:text-white">
            <Pencil size={15} />
          </button>
          <button onClick={() => deleteEntity('mutualFunds', mf.id)} className="p-1.5 rounded-md hover:bg-rose-500/15 text-slate-400 hover:text-rose-400">
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-slate-400">{data.mutualFunds.length} fund(s) tracked</p>
        <button onClick={openAdd} className="flex items-center gap-2 bg-cyan-accent text-navy-950 font-medium rounded-lg px-4 py-2 text-sm hover:bg-cyan-300 transition-colors">
          <Plus size={16} /> Add Mutual Fund / SIP
        </button>
      </div>
      {data.mutualFunds.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="No mutual funds yet"
          description="Track your SIPs and lumpsum mutual fund investments to see them contribute to your net worth."
          actionLabel="Add your first fund"
          onAction={openAdd}
        />
      ) : (
        <DataTable rows={data.mutualFunds} columns={columns} keyFor={(mf) => mf.id} />
      )}
      <Drawer open={drawerOpen} title={editing ? 'Edit Mutual Fund' : 'Add Mutual Fund / SIP'} onClose={() => setDrawerOpen(false)}>
        <AddMFForm initial={editing || undefined} onSubmit={handleSubmit} onCancel={() => setDrawerOpen(false)} />
      </Drawer>
    </div>
  );
}

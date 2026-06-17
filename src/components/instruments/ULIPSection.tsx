import { useState } from 'react';
import { Plus, Pencil, Trash2, LineChart } from 'lucide-react';
import { useFinancialDataContext } from '../../context/FinancialDataContext';
import { summarizeULIP } from '../../hooks/useNetWorth';
import { DataTable, type Column } from '../ui/DataTable';
import { Drawer } from '../ui/Drawer';
import { EmptyState } from '../ui/EmptyState';
import { HealthBadge } from '../ui/Badge';
import { AddULIPForm } from '../forms/AddULIPForm';
import { formatINR, formatPercent, formatDate } from '../../utils/formatters';
import type { ULIP } from '../../types/financial';

export function ULIPSection() {
  const { data, addEntity, updateEntity, deleteEntity } = useFinancialDataContext();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ULIP | null>(null);

  const openAdd = () => {
    setEditing(null);
    setDrawerOpen(true);
  };
  const openEdit = (u: ULIP) => {
    setEditing(u);
    setDrawerOpen(true);
  };

  const handleSubmit = (values: Omit<ULIP, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editing) updateEntity('ulips', editing.id, values);
    else addEntity('ulips', values);
    setDrawerOpen(false);
  };

  const columns: Column<ULIP>[] = [
    { header: 'Policy', render: (u) => <span className="font-medium text-white">{u.policyName}</span> },
    { header: 'Insurer', render: (u) => u.insurer },
    { header: 'Charges', render: (u) => formatPercent(u.mortalityCharges + u.fundManagementCharges) },
    { header: 'Invested', render: (u) => formatINR(summarizeULIP(u).invested) },
    { header: 'Current Value', render: (u) => formatINR(summarizeULIP(u).currentValue) },
    {
      header: 'Returns %',
      render: (u) => {
        const r = summarizeULIP(u).returnsPercent;
        return <span className={r >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{formatPercent(r)}</span>;
      },
    },
    { header: 'Maturity Date', render: (u) => formatDate(summarizeULIP(u).maturityDate) },
    {
      header: 'Health',
      render: (u) => {
        const s = summarizeULIP(u);
        return <HealthBadge level={s.healthScoreLevel} score={s.healthScore} />;
      },
    },
    {
      header: '',
      render: (u) => (
        <div className="flex gap-2">
          <button onClick={() => openEdit(u)} className="p-1.5 rounded-md hover:bg-navy-700 text-slate-400 hover:text-white">
            <Pencil size={15} />
          </button>
          <button onClick={() => deleteEntity('ulips', u.id)} className="p-1.5 rounded-md hover:bg-rose-500/15 text-slate-400 hover:text-rose-400">
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-slate-400">{data.ulips.length} ULIP(s) tracked</p>
        <button onClick={openAdd} className="flex items-center gap-2 bg-cyan-accent text-navy-950 font-medium rounded-lg px-4 py-2 text-sm hover:bg-cyan-300 transition-colors">
          <Plus size={16} /> Add ULIP
        </button>
      </div>
      {data.ulips.length === 0 ? (
        <EmptyState icon={LineChart} title="No ULIPs yet" description="Track unit-linked plans and see when high charges are eating into your returns." actionLabel="Add your first ULIP" onAction={openAdd} />
      ) : (
        <DataTable rows={data.ulips} columns={columns} keyFor={(u) => u.id} />
      )}
      <Drawer open={drawerOpen} title={editing ? 'Edit ULIP' : 'Add ULIP'} onClose={() => setDrawerOpen(false)}>
        <AddULIPForm initial={editing || undefined} onSubmit={handleSubmit} onCancel={() => setDrawerOpen(false)} />
      </Drawer>
    </div>
  );
}

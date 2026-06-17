import { useState } from 'react';
import { Plus, Pencil, Trash2, Coins } from 'lucide-react';
import { useFinancialDataContext } from '../../context/FinancialDataContext';
import { summarizeGold } from '../../hooks/useNetWorth';
import { DataTable, type Column } from '../ui/DataTable';
import { Drawer } from '../ui/Drawer';
import { EmptyState } from '../ui/EmptyState';
import { HealthBadge } from '../ui/Badge';
import { AddGoldForm } from '../forms/AddGoldForm';
import { formatINR, formatPercent } from '../../utils/formatters';
import type { Gold } from '../../types/financial';

export function GoldSection() {
  const { data, addEntity, updateEntity, deleteEntity } = useFinancialDataContext();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Gold | null>(null);

  const openAdd = () => {
    setEditing(null);
    setDrawerOpen(true);
  };
  const openEdit = (gold: Gold) => {
    setEditing(gold);
    setDrawerOpen(true);
  };

  const handleSubmit = (values: Omit<Gold, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editing) updateEntity('gold', editing.id, values);
    else addEntity('gold', values);
    setDrawerOpen(false);
  };

  const columns: Column<Gold>[] = [
    { header: 'Asset', render: (g) => <span className="font-medium text-white">{g.assetName}</span> },
    { header: 'Quantity (g)', render: (g) => g.quantityGrams },
    { header: 'Invested', render: (g) => formatINR(summarizeGold(g).invested) },
    { header: 'Current Value', render: (g) => formatINR(summarizeGold(g).currentValue) },
    {
      header: 'Returns %',
      render: (g) => {
        const r = summarizeGold(g).returnsPercent;
        return <span className={r >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{formatPercent(r)}</span>;
      },
    },
    {
      header: 'Health',
      render: (g) => {
        const s = summarizeGold(g);
        return <HealthBadge level={s.healthScoreLevel} score={s.healthScore} />;
      },
    },
    {
      header: '',
      render: (g) => (
        <div className="flex gap-2">
          <button onClick={() => openEdit(g)} className="p-1.5 rounded-md hover:bg-navy-700 text-slate-400 hover:text-white">
            <Pencil size={15} />
          </button>
          <button onClick={() => deleteEntity('gold', g.id)} className="p-1.5 rounded-md hover:bg-rose-500/15 text-slate-400 hover:text-rose-400">
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-slate-400">{data.gold.length} asset(s) tracked</p>
        <button onClick={openAdd} className="flex items-center gap-2 bg-cyan-accent text-navy-950 font-medium rounded-lg px-4 py-2 text-sm hover:bg-cyan-300 transition-colors">
          <Plus size={16} /> Add Gold / Other Asset
        </button>
      </div>
      {data.gold.length === 0 ? (
        <EmptyState icon={Coins} title="No gold holdings yet" description="Track gold and other physical assets as part of your diversified portfolio." actionLabel="Add your first asset" onAction={openAdd} />
      ) : (
        <DataTable rows={data.gold} columns={columns} keyFor={(g) => g.id} />
      )}
      <Drawer open={drawerOpen} title={editing ? 'Edit Gold / Asset' : 'Add Gold / Other Asset'} onClose={() => setDrawerOpen(false)}>
        <AddGoldForm initial={editing || undefined} onSubmit={handleSubmit} onCancel={() => setDrawerOpen(false)} />
      </Drawer>
    </div>
  );
}

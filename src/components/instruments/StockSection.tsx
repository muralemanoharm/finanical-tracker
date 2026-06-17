import { useState } from 'react';
import { Plus, Pencil, Trash2, BarChart3 } from 'lucide-react';
import { useFinancialDataContext } from '../../context/FinancialDataContext';
import { summarizeStock } from '../../hooks/useNetWorth';
import { DataTable, type Column } from '../ui/DataTable';
import { Drawer } from '../ui/Drawer';
import { EmptyState } from '../ui/EmptyState';
import { HealthBadge } from '../ui/Badge';
import { AddStockForm } from '../forms/AddStockForm';
import { formatINR, formatPercent } from '../../utils/formatters';
import type { Stock } from '../../types/financial';

export function StockSection() {
  const { data, addEntity, updateEntity, deleteEntity } = useFinancialDataContext();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Stock | null>(null);

  const openAdd = () => {
    setEditing(null);
    setDrawerOpen(true);
  };
  const openEdit = (stock: Stock) => {
    setEditing(stock);
    setDrawerOpen(true);
  };

  const handleSubmit = (values: Omit<Stock, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editing) updateEntity('stocks', editing.id, values);
    else addEntity('stocks', values);
    setDrawerOpen(false);
  };

  const columns: Column<Stock>[] = [
    { header: 'Stock', render: (s) => <span className="font-medium text-white">{s.stockName}</span> },
    { header: 'Sector', render: (s) => s.sector || '—' },
    { header: 'Qty', render: (s) => s.quantity },
    { header: 'Invested', render: (s) => formatINR(summarizeStock(s).invested) },
    { header: 'Current Value', render: (s) => formatINR(summarizeStock(s).currentValue) },
    {
      header: 'Returns %',
      render: (s) => {
        const r = summarizeStock(s).returnsPercent;
        return <span className={r >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{formatPercent(r)}</span>;
      },
    },
    {
      header: 'Health',
      render: (s) => {
        const summary = summarizeStock(s);
        return <HealthBadge level={summary.healthScoreLevel} score={summary.healthScore} />;
      },
    },
    {
      header: '',
      render: (s) => (
        <div className="flex gap-2">
          <button onClick={() => openEdit(s)} className="p-1.5 rounded-md hover:bg-navy-700 text-slate-400 hover:text-white">
            <Pencil size={15} />
          </button>
          <button onClick={() => deleteEntity('stocks', s.id)} className="p-1.5 rounded-md hover:bg-rose-500/15 text-slate-400 hover:text-rose-400">
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-slate-400">{data.stocks.length} holding(s) tracked</p>
        <button onClick={openAdd} className="flex items-center gap-2 bg-cyan-accent text-navy-950 font-medium rounded-lg px-4 py-2 text-sm hover:bg-cyan-300 transition-colors">
          <Plus size={16} /> Add Stock
        </button>
      </div>
      {data.stocks.length === 0 ? (
        <EmptyState icon={BarChart3} title="No stock holdings yet" description="Add your direct equity holdings to track gains and portfolio concentration." actionLabel="Add your first stock" onAction={openAdd} />
      ) : (
        <DataTable rows={data.stocks} columns={columns} keyFor={(s) => s.id} />
      )}
      <Drawer open={drawerOpen} title={editing ? 'Edit Stock' : 'Add Stock'} onClose={() => setDrawerOpen(false)}>
        <AddStockForm initial={editing || undefined} onSubmit={handleSubmit} onCancel={() => setDrawerOpen(false)} />
      </Drawer>
    </div>
  );
}

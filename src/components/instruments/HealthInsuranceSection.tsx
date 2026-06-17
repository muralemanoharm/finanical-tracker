import { useState } from 'react';
import { Plus, Pencil, Trash2, HeartPulse } from 'lucide-react';
import { useFinancialDataContext } from '../../context/FinancialDataContext';
import { summarizeHealthInsurance } from '../../hooks/useNetWorth';
import { DataTable, type Column } from '../ui/DataTable';
import { Drawer } from '../ui/Drawer';
import { EmptyState } from '../ui/EmptyState';
import { HealthBadge } from '../ui/Badge';
import { AddHealthInsuranceForm } from '../forms/AddHealthInsuranceForm';
import { formatINR, formatDate } from '../../utils/formatters';
import type { HealthInsurance } from '../../types/financial';

export function HealthInsuranceSection() {
  const { data, addEntity, updateEntity, deleteEntity } = useFinancialDataContext();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<HealthInsurance | null>(null);

  const openAdd = () => {
    setEditing(null);
    setDrawerOpen(true);
  };
  const openEdit = (hi: HealthInsurance) => {
    setEditing(hi);
    setDrawerOpen(true);
  };

  const handleSubmit = (values: Omit<HealthInsurance, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editing) updateEntity('healthInsurance', editing.id, values);
    else addEntity('healthInsurance', values);
    setDrawerOpen(false);
  };

  const columns: Column<HealthInsurance>[] = [
    { header: 'Plan', render: (hi) => <span className="font-medium text-white">{hi.planName}</span> },
    { header: 'Insurer', render: (hi) => hi.insurerName },
    { header: 'Coverage', render: (hi) => hi.coverageType },
    { header: 'Sum Insured', render: (hi) => formatINR(hi.sumInsured) },
    { header: 'Annual Premium', render: (hi) => formatINR(hi.annualPremium) },
    { header: 'Renewal Date', render: (hi) => formatDate(hi.renewalDate) },
    {
      header: 'Health',
      render: (hi) => {
        const s = summarizeHealthInsurance(hi);
        return <HealthBadge level={s.healthScoreLevel} score={s.healthScore} />;
      },
    },
    {
      header: '',
      render: (hi) => (
        <div className="flex gap-2">
          <button onClick={() => openEdit(hi)} className="p-1.5 rounded-md hover:bg-navy-700 text-slate-400 hover:text-white">
            <Pencil size={15} />
          </button>
          <button onClick={() => deleteEntity('healthInsurance', hi.id)} className="p-1.5 rounded-md hover:bg-rose-500/15 text-slate-400 hover:text-rose-400">
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-slate-400">{data.healthInsurance.length} policy(ies) tracked</p>
        <button onClick={openAdd} className="flex items-center gap-2 bg-cyan-accent text-navy-950 font-medium rounded-lg px-4 py-2 text-sm hover:bg-cyan-300 transition-colors">
          <Plus size={16} /> Add Health Insurance
        </button>
      </div>
      {data.healthInsurance.length === 0 ? (
        <EmptyState icon={HeartPulse} title="No health insurance yet" description="Add your health policies to check coverage adequacy against medical inflation." actionLabel="Add your first policy" onAction={openAdd} />
      ) : (
        <DataTable rows={data.healthInsurance} columns={columns} keyFor={(hi) => hi.id} />
      )}
      <Drawer open={drawerOpen} title={editing ? 'Edit Health Insurance' : 'Add Health Insurance'} onClose={() => setDrawerOpen(false)}>
        <AddHealthInsuranceForm initial={editing || undefined} onSubmit={handleSubmit} onCancel={() => setDrawerOpen(false)} />
      </Drawer>
    </div>
  );
}

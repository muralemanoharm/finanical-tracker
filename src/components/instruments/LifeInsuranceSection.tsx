import { useState } from 'react';
import { Plus, Pencil, Trash2, ShieldCheck } from 'lucide-react';
import { useFinancialDataContext } from '../../context/FinancialDataContext';
import { summarizeLifeInsurance } from '../../hooks/useNetWorth';
import { DataTable, type Column } from '../ui/DataTable';
import { Drawer } from '../ui/Drawer';
import { EmptyState } from '../ui/EmptyState';
import { HealthBadge } from '../ui/Badge';
import { AddLifeInsuranceForm } from '../forms/AddLifeInsuranceForm';
import { formatINR, formatDate } from '../../utils/formatters';
import type { LifeInsurance } from '../../types/financial';

export function LifeInsuranceSection() {
  const { data, addEntity, updateEntity, deleteEntity } = useFinancialDataContext();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<LifeInsurance | null>(null);
  const annualIncome = data.profile.monthlyIncome * 12;

  const openAdd = () => {
    setEditing(null);
    setDrawerOpen(true);
  };
  const openEdit = (li: LifeInsurance) => {
    setEditing(li);
    setDrawerOpen(true);
  };

  const handleSubmit = (values: Omit<LifeInsurance, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editing) updateEntity('lifeInsurance', editing.id, values);
    else addEntity('lifeInsurance', values);
    setDrawerOpen(false);
  };

  const columns: Column<LifeInsurance>[] = [
    { header: 'Policy', render: (li) => <span className="font-medium text-white">{li.policyName}</span> },
    { header: 'Type', render: (li) => li.policyType },
    { header: 'Sum Assured', render: (li) => formatINR(li.sumAssured) },
    { header: 'Annual Premium', render: (li) => formatINR(li.annualPremium) },
    { header: 'Maturity Date', render: (li) => formatDate(summarizeLifeInsurance(li, annualIncome).maturityDate) },
    {
      header: 'Health',
      render: (li) => {
        const s = summarizeLifeInsurance(li, annualIncome);
        return <HealthBadge level={s.healthScoreLevel} score={s.healthScore} />;
      },
    },
    {
      header: '',
      render: (li) => (
        <div className="flex gap-2">
          <button onClick={() => openEdit(li)} className="p-1.5 rounded-md hover:bg-navy-700 text-slate-400 hover:text-white">
            <Pencil size={15} />
          </button>
          <button onClick={() => deleteEntity('lifeInsurance', li.id)} className="p-1.5 rounded-md hover:bg-rose-500/15 text-slate-400 hover:text-rose-400">
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-slate-400">{data.lifeInsurance.length} policy(ies) tracked</p>
        <button onClick={openAdd} className="flex items-center gap-2 bg-cyan-accent text-navy-950 font-medium rounded-lg px-4 py-2 text-sm hover:bg-cyan-300 transition-colors">
          <Plus size={16} /> Add Life Insurance Policy
        </button>
      </div>
      {data.lifeInsurance.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No life insurance yet" description="Add your term, endowment, or money-back policies to check coverage adequacy." actionLabel="Add your first policy" onAction={openAdd} />
      ) : (
        <DataTable rows={data.lifeInsurance} columns={columns} keyFor={(li) => li.id} />
      )}
      <Drawer open={drawerOpen} title={editing ? 'Edit Life Insurance' : 'Add Life Insurance Policy'} onClose={() => setDrawerOpen(false)}>
        <AddLifeInsuranceForm initial={editing || undefined} onSubmit={handleSubmit} onCancel={() => setDrawerOpen(false)} />
      </Drawer>
    </div>
  );
}

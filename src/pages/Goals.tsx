import { useState, useMemo } from 'react';
import { Header } from '../components/layout/Header';
import { Drawer } from '../components/ui/Drawer';
import { EmptyState } from '../components/ui/EmptyState';
import { GoalForm, type InstrumentOption } from '../components/goals/GoalForm';
import { GoalCard } from '../components/goals/GoalCard';
import { useFinancialDataContext } from '../context/FinancialDataContext';
import { summarizeMutualFund, summarizeFD, summarizeULIP, summarizeEPFPPF, summarizeStock, summarizeGold } from '../hooks/useNetWorth';
import type { Goal } from '../types/financial';
import { Plus, Target } from 'lucide-react';

export default function Goals() {
  const { data, addGoal, updateGoal, deleteGoal } = useFinancialDataContext();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);

  const instrumentValueMap = useMemo(() => {
    const map = new Map<string, { value: number; monthlySip: number; label: string }>();
    data.mutualFunds.forEach((mf) => {
      const s = summarizeMutualFund(mf);
      map.set(mf.id, { value: s.currentValue, monthlySip: mf.investmentMode === 'SIP' ? mf.monthlySipAmount || 0 : 0, label: `${mf.fundName} (MF)` });
    });
    data.fixedDeposits.forEach((fd) => {
      const s = summarizeFD(fd);
      map.set(fd.id, { value: s.currentValue, monthlySip: 0, label: `${fd.bankName} (FD)` });
    });
    data.ulips.forEach((u) => {
      const s = summarizeULIP(u);
      map.set(u.id, { value: s.currentValue, monthlySip: 0, label: `${u.policyName} (ULIP)` });
    });
    data.epfPpf.forEach((ep) => {
      const s = summarizeEPFPPF(ep);
      map.set(ep.id, { value: s.currentValue, monthlySip: ep.monthlyContribution, label: `${ep.accountType} (EPF/PPF)` });
    });
    data.stocks.forEach((stock) => {
      const s = summarizeStock(stock);
      map.set(stock.id, { value: s.currentValue, monthlySip: 0, label: `${stock.stockName} (Stock)` });
    });
    data.gold.forEach((gold) => {
      const s = summarizeGold(gold);
      map.set(gold.id, { value: s.currentValue, monthlySip: 0, label: `${gold.assetName} (Gold)` });
    });
    return map;
  }, [data]);

  const options: InstrumentOption[] = useMemo(
    () => Array.from(instrumentValueMap.entries()).map(([id, v]) => ({ id, label: v.label })),
    [instrumentValueMap],
  );

  const openAdd = () => {
    setEditing(null);
    setDrawerOpen(true);
  };
  const openEdit = (goal: Goal) => {
    setEditing(goal);
    setDrawerOpen(true);
  };

  const handleSubmit = (values: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'reviewed'>) => {
    if (editing) updateGoal(editing.id, values);
    else addGoal(values);
    setDrawerOpen(false);
  };

  const getLinkedTotals = (goal: Goal) => {
    let value = 0;
    let monthlySip = 0;
    goal.linkedInstrumentIds.forEach((id) => {
      const entry = instrumentValueMap.get(id);
      if (entry) {
        value += entry.value;
        monthlySip += entry.monthlySip;
      }
    });
    return { value, monthlySip };
  };

  return (
    <div>
      <Header title="Goal Tracker" subtitle="Link instruments to your financial goals and track progress" />
      <div className="px-8 py-6">
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-slate-400">{data.goals.length} goal(s)</p>
          <button onClick={openAdd} className="flex items-center gap-2 bg-cyan-accent text-navy-950 font-medium rounded-lg px-4 py-2 text-sm hover:bg-cyan-300 transition-colors">
            <Plus size={16} /> Add Goal
          </button>
        </div>
        {data.goals.length === 0 ? (
          <EmptyState icon={Target} title="No goals yet" description="Set a financial goal and link instruments to track your progress toward it." actionLabel="Add your first goal" onAction={openAdd} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.goals.map((goal) => {
              const { value, monthlySip } = getLinkedTotals(goal);
              return (
                <GoalCard key={goal.id} goal={goal} linkedCurrentValue={value} linkedMonthlySip={monthlySip} onEdit={() => openEdit(goal)} onDelete={() => deleteGoal(goal.id)} />
              );
            })}
          </div>
        )}
        <Drawer open={drawerOpen} title={editing ? 'Edit Goal' : 'Add Goal'} onClose={() => setDrawerOpen(false)}>
          <GoalForm initial={editing || undefined} options={options} onSubmit={handleSubmit} onCancel={() => setDrawerOpen(false)} />
        </Drawer>
      </div>
    </div>
  );
}

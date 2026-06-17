import type { Goal } from '../../types/financial';
import { formatINR, formatDate, formatPercent } from '../../utils/formatters';
import { monthsBetween, todayISO, requiredMonthlySavings, RETURN_BENCHMARK } from '../../utils/calculations';
import { Pencil, Trash2 } from 'lucide-react';

interface GoalCardProps {
  goal: Goal;
  linkedCurrentValue: number;
  linkedMonthlySip: number;
  onEdit: () => void;
  onDelete: () => void;
}

export function GoalCard({ goal, linkedCurrentValue, linkedMonthlySip, onEdit, onDelete }: GoalCardProps) {
  const progressPercent = goal.targetAmount > 0 ? Math.min(100, (linkedCurrentValue / goal.targetAmount) * 100) : 0;
  const monthsRemaining = Math.max(0, monthsBetween(todayISO(), goal.targetDate));
  const remainingAmount = Math.max(0, goal.targetAmount - linkedCurrentValue);
  const monthlySavingsNeeded = requiredMonthlySavings(remainingAmount, RETURN_BENCHMARK, monthsRemaining);
  const sipCoversGoal = linkedMonthlySip >= monthlySavingsNeeded;

  return (
    <div className="rounded-xl border border-navy-700 bg-navy-800 p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-white font-medium">{goal.goalName}</h3>
          <p className="text-sm text-slate-400">Target: {formatINR(goal.targetAmount)} by {formatDate(goal.targetDate)}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onEdit} className="p-1.5 rounded-md hover:bg-navy-700 text-slate-400 hover:text-white">
            <Pencil size={15} />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-md hover:bg-rose-500/15 text-slate-400 hover:text-rose-400">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>{formatINR(linkedCurrentValue)} saved</span>
          <span>{formatPercent(progressPercent, 0)}</span>
        </div>
        <div className="h-2 rounded-full bg-navy-700 overflow-hidden">
          <div className="h-full bg-cyan-accent rounded-full" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-slate-400">Monthly savings needed</p>
          <p className="text-white font-medium">{formatINR(monthlySavingsNeeded)}</p>
        </div>
        <div>
          <p className="text-slate-400">Linked SIP coverage</p>
          <p className={`font-medium ${sipCoversGoal ? 'text-emerald-400' : 'text-amber-400'}`}>
            {sipCoversGoal ? 'Covered by current SIPs' : `Shortfall: ${formatINR(monthlySavingsNeeded - linkedMonthlySip)}/mo`}
          </p>
        </div>
      </div>
    </div>
  );
}

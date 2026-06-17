import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 border border-dashed border-navy-600 rounded-xl bg-navy-800/40">
      <div className="w-12 h-12 rounded-full bg-cyan-accent/10 flex items-center justify-center mb-4">
        <Icon size={22} className="text-cyan-accent" />
      </div>
      <h3 className="text-white font-medium mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mb-5">{description}</p>
      <button onClick={onAction} className="px-4 py-2 rounded-lg bg-cyan-accent text-navy-950 text-sm font-medium hover:bg-cyan-300 transition-colors">
        {actionLabel}
      </button>
    </div>
  );
}

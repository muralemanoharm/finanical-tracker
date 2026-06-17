import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`bg-navy-800 border border-navy-700 rounded-xl p-5 ${className}`}>{children}</div>;
}

export function KpiCard({ label, value, accent }: { label: string; value: ReactNode; accent?: 'positive' | 'negative' | 'neutral' | 'warning' }) {
  const accentClass =
    accent === 'positive' ? 'text-emerald-400' : accent === 'negative' ? 'text-rose-400' : accent === 'warning' ? 'text-amber-400' : 'text-white';
  return (
    <Card>
      <p className="text-sm text-slate-400 mb-2">{label}</p>
      <p className={`text-2xl font-semibold ${accentClass}`}>{value}</p>
    </Card>
  );
}

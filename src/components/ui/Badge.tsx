import type { HealthScoreLevel, Severity } from '../../types/financial';

const levelClasses: Record<HealthScoreLevel, string> = {
  Green: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Yellow: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Red: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
};

export function HealthBadge({ level, score }: { level: HealthScoreLevel; score: number }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${levelClasses[level]}`}>
      {level} · {Math.round(score)}
    </span>
  );
}

const severityClasses: Record<Severity, string> = {
  High: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  Medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Low: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${severityClasses[severity]}`}>{severity}</span>;
}

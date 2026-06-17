import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { JobSwitchYearRow } from '../../utils/careerCalculations';
import { formatINRCompact } from '../../utils/formatters';

export function JobSwitchWealthChart({ rows }: { rows: JobSwitchYearRow[] }) {
  if (rows.length === 0) return <div className="flex items-center justify-center h-64 text-sm text-slate-500">Enter CTC details to compare</div>;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={rows}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2e3950" />
        <XAxis dataKey="year" stroke="#64748b" fontSize={12} tickFormatter={(v) => `Yr ${v}`} />
        <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => formatINRCompact(v)} width={70} />
        <Tooltip formatter={(value: unknown) => formatINRCompact(Number(value))} contentStyle={{ background: '#1a2236', border: '1px solid #2e3950', borderRadius: 8 }} labelFormatter={(v) => `Year ${v}`} />
        <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
        <Line type="monotone" dataKey="wealthCurrent" stroke="#94a3b8" strokeWidth={2} dot={{ r: 3 }} name="Current Job Cumulative Wealth" />
        <Line type="monotone" dataKey="wealthTarget" stroke="#22d3ee" strokeWidth={2} dot={{ r: 3 }} name="Target Job Cumulative Wealth" />
      </LineChart>
    </ResponsiveContainer>
  );
}

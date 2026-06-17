import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { NetWorthSnapshot } from '../../types/financial';
import { formatINRCompact, formatDate } from '../../utils/formatters';

export function NetWorthChart({ snapshots }: { snapshots: NetWorthSnapshot[] }) {
  if (snapshots.length === 0) {
    return <div className="flex items-center justify-center h-64 text-sm text-slate-500">Record a snapshot from the dashboard to start your trend</div>;
  }

  const data = snapshots.map((s) => ({ ...s, label: formatDate(s.date, 'MMM yy') }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2e3950" />
        <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => formatINRCompact(v)} width={70} />
        <Tooltip
          formatter={(value: unknown) => formatINRCompact(Number(value))}
          contentStyle={{ background: '#1a2236', border: '1px solid #2e3950', borderRadius: 8 }}
          labelStyle={{ color: '#e2e8f0' }}
        />
        <Line type="monotone" dataKey="netWorth" stroke="#22d3ee" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

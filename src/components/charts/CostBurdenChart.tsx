import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatINRCompact } from '../../utils/formatters';

interface CostBurdenChartProps {
  rows: { year: number; cumulativeCost: number }[];
}

export function CostBurdenChart({ rows }: CostBurdenChartProps) {
  if (rows.length === 0) {
    return <div className="flex items-center justify-center h-32 text-sm text-slate-500">Add life events with an estimated cost to see your cumulative cost burden</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={rows}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2e3950" />
        <XAxis dataKey="year" stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => formatINRCompact(v)} width={70} />
        <Tooltip
          formatter={(value: unknown) => [formatINRCompact(Number(value)), 'Cumulative Cost']}
          contentStyle={{ background: '#1a2236', border: '1px solid #2e3950', borderRadius: 8 }}
          labelStyle={{ color: '#e2e8f0' }}
        />
        <Bar dataKey="cumulativeCost" fill="#fb923c" radius={4} barSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

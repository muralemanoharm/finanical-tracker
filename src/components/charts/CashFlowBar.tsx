import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatINRCompact } from '../../utils/formatters';

interface CashFlowBarProps {
  expenseBreakdown: { label: string; value: number }[];
  surplus: number;
}

const COLORS = ['#22d3ee', '#38bdf8', '#a78bfa', '#fb923c', '#f472b6', '#facc15', '#818cf8', '#2dd4bf', '#94a3b8'];

export function CashFlowBar({ expenseBreakdown, surplus }: CashFlowBarProps) {
  const row: Record<string, number | string> = { name: 'This month' };
  expenseBreakdown.forEach((e) => {
    row[e.label] = e.value;
  });
  row.Surplus = Math.max(0, surplus);
  const data = [row];

  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2e3950" horizontal={false} />
        <XAxis type="number" stroke="#64748b" fontSize={12} tickFormatter={(v) => formatINRCompact(v)} />
        <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={12} width={0} tick={false} />
        <Tooltip formatter={(value: unknown) => formatINRCompact(Number(value))} contentStyle={{ background: '#1a2236', border: '1px solid #2e3950', borderRadius: 8 }} />
        <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
        {expenseBreakdown.map((e, i) => (
          <Bar key={e.label} dataKey={e.label} stackId="flow" fill={COLORS[i % COLORS.length]} barSize={36} />
        ))}
        <Bar dataKey="Surplus" stackId="flow" fill="#34d399" barSize={36} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { IncomeStreamPoint } from '../../utils/careerCalculations';
import { formatINR, formatDate } from '../../utils/formatters';

interface ChartRow {
  date: string;
  label: string;
  actual: number | null;
  projected: number | null;
}

export function IncomeStreamChart({ points }: { points: IncomeStreamPoint[] }) {
  if (points.length === 0) return null;

  const rows: ChartRow[] = points.map((p) => ({ date: p.date, label: formatDate(p.date, 'MMM yy'), actual: p.isProjected ? null : p.value, projected: null }));
  const lastActualIndex = rows.map((r) => r.actual !== null).lastIndexOf(true);
  if (lastActualIndex >= 0) rows[lastActualIndex] = { ...rows[lastActualIndex], projected: rows[lastActualIndex].actual };
  points.forEach((p, i) => {
    if (p.isProjected) rows[i] = { ...rows[i], projected: p.value };
  });

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={rows}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2e3950" />
        <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => formatINR(v)} width={80} />
        <Tooltip formatter={(value: unknown) => formatINR(Number(value))} contentStyle={{ background: '#1a2236', border: '1px solid #2e3950', borderRadius: 8 }} />
        <Line type="monotone" dataKey="actual" stroke="#22d3ee" strokeWidth={2} dot={{ r: 2 }} name="Actual" />
        <Line type="monotone" dataKey="projected" stroke="#22d3ee" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Projected" />
      </LineChart>
    </ResponsiveContainer>
  );
}

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { NetWorthSnapshot } from '../../types/financial';
import { formatINRCompact, formatDate } from '../../utils/formatters';

interface ProjectionPoint {
  date: string;
  netWorth: number;
}

interface ChartRow {
  date: string;
  label: string;
  actual: number | null;
  projected: number | null;
}

interface NetWorthChartProps {
  snapshots: NetWorthSnapshot[];
  projection?: ProjectionPoint[];
  currentNetWorth?: number;
  currentDate?: string;
}

export function NetWorthChart({ snapshots, projection = [], currentNetWorth, currentDate }: NetWorthChartProps) {
  if (snapshots.length === 0 && projection.length === 0) {
    return <div className="flex items-center justify-center h-64 text-sm text-slate-500">Record a snapshot from the dashboard to start your trend</div>;
  }

  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const rows: ChartRow[] = sorted.map((s) => ({ date: s.date, label: formatDate(s.date, 'MMM yy'), actual: s.netWorth, projected: null }));

  // Bridge point: carries both an actual and projected value so the dashed projection line
  // connects seamlessly to where the solid actual line ends (or to "today" if no snapshots yet).
  if (projection.length > 0) {
    if (rows.length > 0) {
      rows[rows.length - 1] = { ...rows[rows.length - 1], projected: rows[rows.length - 1].actual };
    } else if (currentDate !== undefined && currentNetWorth !== undefined) {
      rows.push({ date: currentDate, label: formatDate(currentDate, 'MMM yy'), actual: null, projected: currentNetWorth });
    }
    projection.forEach((p) => rows.push({ date: p.date, label: formatDate(p.date, 'MMM yy'), actual: null, projected: p.netWorth }));
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={rows}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2e3950" />
        <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => formatINRCompact(v)} width={70} />
        <Tooltip
          formatter={(value: unknown, name: unknown) => [formatINRCompact(Number(value)), name === 'actual' ? 'Net Worth' : 'Projected']}
          contentStyle={{ background: '#1a2236', border: '1px solid #2e3950', borderRadius: 8 }}
          labelStyle={{ color: '#e2e8f0' }}
        />
        <Line type="monotone" dataKey="actual" stroke="#22d3ee" strokeWidth={2} dot={{ r: 3 }} name="Net Worth" />
        <Line type="monotone" dataKey="projected" stroke="#22d3ee" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Projected" />
      </LineChart>
    </ResponsiveContainer>
  );
}

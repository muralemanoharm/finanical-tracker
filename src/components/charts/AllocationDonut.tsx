import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { AssetAllocation } from '../../hooks/useNetWorth';
import { formatINR } from '../../utils/formatters';

const COLORS: Record<keyof AssetAllocation, string> = {
  equity: '#22d3ee',
  debt: '#818cf8',
  insurance: '#f472b6',
  gold: '#fbbf24',
  cash: '#34d399',
};

const LABELS: Record<keyof AssetAllocation, string> = {
  equity: 'Equity',
  debt: 'Debt',
  insurance: 'Insurance',
  gold: 'Gold',
  cash: 'Cash',
};

export function AllocationDonut({ allocation }: { allocation: AssetAllocation }) {
  const data = (Object.keys(allocation) as (keyof AssetAllocation)[])
    .map((key) => ({ key, name: LABELS[key], value: allocation[key] }))
    .filter((d) => d.value > 0);

  if (data.length === 0) {
    return <div className="flex items-center justify-center h-64 text-sm text-slate-500">No asset data yet</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
          {data.map((d) => (
            <Cell key={d.key} fill={COLORS[d.key]} stroke="none" />
          ))}
        </Pie>
        <Tooltip formatter={(value: unknown) => formatINR(Number(value))} contentStyle={{ background: '#1a2236', border: '1px solid #2e3950', borderRadius: 8 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

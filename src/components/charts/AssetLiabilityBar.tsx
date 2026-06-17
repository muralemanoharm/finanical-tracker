import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatINRCompact } from '../../utils/formatters';

export function AssetLiabilityBar({ totalAssets, totalLiabilities }: { totalAssets: number; totalLiabilities: number }) {
  const data = [{ name: 'Net Worth', assets: totalAssets, liabilities: totalLiabilities }];
  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2e3950" horizontal={false} />
        <XAxis type="number" stroke="#64748b" fontSize={12} tickFormatter={(v) => formatINRCompact(v)} />
        <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={12} width={0} tick={false} />
        <Tooltip formatter={(value: unknown) => formatINRCompact(Number(value))} contentStyle={{ background: '#1a2236', border: '1px solid #2e3950', borderRadius: 8 }} />
        <Bar dataKey="assets" name="Assets" fill="#22d3ee" radius={4} barSize={28} />
        <Bar dataKey="liabilities" name="Liabilities" fill="#fb7185" radius={4} barSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

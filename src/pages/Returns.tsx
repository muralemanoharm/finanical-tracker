import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card, KpiCard } from '../components/ui/Card';
import { DataTable, type Column } from '../components/ui/DataTable';
import { Field, Input, Select } from '../components/ui/FormField';
import { useFinancialDataContext } from '../context/FinancialDataContext';
import { useXirr, type XirrInstrument } from '../hooks/useXirr';
import { formatPercent, formatINR, formatDate } from '../utils/formatters';

function BenchmarkRow({ label, value, portfolioXirr }: { label: string; value: number; portfolioXirr: number | null }) {
  const beating = portfolioXirr !== null && portfolioXirr >= value;
  return (
    <div className="flex justify-between items-center py-2 border-b border-navy-700 last:border-0">
      <span className="text-sm text-slate-300">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-400">{formatPercent(value)}</span>
        {portfolioXirr !== null && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${beating ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
            {beating ? 'Beating' : 'Trailing'}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Returns() {
  const { data, addXirrCashflowEntry, removeXirrCashflowEntry } = useFinancialDataContext();
  const xirr = useXirr(data);
  const [selectedId, setSelectedId] = useState<string>(xirr.instruments[0]?.id || '');
  const [entryDate, setEntryDate] = useState('');
  const [entryAmount, setEntryAmount] = useState('');

  const selected = xirr.instruments.find((i) => i.id === selectedId) || null;
  const manualEntries = selectedId ? data.xirrTracker[selectedId] || [] : [];

  const columns: Column<XirrInstrument>[] = [
    { header: 'Category', render: (i) => i.category },
    { header: 'Name', render: (i) => <span className="font-medium text-white">{i.name}</span> },
    {
      header: 'XIRR',
      render: (i) =>
        i.xirr !== null ? (
          <span className={i.xirr >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{formatPercent(i.xirr)}</span>
        ) : (
          <span className="text-slate-500">Not enough data</span>
        ),
    },
    { header: 'Source', render: (i) => (i.usingManualCashflows ? 'Manual cash flows' : i.cashflows.length > 0 ? 'Invested vs current (auto)' : '—') },
  ];

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !entryDate || !entryAmount) return;
    addXirrCashflowEntry(selectedId, { date: entryDate, amount: parseFloat(entryAmount) || 0 });
    setEntryDate('');
    setEntryAmount('');
  };

  return (
    <div>
      <Header title="Returns Analyser" subtitle="XIRR per instrument and against market benchmarks" />
      <div className="px-8 py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <KpiCard
            label="Portfolio XIRR"
            value={xirr.portfolioXirr !== null ? formatPercent(xirr.portfolioXirr) : '—'}
            accent={xirr.portfolioXirr !== null ? (xirr.portfolioXirr >= 0 ? 'positive' : 'negative') : 'neutral'}
          />
          <Card>
            <h3 className="text-white font-medium mb-2">Benchmarks</h3>
            <BenchmarkRow label="Nifty 50 (assumed)" value={xirr.niftyBenchmark} portfolioXirr={xirr.portfolioXirr} />
            <BenchmarkRow label="Best FD Rate" value={xirr.bestFdRate} portfolioXirr={xirr.portfolioXirr} />
            <BenchmarkRow label="Inflation" value={xirr.inflationBenchmark} portfolioXirr={xirr.portfolioXirr} />
          </Card>
        </div>

        <Card>
          <h3 className="text-white font-medium mb-4">Per-Instrument XIRR</h3>
          {xirr.instruments.length === 0 ? (
            <p className="text-sm text-slate-400">Add mutual funds, FDs, ULIPs, stocks or gold to see per-instrument returns.</p>
          ) : (
            <DataTable rows={xirr.instruments} columns={columns} keyFor={(i) => i.id} />
          )}
        </Card>

        <Card>
          <h3 className="text-white font-medium mb-1">Manual Cash Flows</h3>
          <p className="text-xs text-slate-500 mb-4">
            Add real contribution/withdrawal dates and amounts for an instrument to get a more accurate XIRR than the default invested-vs-current
            estimate. Investments should be entered as negative amounts, withdrawals as positive.
          </p>
          {xirr.instruments.length === 0 ? (
            <p className="text-sm text-slate-400">No instruments to configure yet.</p>
          ) : (
            <>
              <div className="max-w-xs mb-4">
                <Field label="Instrument">
                  <Select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                    {xirr.instruments.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.category} — {i.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              {selected && (
                <>
                  {manualEntries.length > 0 && (
                    <div className="mb-4 space-y-2">
                      {manualEntries.map((entry, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-3 bg-navy-900/50 rounded-lg px-3 py-2">
                          <span className="text-sm text-slate-300">{formatDate(entry.date)}</span>
                          <span className={`text-sm ${entry.amount < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{formatINR(entry.amount)}</span>
                          <button
                            onClick={() => removeXirrCashflowEntry(selectedId, idx)}
                            className="p-1 rounded-md hover:bg-rose-500/15 text-slate-400 hover:text-rose-400"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <form onSubmit={handleAddEntry} className="flex flex-wrap items-end gap-3">
                    <div className="w-40">
                      <Field label="Date">
                        <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
                      </Field>
                    </div>
                    <div className="w-48">
                      <Field label="Amount (₹)">
                        <Input type="number" value={entryAmount} onChange={(e) => setEntryAmount(e.target.value)} />
                      </Field>
                    </div>
                    <button type="submit" className="bg-cyan-accent text-navy-950 font-medium rounded-lg px-4 py-2 text-sm hover:bg-cyan-300 transition-colors mb-4">
                      Add Cash Flow
                    </button>
                  </form>
                  <p className="text-xs text-slate-500 mt-2">
                    Current XIRR for this instrument:{' '}
                    {selected.xirr !== null ? formatPercent(selected.xirr) : 'Not enough data'} (
                    {selected.usingManualCashflows ? 'using manual cash flows' : 'using default invested-vs-current estimate'})
                  </p>
                </>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

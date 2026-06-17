import { useState } from 'react';
import { ChevronDown, ChevronUp, ShieldAlert, Trash2 } from 'lucide-react';
import { useFinancialDataContext } from '../../context/FinancialDataContext';
import { useNetWorth } from '../../hooks/useNetWorth';
import { useNominees } from '../../hooks/useNominees';
import { buildNomineeAssetList, nomineeStatusForAsset, totalSharePercent, type NomineeStatus } from '../../utils/nominees';
import { todayISO } from '../../utils/calculations';
import { Card } from '../ui/Card';
import { Input, Select } from '../ui/FormField';
import { formatINR, formatDate } from '../../utils/formatters';
import type { NomineeEntry, RelationshipType, NominationMode } from '../../types/nominees';

const RELATIONSHIPS: RelationshipType[] = ['Spouse', 'Parent', 'Child', 'Sibling', 'Other'];
const MODES: NominationMode[] = ['Physical on file', 'Online', 'Not updated'];

const statusClasses: Record<NomineeStatus, string> = {
  Green: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Yellow: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Red: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
};

function AddNomineeForm({ onAdd }: { onAdd: (entry: NomineeEntry) => void }) {
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState<RelationshipType>('Spouse');
  const [share, setShare] = useState(100);
  const [date, setDate] = useState(todayISO());
  const [mode, setMode] = useState<NominationMode>('Online');

  const submit = () => {
    if (!name.trim()) return;
    onAdd({ nomineeName: name.trim(), relationship, sharePercent: share, updatedDate: date, mode });
    setName('');
    setShare(100);
  };

  return (
    <div className="flex flex-wrap items-end gap-2 mt-3">
      <Input placeholder="Nominee name" value={name} onChange={(e) => setName(e.target.value)} className="w-36 py-1.5" />
      <Select value={relationship} onChange={(e) => setRelationship(e.target.value as RelationshipType)} className="w-28 py-1.5">
        {RELATIONSHIPS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </Select>
      <Input
        type="number"
        min="0"
        max="100"
        value={share}
        onChange={(e) => setShare(parseFloat(e.target.value) || 0)}
        className="w-20 py-1.5"
        placeholder="% share"
      />
      <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-36 py-1.5" />
      <Select value={mode} onChange={(e) => setMode(e.target.value as NominationMode)} className="w-36 py-1.5">
        {MODES.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </Select>
      <button type="button" onClick={submit} className="bg-cyan-accent text-navy-950 rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-cyan-300 transition-colors">
        Add
      </button>
    </div>
  );
}

export function NomineeTracker() {
  const { data } = useFinancialDataContext();
  const netWorth = useNetWorth(data);
  const { data: nomineeData, addNominee, removeNominee } = useNominees();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const assets = buildNomineeAssetList(netWorth.summaries);
  const assetsWithoutNominee = assets.filter((a) => (nomineeData[a.id] || []).length === 0);
  const assetsWithNomineeCount = assets.length - assetsWithoutNominee.length;
  const valueAtRisk = assetsWithoutNominee.reduce((s, a) => s + a.currentValue, 0);

  if (assets.length === 0) {
    return <p className="text-sm text-slate-400">Add instruments in the Instruments tab to start tracking nominees for them.</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-white font-medium mb-2">Nominee Coverage</h3>
        <p className="text-sm text-slate-300 mb-3">
          {assetsWithNomineeCount} of {assets.length} assets have nominees assigned.
        </p>
        {assetsWithoutNominee.length > 0 && (
          <div>
            <p className="text-sm text-rose-400 mb-2">Total value at risk (no nominee): {formatINR(valueAtRisk)}</p>
            <div className="space-y-1.5">
              {assetsWithoutNominee.map((a) => (
                <div key={a.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-sm">
                  <ShieldAlert size={15} className="text-rose-400 shrink-0" />
                  <span className="text-white">{a.name}</span>
                  <span className="text-slate-400">({a.category})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card>
        <h3 className="text-white font-medium mb-1">All Assets</h3>
        <p className="text-xs text-amber-300 mb-4">
          Nominee is NOT the legal heir — it's the first point of contact. A will overrides nomination for most assets except insurance and EPF.
        </p>
        <div className="divide-y divide-navy-700">
          {assets.map((a) => {
            const entries = nomineeData[a.id] || [];
            const status = nomineeStatusForAsset(entries);
            const expanded = expandedId === a.id;
            const shareTotal = totalSharePercent(entries);
            return (
              <div key={a.id} className="py-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-sm font-medium text-white">{a.name}</p>
                    <p className="text-xs text-slate-400">
                      {a.category} · {formatINR(a.currentValue)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${statusClasses[status]}`}>{status}</span>
                    <button onClick={() => setExpandedId(expanded ? null : a.id)} className="p-1.5 rounded-md hover:bg-navy-700 text-slate-400 hover:text-white">
                      {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                  </div>
                </div>
                {entries.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {entries.map((e, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 text-xs bg-navy-700 text-slate-300 rounded-full px-3 py-1">
                        {e.nomineeName} ({e.relationship}) · {e.sharePercent}% · {formatDate(e.updatedDate)} · {e.mode}
                        <button onClick={() => removeNominee(a.id, i)} className="text-slate-500 hover:text-rose-400">
                          <Trash2 size={11} />
                        </button>
                      </span>
                    ))}
                    {shareTotal !== 100 && <span className="text-xs text-amber-400">Shares sum to {shareTotal}%, not 100%</span>}
                  </div>
                )}
                {expanded && <AddNomineeForm onAdd={(entry) => addNominee(a.id, entry)} />}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

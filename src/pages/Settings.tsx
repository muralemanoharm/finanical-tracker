import { useState, useRef } from 'react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Field, Input } from '../components/ui/FormField';
import { useFinancialDataContext } from '../context/FinancialDataContext';
import { Download, Upload, RotateCcw } from 'lucide-react';

export default function Settings() {
  const { data, updateProfile, exportData, importData, resetAllData } = useFinancialDataContext();
  const [profile, setProfile] = useState(data.profile);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(profile);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = importData(String(reader.result));
      setImportMessage(result.success ? 'Data imported successfully.' : `Import failed: ${result.error}`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = () => {
    if (confirm('This will permanently delete all locally stored data. Continue?')) {
      resetAllData();
      setProfile({ name: '', monthlyIncome: 0, age: 30, retirementAge: 60, monthlyExpenseTarget: 0 });
    }
  };

  return (
    <div>
      <Header title="Settings" subtitle="Profile, data import/export" />
      <div className="px-8 py-6 max-w-2xl space-y-6">
        <Card>
          <h2 className="text-white font-medium mb-4">Profile</h2>
          <form onSubmit={handleSave}>
            <Field label="Name">
              <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Your name" />
            </Field>
            <Field label="Monthly Income (₹)">
              <Input
                type="number"
                value={profile.monthlyIncome || ''}
                onChange={(e) => setProfile({ ...profile, monthlyIncome: parseFloat(e.target.value) || 0 })}
                placeholder="e.g. 150000"
              />
            </Field>
            <Field label="Age">
              <Input type="number" value={profile.age || ''} onChange={(e) => setProfile({ ...profile, age: parseFloat(e.target.value) || 0 })} />
            </Field>
            <Field label="Target Retirement Age">
              <Input
                type="number"
                value={profile.retirementAge || ''}
                onChange={(e) => setProfile({ ...profile, retirementAge: parseFloat(e.target.value) || 0 })}
              />
            </Field>
            <Field label="Target Monthly Expense in Retirement (₹, today's value)">
              <Input
                type="number"
                value={profile.monthlyExpenseTarget || ''}
                onChange={(e) => setProfile({ ...profile, monthlyExpenseTarget: parseFloat(e.target.value) || 0 })}
              />
            </Field>
            <button type="submit" className="bg-cyan-accent text-navy-950 font-medium rounded-lg px-5 py-2.5 text-sm hover:bg-cyan-300 transition-colors">
              Save Profile
            </button>
          </form>
        </Card>

        <Card>
          <h2 className="text-white font-medium mb-4">Data Management</h2>
          <p className="text-sm text-slate-400 mb-4">All data is stored locally in your browser. Export a backup or restore from a previous export.</p>
          <div className="flex flex-wrap gap-3">
            <button onClick={exportData} className="flex items-center gap-2 bg-navy-700 text-slate-200 rounded-lg px-4 py-2.5 text-sm hover:bg-navy-600 transition-colors">
              <Download size={16} /> Export JSON
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-navy-700 text-slate-200 rounded-lg px-4 py-2.5 text-sm hover:bg-navy-600 transition-colors"
            >
              <Upload size={16} /> Import JSON
            </button>
            <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />
            <button
              onClick={handleReset}
              className="flex items-center gap-2 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-lg px-4 py-2.5 text-sm hover:bg-rose-500/20 transition-colors"
            >
              <RotateCcw size={16} /> Reset All Data
            </button>
          </div>
          {importMessage && <p className="text-sm text-slate-300 mt-3">{importMessage}</p>}
        </Card>

        <Card>
          <h2 className="text-white font-medium mb-2">Tax Calculation Notes</h2>
          <p className="text-sm text-slate-400">Tax rules based on Finance Act 2024. Last verified: June 2026.</p>
        </Card>
      </div>
    </div>
  );
}

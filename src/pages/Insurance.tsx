import { useState } from 'react';
import { Header } from '../components/layout/Header';
import { HealthPanel } from '../components/insurance/HealthPanel';
import { NomineeTracker } from '../components/insurance/NomineeTracker';

const TABS = [
  { key: 'health', label: 'Health Panel', Component: HealthPanel },
  { key: 'nominees', label: 'Nominees', Component: NomineeTracker },
] as const;

export default function Insurance() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['key']>('health');
  const ActiveComponent = TABS.find((t) => t.key === activeTab)!.Component;

  return (
    <div>
      <Header title="Insurance" subtitle="Coverage adequacy checks, renewal reminders and nominee tracking" />
      <div className="px-8 py-6">
        <div className="flex gap-1 mb-6 overflow-x-auto border-b border-navy-700">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key ? 'border-cyan-accent text-cyan-accent' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <ActiveComponent />
      </div>
    </div>
  );
}

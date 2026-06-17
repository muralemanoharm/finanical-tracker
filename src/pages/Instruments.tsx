import { useState } from 'react';
import { Header } from '../components/layout/Header';
import { MFSection } from '../components/instruments/MFSection';
import { FDSection } from '../components/instruments/FDSection';
import { LifeInsuranceSection } from '../components/instruments/LifeInsuranceSection';
import { ULIPSection } from '../components/instruments/ULIPSection';
import { HealthInsuranceSection } from '../components/instruments/HealthInsuranceSection';
import { EPFPPFSection } from '../components/instruments/EPFPPFSection';
import { StockSection } from '../components/instruments/StockSection';
import { GoldSection } from '../components/instruments/GoldSection';
import { LiabilitySection } from '../components/instruments/LiabilitySection';

const TABS = [
  { key: 'mf', label: 'MF/SIP', Component: MFSection },
  { key: 'fd', label: 'FD', Component: FDSection },
  { key: 'life', label: 'Life Insurance', Component: LifeInsuranceSection },
  { key: 'ulip', label: 'ULIP', Component: ULIPSection },
  { key: 'health', label: 'Health Insurance', Component: HealthInsuranceSection },
  { key: 'epfppf', label: 'EPF/PPF', Component: EPFPPFSection },
  { key: 'stocks', label: 'Stocks', Component: StockSection },
  { key: 'gold', label: 'Gold', Component: GoldSection },
  { key: 'liabilities', label: 'Liabilities', Component: LiabilitySection },
] as const;

export default function Instruments() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['key']>('mf');
  const ActiveComponent = TABS.find((t) => t.key === activeTab)!.Component;

  return (
    <div>
      <Header title="Instruments" subtitle="All your assets, insurance and liabilities in one place" />
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

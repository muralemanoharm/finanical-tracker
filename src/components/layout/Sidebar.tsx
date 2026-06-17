import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wallet, TrendingUp, ShieldCheck, Lightbulb, Target, Settings as SettingsIcon, Banknote } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/instruments', label: 'Instruments', icon: Wallet },
  { to: '/projections', label: 'Projections', icon: TrendingUp },
  { to: '/insurance', label: 'Insurance', icon: ShieldCheck },
  { to: '/recommendations', label: 'Recommendations', icon: Lightbulb },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export function Sidebar() {
  return (
    <aside className="w-60 shrink-0 bg-navy-950 border-r border-navy-700 flex flex-col h-screen sticky top-0">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-navy-700">
        <Banknote className="text-cyan-accent" size={26} />
        <span className="text-lg font-semibold text-white">FinPlan</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-cyan-accent/15 text-cyan-accent' : 'text-slate-400 hover:bg-navy-800 hover:text-slate-200'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 text-xs text-slate-500 border-t border-navy-700">All data stored locally in your browser</div>
    </aside>
  );
}

import { useFinancialDataContext } from '../../context/FinancialDataContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { data } = useFinancialDataContext();
  return (
    <div className="flex items-center justify-between px-8 py-6 border-b border-navy-700">
      <div>
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
      </div>
      {data.profile.name && <div className="text-sm text-slate-400">Hi, {data.profile.name}</div>}
    </div>
  );
}

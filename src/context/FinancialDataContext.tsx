import { createContext, useContext, type ReactNode } from 'react';
import { useFinancialData, type UseFinancialData } from '../hooks/useFinancialData';

const FinancialDataContext = createContext<UseFinancialData | null>(null);

export function FinancialDataProvider({ children }: { children: ReactNode }) {
  const value = useFinancialData();
  return <FinancialDataContext.Provider value={value}>{children}</FinancialDataContext.Provider>;
}

export function useFinancialDataContext(): UseFinancialData {
  const ctx = useContext(FinancialDataContext);
  if (!ctx) throw new Error('useFinancialDataContext must be used within FinancialDataProvider');
  return ctx;
}

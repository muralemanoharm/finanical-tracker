import { createContext, useContext, type ReactNode } from 'react';
import { useCareerData, type UseCareerData } from '../hooks/useCareerData';
import { useFinancialDataContext } from './FinancialDataContext';

const CareerDataContext = createContext<UseCareerData | null>(null);

export function CareerDataProvider({ children }: { children: ReactNode }) {
  const { data } = useFinancialDataContext();
  const value = useCareerData(data.profile);
  return <CareerDataContext.Provider value={value}>{children}</CareerDataContext.Provider>;
}

export function useCareerDataContext(): UseCareerData {
  const ctx = useContext(CareerDataContext);
  if (!ctx) throw new Error('useCareerDataContext must be used within CareerDataProvider');
  return ctx;
}

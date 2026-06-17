import { useCallback, useEffect, useState } from 'react';

export const TAX_HARVEST_STORAGE_KEY = 'nw_harvest';

export interface TaxHarvestStorage {
  realisedGainsThisFY: number;
}

const DEFAULT_DATA: TaxHarvestStorage = { realisedGainsThisFY: 0 };

function loadTaxHarvestData(): TaxHarvestStorage {
  try {
    const raw = localStorage.getItem(TAX_HARVEST_STORAGE_KEY);
    if (!raw) return DEFAULT_DATA;
    return { ...DEFAULT_DATA, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_DATA;
  }
}

export function useTaxHarvest() {
  const [data, setData] = useState<TaxHarvestStorage>(loadTaxHarvestData);

  useEffect(() => {
    localStorage.setItem(TAX_HARVEST_STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const setRealisedGains = useCallback((realisedGainsThisFY: number) => {
    setData({ realisedGainsThisFY });
  }, []);

  return { data, setRealisedGains };
}

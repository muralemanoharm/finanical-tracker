import { useCallback, useEffect, useState } from 'react';
import type { NomineeEntry, NomineeSettings } from '../types/nominees';

export const NOMINEES_STORAGE_KEY = 'nw_nominees';

const DEFAULT_DATA: NomineeSettings = {};

function loadNomineesData(): NomineeSettings {
  try {
    const raw = localStorage.getItem(NOMINEES_STORAGE_KEY);
    if (!raw) return DEFAULT_DATA;
    return { ...DEFAULT_DATA, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_DATA;
  }
}

export function useNominees() {
  const [data, setData] = useState<NomineeSettings>(loadNomineesData);

  useEffect(() => {
    localStorage.setItem(NOMINEES_STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const addNominee = useCallback((assetId: string, entry: NomineeEntry) => {
    setData((prev) => ({ ...prev, [assetId]: [...(prev[assetId] || []), entry] }));
  }, []);

  const removeNominee = useCallback((assetId: string, index: number) => {
    setData((prev) => ({ ...prev, [assetId]: (prev[assetId] || []).filter((_, i) => i !== index) }));
  }, []);

  return { data, addNominee, removeNominee };
}

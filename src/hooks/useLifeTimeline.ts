import { useCallback, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { LifeEvent, LifeTimelineData } from '../types/lifeTimeline';

const STORAGE_KEY = 'nw_lifetimeline';

const DEFAULT_DATA: LifeTimelineData = { events: [] };

function loadLifeTimelineData(): LifeTimelineData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DATA;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_DATA, ...parsed };
  } catch {
    return DEFAULT_DATA;
  }
}

export function useLifeTimeline() {
  const [data, setData] = useState<LifeTimelineData>(loadLifeTimelineData);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const addEvent = useCallback((event: Omit<LifeEvent, 'id'>) => {
    setData((prev) => ({ ...prev, events: [...prev.events, { ...event, id: uuidv4() }] }));
  }, []);

  const updateEvent = useCallback((id: string, updates: Partial<LifeEvent>) => {
    setData((prev) => ({ ...prev, events: prev.events.map((e) => (e.id === id ? { ...e, ...updates } : e)) }));
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setData((prev) => ({ ...prev, events: prev.events.filter((e) => e.id !== id) }));
  }, []);

  return { data, addEvent, updateEvent, deleteEvent };
}

export type UseLifeTimeline = ReturnType<typeof useLifeTimeline>;

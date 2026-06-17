export type LifeEventCategory = 'Career' | 'Personal' | 'Travel' | 'Education' | 'Family';

export interface LifeEvent {
  id: string;
  name: string;
  year: number;
  category: LifeEventCategory;
  estimatedCost?: number;
  notes?: string;
}

export interface LifeTimelineData {
  events: LifeEvent[];
}

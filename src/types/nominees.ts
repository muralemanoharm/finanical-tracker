export type RelationshipType = 'Spouse' | 'Parent' | 'Child' | 'Sibling' | 'Other';
export type NominationMode = 'Physical on file' | 'Online' | 'Not updated';

export interface NomineeEntry {
  nomineeName: string;
  relationship: RelationshipType;
  sharePercent: number;
  updatedDate: string; // ISO date
  mode: NominationMode;
}

/** Per-asset-id list of nominees. Each asset's entries' sharePercent should sum to 100. */
export type NomineeSettings = Record<string, NomineeEntry[]>;

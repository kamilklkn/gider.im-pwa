import type { Timestamp } from 'firebase/firestore';

// Entry Collection Type
export interface FirebaseEntry {
  id: string; // Document ID
  userId: string; // Kullanıcı ID (Auth'dan)
  date: Timestamp;
  type: 'income' | 'expense';
  name: string;
  amount: string; // "123.45678900" formatında
  fullfilled: boolean;
  currencyCode: string; // "TRY", "USD", vb.
  recurringId: string | null;
  groupId: string | null;
  tagId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isDeleted: boolean;
}

// Entry Group Collection Type
export interface FirebaseEntryGroup {
  id: string;
  userId: string;
  name: string;
  icon: string | null;
  createdAt: Timestamp;
  isDeleted: boolean;
}

// Entry Tag Collection Type
export interface FirebaseEntryTag {
  id: string;
  userId: string;
  name: string;
  suggestId: string | null;
  color: string | null;
  icon: string | null;
  createdAt: Timestamp;
  isDeleted: boolean;
}

// Recurring Config Collection Type
export interface FirebaseRecurringConfig {
  id: string;
  userId: string;
  frequency: 'week' | 'month' | 'year';
  interval: number;
  every: number;
  startDate: Timestamp;
  endDate: Timestamp | null;
  createdAt: Timestamp;
  isDeleted: boolean;
}

// Exclusion Collection Type
export interface FirebaseExclusion {
  id: string;
  userId: string;
  recurringId: string;
  date: Timestamp;
  reason: 'deletion' | 'modification';
  modifiedEntryId: string | null;
  createdAt: Timestamp;
  isDeleted: boolean;
}

// Collection name constants
export const COLLECTIONS = {
  ENTRIES: 'entries',
  ENTRY_GROUPS: 'entryGroups',
  ENTRY_TAGS: 'entryTags',
  RECURRING_CONFIGS: 'recurringConfigs',
  EXCLUSIONS: 'exclusions',
} as const;
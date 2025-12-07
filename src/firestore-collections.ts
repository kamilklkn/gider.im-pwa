import { collection, type CollectionReference } from 'firebase/firestore';
import { db } from '@/firebase';
import type {
  FirebaseEntry,
  FirebaseEntryGroup,
  FirebaseEntryTag,
  FirebaseRecurringConfig,
  FirebaseExclusion,
} from '@/types/firebase';
import { COLLECTIONS } from '@/types/firebase';

// Type-safe collection references
export const entriesCollection = collection(
  db,
  COLLECTIONS.ENTRIES
) as CollectionReference<FirebaseEntry>;

export const entryGroupsCollection = collection(
  db,
  COLLECTIONS.ENTRY_GROUPS
) as CollectionReference<FirebaseEntryGroup>;

export const entryTagsCollection = collection(
  db,
  COLLECTIONS.ENTRY_TAGS
) as CollectionReference<FirebaseEntryTag>;

export const recurringConfigsCollection = collection(
  db,
  COLLECTIONS.RECURRING_CONFIGS
) as CollectionReference<FirebaseRecurringConfig>;

export const exclusionsCollection = collection(
  db,
  COLLECTIONS.EXCLUSIONS
) as CollectionReference<FirebaseExclusion>;
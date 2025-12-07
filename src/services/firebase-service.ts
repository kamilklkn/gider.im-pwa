import {
	collection,
	doc,
	getDoc,
	getDocs,
	addDoc,
	updateDoc,
	deleteDoc,
	query,
	where,
	orderBy,
	Timestamp,
	type DocumentData,
	type QuerySnapshot,
	type DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/firebase';
import {
	entriesCollection,
	entryGroupsCollection,
	entryTagsCollection,
	recurringConfigsCollection,
	exclusionsCollection,
} from '@/firestore-collections';
import type {
	FirebaseEntry,
	FirebaseEntryGroup,
	FirebaseEntryTag,
	FirebaseRecurringConfig,
	FirebaseExclusion,
} from '@/types/firebase';

// Helper function to convert Firestore document to typed object
const docToData = <T extends DocumentData>(docSnap: DocumentSnapshot<T>): T | null => {
	if (!docSnap.exists()) return null;
	return { id: docSnap.id, ...docSnap.data() } as T;
};

// Helper function to convert Firestore query snapshot to array
const snapshotToArray = <T extends DocumentData>(snapshot: QuerySnapshot<T>): T[] => {
	return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as T));
};

// ==================== ENTRIES ====================

export const createEntry = async (userId: string, entryData: Omit<FirebaseEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> => {
	try {
		const now = Timestamp.now();
		const entry: Omit<FirebaseEntry, 'id'> = {
			userId,
			...entryData,
			createdAt: now,
			updatedAt: now,
		};

		console.log('📤 Creating entry in Firebase:', { userId, entryData });
		const docRef = await addDoc(entriesCollection, entry);
		console.log('✅ Entry created successfully with ID:', docRef.id);
		console.log('📊 Full entry data:', { id: docRef.id, ...entry });
		return docRef.id;
	} catch (error) {
		console.error('❌ Error creating entry:', error);
		console.error('📋 Error details:', {
			code: (error as { code?: string })?.code,
			message: (error as { message?: string })?.message,
			userId,
			entryData,
		});
		throw error;
	}
};

export const getEntry = async (entryId: string): Promise<FirebaseEntry | null> => {
	const docRef = doc(entriesCollection, entryId);
	const docSnap = await getDoc(docRef);
	return docToData<FirebaseEntry>(docSnap);
};

export const getEntries = async (userId: string): Promise<FirebaseEntry[]> => {
	const q = query(entriesCollection, where('userId', '==', userId), where('isDeleted', '==', false), orderBy('date', 'asc'));
	const snapshot = await getDocs(q);
	return snapshotToArray<FirebaseEntry>(snapshot);
};

export const getEntriesByType = async (userId: string, type: 'income' | 'expense'): Promise<FirebaseEntry[]> => {
	const q = query(
		entriesCollection,
		where('userId', '==', userId),
		where('type', '==', type),
		where('isDeleted', '==', false),
		orderBy('date', 'asc'),
	);
	const snapshot = await getDocs(q);
	return snapshotToArray<FirebaseEntry>(snapshot);
};

export const updateEntry = async (entryId: string, updates: Partial<Omit<FirebaseEntry, 'id' | 'userId' | 'createdAt'>>): Promise<void> => {
	const docRef = doc(entriesCollection, entryId);
	await updateDoc(docRef, {
		...updates,
		updatedAt: Timestamp.now(),
	});
};

export const deleteEntry = async (entryId: string): Promise<void> => {
	const docRef = doc(entriesCollection, entryId);
	await updateDoc(docRef, {
		isDeleted: true,
		updatedAt: Timestamp.now(),
	});
};

// ==================== ENTRY GROUPS ====================

export const createEntryGroup = async (userId: string, groupData: Omit<FirebaseEntryGroup, 'id' | 'userId' | 'createdAt' | 'isDeleted'>): Promise<string> => {
	const now = Timestamp.now();
	const group: Omit<FirebaseEntryGroup, 'id'> = {
		userId,
		...groupData,
		createdAt: now,
		isDeleted: false,
	};

	const docRef = await addDoc(entryGroupsCollection, group);
	return docRef.id;
};

export const getEntryGroups = async (userId: string): Promise<FirebaseEntryGroup[]> => {
	const q = query(entryGroupsCollection, where('userId', '==', userId), where('isDeleted', '==', false), orderBy('createdAt', 'asc'));
	const snapshot = await getDocs(q);
	return snapshotToArray<FirebaseEntryGroup>(snapshot);
};

export const updateEntryGroup = async (groupId: string, updates: Partial<Omit<FirebaseEntryGroup, 'id' | 'userId' | 'createdAt'>>): Promise<void> => {
	const docRef = doc(entryGroupsCollection, groupId);
	await updateDoc(docRef, updates);
};

export const deleteEntryGroup = async (groupId: string): Promise<void> => {
	const docRef = doc(entryGroupsCollection, groupId);
	await updateDoc(docRef, { isDeleted: true });
};

// ==================== ENTRY TAGS ====================

export const createEntryTag = async (userId: string, tagData: Omit<FirebaseEntryTag, 'id' | 'userId' | 'createdAt' | 'isDeleted'>): Promise<string> => {
	const now = Timestamp.now();
	const tag: Omit<FirebaseEntryTag, 'id'> = {
		userId,
		...tagData,
		createdAt: now,
		isDeleted: false,
	};

	const docRef = await addDoc(entryTagsCollection, tag);
	return docRef.id;
};

export const getEntryTags = async (userId: string): Promise<FirebaseEntryTag[]> => {
	const q = query(entryTagsCollection, where('userId', '==', userId), where('isDeleted', '==', false), orderBy('createdAt', 'asc'));
	const snapshot = await getDocs(q);
	return snapshotToArray<FirebaseEntryTag>(snapshot);
};

export const updateEntryTag = async (tagId: string, updates: Partial<Omit<FirebaseEntryTag, 'id' | 'userId' | 'createdAt'>>): Promise<void> => {
	const docRef = doc(entryTagsCollection, tagId);
	await updateDoc(docRef, updates);
};

export const deleteEntryTag = async (tagId: string): Promise<void> => {
	const docRef = doc(entryTagsCollection, tagId);
	await updateDoc(docRef, { isDeleted: true });
};

// ==================== RECURRING CONFIGS ====================

export const createRecurringConfig = async (
	userId: string,
	configData: Omit<FirebaseRecurringConfig, 'id' | 'userId' | 'createdAt' | 'isDeleted'>,
): Promise<string> => {
	const now = Timestamp.now();
	const config: Omit<FirebaseRecurringConfig, 'id'> = {
		userId,
		...configData,
		createdAt: now,
		isDeleted: false,
	};

	const docRef = await addDoc(recurringConfigsCollection, config);
	return docRef.id;
};

export const getRecurringConfigs = async (userId: string): Promise<FirebaseRecurringConfig[]> => {
	const q = query(recurringConfigsCollection, where('userId', '==', userId), where('isDeleted', '==', false), orderBy('createdAt', 'asc'));
	const snapshot = await getDocs(q);
	return snapshotToArray<FirebaseRecurringConfig>(snapshot);
};

export const updateRecurringConfig = async (configId: string, updates: Partial<Omit<FirebaseRecurringConfig, 'id' | 'userId' | 'createdAt'>>): Promise<void> => {
	const docRef = doc(recurringConfigsCollection, configId);
	await updateDoc(docRef, updates);
};

export const deleteRecurringConfig = async (configId: string): Promise<void> => {
	const docRef = doc(recurringConfigsCollection, configId);
	await updateDoc(docRef, { isDeleted: true });
};

// ==================== EXCLUSIONS ====================

export const createExclusion = async (userId: string, exclusionData: Omit<FirebaseExclusion, 'id' | 'userId' | 'createdAt' | 'isDeleted'>): Promise<string> => {
	const now = Timestamp.now();
	const exclusion: Omit<FirebaseExclusion, 'id'> = {
		userId,
		...exclusionData,
		createdAt: now,
		isDeleted: false,
	};

	const docRef = await addDoc(exclusionsCollection, exclusion);
	return docRef.id;
};

export const getExclusions = async (userId: string, recurringId: string): Promise<FirebaseExclusion[]> => {
	const q = query(
		exclusionsCollection,
		where('userId', '==', userId),
		where('recurringId', '==', recurringId),
		where('isDeleted', '==', false),
		orderBy('createdAt', 'asc'),
	);
	const snapshot = await getDocs(q);
	return snapshotToArray<FirebaseExclusion>(snapshot);
};

export const updateExclusion = async (exclusionId: string, updates: Partial<Omit<FirebaseExclusion, 'id' | 'userId' | 'createdAt'>>): Promise<void> => {
	const docRef = doc(exclusionsCollection, exclusionId);
	await updateDoc(docRef, updates);
};

export const deleteExclusion = async (exclusionId: string): Promise<void> => {
	const docRef = doc(exclusionsCollection, exclusionId);
	await updateDoc(docRef, { isDeleted: true });
};


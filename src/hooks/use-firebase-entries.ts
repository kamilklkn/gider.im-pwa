import { useState, useEffect } from 'react';
import { onSnapshot, query, where, orderBy, type QuerySnapshot } from 'firebase/firestore';
import { entriesCollection } from '@/firestore-collections';
import type { FirebaseEntry } from '@/types/firebase';
import * as firebaseService from '@/services/firebase-service';

export interface UseFirebaseEntriesReturn {
	entries: FirebaseEntry[];
	loading: boolean;
	error: Error | null;
	createEntry: (userId: string, entryData: Omit<FirebaseEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
	updateEntry: (entryId: string, updates: Partial<Omit<FirebaseEntry, 'id' | 'userId' | 'createdAt'>>) => Promise<void>;
	deleteEntry: (entryId: string) => Promise<void>;
}

export const useFirebaseEntries = (userId: string | null): UseFirebaseEntriesReturn => {
	const [entries, setEntries] = useState<FirebaseEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		if (!userId) {
			setEntries([]);
			setLoading(false);
			return;
		}

		setLoading(true);
		const q = query(entriesCollection, where('userId', '==', userId), where('isDeleted', '==', false), orderBy('date', 'asc'));

		const unsubscribe = onSnapshot(
			q,
			(snapshot: QuerySnapshot<FirebaseEntry>) => {
				const entriesData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as FirebaseEntry));
				setEntries(entriesData);
				setLoading(false);
				setError(null);
			},
			(err) => {
				setError(err);
				setLoading(false);
			},
		);

		return () => unsubscribe();
	}, [userId]);

	const handleCreateEntry = async (userId: string, entryData: Omit<FirebaseEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
		try {
			return await firebaseService.createEntry(userId, entryData);
		} catch (err) {
			setError(err as Error);
			throw err;
		}
	};

	const handleUpdateEntry = async (entryId: string, updates: Partial<Omit<FirebaseEntry, 'id' | 'userId' | 'createdAt'>>) => {
		try {
			await firebaseService.updateEntry(entryId, updates);
		} catch (err) {
			setError(err as Error);
			throw err;
		}
	};

	const handleDeleteEntry = async (entryId: string) => {
		try {
			await firebaseService.deleteEntry(entryId);
		} catch (err) {
			setError(err as Error);
			throw err;
		}
	};

	return {
		entries,
		loading,
		error,
		createEntry: handleCreateEntry,
		updateEntry: handleUpdateEntry,
		deleteEntry: handleDeleteEntry,
	};
};


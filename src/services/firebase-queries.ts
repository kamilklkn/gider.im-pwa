import { query, where, orderBy, type Query } from 'firebase/firestore';
import {
	entriesCollection,
	entryGroupsCollection,
	entryTagsCollection,
	recurringConfigsCollection,
	exclusionsCollection,
} from '@/firestore-collections';

/**
 * Create query for entries by user ID
 */
export const entriesByUserIdQuery = (userId: string): Query => {
	return query(entriesCollection, where('userId', '==', userId), where('isDeleted', '==', false), orderBy('date', 'asc'));
};

/**
 * Create query for entries by user ID and type
 */
export const entriesByUserIdAndTypeQuery = (userId: string, type: 'income' | 'expense'): Query => {
	return query(
		entriesCollection,
		where('userId', '==', userId),
		where('type', '==', type),
		where('isDeleted', '==', false),
		orderBy('date', 'asc'),
	);
};

/**
 * Create query for entry groups by user ID
 */
export const entryGroupsByUserIdQuery = (userId: string): Query => {
	return query(entryGroupsCollection, where('userId', '==', userId), where('isDeleted', '==', false), orderBy('createdAt', 'asc'));
};

/**
 * Create query for entry tags by user ID
 */
export const entryTagsByUserIdQuery = (userId: string): Query => {
	return query(entryTagsCollection, where('userId', '==', userId), where('isDeleted', '==', false), orderBy('createdAt', 'asc'));
};

/**
 * Create query for recurring configs by user ID
 */
export const recurringConfigsByUserIdQuery = (userId: string): Query => {
	return query(recurringConfigsCollection, where('userId', '==', userId), where('isDeleted', '==', false), orderBy('createdAt', 'asc'));
};

/**
 * Create query for exclusions by user ID and recurring ID
 */
export const exclusionsByRecurringIdQuery = (userId: string, recurringId: string): Query => {
	return query(
		exclusionsCollection,
		where('userId', '==', userId),
		where('recurringId', '==', recurringId),
		where('isDeleted', '==', false),
		orderBy('createdAt', 'asc'),
	);
};


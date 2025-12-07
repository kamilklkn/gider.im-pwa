import { Timestamp } from 'firebase/firestore';
import dayjs from 'dayjs';
import type { FirebaseEntry } from '@/types/firebase';

/**
 * Convert JavaScript Date to Firestore Timestamp
 */
export const dateToTimestamp = (date: Date | string): Timestamp => {
	return Timestamp.fromDate(typeof date === 'string' ? new Date(date) : date);
};

/**
 * Convert Firestore Timestamp to JavaScript Date
 */
export const timestampToDate = (timestamp: Timestamp): Date => {
	return timestamp.toDate();
};

/**
 * Convert Firestore Timestamp to dayjs
 */
export const timestampToDayjs = (timestamp: Timestamp): dayjs.Dayjs => {
	return dayjs(timestamp.toDate());
};

/**
 * Get current Firestore Timestamp
 */
export const now = (): Timestamp => {
	return Timestamp.now();
};

/**
 * Format amount string to number
 */
export const parseAmount = (amount: string): number => {
	return parseFloat(amount);
};

/**
 * Format number to amount string (8 decimal places)
 */
export const formatAmount = (amount: number): string => {
	return amount.toFixed(8);
};

/**
 * Validate Firebase entry data
 */
export const validateEntry = (entry: Partial<FirebaseEntry>): boolean => {
	if (!entry.name || entry.name.length === 0) return false;
	if (!entry.amount || parseFloat(entry.amount) <= 0) return false;
	if (!entry.currencyCode || entry.currencyCode.length !== 3) return false;
	if (!entry.type || !['income', 'expense'].includes(entry.type)) return false;
	return true;
};


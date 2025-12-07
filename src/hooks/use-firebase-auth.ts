import { useState, useEffect } from 'react';
import {
	signInAnonymously,
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	signOut,
	onAuthStateChanged,
	type User,
	type AuthError,
} from 'firebase/auth';
import { auth } from '@/firebase';

export interface UseFirebaseAuthReturn {
	user: User | null;
	loading: boolean;
	error: AuthError | null;
	signInAnonymously: () => Promise<void>;
	signInWithEmail: (email: string, password: string) => Promise<void>;
	signUpWithEmail: (email: string, password: string) => Promise<void>;
	signOut: () => Promise<void>;
}

export const useFirebaseAuth = (): UseFirebaseAuthReturn => {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<AuthError | null>(null);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(
			auth,
			(user) => {
				setUser(user);
				setLoading(false);
				setError(null);
			},
			(err) => {
				setError(err);
				setLoading(false);
			},
		);

		return () => unsubscribe();
	}, []);

	const handleSignInAnonymously = async () => {
		try {
			setError(null);
			await signInAnonymously(auth);
		} catch (err) {
			setError(err as AuthError);
			throw err;
		}
	};

	const handleSignInWithEmail = async (email: string, password: string) => {
		try {
			setError(null);
			await signInWithEmailAndPassword(auth, email, password);
		} catch (err) {
			setError(err as AuthError);
			throw err;
		}
	};

	const handleSignUpWithEmail = async (email: string, password: string) => {
		try {
			setError(null);
			await createUserWithEmailAndPassword(auth, email, password);
		} catch (err) {
			setError(err as AuthError);
			throw err;
		}
	};

	const handleSignOut = async () => {
		try {
			setError(null);
			await signOut(auth);
		} catch (err) {
			setError(err as AuthError);
			throw err;
		}
	};

	return {
		user,
		loading,
		error,
		signInAnonymously: handleSignInAnonymously,
		signInWithEmail: handleSignInWithEmail,
		signUpWithEmail: handleSignUpWithEmail,
		signOut: handleSignOut,
	};
};


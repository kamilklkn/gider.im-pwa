import React, { createContext, useContext, type ReactNode } from 'react';
import { useFirebaseAuth, type UseFirebaseAuthReturn } from '@/hooks/use-firebase-auth';

interface FirebaseAuthContextType extends UseFirebaseAuthReturn {}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(undefined);

export const useFirebaseAuthContext = (): FirebaseAuthContextType => {
	const context = useContext(FirebaseAuthContext);
	if (!context) {
		throw new Error('useFirebaseAuthContext must be used within FirebaseAuthProvider');
	}
	return context;
};

interface FirebaseAuthProviderProps {
	children: ReactNode;
}

export const FirebaseAuthProvider: React.FC<FirebaseAuthProviderProps> = ({ children }) => {
	const auth = useFirebaseAuth();

	return <FirebaseAuthContext.Provider value={auth}>{children}</FirebaseAuthContext.Provider>;
};


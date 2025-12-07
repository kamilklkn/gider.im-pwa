import { useEffect } from 'react';
import { db, auth } from '@/firebase';
import { useFirebaseAuthContext } from '@/providers/firebase-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function FirebaseDebug() {
	const { user } = useFirebaseAuthContext();

	useEffect(() => {
		console.log('🔍 Firebase Debug Info:');
		console.log('📊 Database:', db);
		console.log('🔐 Auth:', auth);
		console.log('👤 Current User:', user);
		console.log('🌍 Environment:', {
			apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing',
			authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing',
			projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing',
			storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ? '✅ Set' : '❌ Missing',
			messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? '✅ Set' : '❌ Missing',
			appId: import.meta.env.VITE_FIREBASE_APP_ID ? '✅ Set' : '❌ Missing',
		});
	}, [user]);

	return (
		<Card className="mt-4">
			<CardHeader>
				<CardTitle>🔍 Firebase Debug Info</CardTitle>
				<CardDescription>Console'da detaylı bilgi için F12'ye basın</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-2 text-sm">
					<div>
						<strong>User Status:</strong> {user ? `✅ Logged in (${user.uid})` : '❌ Not logged in'}
					</div>
					<div>
						<strong>Project ID:</strong> {import.meta.env.VITE_FIREBASE_PROJECT_ID || '❌ Not set'}
					</div>
					<div>
						<strong>API Key:</strong> {import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing'}
					</div>
					<div>
						<strong>Auth Domain:</strong> {import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '❌ Not set'}
					</div>
					<div className="mt-4 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs">
						💡 Tüm detaylar için tarayıcı console'unu açın (F12)
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

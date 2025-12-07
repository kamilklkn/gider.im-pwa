import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
	storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
	appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate Firebase config
const missingConfig = Object.entries(firebaseConfig)
	.filter(([_, value]) => !value || value === 'your-api-key-here' || value.includes('your-'))
	.map(([key]) => key);

if (missingConfig.length > 0) {
	console.error('❌ Firebase config eksik veya yanlış yapılandırılmış:', missingConfig);
	console.error('💡 Lütfen .env dosyasını kontrol edin ve Firebase Console\'dan config değerlerini ekleyin');
}

// Initialize Firebase
let app: FirebaseApp;
try {
	app = initializeApp(firebaseConfig);
	console.log('✅ Firebase initialized successfully');
	console.log('📊 Project ID:', firebaseConfig.projectId);
} catch (error) {
	console.error('❌ Firebase initialization failed:', error);
	throw error;
}

// Initialize Firestore
export const db: Firestore = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
	if (err.code === 'failed-precondition') {
		// Multiple tabs open, persistence can only be enabled in one tab at a time
		console.warn('Firestore persistence failed: Multiple tabs open');
	} else if (err.code === 'unimplemented') {
		// The current browser does not support all of the features required
		console.warn('Firestore persistence not available in this browser');
	}
});

// Initialize Auth
export const auth: Auth = getAuth(app);

// Expose Firebase to window for console debugging (development only)
if (import.meta.env.DEV && typeof window !== 'undefined') {
	(window as any).__firebase = {
		db,
		auth,
		app,
	};
	console.log('🔧 Firebase exposed to window.__firebase for debugging');
}

export default app;
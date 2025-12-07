import { useState } from 'react';
import { useFirebaseAuthContext } from '@/providers/firebase-auth';
import { useFirebaseEntries } from '@/hooks/use-firebase-entries';
import * as firebaseService from '@/services/firebase-service';
import { dateToTimestamp, formatAmount } from '@/lib/firebase-helpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FirebaseDebug } from './firebase-debug';

export function FirebaseTest() {
	const { user, loading: authLoading, signInAnonymously, signOut } = useFirebaseAuthContext();
	const { entries, loading: entriesLoading, createEntry } = useFirebaseEntries(user?.uid || null);
	const [testName, setTestName] = useState('Test Entry');
	const [testAmount, setTestAmount] = useState('100.00');
	const [testType, setTestType] = useState<'income' | 'expense'>('expense');
	const [isCreating, setIsCreating] = useState(false);
	const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);

	const handleSignIn = async () => {
		try {
			await signInAnonymously();
			console.log('✅ Signed in anonymously');
		} catch (error) {
			console.error('❌ Sign in error:', error);
		}
	};

	const handleCreateTestEntry = async () => {
		if (!user) {
			alert('Lütfen önce giriş yapın!');
			return;
		}

		setIsCreating(true);
		try {
			console.log('🚀 Starting entry creation...');
			console.log('👤 User ID:', user.uid);
			console.log('🔐 User authenticated:', user.uid ? '✅ Yes' : '❌ No');
			console.log('📝 Entry data:', {
				name: testName,
				amount: testAmount,
				type: testType,
			});

			// Validate Firebase connection
			const { db } = await import('@/firebase');
			console.log('📊 Firestore DB:', db ? '✅ Connected' : '❌ Not connected');

			const entryData = {
				date: dateToTimestamp(new Date()),
				type: testType,
				name: testName,
				amount: formatAmount(parseFloat(testAmount)),
				fullfilled: false,
				currencyCode: 'TRY',
				recurringId: null,
				groupId: null,
				tagId: null,
			};

			console.log('📦 Prepared entry data:', entryData);
			console.log('📦 Entry data with userId:', { userId: user.uid, ...entryData });

			// Try to create entry
			const entryId = await createEntry(user.uid, entryData);

			setLastCreatedId(entryId);
			console.log('✅ Entry created with ID:', entryId);
			console.log('📊 Entry data:', {
				userId: user.uid,
				name: testName,
				amount: formatAmount(parseFloat(testAmount)),
				type: testType,
			});

			// Verify entry was created by trying to read it
			try {
				const { getEntry } = await import('@/services/firebase-service');
				const createdEntry = await getEntry(entryId);
				if (createdEntry) {
					console.log('✅ Entry verified in Firebase:', createdEntry);
				} else {
					console.warn('⚠️ Entry created but not found when reading back');
				}
			} catch (verifyError) {
				console.warn('⚠️ Could not verify entry:', verifyError);
			}

			alert(`✅ Entry oluşturuldu!\nID: ${entryId}\n\nFirebase Console'da kontrol edebilirsiniz.`);
		} catch (error) {
			console.error('❌ Create entry error:', error);
			console.error('❌ Full error object:', JSON.stringify(error, null, 2));
			
			const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
			const errorCode = (error as { code?: string })?.code || 'unknown';
			const errorStack = error instanceof Error ? error.stack : '';
			
			console.error('🔍 Error code:', errorCode);
			console.error('🔍 Error message:', errorMessage);
			console.error('🔍 Error stack:', errorStack);
			
			let userMessage = `❌ Hata: ${errorMessage}\n\nError Code: ${errorCode}`;
			
			if (errorCode === 'permission-denied') {
				userMessage += '\n\n💡 Security Rules sorunu!\n';
				userMessage += 'Firebase Console > Firestore > Rules bölümünde test mode aktif olmalı:\n';
				userMessage += 'rules_version = \'2\';\n';
				userMessage += 'service cloud.firestore {\n';
				userMessage += '  match /databases/{database}/documents {\n';
				userMessage += '    match /{document=**} {\n';
				userMessage += '      allow read, write: if request.time < timestamp.date(2025, 12, 31);\n';
				userMessage += '    }\n';
				userMessage += '  }\n';
				userMessage += '}';
			} else if (errorCode === 'unavailable') {
				userMessage += '\n\n💡 Firebase bağlantısı yok. İnternet bağlantınızı kontrol edin.';
			} else if (errorCode === 'failed-precondition') {
				userMessage += '\n\n💡 Index eksik olabilir. Firebase Console\'da index oluşturmanız gerekebilir.';
			} else if (errorCode === 'unauthenticated') {
				userMessage += '\n\n💡 Kullanıcı giriş yapmamış. Lütfen önce giriş yapın.';
			}
			
			alert(userMessage);
		} finally {
			setIsCreating(false);
		}
	};

	const handleCreateViaService = async () => {
		if (!user) {
			alert('Lütfen önce giriş yapın!');
			return;
		}

		setIsCreating(true);
		try {
			const entryId = await firebaseService.createEntry(user.uid, {
				date: dateToTimestamp(new Date()),
				type: testType,
				name: `Service Test - ${Date.now()}`,
				amount: formatAmount(parseFloat(testAmount)),
				fullfilled: false,
				currencyCode: 'TRY',
				recurringId: null,
				groupId: null,
				tagId: null,
			});

			console.log('✅ Entry created via service with ID:', entryId);
			alert(`✅ Entry oluşturuldu (Service)!\nID: ${entryId}`);
		} catch (error) {
			console.error('❌ Service create error:', error);
			alert(`❌ Hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
		} finally {
			setIsCreating(false);
		}
	};

	if (authLoading) {
		return <div className="p-4">Loading auth...</div>;
	}

	return (
		<div className="container mx-auto p-4 max-w-4xl">
			<Card className="mb-4">
				<CardHeader>
					<CardTitle>🔥 Firebase Test</CardTitle>
					<CardDescription>Firebase entegrasyonunu test etmek için bu component'i kullanın</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Auth Status */}
					<div className="p-4 bg-muted rounded-lg">
						<h3 className="font-semibold mb-2">Auth Durumu:</h3>
						{user ? (
							<div>
								<p className="text-green-600">✅ Giriş yapıldı</p>
								<p className="text-sm text-muted-foreground mt-1">User ID: {user.uid}</p>
								<Button onClick={signOut} variant="outline" className="mt-2">
									Çıkış Yap
								</Button>
							</div>
						) : (
							<div>
								<p className="text-orange-600">⚠️ Giriş yapılmadı</p>
								<Button onClick={handleSignIn} className="mt-2">
									Anonymous Giriş Yap
								</Button>
							</div>
						)}
					</div>

					{/* Create Entry Form */}
					{user && (
						<div className="space-y-4 p-4 border rounded-lg">
							<h3 className="font-semibold">Test Entry Oluştur</h3>

							<div className="space-y-2">
								<Label htmlFor="testName">İsim</Label>
								<Input id="testName" value={testName} onChange={(e) => setTestName(e.target.value)} placeholder="Entry ismi" />
							</div>

							<div className="space-y-2">
								<Label htmlFor="testAmount">Tutar</Label>
								<Input id="testAmount" type="number" value={testAmount} onChange={(e) => setTestAmount(e.target.value)} placeholder="100.00" />
							</div>

							<div className="space-y-2">
								<Label htmlFor="testType">Tip</Label>
								<select
									id="testType"
									value={testType}
									onChange={(e) => setTestType(e.target.value as 'income' | 'expense')}
									className="w-full p-2 border rounded"
								>
									<option value="income">Gelir</option>
									<option value="expense">Gider</option>
								</select>
							</div>

							<div className="flex gap-2">
								<Button onClick={handleCreateTestEntry} disabled={isCreating}>
									{isCreating ? 'Oluşturuluyor...' : 'Hook ile Oluştur'}
								</Button>
								<Button onClick={handleCreateViaService} disabled={isCreating} variant="outline">
									{isCreating ? 'Oluşturuluyor...' : 'Service ile Oluştur'}
								</Button>
							</div>

							{lastCreatedId && (
								<div className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm">
									<p className="font-semibold">Son oluşturulan ID:</p>
									<code className="text-xs">{lastCreatedId}</code>
								</div>
							)}
						</div>
					)}

					{/* Entries List */}
					{user && (
						<div className="p-4 border rounded-lg">
							<h3 className="font-semibold mb-2">Entries ({entries.length})</h3>
							{entriesLoading ? (
								<p>Loading entries...</p>
							) : entries.length === 0 ? (
								<p className="text-muted-foreground">Henüz entry yok</p>
							) : (
								<div className="space-y-2 max-h-60 overflow-y-auto">
									{entries.map((entry) => (
										<div key={entry.id} className="p-2 bg-muted rounded text-sm">
											<div className="flex justify-between">
												<span className="font-medium">{entry.name}</span>
												<span className={entry.type === 'income' ? 'text-green-600' : 'text-red-600'}>
													{entry.type === 'income' ? '+' : '-'} {entry.amount} {entry.currencyCode}
												</span>
											</div>
											<div className="text-xs text-muted-foreground mt-1">
												ID: {entry.id} | Date: {entry.date.toDate().toLocaleDateString()}
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					)}

					{/* Debug Info */}
					<FirebaseDebug />

					{/* Instructions */}
					<div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
						<h3 className="font-semibold mb-2">📋 Test Adımları:</h3>
						<ol className="list-decimal list-inside space-y-1 text-sm">
							<li>Anonymous giriş yapın</li>
							<li>Bir test entry oluşturun</li>
							<li>
								<a
									href="https://console.firebase.google.com"
									target="_blank"
									rel="noopener noreferrer"
									className="text-blue-600 underline"
								>
									Firebase Console
								</a>
								'da Firestore Database &gt; entries collection'ı kontrol edin
							</li>
							<li>Verilerin göründüğünü doğrulayın</li>
						</ol>
					</div>

					{/* Console Info */}
					<div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
						<h3 className="font-semibold mb-2">🔍 Console Logları:</h3>
						<p className="text-sm text-muted-foreground">
							Tarayıcı console'unu açın (F12) ve işlem loglarını kontrol edin. Tüm işlemler console'a yazdırılıyor.
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}



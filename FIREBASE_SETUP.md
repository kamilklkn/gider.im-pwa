# Firebase Entegrasyonu Kurulum Rehberi

Bu dokümantasyon, gider.im PWA projesine Firebase entegrasyonunun nasıl yapılandırılacağını açıklar.

## 📋 İçindekiler

1. [Firebase Projesi Oluşturma](#1-firebase-projesi-oluşturma)
2. [Ortam Değişkenlerini Yapılandırma](#2-ortam-değişkenlerini-yapılandırma)
3. [Firestore Security Rules](#3-firestore-security-rules)
4. [Kullanım Örnekleri](#4-kullanım-örnekleri)
5. [Mevcut Kod ile Entegrasyon](#5-mevcut-kod-ile-entegrasyon)

---

## 1. Firebase Projesi Oluşturma

### Adım 1: Firebase Console'a Giriş
1. [Firebase Console](https://console.firebase.google.com) adresine gidin
2. Google hesabınızla giriş yapın

### Adım 2: Yeni Proje Oluştur
1. "Add project" butonuna tıklayın
2. Proje adı: `gider-im` (veya istediğiniz bir isim)
3. Google Analytics: İsteğe bağlı (privacy-first için kapatabilirsiniz)
4. "Create project" butonuna tıklayın

### Adım 3: Firestore Database Oluştur
1. Sol menüden "Firestore Database" seçin
2. "Create database" butonuna tıklayın
3. **Test mode** ile başlayın (geliştirme için)
4. Location seçin (ör: `europe-west3` - Frankfurt)
5. "Enable" butonuna tıklayın

### Adım 4: Web App Ekle
1. Project Settings (⚙️) > General sekmesine gidin
2. "Your apps" bölümünde Web (</>) ikonuna tıklayın
3. App nickname: `gider-im-web`
4. Firebase Hosting: Şimdilik atlayın
5. "Register app" butonuna tıklayın
6. **Config bilgilerini kopyalayın** (daha sonra kullanılacak)

### Adım 5: Authentication Etkinleştir (Opsiyonel)
1. Sol menüden "Authentication" seçin
2. "Get started" butonuna tıklayın
3. "Sign-in method" sekmesine gidin
4. **Anonymous** provider'ı etkinleştirin (privacy için önerilir)
5. (Opsiyonel) **Email/Password** provider'ı etkinleştirin

---

## 2. Ortam Değişkenlerini Yapılandırma

### Adım 1: .env Dosyası Oluştur
Proje kök dizininde `.env` dosyası oluşturun:

```bash
cp .env.example .env
```

### Adım 2: Firebase Config Değerlerini Doldur
`.env` dosyasını açın ve Firebase Console'dan aldığınız değerleri doldurun:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=gider-im.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=gider-im
VITE_FIREBASE_STORAGE_BUCKET=gider-im.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

**Not**: Bu değerleri Firebase Console > Project Settings > General > Your apps > Web app config bölümünden alabilirsiniz.

---

## 3. Firestore Security Rules

Firebase Console > Firestore Database > Rules sekmesine gidin ve aşağıdaki kuralları yapıştırın:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the document
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Entries collection
    match /entries/{entryId} {
      allow read, write: if isOwner(resource.data.userId);
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
    }
    
    // Entry Groups collection
    match /entryGroups/{groupId} {
      allow read, write: if isOwner(resource.data.userId);
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
    }
    
    // Entry Tags collection
    match /entryTags/{tagId} {
      allow read, write: if isOwner(resource.data.userId);
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
    }
    
    // Recurring Configs collection
    match /recurringConfigs/{configId} {
      allow read, write: if isOwner(resource.data.userId);
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
    }
    
    // Exclusions collection
    match /exclusions/{exclusionId} {
      allow read, write: if isOwner(resource.data.userId);
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

"Publish" butonuna tıklayarak kuralları kaydedin.

---

## 4. Kullanım Örnekleri

### Auth Kullanımı

```typescript
import { useFirebaseAuthContext } from '@/providers/firebase-auth';

function MyComponent() {
  const { user, loading, signInAnonymously, signOut } = useFirebaseAuthContext();

  if (loading) return <div>Loading...</div>;
  
  if (!user) {
    return <button onClick={signInAnonymously}>Sign In</button>;
  }

  return (
    <div>
      <p>User ID: {user.uid}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Entries Kullanımı

```typescript
import { useFirebaseEntries } from '@/hooks/use-firebase-entries';
import { useFirebaseAuthContext } from '@/providers/firebase-auth';
import { dateToTimestamp, formatAmount } from '@/lib/firebase-helpers';

function EntriesComponent() {
  const { user } = useFirebaseAuthContext();
  const { entries, loading, createEntry } = useFirebaseEntries(user?.uid || null);

  const handleCreate = async () => {
    if (!user) return;
    
    await createEntry(user.uid, {
      date: dateToTimestamp(new Date()),
      type: 'expense',
      name: 'Coffee',
      amount: formatAmount(10.50),
      fullfilled: false,
      currencyCode: 'TRY',
      recurringId: null,
      groupId: null,
      tagId: null,
    });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <button onClick={handleCreate}>Add Entry</button>
      {entries.map(entry => (
        <div key={entry.id}>{entry.name}: {entry.amount}</div>
      ))}
    </div>
  );
}
```

### Service Layer Kullanımı

```typescript
import * as firebaseService from '@/services/firebase-service';
import { dateToTimestamp, formatAmount } from '@/lib/firebase-helpers';

// Create entry
const entryId = await firebaseService.createEntry(userId, {
  date: dateToTimestamp(new Date()),
  type: 'income',
  name: 'Salary',
  amount: formatAmount(5000),
  fullfilled: true,
  currencyCode: 'TRY',
  recurringId: null,
  groupId: null,
  tagId: null,
});

// Get entries
const entries = await firebaseService.getEntries(userId);

// Update entry
await firebaseService.updateEntry(entryId, {
  fullfilled: true,
});

// Delete entry (soft delete)
await firebaseService.deleteEntry(entryId);
```

---

## 5. Mevcut Kod ile Entegrasyon

### Provider'ı Ana Uygulamaya Ekle

`src/main.tsx` dosyasını güncelleyin:

```typescript
import { FirebaseAuthProvider } from '@/providers/firebase-auth';

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <FirebaseAuthProvider>
      <EvoluProvider value={evolu}>
        {/* ... diğer provider'lar */}
      </EvoluProvider>
    </FirebaseAuthProvider>
  </React.StrictMode>,
);
```

### Hybrid Yaklaşım (Önerilen)

Mevcut Evolu kodunu koruyup, Firebase'i backup/sync için kullanabilirsiniz:

1. **Local-first**: Evolu ile local storage'da çalışmaya devam edin
2. **Cloud backup**: Firebase'e periyodik olarak veri yedekleyin
3. **Sync**: İki yönlü sync mekanizması ekleyin

### Tam Geçiş

Eğer tamamen Firebase'e geçmek isterseniz:

1. `evolu-queries.ts` dosyasındaki fonksiyonları Firebase service fonksiyonlarıyla değiştirin
2. `useQuery` hook'larını Firebase hooks ile değiştirin
3. Real-time listeners ekleyin

---

## 📝 Önemli Notlar

1. **Privacy**: Firebase Google servisi olduğu için privacy-first yaklaşımınızı göz önünde bulundurun
2. **Offline Support**: Firestore offline persistence otomatik olarak etkinleştirilmiştir
3. **Cost**: Ücretsiz tier limitlerini aşmamaya dikkat edin
4. **Security**: Production'da Security Rules'ı mutlaka test edin

---

## 🔧 Troubleshooting

### "Firebase: Error (auth/configuration-not-found)"
- `.env` dosyasının doğru yapılandırıldığından emin olun
- Firebase config değerlerinin doğru olduğunu kontrol edin

### "Missing or insufficient permissions"
- Security Rules'ın doğru yapılandırıldığını kontrol edin
- Kullanıcının authenticated olduğundan emin olun

### "Index required"
- Firebase Console > Firestore > Indexes sekmesine gidin
- Gerekli index'leri oluşturun

---

## 📚 Daha Fazla Bilgi

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)



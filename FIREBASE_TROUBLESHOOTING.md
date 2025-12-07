# Firebase Sorun Giderme Rehberi

## Veriler Firebase'e Insert Olmuyor

### 1. Security Rules Kontrolü (En Yaygın Sorun)

Firebase Console > Firestore Database > Rules sekmesine gidin.

**Test Mode (Geliştirme için):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 12, 31);
    }
  }
}
```

**Production Rules (Kullanıcı bazlı):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    match /entries/{entryId} {
      allow read, write: if isOwner(resource.data.userId);
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
    }
    
    match /entryGroups/{groupId} {
      allow read, write: if isOwner(resource.data.userId);
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
    }
    
    match /entryTags/{tagId} {
      allow read, write: if isOwner(resource.data.userId);
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
    }
    
    match /recurringConfigs/{configId} {
      allow read, write: if isOwner(resource.data.userId);
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
    }
    
    match /exclusions/{exclusionId} {
      allow read, write: if isOwner(resource.data.userId);
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

**Önemli:** Rules'ı değiştirdikten sonra "Publish" butonuna tıklayın!

---

### 2. Authentication Kontrolü

1. Firebase Console > Authentication > Sign-in method
2. **Anonymous** provider'ın etkin olduğundan emin olun
3. Test component'inde "Anonymous Giriş Yap" butonuna tıklayın
4. Console'da `✅ Signed in anonymously` mesajını kontrol edin

---

### 3. Index Eksikliği

Eğer `failed-precondition` hatası alıyorsanız, index oluşturmanız gerekebilir:

1. Firebase Console > Firestore Database > Indexes
2. Hata mesajında belirtilen index'i oluşturun
3. Genellikle şu index gerekir:
   - Collection: `entries`
   - Fields: `userId` (Ascending), `isDeleted` (Ascending), `date` (Ascending)

---

### 4. Console Logları Kontrolü

Tarayıcı console'unu açın (F12) ve şu logları kontrol edin:

**Başarılı durumda görmeniz gerekenler:**
```
✅ Firebase initialized successfully
📊 Project ID: gider-uygulamasi
✅ Signed in anonymously
🚀 Starting entry creation...
👤 User ID: abc123...
📤 Creating entry in Firebase: {...}
✅ Entry created successfully with ID: xyz789
```

**Hata durumunda:**
```
❌ Error creating entry: [error object]
🔍 Error code: permission-denied
🔍 Error message: Missing or insufficient permissions
```

---

### 5. Offline Persistence Sorunu

Firestore offline persistence aktifse, veriler önce local'e kaydedilir. İnternet bağlantısı olmadığında Firebase'e senkronize olmayabilir.

**Kontrol:**
- İnternet bağlantınızın olduğundan emin olun
- Network tab'ında Firebase isteklerini kontrol edin
- Console'da `Firestore persistence failed` uyarısı var mı kontrol edin

---

### 6. .env Dosyası Kontrolü

`.env` dosyasının doğru yapılandırıldığından emin olun:

```bash
# .env dosyasını kontrol edin
cat .env
```

Tüm değerlerin dolu olduğundan emin olun:
- `VITE_FIREBASE_API_KEY=...`
- `VITE_FIREBASE_AUTH_DOMAIN=...`
- `VITE_FIREBASE_PROJECT_ID=...`
- vb.

**Önemli:** `.env` değişikliklerinden sonra server'ı yeniden başlatın!

---

### 7. Firebase Console'da Manuel Kontrol

1. [Firebase Console](https://console.firebase.google.com) → Projeniz
2. Firestore Database → Data sekmesi
3. `entries` collection'ını kontrol edin
4. Eğer collection yoksa, ilk veri yazıldığında otomatik oluşur

---

### 8. Network Tab Kontrolü

1. Tarayıcı DevTools > Network sekmesi
2. Test entry oluştururken network isteklerini izleyin
3. `firestore.googleapis.com` isteklerini kontrol edin
4. Hata varsa response'u inceleyin

---

## Hızlı Test Adımları

1. ✅ `.env` dosyası doğru yapılandırıldı mı?
2. ✅ Server yeniden başlatıldı mı? (`pnpm dev`)
3. ✅ Firebase Console'da Anonymous Auth etkin mi?
4. ✅ Security Rules test mode'da mı?
5. ✅ Tarayıcı console'unda hata var mı?
6. ✅ Network tab'ında Firebase istekleri başarılı mı?

---

## Yaygın Hata Kodları

| Hata Kodu | Anlamı | Çözüm |
|-----------|--------|-------|
| `permission-denied` | Security Rules izin vermiyor | Rules'ı test mode'a alın |
| `unauthenticated` | Kullanıcı giriş yapmamış | Anonymous giriş yapın |
| `failed-precondition` | Index eksik | Firebase Console'da index oluşturun |
| `unavailable` | Bağlantı yok | İnternet bağlantısını kontrol edin |
| `invalid-argument` | Veri formatı yanlış | Entry data formatını kontrol edin |

---

## Debug Komutları

Tarayıcı console'unda çalıştırabileceğiniz komutlar:

```javascript
// Firebase bağlantısını kontrol et
import { db, auth } from '@/firebase';
console.log('DB:', db);
console.log('Auth:', auth);
console.log('User:', auth.currentUser);

// Collection'ı kontrol et
import { entriesCollection } from '@/firestore-collections';
console.log('Collection:', entriesCollection);
```

---

## Hala Çalışmıyorsa

1. Tüm console loglarını kopyalayın
2. Network tab'ındaki Firebase isteklerini screenshot alın
3. Firebase Console > Firestore > Rules'ı kontrol edin
4. Hata mesajını tam olarak paylaşın


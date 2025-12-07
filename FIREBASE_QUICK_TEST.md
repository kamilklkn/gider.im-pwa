# Firebase Hızlı Test Rehberi

## Console'da Firebase Kontrolü

Tarayıcı console'unu açın (F12) ve şu komutu çalıştırın:

```javascript
// Firebase'in başlatılıp başlatılmadığını kontrol et
if (window.__firebase) {
  const { db, auth } = window.__firebase;
  console.log('✅ Firebase başlatıldı!');
  console.log('📊 Database:', db);
  console.log('🔐 Auth:', auth);
  console.log('👤 Current User:', auth.currentUser);
  console.log('🌍 Environment:', {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '❌ Not set',
  });
} else {
  console.error('❌ Firebase henüz başlatılmamış. Sayfayı yenileyin.');
}
```

## Firebase Test Sayfasına Gitme

1. Uygulamada **Settings (Ayarlar)** sayfasına gidin
2. **"🔥 Firebase Test"** bölümünü bulun
3. **"Test Et"** butonuna tıklayın
4. Firebase Test paneli açılacak

## Test Adımları

1. **Anonymous Giriş Yap** butonuna tıklayın
   - Console'da `✅ Signed in anonymously` görmelisiniz
   
2. **Test Entry Oluştur** butonuna tıklayın
   - Console'da şu logları görmelisiniz:
     - `🚀 Starting entry creation...`
     - `📤 Creating entry in Firebase`
     - `✅ Entry created successfully with ID: ...`

3. **Firebase Console'da Kontrol Edin**
   - [Firebase Console](https://console.firebase.google.com) → Projeniz
   - Firestore Database → Data sekmesi
   - `entries` collection'ını kontrol edin

## Console Filtreleme

Console'da sadece Firebase loglarını görmek için:

1. Console'da filtre kutusuna `Firebase` yazın
2. Veya şu emojileri arayın: `✅`, `📊`, `🔍`, `📤`

## Beklenen Loglar

Başarılı durumda console'da şunları görmelisiniz:

```
✅ Firebase initialized successfully
📊 Project ID: gider-uygulamasi
🔍 Firebase Debug Info:
📊 Database: Firestore {...}
🔐 Auth: FirebaseAuth {...}
👤 Current User: null (giriş yapmadan önce)
✅ Signed in anonymously
👤 Current User: FirebaseUser {...}
🚀 Starting entry creation...
👤 User ID: abc123...
📤 Creating entry in Firebase: {...}
✅ Entry created successfully with ID: xyz789
📊 Full entry data: {...}
```

## Sorun Giderme

### Firebase logları görünmüyorsa:

1. **Sayfayı hard refresh yapın:**
   - Mac: `Cmd + Shift + R`
   - Windows/Linux: `Ctrl + Shift + R`

2. **Dev server'ı yeniden başlatın:**
   ```bash
   # Terminal'de Ctrl+C ile durdurun
   pnpm dev
   ```

3. **Console'da hata var mı kontrol edin:**
   - `❌ Firebase config eksik` → `.env` dosyasını kontrol edin
   - `❌ Firebase initialization failed` → Firebase config değerlerini kontrol edin

### Veriler Firebase'e gitmiyorsa:

1. **Security Rules kontrol edin:**
   - Firebase Console → Firestore Database → Rules
   - Test mode'da olmalı:
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

2. **Anonymous Authentication etkin mi:**
   - Firebase Console → Authentication → Sign-in method
   - Anonymous provider'ın etkin olduğundan emin olun

3. **Network tab'ını kontrol edin:**
   - DevTools → Network sekmesi
   - `firestore.googleapis.com` isteklerini kontrol edin
   - Hata varsa response'u inceleyin


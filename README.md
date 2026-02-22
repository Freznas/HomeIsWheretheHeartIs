# 🏠 Home Is Where The Hearth Is

En heltäckande mobilapp för hushållshantering som hjälper familjer och sammanboendegrupper att organisera sitt gemensamma liv.

## 📱 Funktioner

### Huvudfunktioner
- **👥 Hushållshantering** - Skapa och hantera hushåll med flera medlemmar
- **✅ Sysslor** - Skapa, tilldela och spåra hushållssysslor med notifikationer
- **🛒 Inköpslistor** - Delade inköpslistor med kategorier och färdigkryssning
- **💰 Räkningar** - Spåra och få påminnelser om kommande betalningar
- **📅 Kalender** - Synkronisera familjehändelser med telefonens kalender
- **💬 Kommunikation** - Inbyggd chat för hushållsmedlemmar
- **🌤️ Väder** - Lokal väderprognoser baserat på position
- **👋 Besökare** - Hantera och spåra förväntade besökare
- **🍱 Skafferi** - Håll koll på vad som finns hemma och utgångsdatum
- **📝 Anteckningar** - Delade anteckningar för hushållet

### Tekniska funktioner
- 📴 **Offline-support** - Fungerar utan internetanslutning
- 🔔 **Push-notifikationer** - Påminnelser för sysslor, räkningar och händelser
- 🌍 **Flerspråkig** - Svenska och Engelska
- 🎨 **Mörkt/ljust tema** - Anpassningsbart utseende
- 🔐 **Säker autentisering** - Firebase Auth med 2FA via email
- 📱 **Cross-platform** - iOS och Android

## 🚀 Komma igång

### Förutsättningar

- Node.js (v16 eller senare)
- npm eller yarn
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)
- Firebase-konto
- SendGrid-konto (för 2FA email)

### Installation

1. **Klona projektet**
   ```bash
   git clone <repository-url>
   cd HomeIsWheretheHeartIs
   ```

2. **Installera dependencies**
   ```bash
   npm install
   cd backend
   npm install
   cd ..
   ```

3. **Konfigurera environment variables**
   
   Skapa `.env` i root-mappen:
   ```bash
   cp .env.example .env
   ```
   
   Fyll i dina Firebase credentials i `.env`:
   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
   EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
   EXPO_PUBLIC_API_URL=http://localhost:3000
   ```

   Skapa `backend/.env`:
   ```bash
   cd backend
   cp .env.example .env
   ```
   
   Fyll i dina SendGrid credentials:
   ```env
   SENDGRID_API_KEY=your_sendgrid_api_key
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   PORT=3000
   ```

4. **Konfigurera Firebase**
   
   Se [FIREBASE_SETUP.md](FIREBASE_SETUP.md) för detaljerade instruktioner om:
   - Skapa Firebase-projekt
   - Aktivera Authentication med Email/Password
   - Skapa Firestore-databas
   - Konfigurera säkerhetsregler
   - Aktivera Storage

5. **Starta backend-servern**
   ```bash
   cd backend
   npm start
   ```
   
   Servern körs nu på `http://localhost:3000`

6. **Starta Expo-appen**
   
   I en ny terminal:
   ```bash
   npm start
   ```
   
   - Scanna QR-koden med Expo Go-appen (iOS/Android)
   - Eller tryck `i` för iOS-simulator
   - Eller tryck `a` för Android-emulator

## 📦 Bygga för produktion

### Konfigurera EAS Build

EAS-projektet är redan konfigurerat. Se [eas.json](eas.json) för build-profiler.

### Bygga för Android
```bash
npm run build:android
```

### Bygga för iOS
```bash
npm run build:ios
```

### Bygga för båda plattformarna
```bash
npm run build:all
```

### Submitting till App Stores
```bash
eas submit -p [ios|android]
```

## 🏗️ Teknisk stack

- **Framework:** React Native med Expo (~54.0)
- **Navigation:** React Navigation 7
- **Backend:** Express.js med SendGrid
- **Database:** Firebase Firestore
- **Authentication:** Firebase Auth
- **Storage:** Firebase Storage
- **Notifications:** Expo Notifications
- **State Management:** React Context API
- **UI Components:** React Native Paper

## 📂 Projektstruktur

```
HomeIsWheretheHeartIs/
├── assets/                 # Bilder, ikoner, splash screens
├── backend/               # Express.js backend för 2FA
│   ├── server.js         # Huvudserver-fil
│   └── package.json      
├── components/           
│   ├── common/           # Återanvändbara komponenter
│   └── sections/         # Sektionsspecifika komponenter
├── config/              
│   ├── firebase.js       # Firebase-konfiguration och funktioner
│   └── firebase.template.js
├── context/              # React Context providers
│   ├── AuthContext.js    # Autentisering
│   ├── ThemeContext.js   # Tema (mörk/ljus)
│   ├── LanguageContext.js # Språk (sv/en)
│   ├── NotificationsContext.js
│   ├── OfflineContext.js
│   └── ToastContext.js
├── hooks/                # Custom React hooks
├── screens/             
│   ├── auth/            # Login, Register, Household Setup
│   └── main/            # Huvudskärmar för alla funktioner
├── services/            # Tjänster och utilities
├── styles/              # Globala styles och tema
└── utils/               # Hjälpfunktioner

```

## 🔐 Säkerhet

- Firebase Security Rules är konfigurerade för att endast tillåta autentiserade användare
- Användare kan endast se data från sitt eget hushåll
- 2FA via email för extra säkerhet
- Rate limiting på backend för att förhindra missbruk
- Environment variables för känslig data
- Console logs tas bort i production builds

Se [SECURITY_AND_IMPROVEMENTS.md](SECURITY_AND_IMPROVEMENTS.md) för mer information.

## 📖 Dokumentation

- [FIREBASE_SETUP.md](FIREBASE_SETUP.md) - Firebase-konfiguration
- [FIREBASE_SECURITY_RULES_UPDATED.md](FIREBASE_SECURITY_RULES_UPDATED.md) - Säkerhetsregler
- [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md) - Google OAuth (valfritt)
- [BACKEND_URLS_FIXED.md](BACKEND_URLS_FIXED.md) - Backend URL-konfiguration
- [SECURITY_AND_IMPROVEMENTS.md](SECURITY_AND_IMPROVEMENTS.md) - Säkerhet och förbättringar

## 🤝 Bidra

Projektet är för närvarande privat. Kontakta projektägaren för mer information.

## 📄 Licens

0BSD - Se LICENSE-fil för detaljer

## 🐛 Felsökning

### Problem med Firebase-anslutning
- Kontrollera att alla environment variables är korrekt satta
- Verifiera att Firebase-projektet är korrekt konfigurerat
- Se till att Firestore Security Rules är deployade

### Backend-problem
- Kontrollera att backend-servern körs på rätt port
- Verifiera SendGrid API-key
- Kolla backend-loggar för felmeddelanden

### Build-problem
- Kör `expo doctor` för att diagnostisera problem
- Rensa cache: `expo start -c`
- Reinstallera dependencies: `rm -rf node_modules && npm install`

## 📞 Support

För support och frågor, kontakta utvecklingsteamet.

---

**Version:** 1.0.0  
**Expo SDK:** ~54.0  
**React Native:** 0.81.5

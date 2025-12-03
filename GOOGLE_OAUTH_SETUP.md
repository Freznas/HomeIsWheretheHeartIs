# Google OAuth & 2FA Setup Guide

## 🔐 2FA (Tvåfaktorsautentisering)

### Implementerat med TOTP (Time-based One-Time Password)

**Paket som används:**
- `otplib` - Genererar och verifierar TOTP-koder
- `react-native-qrcode-svg` - Visar QR-koder för Authenticator-appar
- `expo-crypto` - Kryptografiska funktioner

**Funktioner:**
- ✅ Genererar unika hemliga nycklar per användare
- ✅ Visar QR-kod för scanning med Google Authenticator, Authy, etc.
- ✅ Verifierar 6-siffriga koder med 90 sekunders tidsföränster
- ✅ Kräver 2FA för känsliga operationer (lösenordsbyte, kontoborttagning)
- ✅ Demo-läge visar aktuell giltig kod för testning

**Användarflöde:**
1. Aktivera 2FA i Profilinställningar
2. Scanna QR-kod med Authenticator-app (eller ange manuell nyckel)
3. Bekräfta med 6-siffrig kod från appen
4. Vid känsliga operationer krävs ny kod

---

## 🔴 Google OAuth Integration

### Setup-steg

#### 1. Google Cloud Console
1. Gå till [Google Cloud Console](https://console.cloud.google.com/)
2. Skapa nytt projekt eller välj befintligt
3. Aktivera **Google+ API** (eller Google Identity)
4. Gå till **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**

#### 2. Konfigurera OAuth Consent Screen
- User Type: External
- App name: HomeIsWhereTheHeartIs
- User support email: Din email
- Developer contact: Din email
- Lägg till scopes: `email`, `profile`

#### 3. Skapa OAuth 2.0 Credentials

**För Expo/React Native:**

**Web Client ID:**
```
Application type: Web application
Authorized redirect URIs:
  - https://auth.expo.io/@YOUR_EXPO_USERNAME/HomeIsWheretheHeartIs
```

**iOS Client ID:**
```
Application type: iOS
Bundle ID: Hämta från app.json eller Expo
```

**Android Client ID:**
```
Application type: Android
Package name: Hämta från app.json
SHA-1: Kör: expo credentials:manager -p android
```

#### 4. Uppdatera AuthContext.js

Ersätt placeholder-värdena i `context/AuthContext.js`:

```javascript
const [request, response, promptAsync] = Google.useAuthRequest({
  expoClientId: 'DIN_EXPO_CLIENT_ID.apps.googleusercontent.com',
  iosClientId: 'DIN_IOS_CLIENT_ID.apps.googleusercontent.com',
  androidClientId: 'DIN_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  webClientId: 'DIN_WEB_CLIENT_ID.apps.googleusercontent.com',
});
```

#### 5. Lägg till Redirect URI i app.json (om inte redan finns)

```json
{
  "expo": {
    "scheme": "homeiswheretheheartis",
    "android": {
      "googleServicesFile": "./google-services.json"
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.homeiswheretheheartis",
      "googleServicesFile": "./GoogleService-Info.plist"
    }
  }
}
```

#### 6. Testning

**Development:**
```bash
npx expo start
```

**Production Build:**
```bash
eas build --platform ios
eas build --platform android
```

---

## 📱 Backend-integration (TODO)

För fullt fungerande 2FA och OAuth behövs en backend:

### 2FA Backend
```javascript
// POST /api/auth/2fa/enable
{
  userId: string,
  secret: string // Spara krypterat!
}

// POST /api/auth/2fa/verify
{
  userId: string,
  code: string
}
```

### Google OAuth Backend
```javascript
// POST /api/auth/google
{
  accessToken: string
}

// Returnerar:
{
  user: {
    id, email, name, ...
  },
  sessionToken: string
}
```

**Rekommenderade paket för backend:**
- `otplib` - TOTP-verifiering
- `google-auth-library` - Verifiera Google tokens
- `bcrypt` - Hasha lösenord
- `jsonwebtoken` - Session tokens

---

## 🔒 Säkerhetsnoteringar

1. **2FA Secrets:**
   - Spara aldrig secrets i klartext
   - Använd kryptering (AES-256)
   - Lagra i säker databas

2. **Google Tokens:**
   - Verifiera alltid tokens server-side
   - Använd `google-auth-library` för att verifiera
   - Kontrollera audience och issuer

3. **Session Management:**
   - Använd JWT med kort livstid (15 min)
   - Refresh tokens för förlängning
   - Logga ut från alla enheter vid misstänkt aktivitet

4. **Rate Limiting:**
   - Begränsa 2FA-försök (5 per minut)
   - Begränsa OAuth-försök
   - IP-baserad throttling

---

## 📚 Användbara länkar

- [expo-auth-session docs](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [otplib Documentation](https://github.com/yeojz/otplib)
- [TOTP RFC 6238](https://tools.ietf.org/html/rfc6238)

---

## 🧪 Demo-läge

För testning utan backend:
- 2FA visar aktuell giltig kod i UI
- Google OAuth kräver riktiga credentials
- AsyncStorage används för lokal persistence

**Ta bort demo-funktioner innan production!**

# Firebase Setup Guide för Home Is Where The Hearth Is

## Steg 1: Skapa Firebase-projekt

1. Gå till [Firebase Console](https://console.firebase.google.com/)
2. Klicka på "Lägg till projekt" / "Add project"
3. Ge projektet namnet: **HomeIsWhereTheHearthIs**
4. Aktivera Google Analytics (valfritt)
5. Klicka på "Skapa projekt"

## Steg 2: Lägg till Web App

1. I Firebase Console, klicka på webb-ikonen (</>) för att lägga till en webbapp
2. Ge appen ett smeknamn: **Home App**
3. Klicka på "Registrera app"
4. Kopiera Firebase-konfigurationen (du kommer få något liknande detta):

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "homeiswherethehearthis.firebaseapp.com",
  projectId: "homeiswherethehearthis",
  storageBucket: "homeiswherethehearthis.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

## Steg 3: Uppdatera config/firebase.js

Öppna `config/firebase.js` och ersätt platsinnehållarna:

```javascript
const firebaseConfig = {
  apiKey: "DIN_API_KEY_HÄR",
  authDomain: "DIN_AUTH_DOMAIN_HÄR",
  projectId: "DITT_PROJECT_ID_HÄR",
  storageBucket: "DIN_STORAGE_BUCKET_HÄR",
  messagingSenderId: "DITT_MESSAGING_SENDER_ID_HÄR",
  appId: "DITT_APP_ID_HÄR"
};
```

## Steg 4: Aktivera Firestore Database

1. I Firebase Console, gå till **Build > Firestore Database**
2. Klicka på "Skapa databas" / "Create database"
3. Välj **Production mode** (vi ändrar regler senare)
4. Välj en location nära dig (europe-west1 för Sverige)
5. Klicka på "Aktivera"

## Steg 5: Konfigurera Firestore Security Rules

1. Gå till **Firestore Database > Regler**
2. Ersätt med dessa regler:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Hushåll - alla autentiserade användare kan läsa
    match /households/{householdId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        get(/databases/$(database)/documents/households/$(householdId)).data.members
          .hasAny([{'userId': request.auth.uid, 'role': 'admin'}]);
    }
    
    // Användares hushållskopplingar
    match /userHouseholds/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Hushållsdata (pantry, shopping lists, etc.)
    match /householdData/{householdId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Klicka på "Publicera"

## Steg 6: Aktivera Email/Password Authentication (för framtiden)

1. Gå till **Build > Authentication**
2. Klicka på "Kom igång"
3. Välj **Email/Password** provider
4. Aktivera "Email/Password"
5. Spara

## Steg 7: Testa installationen

Kör appen och försök:
1. Skapa ett nytt hushåll
2. Gå till Firebase Console > Firestore Database
3. Du bör se två collections:
   - `households` - med ditt nya hushåll
   - `userHouseholds` - med din användares koppling

## Datastruktur i Firestore

### Collection: `households`
```json
{
  "household_1234567890": {
    "id": "household_1234567890",
    "name": "Familjen Andersson",
    "inviteCode": "123456",
    "createdBy": "user123",
    "createdAt": "2025-12-08T20:00:00.000Z",
    "members": [
      {
        "userId": "user123",
        "email": "anna@example.com",
        "role": "admin",
        "joinedAt": "2025-12-08T20:00:00.000Z"
      }
    ]
  }
}
```

### Collection: `userHouseholds`
```json
{
  "user123": {
    "householdId": "household_1234567890",
    "joinedAt": "2025-12-08T20:00:00.000Z"
  }
}
```

## Nästa steg

När Firebase är konfigurerat:
1. Uppdatera `HouseholdSetupScreen.js` att använda Firebase-funktionerna
2. Uppdatera `ProfilePage.js` HouseholdSection att använda Firebase
3. Implementera realtime listeners för automatiska uppdateringar

## Kostnader

Firebase Free (Spark) Plan inkluderar:
- 1 GB lagring
- 10 GB/månad nedladdning
- 50,000 läsningar/dag
- 20,000 skrivningar/dag

Detta bör räcka för utveckling och småskalig användning!

## Säkerhet

⚠️ **VIKTIGT:** Lägg ALDRIG till `config/firebase.js` i version control om du använder riktiga credentials. Lägg till i `.gitignore`:

```
config/firebase.js
```

Använd istället environment variables för produktion.

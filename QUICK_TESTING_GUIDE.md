# 🧪 Quick Testing Guide

## Servrar som körs nu:

✅ **Backend Server** - Port 3000 (för 2FA emails)  
✅ **Expo Dev Server** - Startar... (väntar på initialisering)

⚠️ **Version Warnings:** 
- `expo@54.0.27` bör uppdateras till `~54.0.33`
- `expo-notifications@0.32.14` bör uppdateras till `~0.32.16`

Du kan uppdatera senare om du vill, eller ignorera för tillfället.

---

## 📱 Hur du testar appen:

### Alternativ 1: Testa på fysisk enhet (Rekommenderat)

#### För Android:
1. **Installera Expo Go** från Google Play Store
2. **Öppna Expo Go-appen**
3. **Scanna QR-koden** som visas i terminalen
4. Appen laddas och körs på din telefon

#### För iOS:
1. **Installera Expo Go** från App Store
2. **Öppna Kamera-appen** (inte Expo Go)
3. **Scanna QR-koden** som visas i terminalen
4. **Klicka på notifikationen** som dyker upp
5. Appen öppnas i Expo Go

### Alternativ 2: Testa på Emulator/Simulator

#### Android Emulator:
1. **Starta Android Studio**
2. **Öppna AVD Manager** (Android Virtual Device)
3. **Starta en emulator**
4. I Expo-terminalen, **tryck `a`** för att öppna på Android
5. Appen installeras automatiskt på emulatorn

#### iOS Simulator (endast Mac):
1. **Xcode måste vara installerat**
2. I Expo-terminalen, **tryck `i`** för att öppna på iOS
3. Simulator startar automatiskt
4. Appen laddas i simulatorn

---

## 🔍 Vad ska du testa först?

### Snabbtest (15-20 min):
1. **📝 Registration & Login**
   - Registrera nytt konto
   - Verifiera 2FA via email
   - Skapa hushåll
   - Logga ut och in igen

2. **✅ Core Features**
   - Skapa en syssla
   - Lägg till item i inköpslista
   - Skicka ett chattmeddelande
   - Lägg till en räkning

3. **🔔 Notifikationer**
   - Tillåt push-notifikationer
   - Testa notifikation (om möjligt)

4. **📴 Offline Test**
   - Aktivera Flight Mode
   - Försök skapa något
   - Återanslut - verifiera sync

5. **🎨 UI/UX**
   - Byt till mörkt tema
   - Byt språk till engelska
   - Navigera mellan skärmar

### Fullständig Test (1-2 timmar):
Se [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) för komplett checklista.

---

## 🐛 Om du hittar buggar:

### Dokumentera i TESTING_CHECKLIST.md:
```markdown
| # | Beskrivning | Severity | Status |
|---|-------------|----------|--------|
| 1 | Beskrivning av bugg | 🔴/🟡/🟢 | Open |
```

### Severity-nivåer:
- 🔴 **Critical** - Appen kraschar eller huvudfunktion fungerar inte
- 🟡 **Medium** - Feature fungerar men har problem
- 🟢 **Minor** - Kosmetiska eller mindre problemm

---

## 💡 Debugging Tips:

### Se Expo Logs:
Alla console.logs och errors visas i terminalen där Expo körs.

### Reload App:
- **Shake device** → "Reload" (fysisk enhet)
- **`r` i terminalen** → Reload
- **`Cmd/Ctrl + R`** → Reload (simulator/emulator)

### Clear Cache:
Om något beter sig konstigt:
1. Stoppa Expo (Ctrl+C i terminalen)
2. Kör: `npm start -- --clear`

### Backend Logs:
Kolla backend-terminalen för 2FA-relaterade logs och errors.

---

## ✅ Kritiskt att testa:

### Måste fungera för release:
- [ ] Registration med 2FA
- [ ] Login med 2FA
- [ ] Skapa och gå med i hushåll (testa med 2 användare)
- [ ] Real-time synkning mellan användare
- [ ] Push-notifikationer
- [ ] Offline-funktionalitet
- [ ] Bilduppladdning (profil, chat, pantry)
- [ ] Alla CRUD-operationer (Create, Read, Update, Delete)

### Bör fungera:
- [ ] Kalender-synkning
- [ ] Väderdata
- [ ] Alla filter och sorteringar
- [ ] Tema-byte
- [ ] Språk-byte

---

## 📊 Test Status:

Uppdatera efter testning:

**Test Started:** [Datum/Tid]  
**Test Completed:** [Datum/Tid]  
**Total Bugs Found:** [Antal]  
**Critical Bugs:** [Antal]  
**Status:** 🔴 Not Ready / 🟡 Needs Work / 🟢 Ready for Release

---

## 🚀 Nästa Steg Efter Testning:

1. **Fixa kritiskaila buggar** (🔴)
2. **Överväg att fixa medium buggar** (🟡)
3. **Uppdatera versionsnummer** om stora ändringar gjordes
4. **Deploy backend** till produktion
5. **Uppdatera EXPO_PUBLIC_API_URL** till production URL
6. **Bygg production builds** med `eas build`
7. **Testa production builds** innan submit
8. **Submit till App Stores** med `eas submit`

---

## 📞 Support During Testing:

Om något inte fungerar:
1. Kolla console logs i Expo-terminalen
2. Kolla Firebase Console för autentisering/databas-fel
3. Kolla SendGrid Dashboard för email-delivery
4. Restart appen och försök igen
5. Clear cache och rebuild

**Happy Testing! 🎉**

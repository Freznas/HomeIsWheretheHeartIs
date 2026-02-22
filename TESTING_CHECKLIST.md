# 🧪 Testing Checklist - Release Readiness

## Pre-Testing Setup
- [ ] Backend-server körs (lokalt eller deployed)
- [ ] Firebase är korrekt konfigurerat
- [ ] Environment variables är satta
- [ ] Internet-anslutning tillgänglig för online-tester
- [ ] Testenheter redo (iOS / Android)

---

## 🔐 Autentisering & Onboarding

### Registration Flow
- [ ] **Öppna appen första gången** - Splash screen visas korrekt
- [ ] **Navigera till Registration** - UI är responsiv och tydlig
- [ ] **Registrera med email och lösenord**
  - [ ] Validering fungerar (för kort lösenord, ogiltig email)
  - [ ] Firebase-registrering lyckas
  - [ ] Error-hantering för befintlig användare
- [ ] **2FA Email skickas** - Kod mottas i inbox (kolla skräppost)
- [ ] **Verifiera 2FA-kod**
  - [ ] Giltig kod accepteras
  - [ ] Ogiltig kod avvisas
  - [ ] Rate limiting fungerar (3 försök)
- [ ] **Household Setup visas** - Formulär är korrekt

### Household Creation
- [ ] **Skapa nytt hushåll** - Namn och beskrivning sparas
- [ ] **QR-kod genereras** - Visas korrekt på skärmen
- [ ] **Fortsätt till huvudapp** - Navigering fungerar

### Login Flow
- [ ] **Logga ut från appen**
- [ ] **Logga in med befintligt konto**
  - [ ] Korrekt email/lösenord accepteras
  - [ ] Fel lösenord avvisas
  - [ ] 2FA-flow fungerar igen
- [ ] **Household laddas korrekt** - Användarens data visas

### Join Household
- [ ] **Registrera en andra testanvändare**
- [ ] **Skanna QR-kod från första användaren**
- [ ] **Gå med i hushåll** - Användare läggs till korrekt
- [ ] **Båda användare ser samma hushållsdata**

---

## 🏠 Huvudskärm (Home Screen)

- [ ] **Dashboard laddas korrekt** - Alla sektioner visas
- [ ] **Header visar hushållsnamn** - Korrekt data
- [ ] **Navigering mellan sektioner** - Smooth övergångar
- [ ] **Highlights-sektion** - Visar kommande aktiviteter
- [ ] **Väder-sektion** - Position-permission och väder laddas
- [ ] **Drawer-meny** - Öppnas och stängs korrekt
- [ ] **Profilikon** - Navigerar till profil

---

## ✅ Sysslor (Chores)

### Skapa Sysslor
- [ ] **Lägg till ny syssla** - Formulär öppnas
- [ ] **Fyll i information**
  - [ ] Titel (required)
  - [ ] Beskrivning
  - [ ] Tilldelad medlem (dropdown fungerar)
  - [ ] Prioritet (Låg/Medel/Hög)
  - [ ] Kategori (väljer från lista)
  - [ ] Återkommande (daglig/veckovis/månatlig)
  - [ ] Förfallodatum
- [ ] **Spara syssla** - Toast-notification visas
- [ ] **Syssla syns i listan** - Korrekt data

### Hantera Sysslor
- [ ] **Markera som klar** - Status uppdateras, animation visas
- [ ] **Redigera syssla** - Ändringar sparas
- [ ] **Ta bort syssla** - Bekräftelse och borttagning
- [ ] **Filtrera sysslor** - Per status/medlem/prioritet
- [ ] **Sortering fungerar** - Datum/prioritet
- [ ] **Push-notis för förfallen syssla** - Mottas korrekt

### Multi-User Test
- [ ] **Andra användaren ser ny syssla** - Real-time sync
- [ ] **Första användaren markerar klar** - Andra ser uppdatering
- [ ] **Notifikation till tilldelad medlem** - Fungerar

---

## 🛒 Inköpslista (Shopping List)

### Lägg till Items
- [ ] **Lägg till artikel** - Namn och kategori
- [ ] **Välj kategori** - Dropdown fungerar
- [ ] **Lägg till antal** - Nummer-input
- [ ] **Spara** - Toast och lista uppdateras

### Hantera Items
- [ ] **Kryssa av item** - Visuell feedback (strikethrough)
- [ ] **Redigera item** - Modal öppnas, ändringar sparas
- [ ] **Ta bort item** - Bekräftelse fungerar
- [ ] **Filtrera per kategori** - Fungerar korrekt
- [ ] **Rensa avklarade items** - Bulk delete

### Multi-User Test
- [ ] **Andra användaren lägger till item** - Första ser direkt
- [ ] **Real-time synkning** - Båda ser samma lista
- [ ] **Samtidig uppdatering** - Ingen konflikt

---

## 💰 Räkningar (Bills)

### Skapa Räkningar
- [ ] **Lägg till räkning** - Formulär öppnas
- [ ] **Fyll i detaljer**
  - [ ] Namn
  - [ ] Belopp (nummer-validering)
  - [ ] Förfallodatum (date picker)
  - [ ] Kategori
  - [ ] Återkommande
  - [ ] Betald status
- [ ] **Spara räkning** - Sparas till Firestore

### Hantera Räkningar
- [ ] **Markera som betald** - Status-toggle fungerar
- [ ] **Redigera räkning** - Modal och save
- [ ] **Ta bort räkning** - Bekräftelse
- [ ] **Sortera räkningar** - Per datum/belopp
- [ ] **Notifikation 3 dagar innan** - Mottas
- [ ] **Notifikation på förfallodagen** - Mottas

---

## 📅 Kalender (Calendar)

### Skapa Händelser
- [ ] **Lägg till händelse** - Form visas
- [ ] **Fyll i detaljer**
  - [ ] Titel
  - [ ] Beskrivning
  - [ ] Datum och tid
  - [ ] Plats
  - [ ] Deltagare (multi-select)
- [ ] **Spara händelse** - Sparas korrekt

### Kalendervy
- [ ] **Månadskarta visas** - Dagens datum markerat
- [ ] **Händelser visas på rätt datum** - Marker/dots
- [ ] **Klicka på datum** - Visar händelser för den dagen
- [ ] **Navigera mellan månader** - Pilar fungerar

### Synkning med Telefonkalender
- [ ] **Permission-request** - Visas första gången
- [ ] **Lägg till i telefonkalender** - Event skapas
- [ ] **Verifiera i telefonens kalenderapp** - Event syns
- [ ] **Ta bort från telefonkalender** - Event tas bort

---

## 💬 Kommunikation (Chat)

### Skicka Meddelanden
- [ ] **Öppna chat-skärm** - Laddas korrekt
- [ ] **Skriv meddelande** - Text-input fungerar
- [ ] **Skicka meddelande** - Visas i chat
- [ ] **Timestamp** - Visar korrekt tid
- [ ] **Avsändarnamn** - Visas rätt

### Bilder & Filer
- [ ] **Välj bild från galleri** - Permission och väljare
- [ ] **Ta foto med kamera** - Kamera öppnas
- [ ] **Ladda upp bild** - Upload till Firebase Storage
- [ ] **Visa bild i chat** - Thumbnail och fullsize

### Real-time Chat
- [ ] **Andra användaren får meddelande direkt** - Real-time
- [ ] **Push-notis för nytt meddelande** - Mottas
- [ ] **Scrolla till senaste** - Auto-scroll fungerar
- [ ] **Meddelanden i kronologisk ordning** - Sorterat

---

## 🌤️ Väder (Weather)

### Position & Data
- [ ] **Location permission** - Request visas
- [ ] **Tillåt position** - Koordinater hämtas
- [ ] **Väderdata laddas** - API-call lyckas
- [ ] **Visar aktuellt väder** - Temperatur, ikon, beskrivning
- [ ] **5-dagars prognos** - Visar kommande dagar
- [ ] **Fel-hantering** - Om position nekas eller API misslyckas

### UI & UX
- [ ] **Väderikon matchar vädertyp** - Solsken/regn/moln
- [ ] **Uppdatera-knapp** - Refreshar data
- [ ] **Loader visas** - Under datahämtning

---

## 👋 Besökare (Visitors)

### Lägg till Besökare
- [ ] **Lägg till besökare** - Formulär
- [ ] **Fyll i information**
  - [ ] Namn
  - [ ] Ankomstdatum & tid
  - [ ] Avgångsdatum & tid
  - [ ] Noteringar
- [ ] **Välj från kontakter** - Kontakt-permission och väljare
- [ ] **Spara** - Sparas till Firestore

### Hantera Besökare
- [ ] **Visa lista** - Kommande och tidigare besökare
- [ ] **Redigera besökare** - Modal fungerar
- [ ] **Ta bort besökare** - Bekräftelse
- [ ] **Notifikation innan besök** - Påminnelse mottas
- [ ] **Filtrera besökare** - Kommande/tidigare

---

## 🍱 Skafferi (Pantry)

### Artiklar
- [ ] **Lägg till artikel** - Formulär
- [ ] **Fyll i information**
  - [ ] Namn
  - [ ] Kategori
  - [ ] Antal
  - [ ] Utgångsdatum (date picker)
  - [ ] Plats (kylskåp/skafferi/frys)
- [ ] **Ta foto av artikel** - Kamera/galleri
- [ ] **Spara** - Sparas med bild

### Hantering
- [ ] **Redigera artikel** - Ändringar sparas
- [ ] **Ta bort artikel** - Bekräftelse
- [ ] **Filtrera per kategori** - Fungerar
- [ ] **Sortiera per utgångsdatum** - Visar snart utgångna
- [ ] **Notis för utgående datum** - Varning 3 dagar innan
- [ ] **Lägg till i inköpslista** - Skapar shopping list item

---

## 📝 Anteckningar (Notes)

### Skapa Anteckningar
- [ ] **Ny anteckning** - Editor öppnas
- [ ] **Titel och innehåll** - Text-input fungerar
- [ ] **Kategorisera** - Välj kategori
- [ ] **Spara** - Sparas till Firestore

### Hantera
- [ ] **Lista anteckningar** - Alla anteckningar visas
- [ ] **Öppna anteckning** - Visar innehåll
- [ ] **Redigera** - Ändringar sparas
- [ ] **Ta bort** - Bekräftelse
- [ ] **Sök funktion** - Filtrerar anteckningar
- [ ] **Dela med medlem** - Syn för alla i hushåll

---

## ⚙️ Inställningar & Profil

### Profil
- [ ] **Öppna profilskärm** - Från drawer
- [ ] **Visa användarinfo** - Email, namn, hushållsnamn
- [ ] **Uppdatera profilbild** - Välj/ta foto, ladda upp
- [ ] **Uppdatera displaynamn** - Sparas korrekt
- [ ] **QR-kod för hushåll** - Visas och kan delas

### Notifikationer
- [ ] **Öppna notifikationsinställningar**
- [ ] **Toggle notifikationer per typ**
  - [ ] Sysslor
  - [ ] Räkningar
  - [ ] Kalender
  - [ ] Chat
  - [ ] Besökare
- [ ] **Spara inställningar** - Persisteras
- [ ] **Testa notifikation** - Skicka test-notis

### Tema
- [ ] **Toggle ljust/mörkt tema** - Switch i drawer
- [ ] **Färger ändras korrekt** - Hela appen uppdateras
- [ ] **Inställning sparas** - Kvarstår efter omstart

### Språk
- [ ] **Byt språk till Engelska** - Alla texter uppdateras
- [ ] **Byt till Svenska** - Fungerar
- [ ] **Språk sparas** - Kvarstår efter omstart

### Support
- [ ] **Öppna supportskärm** - Från drawer
- [ ] **Visa versionsnummer** - Korrekt version (1.0.0)
- [ ] **Kontaktinformation** - Visas korrekt

---

## 📴 Offline-funktionalitet

### Testa Offline
- [ ] **Aktivera Flight Mode** - Stäng av internet
- [ ] **Offline-banner visas** - "Ingen anslutning"
- [ ] **Skapa syssla offline** - Sparas lokalt (pending)
- [ ] **Lägg till item i shopping list offline** - Pending
- [ ] **Skicka meddelande offline** - Hamnar i kö
- [ ] **Återanslut till internet** - Banner försvinner
- [ ] **Pending actions synkas** - Automatisk sync
- [ ] **Bekräfta att data nu på server** - Verifiera i Firestore

### Cache
- [ ] **Ladda data med internet**
- [ ] **Stäng av internet**
- [ ] **Data visas från cache** - Lista sysslor/items
- [ ] **Bilderna cachas** - Profilbilder/chat-bilder

---

## 🔔 Push-notifikationer

### Permission & Setup
- [ ] **Första start** - Permission-request
- [ ] **Tillåt notifikationer** - Token sparas till Firestore
- [ ] **Neka notifikationer** - App fungerar ändå

### Test alla notistyper
- [ ] **Syssla förfaller** - Mottas vid deadline
- [ ] **Räkning förfaller snart** - 3 dagar innan
- [ ] **Räkning förfaller idag** - På förfallodagen
- [ ] **Ny chattmeddelande** - Från annan användare
- [ ] **Kalenderpåminnelse** - 15 min innan händelse (om konfigurerat)
- [ ] **Besökare ankommer snart** - Dag innan
- [ ] **Skafferi utgår snart** - 3 dagar innan utgångsdatum

### Notis-hantering
- [ ] **Klicka på notis** - Öppnar rätt skärm
- [ ] **Notis-ikon** - Badge eller indicator
- [ ] **Stänga av notis per typ** - Respekteras

---

## 🔐 Säkerhet & Permissions

### Firebase Access
- [ ] **Testa med annan användare** - Kan inte se andra hushålls data
- [ ] **Försök läsa andras data** - Firestore rules blockerar
- [ ] **Försök skriva till annat hushåll** - Blockeras

### Permissions
- [ ] **Kamera** - Request första gången, fungerar efter
- [ ] **Galleri** - Permission och access
- [ ] **Position** - Request och fungerar
- [ ] **Notifikationer** - Request och fungerar
- [ ] **Kalender** - Request och sync fungerar
- [ ] **Kontakter** - Request och väljare fungerar

---

## 🐛 Error Handling

### Network Errors
- [ ] **Ingen internetanslutning** - Felmeddelande visas
- [ ] **API fel** - Error boundary fångar
- [ ] **Timeout** - Hantering och retry

### Firebase Errors
- [ ] **Firestore write error** - Toast med felmeddelande
- [ ] **Auth error** - Redirect till login
- [ ] **Storage upload error** - Felmeddelande

### Validation Errors
- [ ] **Tomt obligatoriskt fält** - Validering fungerar
- [ ] **Fel format (email, datum)** - Validering
- [ ] **För lång text** - Character limit

---

## 🎨 UI/UX

### Responsiveness
- [ ] **Olika skärmstorlekar** - Layout anpassas
- [ ] **Portrait/landscape** - Rotation fungerar
- [ ] **iPhone SE (små skärmar)** - Allt visas
- [ ] **Tablets** - Utnyttjar skärmutrymme

### Animations & Feedback
- [ ] **Button press feedback** - Ripple/highlight
- [ ] **Loading states** - Skeleton loaders visas
- [ ] **Success animations** - Check marks etc
- [ ] **Toast notifications** - Visas och försvinner
- [ ] **Modals** - Slide in/out animations

### Accessibility
- [ ] **Font sizes** - Läsbara
- [ ] **Contrast** - Bra i både ljust och mörkt tema
- [ ] **Touch targets** - Tillräckligt stora (minst 44x44)
- [ ] **Error messages** - Tydliga och hjälpsamma

---

## ⚡ Performance

### Loading Times
- [ ] **App start** - Under 3 sekunder till login/home
- [ ] **Screen transitions** - Smidiga, <500ms
- [ ] **Bild-uppladdning** - Reasonable för normala bilder
- [ ] **Lista scrolling** - Ingen lag med 50+ items

### Memory & Battery
- [ ] **Kör appen 30 min** - Ingen memory leak
- [ ] **Background behavior** - Inte onödig batterianvändning
- [ ] **Notifikationer** - Väcker appen effektivt

---

## 🚀 Build & Deploy Readiness

### Production Build
- [ ] **Console logs borttagna** - Endast error/warn kvar
- [ ] **Environment variables** - Production URLs
- [ ] **Icons & splash** - Korrekt upplösning och filformat
- [ ] **App name** - Korrekt i både iOS och Android
- [ ] **Bundle identifier** - Unik och korrekt
- [ ] **Version number** - 1.0.0
- [ ] **Build number** - 1 (iOS) och version code 1 (Android)

### Platform-specific
- [ ] **iOS permissions** - Info.plist descriptions är tydliga och på svenska
- [ ] **Android permissions** - Manifest är komplett
- [ ] **iOS bundle ID** - Korrekt: com.homeishearth.app
- [ ] **Android package** - Korrekt: com.homeishearth.app

---

## ✅ Final Checks

- [ ] **Alla kritiska features fungerar**
- [ ] **Inga kända crashar**
- [ ] **Offline mode fungerar**
- [ ] **Notifikationer fungerar**
- [ ] **Multi-user sync fungerar**
- [ ] **Backend är deployed och fungerar**
- [ ] **Firebase rules är deployade**
- [ ] **Säkerhet är verifierad**
- [ ] **Error handling fungerar**
- [ ] **UI är polish och professionell**

---

## 📝 Bug Tracker

Anteckna buggar här under testning:

| # | Beskrivning | Severity | Status | Fix |
|---|-------------|----------|--------|-----|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

**Severity:** 🔴 Critical (måste fixas) | 🟡 Medium (bör fixas) | 🟢 Minor (kan fixas senare)

---

## 🎉 När alla checkboxar är ikryssade = READY FOR RELEASE! 🚀

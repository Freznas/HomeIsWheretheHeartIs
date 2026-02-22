# Backend 2FA Setup Guide

## Snabbstart

### 1. Installera dependencies
```bash
cd backend
npm install
```

### 2. Konfigurera SendGrid

#### Skapa SendGrid-konto:
1. Gå till [sendgrid.com](https://sendgrid.com/)
2. Skapa gratis konto (100 emails/dag)
3. Verifiera din email

#### Få API-nyckel:
1. Logga in på SendGrid Dashboard
2. Gå till **Settings** → **API Keys**
3. Klicka **Create API Key**
4. Välj namn: "HomeIsWhereTheHeartIs-2FA"
5. Permissions: **Full Access** (eller minst "Mail Send")
6. Klicka **Create & View**
7. **KOPIERA NYCKELN NU** (visas bara en gång!)

#### Verifiera avsändar-email:
1. Gå till **Settings** → **Sender Authentication**
2. Klicka **Verify a Single Sender**
3. Fyll i:
   - From Name: "Home App"
   - From Email: din@email.com (eller noreply@dindomain.com)
   - Reply To: samma som ovan
4. Verifiera via email-länk

### 3. Konfigurera miljövariabler

Kopiera `.env.example` till `.env`:
```bash
copy .env.example .env
```

Redigera `.env` och lägg till:
```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=din@verifierade-email.com
PORT=3000
```

### 4. Starta servern

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Servern körs på `http://localhost:3000`

### 5. Testa API:et

**Skicka 2FA-kod:**
```bash
curl -X POST http://localhost:3000/api/auth/send-2fa-code \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"din@email.com\",\"code\":\"123456\",\"userId\":\"user123\"}"
```

**Verifiera kod:**
```bash
curl -X POST http://localhost:3000/api/auth/verify-2fa-code \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"user123\",\"code\":\"123456\"}"
```

---

## Uppdatera React Native App

Uppdatera `send2FACode` i ProfilePage.js:

```javascript
const send2FACode = async () => {
  const newCode = generate2FACode();
  setGeneratedCode(newCode);
  
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 5);
  setCodeExpiry(expiry);
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/send-2fa-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: currentUser.email,
        code: newCode,
        userId: currentUser.id
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showToast('📧 Kod skickad till din email!', 'success');
    } else {
      showToast(`❌ ${data.error}`, 'error');
    }
  } catch (error) {
    console.error('Send 2FA error:', error);
    showToast('❌ Kunde inte skicka kod', 'error');
  }
  
  return newCode;
};
```

**OBS:** Byt `http://localhost:3000` till din server-URL när du deployar.

---

## Deploy (Produktion)

### Vercel (Rekommenderat)
```bash
npm install -g vercel
cd backend
vercel
```

### Heroku
```bash
heroku create your-app-name
git push heroku main
heroku config:set SENDGRID_API_KEY=your_key
heroku config:set SENDGRID_FROM_EMAIL=your_email
```

### Railway
1. Gå till [railway.app](https://railway.app)
2. Skapa nytt projekt från GitHub
3. Lägg till miljövariabler
4. Deploy automatiskt

---

## Säkerhet

### För produktion, lägg till:

1. **HTTPS endast**
2. **Helmet.js** för security headers
3. **Express-rate-limit** istället för egen implementation
4. **Database** istället för in-memory storage (MongoDB, PostgreSQL)
5. **Hash codes** innan lagring
6. **IP-baserad throttling**
7. **Logging** (Winston, Morgan)
8. **API-autentisering** (JWT tokens)

---

## Troubleshooting

### "SendGrid API Key invalid"
- Dubbelkolla att du kopierat hela nyckeln
- Kontrollera att nyckeln har rätt permissions

### "From email not verified"
- Verifiera avsändare i SendGrid Dashboard
- Använd exakt samma email i .env

### "Port 3000 already in use"
- Ändra PORT i .env
- Eller stoppa processen: `npx kill-port 3000`

### Emails hamnar i spam
- Använd SendGrid's domain authentication
- Lägg till SPF och DKIM records

---

## API Endpoints

### POST /api/auth/send-2fa-code
Skickar 2FA-kod via email

**Request:**
```json
{
  "email": "user@example.com",
  "code": "123456",
  "userId": "user123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Kod skickad till din email"
}
```

### POST /api/auth/verify-2fa-code
Verifierar 2FA-kod

**Request:**
```json
{
  "userId": "user123",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Kod verifierad"
}
```

### GET /health
Health check endpoint

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-03T10:00:00.000Z"
}
```
---

## 🚀 Deployment till Produktion

Backend-servern är förberedd för deployment till flera plattformar:
- **Railway** (Rekommenderat - Enklast setup)
- **Render** (Generös free tier)
- **Vercel** (Serverless)
- **Heroku** (Etablerad plattform)

**Se [DEPLOYMENT.md](DEPLOYMENT.md) för detaljerade instruktioner.**

### Snabbstart - Railway Deployment:
```bash
# Installera Railway CLI
npm install -g @railway/cli

# Login och deploy
railway login
railway init
railway up

# Sätt environment variables
railway variables set SENDGRID_API_KEY="your_key"
railway variables set SENDGRID_FROM_EMAIL="your_email"
```

Efter deployment, uppdatera `EXPO_PUBLIC_API_URL` i frontend `.env` med din production URL.
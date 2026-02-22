# 🚀 Backend Deployment Guide

Detta dokument ger instruktioner för att deploya backend-servern till olika hosting-plattformar.

## Förberedelser

Backend-servern är redan förberedd med:
- ✅ `start` script i package.json
- ✅ Environment variables via dotenv
- ✅ CORS konfigurerat
- ✅ Rate limiting implementerat
- ✅ Node.js version specifierad (>=16.0.0)

## Vilken plattform ska jag välja?

### 🟢 Railway (Rekommenderat - Enklast)
- **Pris:** $5/månad efter free trial
- **Fördelar:** Enkel setup, automatisk deployment från Git, gratis databaser
- **Perfekt för:** Små till medelstora projekt

### 🔵 Render
- **Pris:** Free tier tillgänglig (med begränsningar)
- **Fördelar:** Generös free tier, bra dokumentation
- **Perfekt för:** Utveckling och små projekt

### 🟣 Vercel
- **Pris:** Free tier tillgänglig
- **Fördelar:** Snabb deployment, bra för serverless
- **OBS:** Begränsat till serverless functions (inte långvariga anslutningar)

### 🔴 Heroku
- **Pris:** Från $7/månad (ingen längre free tier)
- **Fördelar:** Väletablerad, många add-ons
- **Perfekt för:** Produktion, behöver add-ons

---

## Option 1: Railway Deployment (Rekommenderat)

### Steg 1: Förberedelser
```bash
cd backend
```

### Steg 2: Installera Railway CLI
```bash
npm install -g @railway/cli
```

### Steg 3: Login till Railway
```bash
railway login
```

### Steg 4: Initiera Railway-projekt
```bash
railway init
```

### Steg 5: Sätt environment variables
```bash
railway variables set SENDGRID_API_KEY="your_sendgrid_api_key"
railway variables set SENDGRID_FROM_EMAIL="your_email@domain.com"
railway variables set NODE_ENV="production"
```

### Steg 6: Deploy
```bash
railway up
```

### Steg 7: Få din URL
```bash
railway domain
```

Railway genererar en URL som: `https://your-app.up.railway.app`

### Steg 8: Uppdatera frontend .env
Kopiera din Railway URL och uppdatera i root `.env`:
```env
EXPO_PUBLIC_API_URL=https://your-app.up.railway.app
```

---

## Option 2: Render Deployment

### Steg 1: Pusha kod till GitHub
Säkerställ att backend-koden finns i ett Git repository.

### Steg 2: Skapa konto på Render
Gå till [render.com](https://render.com) och skapa ett konto.

### Steg 3: New Web Service
1. Klicka "New +" → "Web Service"
2. Koppla ditt GitHub repository
3. Välj `backend` folder (eller root om backend är separerat)

### Steg 4: Konfigurera
- **Name:** homeiswheretheheartis-backend
- **Environment:** Node
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Plan:** Free (eller välj betald)

### Steg 5: Lägg till Environment Variables
Under "Environment" tab, lägg till:
```
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=your_email@domain.com
NODE_ENV=production
```

### Steg 6: Deploy
Klicka "Create Web Service" - Render börjar deploya automatiskt.

### Steg 7: Få din URL
Render ger dig en URL som: `https://your-app.onrender.com`

### Steg 8: Uppdatera frontend .env
```env
EXPO_PUBLIC_API_URL=https://your-app.onrender.com
```

---

## Option 3: Vercel Deployment

### Steg 1: Installera Vercel CLI
```bash
npm install -g vercel
```

### Steg 2: Login
```bash
vercel login
```

### Steg 3: Deploy från backend-mappen
```bash
cd backend
vercel
```

### Steg 4: Följ prompten
- Välj scope (ditt konto)
- Länka till existerande projekt eller skapa nytt
- Bekräfta settings

### Steg 5: Sätt environment variables
```bash
vercel env add SENDGRID_API_KEY
vercel env add SENDGRID_FROM_EMAIL
vercel env add NODE_ENV
```

### Steg 6: Production deployment
```bash
vercel --prod
```

### Steg 7: Uppdatera frontend .env
Använd din Vercel URL:
```env
EXPO_PUBLIC_API_URL=https://your-app.vercel.app
```

---

## Option 4: Heroku Deployment

### Steg 1: Installera Heroku CLI
Ladda ner från [heroku.com/cli](https://devcenter.heroku.com/articles/heroku-cli)

### Steg 2: Login
```bash
heroku login
```

### Steg 3: Skapa Heroku app
```bash
cd backend
heroku create homeiswheretheheartis-backend
```

### Steg 4: Sätt environment variables
```bash
heroku config:set SENDGRID_API_KEY=your_sendgrid_api_key
heroku config:set SENDGRID_FROM_EMAIL=your_email@domain.com
heroku config:set NODE_ENV=production
```

### Steg 5: Deploy
```bash
git init  # Om inte redan ett git repo
git add .
git commit -m "Initial backend deployment"
heroku git:remote -a homeiswheretheheartis-backend
git push heroku main
```

### Steg 6: Öppna appen
```bash
heroku open
```

### Steg 7: Uppdatera frontend .env
```env
EXPO_PUBLIC_API_URL=https://homeiswheretheheartis-backend.herokuapp.com
```

---

## ✅ Verifiera Deployment

Efter deployment, testa att backend fungerar:

### Test 1: Health Check
```bash
curl https://your-backend-url.com/
```

Förväntat svar: `Backend server is running`

### Test 2: Send 2FA Code Endpoint
```bash
curl -X POST https://your-backend-url.com/api/auth/send-2fa-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","code":"123456","userId":"testUser"}'
```

Ska returnera success eller error beroende på SendGrid-konfiguration.

---

## 🔒 Säkerhet i Produktion

### CORS Configuration
Backend är redan konfigurerad med CORS. För produktion, överväg att begränsa origins:

```javascript
// I server.js, uppdatera CORS
app.use(cors({
  origin: ['https://your-production-domain.com', 'exp://localhost:19000'],
  credentials: true
}));
```

### Environment Variables
- ✅ Använd aldrig hårdkodade API-nycklar
- ✅ Sätt alla känsliga värden via environment variables
- ✅ Använd olika nycklar för development och production

### Rate Limiting
Backend har redan rate limiting implementerat (3 försök per 15 min).

---

## 🔄 Continuous Deployment

### Railway
Railway har automatisk deployment när du pushar till Git:
```bash
git push
```

### Render
Render deployer automatiskt vid push till main branch.

### Vercel
```bash
vercel --prod
```
Eller koppla GitHub för automatisk deployment.

### Heroku
```bash
git push heroku main
```

---

## 🐛 Troubleshooting

### Backend returnerar 500-fel
- Kolla att alla environment variables är satta
- Verifiera SendGrid API-key är giltig
- Kontrollera logs

**Railway:**
```bash
railway logs
```

**Render:**
Logs finns i Dashboard → din service → Logs tab

**Vercel:**
```bash
vercel logs
```

**Heroku:**
```bash
heroku logs --tail
```

### CORS-fel
- Lägg till din production domain till CORS origins
- Kontrollera att request headers är korrekt satta

### SendGrid-fel
- Verifiera API key är korrekt
- Kontrollera from-email är verifierad i SendGrid
- Kolla SendGrid dashboard för activity

---

## 📊 Monitoring

### Railway
- Dashboard: https://railway.app/dashboard
- Metrics och logs tillgängliga i UI

### Render
- Dashboard: https://dashboard.render.com
- Automatic health checks

### Vercel
- Dashboard: https://vercel.com/dashboard
- Analytics tillgängliga

### Heroku
- Dashboard: https://dashboard.heroku.com
- Använd add-ons för monitoring (t.ex. Papertrail för logs)

---

## 💰 Kostnadsjämförelse

| Plattform | Free Tier | Betald Plan | Bäst För |
|-----------|-----------|-------------|----------|
| Railway | 500h/månad trial | $5/månad | Små-medelstora projekt |
| Render | 750h/månad | $7/månad | Utveckling, prototyper |
| Vercel | Serverless limits | $20/månad | Serverless functions |
| Heroku | ❌ Ingen | $7/månad | Etablerade projekt |

---

## 🎯 Rekommendation

För denna app rekommenderar jag **Railway** eftersom:
1. Enkel setup och deployment
2. Bra free tier för utvärdering
3. Automatisk deployment från Git
4. Bra performance
5. Enkelt att sätta environment variables

Alternativt är **Render** ett utmärkt gratis alternativ för utveckling och testing.

---

## 📝 Nästa Steg Efter Deployment

1. ✅ Verifiera att backend svarar på requests
2. ✅ Uppdatera `EXPO_PUBLIC_API_URL` i frontend `.env`
3. ✅ Testa 2FA-funktionalitet end-to-end
4. ✅ Bygg en ny version av appen med production API URL
5. ✅ Övervaka logs för eventuella fel
6. ✅ Sätt upp monitoring/alerting (optional men rekommenderat)

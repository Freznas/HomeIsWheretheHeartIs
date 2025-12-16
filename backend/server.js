const express = require('express');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Konfigurera SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// In-memory storage för koder (i produktion, använd databas!)
const twoFactorCodes = new Map();

// Rate limiting map
const rateLimitMap = new Map();

// Rate limiting middleware
const rateLimit = (req, res, next) => {
  const identifier = req.body.email || req.ip;
  const now = Date.now();
  
  if (!rateLimitMap.has(identifier)) {
    rateLimitMap.set(identifier, []);
  }
  
  const attempts = rateLimitMap.get(identifier);
  // Ta bort försök äldre än 15 minuter
  const recentAttempts = attempts.filter(time => now - time < 15 * 60 * 1000);
  
  if (recentAttempts.length >= 3) {
    return res.status(429).json({ 
      success: false, 
      error: 'För många försök. Försök igen om 15 minuter.' 
    });
  }
  
  recentAttempts.push(now);
  rateLimitMap.set(identifier, recentAttempts);
  next();
};

// Skicka 2FA-kod
app.post('/api/auth/send-2fa-code', rateLimit, async (req, res) => {
  try {
    const { email, code, userId } = req.body;
    
    if (!email || !code || !userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email, kod och userId krävs' 
      });
    }
    
    // Spara koden med expiry (5 minuter)
    const expiresAt = Date.now() + 5 * 60 * 1000;
    twoFactorCodes.set(userId, {
      code,
      email,
      expiresAt,
      used: false
    });
    
    // Skicka email
    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL, // Måste vara verifierad i SendGrid
      subject: '🔐 Din tvåfaktorsautentiseringskod',
      text: `Din verifieringskod är: ${code}\n\nKoden gäller i 5 minuter.\n\nOm du inte begärt denna kod, ignorera detta meddelande.`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #4ECDC4; margin-bottom: 20px; }
            .code { font-size: 36px; font-weight: bold; color: #4ECDC4; letter-spacing: 8px; text-align: center; padding: 20px; background: #f9f9f9; border-radius: 8px; margin: 20px 0; }
            .info { color: #666; font-size: 14px; line-height: 1.6; }
            .warning { color: #FF6B6B; margin-top: 20px; padding: 15px; background: #fff5f5; border-radius: 5px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🏠 Home Is Where The Heart Is</h1>
            <h2>Tvåfaktorsautentisering</h2>
            <p class="info">Du har begärt en verifieringskod för att aktivera 2FA eller utföra en känslig operation.</p>
            
            <div class="code">${code}</div>
            
            <p class="info">
              <strong>Viktigt:</strong><br>
              • Koden är giltig i <strong>5 minuter</strong><br>
              • Dela aldrig denna kod med någon<br>
              • Ange koden i appen för att slutföra verifieringen
            </p>
            
            <div class="warning">
              ⚠️ Om du inte begärt denna kod, ignorera detta meddelande. Din säkerhet kan vara i fara om någon annan försöker komma åt ditt konto.
            </div>
            
            <div class="footer">
              <p>Detta är ett automatiskt meddelande. Svara inte på detta email.</p>
              <p>&copy; 2025 Home Is Where The Heart Is</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    await sgMail.send(msg);
    
    console.log(`2FA-kod skickad till ${email} för userId: ${userId}`);
    
    res.json({ 
      success: true, 
      message: 'Kod skickad till din email' 
    });
    
  } catch (error) {
    console.error('Fel vid skickande av 2FA-kod:', error);
    
    if (error.response) {
      console.error('SendGrid error:', error.response.body);
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Kunde inte skicka email. Kontrollera din SendGrid-konfiguration.' 
    });
  }
});

// Verifiera 2FA-kod
app.post('/api/auth/verify-2fa-code', async (req, res) => {
  try {
    const { userId, code } = req.body;
    
    if (!userId || !code) {
      return res.status(400).json({ 
        success: false, 
        error: 'UserId och kod krävs' 
      });
    }
    
    const storedCode = twoFactorCodes.get(userId);
    
    if (!storedCode) {
      return res.status(404).json({ 
        success: false, 
        error: 'Ingen kod hittades. Begär en ny kod.' 
      });
    }
    
    // Kolla om koden har använts
    if (storedCode.used) {
      return res.status(400).json({ 
        success: false, 
        error: 'Koden har redan använts' 
      });
    }
    
    // Kolla om koden har gått ut
    if (Date.now() > storedCode.expiresAt) {
      twoFactorCodes.delete(userId);
      return res.status(400).json({ 
        success: false, 
        error: 'Koden har gått ut. Begär en ny kod.' 
      });
    }
    
    // Verifiera koden
    if (storedCode.code !== code) {
      return res.status(400).json({ 
        success: false, 
        error: 'Felaktig kod' 
      });
    }
    
    // Markera som använd
    storedCode.used = true;
    twoFactorCodes.set(userId, storedCode);
    
    // Ta bort efter 1 minut
    setTimeout(() => {
      twoFactorCodes.delete(userId);
    }, 60 * 1000);
    
    res.json({ 
      success: true, 
      message: 'Kod verifierad' 
    });
    
  } catch (error) {
    console.error('Fel vid verifiering av 2FA-kod:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Serverfel vid verifiering' 
    });
  }
});

// Cleanup gamla koder var 5:e minut
setInterval(() => {
  const now = Date.now();
  for (const [userId, codeData] of twoFactorCodes.entries()) {
    if (now > codeData.expiresAt) {
      twoFactorCodes.delete(userId);
      console.log(`Rensade utgången kod för userId: ${userId}`);
    }
  }
}, 5 * 60 * 1000);

const server = app.listen(PORT, '172.20.10.4', () => {
  console.log(`🚀 2FA Backend server körs på port ${PORT}`);
  console.log(`📧 SendGrid konfigurerad: ${process.env.SENDGRID_API_KEY ? 'Ja' : 'Nej'}`);
  console.log(`🌐 Tillgänglig på: http://172.20.10.4:${PORT}`);
  console.log(`🔥 Lyssnar på IP: 172.20.10.4`);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
});

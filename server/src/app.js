// =============================================================================
// app.js — Entry Point Express Application
//
// Security layers yang diterapkan (defense in depth):
//
//  [1] helmet        — HTTP security headers (XSS, MIME-sniff, Clickjacking, …)
//  [2] cors          — Whitelist origin dari CLIENT_URL saja
//  [3] cookie-parser — Parse cookie untuk membaca JWT HTTP-Only Cookie
//  [4] hpp           — Cegah HTTP Parameter Pollution
//  [5] express-json  — Body parser dengan size limit (cegah payload bomb)
//  [6] Rate Limiter  — General (100/15min), Login (5/15min) di auth.routes.js
//  [7] express-validator (di validator) — Sanitasi & validasi semua input
//  [8] Parameterized Queries (di controller) — Anti SQL Injection
//  [9] JWT HTTP-Only Cookie — Anti XSS token theft
// [10] RBAC middleware — authorizeRole(['admin'])
// [11] Audit Logs — Non-repudiation & forensik
// [12] Error handler — No stack trace di production (anti info leak)
// =============================================================================

import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import authRoutes        from './routes/auth.routes.js';
import itemRoutes        from './routes/item.routes.js';
import supplierRoutes    from './routes/supplier.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import userRoutes        from './routes/user.routes.js';
import auditRoutes       from './routes/audit.routes.js';
import reportRoutes      from './routes/report.routes.js';

// Error handlers
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// Validasi environment variables WAJIB saat startup
// ---------------------------------------------------------------------------
const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET', 'CLIENT_URL'];
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(
    `[FATAL] Environment variables berikut belum diset: ${missingEnv.join(', ')}`
  );
  console.error('[FATAL] Salin server/.env.example ke server/.env dan isi nilainya.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;
const IS_PROD = process.env.NODE_ENV === 'production';

// =============================================================================
// [1] HELMET — HTTP Security Headers
// =============================================================================
app.use(
  helmet({
    contentSecurityPolicy: IS_PROD ? undefined : false,
    crossOriginEmbedderPolicy: false,
  })
);

// =============================================================================
// [2] CORS — Hanya izinkan request dari CLIENT_URL
// =============================================================================
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  })
);

// =============================================================================
// [3] COOKIE PARSER — Untuk membaca HTTP-Only Cookie JWT
// =============================================================================
app.use(cookieParser());

// =============================================================================
// [4] HPP — HTTP Parameter Pollution Protection
// =============================================================================
app.use(hpp());

// =============================================================================
// [5] BODY PARSER — Limit 10kb untuk mencegah payload flooding
// =============================================================================
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// =============================================================================
// LOGGING — HTTP request log (hanya di development)
// =============================================================================
if (!IS_PROD) {
  app.use(morgan('dev'));
}

app.disable('x-powered-by');

// =============================================================================
// General Rate Limiter
// =============================================================================
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: IS_PROD ? 1000 : 5000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Terlalu banyak request. Coba lagi dalam 15 menit.',
    },
  })
);

// =============================================================================
// HEALTH CHECK
// =============================================================================
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: '☕ Warkop Kiwil API is running.',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// =============================================================================
// ROUTES
// =============================================================================
app.use('/api/auth',         authRoutes);
app.use('/api/items',        itemRoutes);
app.use('/api/suppliers',    supplierRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/users',        userRoutes);
app.use('/api/audit-logs',   auditRoutes);
app.use('/api/reports',      reportRoutes);

// =============================================================================
// PRODUCTION STATIC SERVING — Menyajikan Frontend React (Single Container)
// =============================================================================
if (IS_PROD) {
  app.use(express.static(path.join(__dirname, '../public')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
  });
}

// =============================================================================
// ERROR HANDLING (harus di paling bawah)
// =============================================================================
app.use(notFoundHandler);
app.use(errorHandler);

// =============================================================================
// START SERVER
// =============================================================================
app.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║    Warkop Kiwil — Inventory API        ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log(`║  Port    : ${String(PORT).padEnd(31)}║`);
  console.log(`║  Env     : ${String(process.env.NODE_ENV || 'development').padEnd(31)}║`);
  console.log(`║  CORS    : ${String(process.env.CLIENT_URL).padEnd(31)}║`);
  console.log('╚══════════════════════════════════════════╝\n');
});

export default app;
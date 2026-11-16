# ☕ Aplikasi Sistem Inventori Warkop Kiwil

> Tugas Besar Cyber Security — Sistem manajemen inventori bahan baku warkop
> dengan arsitektur terpisah (React + Express + PostgreSQL/Supabase).

## 📁 Struktur Proyek

```
Aplikasi Inventori Warkop Kiwil/
├── client/                          # Frontend — React.js (Vite) + Tailwind CSS
│   ├── public/
│   ├── src/
│   │   ├── assets/                  # Gambar, ikon, font
│   │   ├── components/
│   │   │   ├── common/              # Komponen reusable (Button, Modal, Table)
│   │   │   └── layout/              # Sidebar, Navbar, Layout wrapper
│   │   ├── context/                 # React Context (Auth, Theme)
│   │   ├── hooks/                   # Custom hooks
│   │   ├── pages/                   # Halaman utama (Dashboard, Items, dll)
│   │   ├── services/                # Axios API client
│   │   ├── utils/                   # Helper functions
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                          # Backend — Node.js + Express.js
│   ├── src/
│   │   ├── config/                  # Konfigurasi (DB, Supabase)
│   │   ├── controllers/             # Business logic per resource
│   │   ├── middleware/              # Auth, error handler, audit logger
│   │   ├── models/                  # (opsional) Model/query abstraction
│   │   ├── routes/                  # Definisi route per resource
│   │   ├── services/                # Service layer (opsional)
│   │   ├── utils/                   # Helper functions
│   │   ├── validators/              # Joi validation schemas
│   │   └── app.js                   # Entry point Express
│   ├── .env.example
│   └── package.json
│
├── database/                        # Skrip SQL
│   ├── migrations/
│   │   └── 001_initial_schema.sql   # DDL + Trigger + RLS
│   └── seeds/
│       └── 001_seed_data.sql        # Data awal untuk development
│
├── docs/                            # Dokumentasi tambahan
├── .gitignore
├── package.json                     # Root monorepo scripts
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18
- Akun Supabase (gratis) — [supabase.com](https://supabase.com)

### 1. Clone & Install

```bash
git clone <repository-url>
cd "Aplikasi Inventori Warkop Kiwil"
npm install                  # Install root (concurrently)
cd client && npm install     # Install client dependencies
cd ../server && npm install  # Install server dependencies
```

### 2. Setup Database

1. Buat project baru di Supabase Dashboard.
2. Buka **SQL Editor** di Supabase.
3. Jalankan `database/migrations/001_initial_schema.sql`.
4. Jalankan `database/seeds/001_seed_data.sql` (opsional, untuk data contoh).

### 3. Konfigurasi Environment

```bash
# Server
cp server/.env.example server/.env
# Edit server/.env — isi SUPABASE_URL, DATABASE_URL, JWT_SECRET, dll.

# Client
cp client/.env.example client/.env
```

> ⚠️ **JANGAN** commit file `.env` ke repository!

### 4. Jalankan Development Server

```bash
# Dari root folder — jalankan backend & frontend bersamaan
npm run dev
```

- Frontend: http://localhost:5173
- Backend:  http://localhost:5000
- Health:   http://localhost:5000/api/health

## 🔒 Fitur Keamanan (Cyber Security)

| Layer | Fitur | Implementasi |
|-------|-------|-------------|
| **Database** | Row Level Security (RLS) | Supabase RLS policies |
| **Database** | Trigger validasi stok | `fn_update_stok_on_transaction()` |
| **Database** | Row-level locking | `SELECT ... FOR UPDATE` (anti race condition) |
| **Database** | CHECK constraints | stok >= 0, jumlah > 0, harga >= 0 |
| **Backend** | Password hashing | bcrypt (12 salt rounds) |
| **Backend** | JWT Authentication | jsonwebtoken + HS256 |
| **Backend** | Role-Based Access Control | admin / kasir middleware |
| **Backend** | Input validation | Joi schemas + stripUnknown |
| **Backend** | Rate limiting | express-rate-limit (100 req/15min, 10 auth) |
| **Backend** | Security headers | helmet (XSS, clickjacking, MIME) |
| **Backend** | CORS whitelist | Hanya origin yang diizinkan |
| **Backend** | HPP protection | hpp middleware |
| **Backend** | Body size limit | 10kb max payload |
| **Backend** | Audit logging | Semua aksi dicatat + IP address |
| **Backend** | Error sanitization | No stack traces di production |
| **Frontend** | JWT di localStorage | Auto-redirect pada 401 |
| **General** | No hardcoded secrets | Semua credential di `.env` |

## 📡 API Endpoints

| Method | Endpoint | Auth | Role | Deskripsi |
|--------|----------|------|------|-----------|
| POST | `/api/auth/login` | ❌ | — | Login |
| POST | `/api/auth/register` | ✅ | — | Registrasi user baru |
| GET | `/api/auth/me` | ✅ | — | Profil user saat ini |
| GET | `/api/items` | ✅ | — | Semua item |
| GET | `/api/items/low-stock` | ✅ | — | Item stok rendah |
| POST | `/api/items` | ✅ | admin | Tambah item |
| PUT | `/api/items/:id` | ✅ | admin | Update item |
| DELETE | `/api/items/:id` | ✅ | admin | Hapus item |
| GET | `/api/suppliers` | ✅ | — | Semua supplier |
| POST | `/api/suppliers` | ✅ | admin | Tambah supplier |
| PUT | `/api/suppliers/:id` | ✅ | admin | Update supplier |
| DELETE | `/api/suppliers/:id` | ✅ | admin | Hapus supplier |
| GET | `/api/transactions` | ✅ | — | Riwayat transaksi |
| POST | `/api/transactions` | ✅ | — | Catat transaksi baru |
| GET | `/api/audit-logs` | ✅ | admin | Lihat audit logs |
| GET | `/api/users` | ✅ | admin | Semua user |
| DELETE | `/api/users/:id` | ✅ | admin | Hapus user |

## 📄 Lisensi

Proyek ini dibuat untuk keperluan akademis (Tugas Besar Cyber Security).


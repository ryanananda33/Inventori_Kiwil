# Aplikasi Sistem Inventori Warkop Kiwil

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


Proyek ini dibuat untuk keperluan akademis (Tugas Besar Cyber Security).


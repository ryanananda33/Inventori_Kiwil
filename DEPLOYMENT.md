# 🚀 Panduan Deployment VPS — Warkop Kiwil

## Prasyarat VPS
- **OS**: Ubuntu 22.04+ / Debian 12+
- **RAM**: Minimal 1GB (rekomendasi 2GB)
- **Storage**: Minimal 10GB
- **Docker** & **Docker Compose** terinstall
- **Domain** sudah mengarah ke IP VPS (DNS A Record)

---

## Langkah 1: Clone Repository ke VPS

```bash
ssh root@IP_VPS_ANDA
git clone https://github.com/ryanananda33/Inventori_Kiwil.git
cd Inventori_Kiwil
```

## Langkah 2: Setup Environment Variables

```bash
cp .env.example .env
nano .env
```

Isi semua variabel:
```
DATABASE_URL=postgresql://postgres.[REF]:[PASS]@aws-0-....supabase.com:6543/postgres
JWT_SECRET=random_string_yang_panjang_dan_aman_minimal_32_char
CLIENT_URL=https://domainanda.com
PORT=5000
NODE_ENV=production
```

## Langkah 3: Konfigurasi Domain di Nginx

```bash
# Ganti DOMAIN_ANDA dengan domain Anda yang sebenarnya
sed -i 's/DOMAIN_ANDA/domainanda.com/g' nginx/default.conf
```

## Langkah 4: Jalankan Aplikasi (HTTP dulu)

```bash
docker compose up -d --build
```

Cek apakah sudah berjalan:
```bash
docker compose ps
docker compose logs app
curl http://localhost/api/health
```

## Langkah 5: Generate SSL Certificate (Let's Encrypt)

```bash
# Generate sertifikat SSL
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path /var/www/certbot \
  -d domainanda.com \
  -d www.domainanda.com \
  --email email@anda.com \
  --agree-tos \
  --no-eff-email
```

## Langkah 6: Aktifkan HTTPS di Nginx

Edit `nginx/default.conf`:
1. **Comment** blok `=== TAHAP 1 ===` (HTTP proxy)
2. **Uncomment** redirect HTTP → HTTPS
3. **Uncomment** seluruh blok `server 443` (HTTPS)
4. Ganti `DOMAIN_ANDA` jika belum

```bash
nano nginx/default.conf
```

Lalu restart nginx:
```bash
docker compose restart nginx
```

## Langkah 7: Auto-Renew SSL (Cron Job)

```bash
# Tambah crontab untuk auto-renew setiap 12 jam
crontab -e

# Tambahkan baris ini:
0 */12 * * * cd /path/to/Inventori_Kiwil && docker compose run --rm certbot renew --quiet && docker compose restart nginx
```

---

## Perintah Berguna

```bash
# Lihat status semua container
docker compose ps

# Lihat log real-time
docker compose logs -f app
docker compose logs -f nginx

# Restart semua service
docker compose restart

# Rebuild & restart (setelah update code)
git pull
docker compose up -d --build

# Stop semua
docker compose down

# Stop + hapus volume
docker compose down -v
```

---

## Struktur File Deployment

```
Inventori_Kiwil/
├── docker-compose.yml      # Orchestrator utama
├── Dockerfile              # Multi-stage build (React + Express)
├── .env                    # Environment variables (JANGAN commit!)
├── .env.example            # Template environment
├── nginx/
│   └── default.conf        # Nginx reverse proxy config
├── certbot/                # Auto-generated oleh certbot
│   ├── conf/               # SSL certificates
│   └── www/                # ACME challenge files
├── client/                 # Frontend React
└── server/                 # Backend Express
```

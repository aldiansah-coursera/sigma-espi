# Panduan Publish SIGMA eSPI (Gratis, Tanpa Kartu Kredit)

Panduan ini men-deploy backend, frontend, dan database SIGMA eSPI ke 3
layanan gratis yang saling terpisah (semuanya bisa daftar pakai email
kampus/pribadi, tanpa kartu kredit):

| Bagian    | Layanan                | Kenapa                                            |
|-----------|-------------------------|----------------------------------------------------|
| Database  | [Neon](https://neon.tech)        | PostgreSQL gratis selamanya, tanpa kartu kredit     |
| Backend   | [Render](https://render.com)     | Jalankan Docker image Spring Boot, paket Free       |
| Frontend  | [Vercel](https://vercel.com)     | Hosting statis untuk hasil build Vite/React         |

Repo GitHub (`aldiansah-coursera/sigma-espi`) harus sudah ter-push
(sudah dilakukan sebelumnya). Ketiga layanan di atas akan connect
langsung ke repo ini, jadi setiap `git push` ke `main` otomatis re-deploy.

Perkiraan waktu total: 20-30 menit.

---

## 1. Database -- Neon (PostgreSQL)

1. Buka https://neon.tech -> Sign up (bisa pakai akun GitHub Anda).
2. Buat project baru, misal nama `sigma-espi`, region terdekat (Singapore).
3. Neon otomatis buat database `neondb` + kasih **Connection String**, mis:
   ```
   postgresql://neondb_owner:AbCdEf123@ep-cool-forest-a1b2c3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Pecah connection string itu jadi bagian-bagian berikut (dipakai di
   langkah Render nanti):
   - `DB_HOST` = `ep-cool-forest-a1b2c3.ap-southeast-1.aws.neon.tech`
   - `DB_PORT` = `5432`
   - `DB_NAME` = `neondb`
   - `DB_USER` = `neondb_owner`
   - `DB_PASSWORD` = `AbCdEf123`
   - `DB_SSLMODE` = `require`

   (Nilai di atas contoh -- pakai punya Anda sendiri dari dashboard Neon.)

Catatan: `spring.jpa.hibernate.ddl-auto=update` di aplikasi sudah otomatis
membuat semua tabel begitu backend pertama kali connect -- tidak perlu
import skema manual.

---

## 2. Backend -- Render (Docker Web Service)

Repo sudah punya `render.yaml` (Blueprint) + `backend/Dockerfile` yang
siap pakai, jadi tinggal:

1. Buka https://render.com -> Sign up pakai akun GitHub Anda (biar bisa
   otorisasi akses ke repo langsung).
2. Dashboard Render -> **New** -> **Blueprint**.
3. Pilih repo `aldiansah-coursera/sigma-espi`. Render akan otomatis
   membaca `render.yaml` dan menyiapkan service bernama `sigma-backend`
   (root directory `backend`, paket Free, region Singapore).
4. Sebelum "Apply", Render akan minta Anda isi env var yang sensitif
   (ditandai `sync: false` di `render.yaml`) -- isi dengan punya Anda:
   - `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` -> dari Neon (langkah 1)
   - `JWT_SECRET` -> string acak panjang, generate sendiri lewat Terminal:
     `openssl rand -base64 48`
   - `CORS_ALLOWED_ORIGINS` dan `FRONTEND_BASE_URL` -> isi sementara
     `http://localhost:5173` dulu, nanti diupdate lagi di Langkah 4
     setelah frontend jadi (Vercel kasih URL final-nya)
   - `MAIL_USERNAME` / `MAIL_PASSWORD` -> opsional, isi kalau mau fitur
     "Lupa Password" (email) aktif. Untuk Gmail, `MAIL_PASSWORD` HARUS App
     Password (myaccount.google.com/apppasswords), bukan password akun.
     Kalau dikosongkan, fitur lain tetap normal, cuma lupa-password yang
     gagal saat dipakai.
5. Klik **Apply**. Render build image Docker-nya (± 3-5 menit pertama
   kali, karena build Maven dari nol).
6. Setelah selesai, Render kasih URL publik backend, misal:
   `https://sigma-backend.onrender.com`

Catatan paket Free Render: service otomatis "tidur" kalau tidak ada
trafik selama 15 menit, request pertama setelah itu akan lambat (cold
start, ± 30-60 detik) -- normal untuk paket gratis, cukup untuk demo.

---

## 3. Frontend -- Vercel (Static Hosting)

Repo sudah punya `frontend/vercel.json` (routing SPA untuk React Router).

1. Buka https://vercel.com -> Sign up pakai akun GitHub Anda.
2. **Add New** -> **Project** -> pilih repo `aldiansah-coursera/sigma-espi`.
3. Saat konfigurasi:
   - **Root Directory**: klik "Edit" -> pilih folder `frontend`
   - **Framework Preset**: Vite (biasanya terdeteksi otomatis)
   - **Build Command**: `npm run build` (default, sudah sesuai `package.json`)
   - **Output Directory**: `dist` (default)
4. Buka **Environment Variables**, tambahkan:
   - `VITE_API_BASE_URL` = URL backend Render dari Langkah 2, mis.
     `https://sigma-backend.onrender.com` (TANPA garis miring di akhir)
5. Klik **Deploy**. Setelah selesai (± 1 menit), Vercel kasih URL publik,
   misal: `https://sigma-espi.vercel.app`

---

## 4. Sambungkan Balik CORS di Backend

Supaya backend mengizinkan request dari domain Vercel (bukan cuma
localhost), balik ke dashboard Render -> service `sigma-backend` ->
**Environment**, update:

- `CORS_ALLOWED_ORIGINS` = `https://sigma-espi.vercel.app` (URL Vercel
  dari Langkah 3, TANPA garis miring di akhir)
- `FRONTEND_BASE_URL` = nilai yang sama (dipakai untuk link di email
  reset password)

Simpan -> Render otomatis redeploy ulang backend dengan env var baru
(± 1 menit, tidak perlu build ulang dari nol).

---

## 5. Tes

1. Buka URL Vercel Anda di browser.
2. Coba Register / Login. Request pertama ke backend bisa lambat
   (cold start Render, lihat catatan di Langkah 2) -- tunggu saja.
3. Kalau muncul error CORS di console browser, cek lagi `CORS_ALLOWED_ORIGINS`
   di Render persis sama dengan URL Vercel (termasuk `https://`, tanpa
   trailing slash).

---

## Update Selanjutnya

Karena ketiganya connect ke GitHub, alur kerja selanjutnya cukup:

```
git add -A
git commit -m "pesan perubahan"
git push origin main
```

Render & Vercel otomatis build ulang & deploy versi terbaru setiap kali
push ke `main`. Tidak perlu ulang setup dari awal.

## Batasan Paket Gratis (baca sebelum sidang/demo penting)

- **Render Free**: service tidur setelah 15 menit tanpa trafik, 750
  jam/bulan gratis (cukup untuk 1 service nonstop). Kalau mau pastikan
  tidak "tidur" pas presentasi, buka URL backend/frontend beberapa menit
  sebelum mulai supaya sudah "bangun".
- **Neon Free**: database auto-suspend juga kalau lama tidak dipakai,
  tapi otomatis aktif lagi begitu ada koneksi masuk (nambah sedikit
  delay di request pertama).
- **Vercel Free**: tidak ada batasan sleep, selalu aktif.

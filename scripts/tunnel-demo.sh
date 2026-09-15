#!/usr/bin/env bash
# Tunnel demo sementara untuk SIGMA eSPI lewat Cloudflare Quick Tunnel (gratis,
# tanpa perlu daftar akun). Menembak docker-compose yang jalan di komputer ini
# ke URL publik, dan otomatis menyambungkan API base URL (frontend -> backend)
# serta CORS (backend -> frontend) supaya keduanya bisa saling panggil lewat
# tunnel-nya masing-masing.
#
# CATATAN: tunnel ini hidup selama skrip ini & Docker di komputer ini menyala.
# Cocok untuk demo ke dosen/klien, BUKAN untuk hosting permanen.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== SIGMA eSPI - Tunnel Demo Sementara =="

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "cloudflared belum terpasang."
  if command -v brew >/dev/null 2>&1; then
    echo "Menginstall lewat Homebrew..."
    brew install cloudflared
  else
    echo "Homebrew tidak ditemukan. Install manual dulu:"
    echo "  https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/"
    exit 1
  fi
fi

DC="docker compose"
if ! docker compose version >/dev/null 2>&1; then
  DC="docker-compose"
fi

echo "Menjalankan docker compose (jika belum jalan)..."
$DC up -d

echo "Menunggu backend siap di :8080..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:8080 >/dev/null 2>&1; then break; fi
  sleep 2
done

mkdir -p .tunnel-logs
rm -f .tunnel-logs/backend.log .tunnel-logs/frontend.log .tunnel-logs/backend.pid .tunnel-logs/frontend.pid

echo "Membuka tunnel untuk backend (port 8080)..."
nohup cloudflared tunnel --url http://localhost:8080 > .tunnel-logs/backend.log 2>&1 &
echo $! > .tunnel-logs/backend.pid

BACKEND_URL=""
for i in $(seq 1 30); do
  BACKEND_URL=$(grep -oE 'https://[a-zA-Z0-9.-]+\.trycloudflare\.com' .tunnel-logs/backend.log 2>/dev/null | head -1 || true)
  [ -n "$BACKEND_URL" ] && break
  sleep 1
done
if [ -z "$BACKEND_URL" ]; then
  echo "Gagal mendapatkan URL tunnel backend. Cek isi .tunnel-logs/backend.log"
  exit 1
fi
echo "Backend tunnel  : $BACKEND_URL"

touch .env
grep -v '^VITE_API_BASE_URL=' .env > .env.tmp 2>/dev/null || true
mv .env.tmp .env
echo "VITE_API_BASE_URL=$BACKEND_URL" >> .env

echo "Merestart frontend dengan API base baru..."
$DC up -d --force-recreate frontend

echo "Menunggu frontend siap di :5173..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:5173 >/dev/null 2>&1; then break; fi
  sleep 2
done

echo "Membuka tunnel untuk frontend (port 5173)..."
nohup cloudflared tunnel --url http://localhost:5173 > .tunnel-logs/frontend.log 2>&1 &
echo $! > .tunnel-logs/frontend.pid

FRONTEND_URL=""
for i in $(seq 1 30); do
  FRONTEND_URL=$(grep -oE 'https://[a-zA-Z0-9.-]+\.trycloudflare\.com' .tunnel-logs/frontend.log 2>/dev/null | head -1 || true)
  [ -n "$FRONTEND_URL" ] && break
  sleep 1
done
if [ -z "$FRONTEND_URL" ]; then
  echo "Gagal mendapatkan URL tunnel frontend. Cek isi .tunnel-logs/frontend.log"
  exit 1
fi
echo "Frontend tunnel : $FRONTEND_URL"

grep -v '^CORS_ALLOWED_ORIGINS=' .env > .env.tmp 2>/dev/null || true
mv .env.tmp .env
grep -v '^FRONTEND_BASE_URL=' .env > .env.tmp 2>/dev/null || true
mv .env.tmp .env
echo "CORS_ALLOWED_ORIGINS=$FRONTEND_URL" >> .env
echo "FRONTEND_BASE_URL=$FRONTEND_URL" >> .env

echo "Merestart backend dengan CORS baru..."
$DC up -d --force-recreate backend

echo ""
echo "=========================================="
echo " Demo siap diakses publik (selama Mac & Docker ini menyala):"
echo " Frontend : $FRONTEND_URL"
echo " Backend  : $BACKEND_URL"
echo "=========================================="
echo ""
echo "Untuk menghentikan tunnel: bash scripts/stop-tunnel-demo.sh"

#!/usr/bin/env bash
# Menghentikan tunnel yang dibuat oleh scripts/tunnel-demo.sh, DAN
# mengembalikan .env ke default lokal (localhost) supaya frontend/backend
# tidak "nyangkut" mencoba menghubungi URL tunnel yang sudah mati -- ini
# penyebab pesan "Tidak dapat terhubung ke server" kalau lupa dibersihkan.
set -euo pipefail
cd "$(dirname "$0")/.."

for f in .tunnel-logs/backend.pid .tunnel-logs/frontend.pid; do
  if [ -f "$f" ]; then
    PID=$(cat "$f")
    if kill "$PID" 2>/dev/null; then
      echo "Tunnel PID $PID dihentikan."
    fi
    rm -f "$f"
  fi
done

if [ -f .env ]; then
  python3 - <<'PYEOF'
with open(".env") as f:
    lines = f.readlines()
keep = [l for l in lines if not l.startswith(("VITE_API_BASE_URL=", "CORS_ALLOWED_ORIGINS=", "FRONTEND_BASE_URL="))]
with open(".env", "w") as f:
    f.writelines(keep)
print(f"Membersihkan {len(lines) - len(keep)} baris URL tunnel dari .env.")
PYEOF
fi

DC="docker compose"
if ! docker compose version >/dev/null 2>&1; then
  DC="docker-compose"
fi

echo "Merestart frontend & backend supaya balik ke localhost..."
$DC up -d --force-recreate frontend backend

echo "Selesai. Aplikasi kembali ke localhost:5173 / localhost:8080 seperti biasa."

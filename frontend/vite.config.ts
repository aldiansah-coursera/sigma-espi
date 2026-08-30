import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    // Izinkan akses lewat hostname Cloudflare Tunnel (trycloudflare.com) --
    // Vite menolak Host header selain localhost secara default sebagai
    // proteksi DNS-rebinding, jadi domain tunnel perlu didaftarkan manual.
    allowedHosts: ['.trycloudflare.com'],
    // Saat diakses lewat tunnel (mis. Cloudflare Tunnel), client HMR di
    // browser tidak bisa nyambung balik ke port internal 5173 -- perlu
    // dipaksa pakai port publik (443, karena tunnel selalu HTTPS/WSS) via
    // env var HMR_CLIENT_PORT. Dev lokal biasa (tanpa env var ini) tidak
    // terpengaruh sama sekali.
    hmr: process.env.HMR_CLIENT_PORT
      ? { clientPort: Number(process.env.HMR_CLIENT_PORT), protocol: 'wss' }
      : undefined,
  },
})

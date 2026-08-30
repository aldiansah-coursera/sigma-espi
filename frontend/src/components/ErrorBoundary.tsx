import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

/**
 * Jaring pengaman terakhir: kalau ada error React yang tidak tertangani
 * saat render (mis. saat pindah halaman lewat Sidebar), tanpa komponen
 * ini seluruh aplikasi akan langsung unmount total dan cuma menyisakan
 * layar putih kosong tanpa keterangan apa pun. Dengan ini, penggunanya
 * setidaknya melihat pesan yang jelas + tombol untuk muat ulang.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[SIGMA] Unhandled render error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
          <p className="text-lg font-bold text-blue-950">Terjadi kesalahan saat memuat halaman.</p>
          <p className="max-w-sm text-sm text-slate-500">
            Silakan coba muat ulang. Kalau masalah ini terus berulang, beri tahu detail langkahnya ke tim
            pengembang.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-800"
          >
            <RefreshCw size={16} />
            Muat Ulang
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

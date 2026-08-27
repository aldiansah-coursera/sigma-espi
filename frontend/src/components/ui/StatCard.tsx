import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: number | string
  icon?: LucideIcon
  customIcon?: ReactNode
  badge?: string
  subtitle?: string
}

export function StatCard({ label, value, icon: Icon, customIcon, badge, subtitle }: StatCardProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-[#e7ebf6] p-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-blue-900/60">{label}</p>
        <div className="mt-2 flex items-center gap-2">
          <p className="text-3xl font-bold text-blue-950">{value}</p>
          {badge && (
            <span className="rounded-lg bg-amber-400 px-2.5 py-0.5 text-[11px] font-bold text-white">
              {badge}
            </span>
          )}
        </div>
        {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
      </div>
      {customIcon ? customIcon : Icon ? <Icon size={44} strokeWidth={1.5} className="text-blue-700/70" /> : null}
    </div>
  )
}

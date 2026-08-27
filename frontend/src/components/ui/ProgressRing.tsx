interface ProgressRingProps {
  percent: number
  size?: number
}

// Ring progres sederhana (SVG murni, tanpa library tambahan) dipakai di
// stat card "PKPT Tahunan" dashboard Kepala SPI, meniru gaya donut-chart
// hijau pada mockup.
export function ProgressRing({ percent, size = 44 }: ProgressRingProps) {
  const clamped = Math.min(100, Math.max(0, percent))
  const stroke = 5
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clamped / 100) * circumference

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#22c55e"
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  )
}

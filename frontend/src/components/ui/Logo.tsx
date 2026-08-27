import logoImage from '../../assets/logo.png'

interface LogoProps {
  variant?: 'light' | 'dark'
  size?: 'sm' | 'md' | 'lg'
  showWordmark?: boolean
}

const BOX_SIZE: Record<NonNullable<LogoProps['size']>, string> = {
  sm: 'h-10 w-10',
  md: 'h-14 w-14',
  lg: 'h-20 w-20',
}

export function Logo({ variant = 'dark', size = 'md', showWordmark = true }: LogoProps) {
  const isLight = variant === 'light'

  return (
    <div className="flex items-center gap-3">
      <img
        src={logoImage}
        alt="Logo PT Dirgantara Indonesia"
        className={`shrink-0 object-contain ${BOX_SIZE[size]}`}
      />
      {showWordmark && (
        <div>
          <p className={`text-lg font-bold leading-tight tracking-wide ${isLight ? 'text-white' : 'text-slate-900'}`}>
            SIGMA <span className="font-medium opacity-80">eSPI</span>
          </p>
          <p className={`text-[11px] font-medium tracking-wide ${isLight ? 'text-blue-100/80' : 'text-slate-500'}`}>
            PT Dirgantara Indonesia
          </p>
        </div>
      )}
    </div>
  )
}

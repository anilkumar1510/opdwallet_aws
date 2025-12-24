import Link from 'next/link'

interface LogoProps {
  variant?: 'white' | 'blue'
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  href?: string
  className?: string
}

const sizeMap = {
  sm: { width: 100, height: 32 },
  md: { width: 140, height: 45 },
  lg: { width: 180, height: 58 },
  xl: { width: 240, height: 78 },
  full: { width: '100%', height: 'auto' },
}

// Operations portal uses basePath: '/operations' in next.config.js
const BASE_PATH = '/operations'

export function Logo({
  variant = 'blue',
  size = 'md',
  href = '/operations',
  className = ''
}: LogoProps) {
  const dimensions = sizeMap[size]
  const logoSrc = variant === 'white'
    ? `${BASE_PATH}/logos/habit-logo-white.png`
    : `${BASE_PATH}/logos/habit-health-logo-blue.svg`

  const logoElement = size === 'full' ? (
    <img
      src={logoSrc}
      alt="Habit Health"
      style={{ width: '100%', height: 'auto' }}
      className={className}
    />
  ) : (
    <img
      src={logoSrc}
      alt="Habit Health"
      width={dimensions.width}
      height={dimensions.height}
      className={className}
    />
  )

  return href ? (
    <Link href={href} className="flex items-center">
      {logoElement}
    </Link>
  ) : logoElement
}

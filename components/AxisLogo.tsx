'use client'

interface AxisLogoProps {
  size?: 'sm' | 'md' | 'lg'
}

export default function AxisLogo({ size = 'md' }: AxisLogoProps) {
  const sizes = {
    sm: { text: 'text-xl', sub: 'text-[8px]' },
    md: { text: 'text-3xl', sub: 'text-[10px]' },
    lg: { text: 'text-5xl', sub: 'text-xs' },
  }

  return (
    <div className="flex flex-col items-start leading-none">
      <span
        className={`font-barlow font-bold tracking-[0.15em] uppercase ${sizes[size].text}`}
        style={{ color: '#c95a2a', fontFamily: "'Barlow Condensed', sans-serif" }}
      >
        AXIS
      </span>
      <span
        className={`font-mono tracking-[0.3em] uppercase ${sizes[size].sub}`}
        style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}
      >
        PARTNERSHIP OS
      </span>
    </div>
  )
}

'use client'

interface AxisLogoProps {
  size?: 'sm' | 'md' | 'lg'
}

export default function AxisLogo({ size = 'md' }: AxisLogoProps) {
  const sizes = {
    sm: { img: 32, text: 'text-xl', sub: 'text-[8px]' },
    md: { img: 48, text: 'text-3xl', sub: 'text-[10px]' },
    lg: { img: 72, text: 'text-5xl', sub: 'text-xs' },
  }

  const s = sizes[size]

  return (
    <div className="flex items-center gap-3">
      <img
        src="/axis-logo.png"
        alt="AXIS"
        width={s.img}
        height={s.img}
        style={{ width: s.img, height: s.img, objectFit: 'contain' }}
      />
      <div className="flex flex-col items-start leading-none">
        <span
          className={`font-bold tracking-[0.15em] uppercase ${s.text}`}
          style={{ color: '#c95a2a', fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          AXIS
        </span>
        <span
          className={`tracking-[0.3em] uppercase ${s.sub}`}
          style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}
        >
          PARTNERSHIP OS
        </span>
      </div>
    </div>
  )
}

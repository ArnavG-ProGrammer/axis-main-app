'use client'

interface CompanyAvatarProps {
  name: string
  logoUrl?: string | null
  size?: number
  className?: string
}

export default function CompanyAvatar({ name, logoUrl, size = 40, className = '' }: CompanyAvatarProps) {
  const letter = name?.[0]?.toUpperCase() ?? '?'

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        width={size}
        height={size}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size, minWidth: size }}
      />
    )
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        background: '#c95a2a',
        color: '#0f0c08',
        fontSize: size * 0.4,
        fontFamily: "'Barlow Condensed', sans-serif",
      }}
    >
      {letter}
    </div>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Telescope, Handshake, TrendingUp, Settings } from 'lucide-react'

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Feed' },
  { href: '/dashboard/discover', icon: Telescope, label: 'Discover' },
  { href: '/dashboard/partnerships', icon: Handshake, label: 'Partners' },
  { href: '/dashboard/markets', icon: TrendingUp, label: 'Markets' },
  { href: '/dashboard/settings', icon: Settings, label: 'More' },
]

export default function MobileNav() {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 flex md:hidden"
      style={{ background: '#150e05', borderTop: '1px solid #2e1e0e', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {NAV.map(({ href, icon: Icon, label }) => {
        const active = isActive(href)
        return (
          <Link key={href} href={href} className="flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors"
            style={{ color: active ? '#c95a2a' : '#4a3828' }}>
            <Icon size={20} />
            <span className="text-[9px] font-mono uppercase tracking-widest" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

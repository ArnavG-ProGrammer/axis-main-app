'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Telescope,
  Handshake,
  TrendingUp,
  FileText,
  History,
  Settings,
  LogOut,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useCompany } from '@/lib/company-context'
import AxisLogo from '@/components/AxisLogo'
import CompanyAvatar from '@/components/CompanyAvatar'
import { useRouter } from 'next/navigation'

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Feed' },
  { href: '/dashboard/discover', icon: Telescope, label: 'Discover' },
  { href: '/dashboard/partnerships', icon: Handshake, label: 'Partnerships' },
  { href: '/dashboard/markets', icon: TrendingUp, label: 'Markets' },
  { href: '/dashboard/legal', icon: FileText, label: 'Legal Docs' },
  { href: '/dashboard/activity', icon: History, label: 'Activity' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
]

type TrackedCompany = {
  id: string
  name: string
  handle: string
  logo_url: string | null
}

export default function LeftSidebar() {
  const pathname = usePathname()
  const { company } = useCompany()
  const [tracked, setTracked] = useState<TrackedCompany[]>([])
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    if (!company) return
    async function fetchTracked() {
      const { data } = await supabase
        .from('follows')
        .select('following_id, companies!follows_following_id_fkey(id, name, handle, logo_url)')
        .eq('follower_id', company!.id)
        .limit(8)

      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setTracked(data.map((d: any) => d.companies).filter(Boolean))
      }
    }
    fetchTracked()
  }, [company])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col z-20 overflow-y-auto"
      style={{ width: 240, background: '#0a0806', borderRight: '1px solid #1a1208' }}
    >
      {/* Logo */}
      <div className="px-5 py-6 flex-shrink-0">
        <AxisLogo size="sm" />
      </div>

      {/* My company card */}
      {company && (
        <Link
          href="/dashboard/profile"
          className="flex items-center gap-3 mx-3 mb-4 px-3 py-2 rounded transition-colors hover:bg-white/[0.04]"
        >
          <CompanyAvatar name={company.name} logoUrl={company.logo_url} size={36} />
          <div className="overflow-hidden">
            <p className="text-sm font-bold truncate" style={{ color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }}>
              {company.name}
            </p>
            <p className="text-[10px] truncate" style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>
              @{company.handle}
            </p>
          </div>
        </Link>
      )}

      {/* Nav links */}
      <nav className="flex flex-col gap-0.5 px-3 flex-1">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-all duration-150"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                background: active ? 'rgba(201,90,42,0.10)' : 'transparent',
                color: active ? '#c95a2a' : '#7a6654',
              }}
            >
              <Icon size={16} />
              <span className="font-semibold tracking-wide">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Tracked companies */}
      {tracked.length > 0 && (
        <div className="px-5 pb-4 flex-shrink-0">
          <p
            className="text-[9px] uppercase tracking-widest mb-3"
            style={{ color: '#4a3828', fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Tracked
          </p>
          <div className="flex flex-col gap-2">
            {tracked.map(c => (
              <Link
                key={c.id}
                href={`/dashboard/company/${c.handle}`}
                className="flex items-center gap-2 group"
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: c.logo_url ? 'transparent' : '#c95a2a' }}
                >
                  {c.logo_url && (
                    <img src={c.logo_url} alt="" className="w-2 h-2 rounded-full object-cover" />
                  )}
                </div>
                <span
                  className="text-xs truncate group-hover:text-[#f5ede3] transition-colors"
                  style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {c.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="flex items-center gap-3 mx-3 mb-4 px-3 py-2.5 rounded text-sm transition-colors hover:bg-white/[0.04]"
        style={{ color: '#4a3828', fontFamily: "'Barlow Condensed', sans-serif" }}
      >
        <LogOut size={15} />
        <span className="font-semibold tracking-wide">Sign Out</span>
      </button>
    </aside>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useCompany } from '@/lib/company-context'
import CompanyAvatar from '@/components/CompanyAvatar'

type SuggestedCompany = {
  id: string
  name: string
  handle: string
  sector: string
  logo_url: string | null
  followers_count: number
}

const MARKET_MOVERS = [
  { ticker: 'NVDA', change: '+4.21%', positive: true },
  { ticker: 'AAPL', change: '+1.03%', positive: true },
  { ticker: 'META', change: '-0.87%', positive: false },
  { ticker: 'GOOGL', change: '+2.15%', positive: true },
]

const TRENDING = [
  { tag: '#AIPartnerships', count: '214 posts' },
  { tag: '#SaaSGrowth', count: '189 posts' },
  { tag: '#FintechCollab', count: '156 posts' },
  { tag: '#B2BNetworking', count: '132 posts' },
  { tag: '#StartupDeals', count: '98 posts' },
]

export default function RightSidebar() {
  const { company } = useCompany()
  const [suggested, setSuggested] = useState<SuggestedCompany[]>([])
  const [stats, setStats] = useState({ partnerships: 0, tracked: 0, docs: 0 })
  const supabase = createClient()

  useEffect(() => {
    if (!company) return
    async function fetchData() {
      const { data: companies } = await supabase
        .from('companies')
        .select('id, name, handle, sector, logo_url, followers_count')
        .neq('id', company!.id)
        .order('followers_count', { ascending: false })
        .limit(3)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (companies) setSuggested(companies as any)

      const [{ count: partnerships }, { count: tracked }, { count: docs }] = await Promise.all([
        supabase.from('partnership_requests').select('*', { count: 'exact', head: true }).or(`sender_id.eq.${company!.id},receiver_id.eq.${company!.id}`),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', company!.id),
        supabase.from('legal_documents').select('*', { count: 'exact', head: true }).eq('company_id', company!.id),
      ])
      setStats({ partnerships: partnerships ?? 0, tracked: tracked ?? 0, docs: docs ?? 0 })
    }
    fetchData()
  }, [company])

  async function handleFollow(targetId: string) {
    if (!company) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('follows').insert({ follower_id: company.id, following_id: targetId })
    setSuggested(prev => prev.filter(c => c.id !== targetId))
  }

  return (
    <aside
      className="fixed right-0 top-0 h-screen overflow-y-auto px-5 py-6 hidden xl:flex flex-col gap-6"
      style={{ width: 280, background: '#0a0806', borderLeft: '1px solid #1a1208' }}
    >
      {/* Trending */}
      <div>
        <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: '#c95a2a', fontFamily: "'IBM Plex Mono', monospace" }}>
          Trending
        </p>
        <div className="flex flex-col gap-3">
          {TRENDING.map(t => (
            <div key={t.tag}>
              <p className="text-sm" style={{ color: '#7ab8c9', fontFamily: "'IBM Plex Mono', monospace" }}>{t.tag}</p>
              <p className="text-[10px]" style={{ color: '#4a3828', fontFamily: "'IBM Plex Mono', monospace" }}>{t.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested */}
      {suggested.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>
            Who to Track
          </p>
          <div className="flex flex-col gap-4">
            {suggested.map(c => (
              <div key={c.id} className="flex items-center gap-2">
                <Link href={`/dashboard/company/${c.handle}`}>
                  <CompanyAvatar name={c.name} logoUrl={c.logo_url} size={32} />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/dashboard/company/${c.handle}`}>
                    <p className="text-sm font-bold truncate leading-tight" style={{ color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }}>{c.name}</p>
                    <p className="text-[10px] truncate" style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>{c.sector}</p>
                  </Link>
                </div>
                <button
                  onClick={() => handleFollow(c.id)}
                  className="text-[10px] font-mono px-2 py-1 rounded transition-colors flex-shrink-0"
                  style={{ border: '1px solid #2e1e0e', color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  Track
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Market movers */}
      <div>
        <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>
          Market Movers
        </p>
        <div className="flex flex-col gap-2">
          {MARKET_MOVERS.map(m => (
            <Link key={m.ticker} href="/dashboard/markets" className="flex items-center justify-between group">
              <span className="text-xs font-mono group-hover:text-[#f5ede3] transition-colors" style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>
                {m.ticker}
              </span>
              <span className="text-xs font-mono" style={{ color: m.positive ? '#4ade80' : '#f87171', fontFamily: "'IBM Plex Mono', monospace" }}>
                {m.change}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Activity summary */}
      <div>
        <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>
          Your Activity
        </p>
        <div className="flex flex-col gap-2">
          {[
            { label: 'Partnerships', value: stats.partnerships },
            { label: 'Tracking', value: stats.tracked },
            { label: 'Documents', value: stats.docs },
          ].map(s => (
            <div key={s.label} className="flex justify-between">
              <span className="text-xs" style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>{s.label}</span>
              <span className="text-sm font-bold" style={{ color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}

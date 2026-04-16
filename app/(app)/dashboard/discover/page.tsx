'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useCompany } from '@/lib/company-context'
import CompanyCard, { type CompanyCardData } from '@/components/CompanyCard'

const SECTORS = ['All', 'Technology', 'Fintech', 'AI/ML', 'SaaS', 'E-commerce', 'Healthcare', 'Education', 'Infrastructure', 'Other']
const TEAM_SIZES = ['All', 'Just me', '2-10', '11-50', '51-200', '200+']
const PAGE_SIZE = 12

export default function DiscoverPage() {
  const { company: myCompany } = useCompany()
  const [companies, setCompanies] = useState<CompanyCardData[]>([])
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [sector, setSector] = useState('All')
  const [teamSize, setTeamSize] = useState('All')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const offsetRef = useRef(0)
  const supabase = createClient()

  // Load following IDs once
  useEffect(() => {
    if (!myCompany) return
    async function loadFollowing() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any).from('follows').select('following_id').eq('follower_id', myCompany!.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setFollowingIds(new Set((data ?? []).map((f: any) => f.following_id)))
    }
    loadFollowing()
  }, [myCompany])

  const fetchCompanies = useCallback(async (reset = false) => {
    const offset = reset ? 0 : offsetRef.current
    if (reset) setLoading(true); else setLoadingMore(true)

    let query = supabase
      .from('companies')
      .select('id, name, handle, sector, bio, tags, logo_url, followers_count')
      .order('followers_count', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    if (myCompany) query = query.neq('id', myCompany.id)
    if (sector !== 'All') query = query.eq('sector', sector)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (teamSize !== 'All') query = (query as any).eq('team_size', teamSize)
    if (search.trim()) query = query.ilike('name', `%${search.trim()}%`)

    const { data } = await query
    const fetched = (data ?? []) as CompanyCardData[]

    if (reset) {
      setCompanies(fetched)
      offsetRef.current = fetched.length
    } else {
      setCompanies(prev => [...prev, ...fetched])
      offsetRef.current += fetched.length
    }
    setHasMore(fetched.length === PAGE_SIZE)
    setLoading(false)
    setLoadingMore(false)
  }, [search, sector, teamSize, myCompany])

  useEffect(() => {
    offsetRef.current = 0
    fetchCompanies(true)
  }, [search, sector, teamSize, myCompany])

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) fetchCompanies(false)
    }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [hasMore, loadingMore, fetchCompanies])

  return (
    <div className="max-w-5xl mx-auto px-5 py-6">
      <h1 className="text-3xl font-bold mb-6" style={{ color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }}>
        Discover Companies
      </h1>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#4a3828' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search companies, sectors, keywords..."
          className="w-full pl-9 pr-4 py-2.5 rounded text-xs outline-none"
          style={{
            background: '#1a1208',
            border: '1px solid #2e1e0e',
            color: '#f5ede3',
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={sector}
          onChange={e => setSector(e.target.value)}
          className="text-xs font-mono px-3 py-2 rounded outline-none"
          style={{ background: '#1a1208', border: '1px solid #2e1e0e', color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}
        >
          {SECTORS.map(s => <option key={s} value={s} style={{ background: '#1a1208' }}>{s === 'All' ? 'All Sectors' : s}</option>)}
        </select>
        <select
          value={teamSize}
          onChange={e => setTeamSize(e.target.value)}
          className="text-xs font-mono px-3 py-2 rounded outline-none"
          style={{ background: '#1a1208', border: '1px solid #2e1e0e', color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}
        >
          {TEAM_SIZES.map(s => <option key={s} value={s} style={{ background: '#1a1208' }}>{s === 'All' ? 'All Sizes' : s}</option>)}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="rounded p-6 animate-pulse" style={{ background: '#1a1208', border: '1px solid #2e1e0e', height: 180 }} />
          ))}
        </div>
      ) : companies.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-3">
          <Search size={40} style={{ color: '#2e1e0e' }} />
          <p className="text-xl font-bold" style={{ color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }}>No companies match your filters.</p>
          <p className="text-sm" style={{ color: '#7a6654', fontFamily: "'Barlow Condensed', sans-serif" }}>Try adjusting your search or filters.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map(c => (
              <CompanyCard key={c.id} company={c} isFollowing={followingIds.has(c.id)} />
            ))}
          </div>
          <div ref={sentinelRef} className="py-6 flex justify-center">
            {loadingMore && <span className="text-xs font-mono" style={{ color: '#4a3828', fontFamily: "'IBM Plex Mono', monospace" }}>Loading...</span>}
          </div>
        </>
      )}
    </div>
  )
}

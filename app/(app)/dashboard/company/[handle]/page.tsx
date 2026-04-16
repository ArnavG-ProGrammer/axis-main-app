'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Globe, Calendar, Users, Handshake, Edit, ArrowLeft } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { createClient } from '@/lib/supabase'
import { useCompany } from '@/lib/company-context'
import { generateGradient } from '@/lib/utils'
import CompanyAvatar from '@/components/CompanyAvatar'
import PostCard, { type Post } from '@/components/PostCard'

type Company = {
  id: string
  name: string
  handle: string
  sector: string
  bio: string | null
  location: string | null
  tags: string[]
  logo_url: string | null
  website: string | null
  founded_year: number | null
  team_size: string | null
  partnership_seeking: string[]
  followers_count: number
  following_count: number
  verified: boolean
  created_at: string
}

type PartnershipRequest = {
  id: string
  sender_id: string
  receiver_id: string
  status: string
  message: string | null
  created_at: string
  sender?: { name: string; handle: string; logo_url: string | null }
  receiver?: { name: string; handle: string; logo_url: string | null }
}

type Tab = 'posts' | 'about' | 'partnerships'

export default function CompanyProfilePage() {
  const { handle } = useParams<{ handle: string }>()
  const router = useRouter()
  const { company: myCompany } = useCompany()
  const [company, setCompany] = useState<Company | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [partnerships, setPartnerships] = useState<PartnershipRequest[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [hasRequested, setHasRequested] = useState(false)
  const [tab, setTab] = useState<Tab>('posts')
  const [loading, setLoading] = useState(true)
  const [followLoading, setFollowLoading] = useState(false)
  const supabase = createClient()

  const isOwn = myCompany?.handle === handle

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('companies')
        .select('*')
        .eq('handle', handle)
        .single()

      if (!data) { setLoading(false); return }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setCompany(data as any)

      const [postsRes, followRes, requestRes] = await Promise.all([
        supabase
          .from('posts')
          .select('*, companies(id, name, handle, sector, logo_url, verified)')
          .eq('company_id', data.id)
          .order('created_at', { ascending: false })
          .limit(20),
        myCompany
          ? supabase.from('follows').select('follower_id').match({ follower_id: myCompany.id, following_id: data.id }).single()
          : Promise.resolve({ data: null }),
        myCompany
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ? (supabase as any).from('partnership_requests').select('id').eq('sender_id', myCompany.id).eq('receiver_id', data.id).single()
          : Promise.resolve({ data: null }),
      ])

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setPosts((postsRes.data ?? []) as any)
      setIsFollowing(!!followRes.data)
      setHasRequested(!!requestRes.data)

      // Fetch partnerships
      if (isOwn) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: prData } = await (supabase as any)
          .from('partnership_requests')
          .select('*, sender:sender_id(name, handle, logo_url), receiver:receiver_id(name, handle, logo_url)')
          .or(`sender_id.eq.${data.id},receiver_id.eq.${data.id}`)
          .order('created_at', { ascending: false })
        setPartnerships(prData ?? [])
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: prData } = await (supabase as any)
          .from('partnership_requests')
          .select('*, sender:sender_id(name, handle, logo_url), receiver:receiver_id(name, handle, logo_url)')
          .or(`sender_id.eq.${data.id},receiver_id.eq.${data.id}`)
          .eq('status', 'accepted')
        setPartnerships(prData ?? [])
      }

      setLoading(false)
    }
    if (myCompany !== undefined) load()
  }, [handle, myCompany])

  async function toggleFollow() {
    if (!myCompany || !company) return
    setFollowLoading(true)
    if (isFollowing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('follows').delete().match({ follower_id: myCompany.id, following_id: company.id })
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('follows').insert({ follower_id: myCompany.id, following_id: company.id })
    }
    setIsFollowing(v => !v)
    setFollowLoading(false)
  }

  async function handleRequest() {
    if (!myCompany || !company || isOwn) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('partnership_requests').insert({ sender_id: myCompany.id, receiver_id: company.id })
    setHasRequested(true)
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="animate-pulse">
          <div className="h-40 w-full" style={{ background: '#1a1208' }} />
          <div className="px-6 pt-10 flex flex-col gap-3">
            <div className="h-6 w-48 rounded" style={{ background: '#1a1208' }} />
            <div className="h-4 w-32 rounded" style={{ background: '#1a1208' }} />
            <div className="h-16 w-full rounded" style={{ background: '#1a1208' }} />
          </div>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 flex flex-col items-center gap-4">
        <p className="text-2xl font-bold" style={{ color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }}>Company not found.</p>
        <Link href="/dashboard" className="text-sm font-mono" style={{ color: '#c95a2a', fontFamily: "'IBM Plex Mono', monospace" }}>← Back to feed</Link>
      </div>
    )
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'posts', label: 'Posts' },
    { key: 'about', label: 'About' },
    { key: 'partnerships', label: 'Partnerships' },
  ]

  const STATUS_COLOR: Record<string, string> = {
    pending: '#c95a2a',
    accepted: '#4ade80',
    rejected: '#f87171',
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <div className="px-5 pt-4">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-xs font-mono mb-4" style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>
          <ArrowLeft size={13} /> Back
        </button>
      </div>

      {/* Banner */}
      <div className="relative" style={{ height: 160, background: generateGradient(company.name) }}>
        {/* Avatar */}
        <div
          className="absolute"
          style={{ bottom: -32, left: 24 }}
        >
          <div style={{ border: '3px solid #0f0c08', borderRadius: '50%' }}>
            <CompanyAvatar name={company.name} logoUrl={company.logo_url} size={64} />
          </div>
        </div>

        {/* Action buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          {isOwn ? (
            <Link
              href="/dashboard/profile/edit"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono"
              style={{ border: '1px solid rgba(255,255,255,0.15)', color: '#f5ede3', background: 'rgba(0,0,0,0.4)', fontFamily: "'IBM Plex Mono', monospace" }}
            >
              <Edit size={11} /> Edit Profile
            </Link>
          ) : (
            <>
              <button
                onClick={toggleFollow}
                disabled={followLoading}
                className="px-3 py-1.5 rounded text-xs font-mono transition-all"
                style={{
                  background: isFollowing ? 'rgba(30,22,16,0.9)' : 'rgba(0,0,0,0.4)',
                  border: isFollowing ? '1px solid #3a2810' : '1px solid rgba(255,255,255,0.15)',
                  color: isFollowing ? '#c95a2a' : '#f5ede3',
                  fontFamily: "'IBM Plex Mono', monospace",
                }}
              >
                {isFollowing ? 'Tracking' : 'Track'}
              </button>
              <button
                onClick={handleRequest}
                disabled={hasRequested}
                className="px-3 py-1.5 rounded text-xs font-mono transition-all disabled:opacity-60"
                style={{ background: '#c95a2a', color: '#0f0c08', fontFamily: "'IBM Plex Mono', monospace" }}
              >
                {hasRequested ? '✦ Requested' : '⊕ Request Partnership'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Profile info */}
      <div className="px-6 pt-10 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold" style={{ color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }}>
                {company.name}
              </h1>
              {company.verified && <span style={{ color: '#c95a2a' }}>✦</span>}
            </div>
            <p className="text-xs font-mono" style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>@{company.handle}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-2 flex-wrap">
          {company.location && (
            <span className="flex items-center gap-1 text-[11px] font-mono" style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>
              <MapPin size={10} /> {company.location}
            </span>
          )}
          <span className="text-[11px] font-mono" style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>
            {company.sector}
          </span>
          {company.website && (
            <a href={company.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[11px] font-mono hover:underline" style={{ color: '#c95a2a', fontFamily: "'IBM Plex Mono', monospace" }}>
              <Globe size={10} /> {company.website.replace(/^https?:\/\//, '')}
            </a>
          )}
          {company.founded_year && (
            <span className="flex items-center gap-1 text-[11px] font-mono" style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>
              <Calendar size={10} /> Est. {company.founded_year}
            </span>
          )}
        </div>

        {company.bio && (
          <p className="mt-3 text-sm leading-relaxed" style={{ color: '#b8a898', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 300, lineHeight: 1.7 }}>
            {company.bio}
          </p>
        )}

        {company.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {company.tags.map(tag => (
              <span
                key={tag}
                className="text-[9px] font-mono px-2 py-0.5 rounded"
                style={{ background: 'rgba(201,90,42,0.06)', border: '1px solid rgba(201,90,42,0.15)', color: '#c95a2a', fontFamily: "'IBM Plex Mono', monospace" }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="flex gap-6 mt-4 pt-4 border-t" style={{ borderColor: '#1a1208' }}>
          {[
            { label: 'Followers', value: company.followers_count },
            { label: 'Following', value: company.following_count },
            { label: 'Posts', value: posts.length },
          ].map(s => (
            <div key={s.label}>
              <p className="text-xl font-bold" style={{ color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }}>{s.value}</p>
              <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: '#1a1208' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-5 py-3 text-[11px] font-mono uppercase tracking-widest transition-colors"
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              color: tab === t.key ? '#c95a2a' : '#7a6654',
              borderBottom: tab === t.key ? '2px solid #c95a2a' : '2px solid transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'posts' && (
        posts.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-2">
            <p className="text-xl font-bold" style={{ color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }}>No posts yet.</p>
          </div>
        ) : (
          posts.map(post => <PostCard key={post.id} post={post} />)
        )
      )}

      {tab === 'about' && (
        <div className="px-6 py-6 flex flex-col gap-5">
          {[
            { icon: Calendar, label: 'Founded', value: company.founded_year?.toString() },
            { icon: Users, label: 'Team Size', value: company.team_size },
            { icon: Globe, label: 'Website', value: company.website },
            { icon: Handshake, label: 'Sector', value: company.sector },
          ].filter(r => r.value).map(row => (
            <div key={row.label} className="flex items-start gap-3">
              <row.icon size={14} style={{ color: '#7a6654', marginTop: 2 }} />
              <div>
                <p className="text-[9px] font-mono uppercase tracking-widest mb-0.5" style={{ color: '#4a3828', fontFamily: "'IBM Plex Mono', monospace" }}>{row.label}</p>
                <p className="text-sm" style={{ color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }}>{row.value}</p>
              </div>
            </div>
          ))}

          {company.partnership_seeking.length > 0 && (
            <div>
              <p className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: '#4a3828', fontFamily: "'IBM Plex Mono', monospace" }}>Seeking Partners For</p>
              <div className="flex flex-wrap gap-1.5">
                {company.partnership_seeking.map(s => (
                  <span key={s} className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ border: '1px solid #2e1e0e', color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: '#4a3828', fontFamily: "'IBM Plex Mono', monospace" }}>On AXIS Since</p>
            <p className="text-sm" style={{ color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }}>
              {formatDistanceToNow(new Date(company.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      )}

      {tab === 'partnerships' && (
        partnerships.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-2">
            <p className="text-xl font-bold" style={{ color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }}>No partnerships yet.</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y" style={{ borderColor: '#1a1208' }}>
            {partnerships.map(pr => (
              <div key={pr.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap text-sm" style={{ color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }}>
                  <span>{pr.sender?.name}</span>
                  <span style={{ color: '#4a3828' }}>↔</span>
                  <span>{pr.receiver?.name}</span>
                </div>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded flex-shrink-0"
                  style={{
                    border: `1px solid ${STATUS_COLOR[pr.status]}40`,
                    color: STATUS_COLOR[pr.status],
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}
                >
                  {pr.status}
                </span>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}

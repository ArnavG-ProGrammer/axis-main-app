'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Users } from 'lucide-react'
import CompanyAvatar from '@/components/CompanyAvatar'
import { createClient } from '@/lib/supabase'
import { useCompany } from '@/lib/company-context'

export type CompanyCardData = {
  id: string
  name: string
  handle: string
  sector: string
  bio: string | null
  tags: string[]
  logo_url: string | null
  followers_count: number
}

interface CompanyCardProps {
  company: CompanyCardData
  isFollowing?: boolean
}

export default function CompanyCard({ company, isFollowing: initialFollowing = false }: CompanyCardProps) {
  const { company: myCompany } = useCompany()
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const isOwn = myCompany?.id === company.id

  async function toggleFollow() {
    if (!myCompany || isOwn) return
    setLoading(true)
    if (following) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('follows').delete().match({ follower_id: myCompany.id, following_id: company.id })
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('follows').insert({ follower_id: myCompany.id, following_id: company.id })
    }
    setFollowing(v => !v)
    setLoading(false)
  }

  return (
    <div
      className="rounded flex flex-col gap-3 p-6 transition-all duration-150 cursor-default"
      style={{ background: '#1a1208', border: '1px solid #2e1e0e' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = '#3a2810')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = '#2e1e0e')}
    >
      <Link href={`/dashboard/company/${company.handle}`} className="flex items-center gap-3">
        <CompanyAvatar name={company.name} logoUrl={company.logo_url} size={48} />
        <div className="overflow-hidden">
          <p className="font-bold text-base truncate" style={{ color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }}>
            {company.name}
          </p>
          <p className="text-[10px] truncate" style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>
            @{company.handle}
          </p>
        </div>
      </Link>

      {/* Sector badge */}
      <span
        className="self-start text-[10px] font-mono px-2 py-0.5 rounded"
        style={{ background: '#0a0806', border: '1px solid #2e1e0e', color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}
      >
        {company.sector}
      </span>

      {/* Bio */}
      {company.bio && (
        <p className="text-sm leading-relaxed" style={{ color: '#7a6654', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 300 }}>
          {company.bio.slice(0, 90)}{company.bio.length > 90 ? '…' : ''}
        </p>
      )}

      {/* Tags */}
      {company.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {company.tags.slice(0, 4).map(tag => (
            <span
              key={tag}
              className="text-[9px] font-mono px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(201,90,42,0.06)', border: '1px solid rgba(201,90,42,0.15)', color: '#c95a2a', fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t" style={{ borderColor: '#2e1e0e' }}>
        <div className="flex items-center gap-1.5">
          <Users size={11} style={{ color: '#4a3828' }} />
          <span className="text-[10px] font-mono" style={{ color: '#4a3828', fontFamily: "'IBM Plex Mono', monospace" }}>
            {company.followers_count} followers
          </span>
        </div>
        {!isOwn && (
          <button
            onClick={toggleFollow}
            disabled={loading}
            className="text-[10px] font-mono px-3 py-1 rounded transition-all disabled:opacity-50"
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              background: following ? '#1e1610' : 'transparent',
              border: following ? '1px solid #3a2810' : '1px solid #2e1e0e',
              color: following ? '#c95a2a' : '#7a6654',
            }}
          >
            {following ? 'Tracking' : 'Track'}
          </button>
        )}
      </div>
    </div>
  )
}

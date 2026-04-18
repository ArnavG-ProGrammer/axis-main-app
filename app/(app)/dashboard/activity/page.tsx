'use client'

import { useState, useEffect } from 'react'
import { Edit, Handshake, Eye, FileText, Building2, Download } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { createClient } from '@/lib/supabase'
import { useCompany } from '@/lib/company-context'

type ActivityType = 'all' | 'post' | 'partnership_request' | 'document_created' | 'follow' | 'onboarding'

type ActivityItem = {
  id: string
  type: string
  description: string
  metadata: Record<string, unknown>
  created_at: string
}

const TYPE_ICON: Record<string, React.ElementType> = {
  post: Edit,
  partnership_request: Handshake,
  follow: Eye,
  document_created: FileText,
  onboarding: Building2,
}

const FILTER_OPTIONS: { key: ActivityType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'post', label: 'Posts' },
  { key: 'partnership_request', label: 'Partnerships' },
  { key: 'document_created', label: 'Documents' },
  { key: 'follow', label: 'Follows' },
  { key: 'onboarding', label: 'Onboarding' },
]

const PAGE_SIZE = 25

export default function ActivityPage() {
  const { company } = useCompany()
  const [items, setItems] = useState<ActivityItem[]>([])
  const [filter, setFilter] = useState<ActivityType>('all')
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    setItems([])
    setOffset(0)
    setHasMore(true)
    fetchActivity(true)
  }, [filter, company])

  async function fetchActivity(reset = false) {
    if (!company) return
    if (reset) setLoading(true)

    const start = reset ? 0 : offset
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('activity_history')
      .select('*')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false })
      .range(start, start + PAGE_SIZE - 1)

    if (filter !== 'all') query = query.eq('type', filter)

    const { data } = await query
    const fetched = data ?? []

    if (reset) {
      setItems(fetched)
      setOffset(fetched.length)
    } else {
      setItems(prev => [...prev, ...fetched])
      setOffset(prev => prev + fetched.length)
    }
    setHasMore(fetched.length === PAGE_SIZE)
    setLoading(false)
  }

  function exportCSV() {
    const rows = [['Type', 'Description', 'Date']]
    items.forEach(i => rows.push([i.type, i.description, new Date(i.created_at).toISOString()]))
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'axis_activity.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold" style={{ color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }}>Activity</h1>
        <button onClick={exportCSV} className="flex items-center gap-1.5 text-xs font-mono px-3 py-2 rounded"
          style={{ border: '1px solid #2e1e0e', color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>
          <Download size={11} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTER_OPTIONS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className="text-[10px] font-mono px-3 py-1.5 rounded transition-all"
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              background: filter === f.key ? 'rgba(201,90,42,0.10)' : 'transparent',
              border: filter === f.key ? '1px solid rgba(201,90,42,0.3)' : '1px solid #2e1e0e',
              color: filter === f.key ? '#c95a2a' : '#7a6654',
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-9 h-9 rounded" style={{ background: '#221508', flexShrink: 0 }} />
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="h-3 rounded w-2/3" style={{ background: '#221508' }} />
                <div className="h-3 rounded w-1/3" style={{ background: '#221508' }} />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-3">
          <Building2 size={40} style={{ color: '#2e1e0e' }} />
          <p className="text-xl font-bold" style={{ color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }}>No activity yet.</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {items.map((item, idx) => {
            const Icon = TYPE_ICON[item.type] ?? Building2
            return (
              <div key={item.id}>
                <div className="flex items-start gap-3 py-4">
                  <div className="w-9 h-9 rounded flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(201,90,42,0.08)' }}>
                    <Icon size={15} style={{ color: '#c95a2a' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }}>{item.description}</p>
                    <p className="text-[10px] font-mono mt-0.5 capitalize" style={{ color: '#4a3828', fontFamily: "'IBM Plex Mono', monospace" }}>{item.type.replace(/_/g, ' ')}</p>
                  </div>
                  <span className="text-[10px] font-mono flex-shrink-0" style={{ color: '#4a3828', fontFamily: "'IBM Plex Mono', monospace" }}>
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: false })} ago
                  </span>
                </div>
                {idx < items.length - 1 && <div className="h-px" style={{ background: '#2e1e0e' }} />}
              </div>
            )
          })}

          {hasMore && (
            <div className="pt-6 flex justify-center">
              <button onClick={() => fetchActivity(false)}
                className="text-xs font-mono uppercase tracking-widest px-6 py-2 rounded"
                style={{ border: '1px solid #2e1e0e', color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>
                Load more
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeftRight, Check, X, FileText, Eye } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { createClient } from '@/lib/supabase'
import { useCompany } from '@/lib/company-context'
import CompanyAvatar from '@/components/CompanyAvatar'

type PRTab = 'received' | 'sent' | 'active'

type PartnershipRequest = {
  id: string
  sender_id: string
  receiver_id: string
  message: string | null
  status: string
  created_at: string
  sender: { id: string; name: string; handle: string; logo_url: string | null }
  receiver: { id: string; name: string; handle: string; logo_url: string | null }
}

const STATUS_STYLE: Record<string, { color: string; border: string }> = {
  pending: { color: '#c95a2a', border: 'rgba(201,90,42,0.3)' },
  accepted: { color: '#4ade80', border: 'rgba(74,222,128,0.3)' },
  rejected: { color: '#f87171', border: 'rgba(248,113,113,0.3)' },
}

export default function PartnershipsPage() {
  const { company } = useCompany()
  const [tab, setTab] = useState<PRTab>('received')
  const [requests, setRequests] = useState<PartnershipRequest[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { if (company) fetchRequests() }, [company, tab])

  async function fetchRequests() {
    if (!company) return
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('partnership_requests')
      .select('*, sender:sender_id(id, name, handle, logo_url), receiver:receiver_id(id, name, handle, logo_url)')
      .order('created_at', { ascending: false })

    if (tab === 'received') query = query.eq('receiver_id', company.id).eq('status', 'pending')
    else if (tab === 'sent') query = query.eq('sender_id', company.id)
    else query = query.or(`sender_id.eq.${company.id},receiver_id.eq.${company.id}`).eq('status', 'accepted')

    const { data } = await query
    setRequests(data ?? [])
    setLoading(false)
  }

  async function updateStatus(id: string, status: 'accepted' | 'rejected') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('partnership_requests').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    if (status === 'accepted' && company) {
      const req = requests.find(r => r.id === id)
      if (req) {
        const otherId = req.sender_id === company.id ? req.receiver_id : req.sender_id
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('activity_history').insert([
          { company_id: company.id, type: 'partnership_request', description: `Partnership accepted with ${req.sender.name}` },
          { company_id: otherId, type: 'partnership_request', description: `Partnership accepted with ${company.name}` },
        ])
      }
    }
    fetchRequests()
  }

  const TABS: { key: PRTab; label: string }[] = [
    { key: 'received', label: 'Received' },
    { key: 'sent', label: 'Sent' },
    { key: 'active', label: 'Active' },
  ]

  return (
    <div className="max-w-2xl mx-auto px-5 py-6">
      <h1 className="text-3xl font-bold mb-6" style={{ color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }}>Partnerships</h1>

      {/* Tabs */}
      <div className="flex border-b mb-6" style={{ borderColor: '#1a1208' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-5 py-3 text-[11px] font-mono uppercase tracking-widest transition-colors"
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              color: tab === t.key ? '#c95a2a' : '#7a6654',
              borderBottom: tab === t.key ? '2px solid #c95a2a' : '2px solid transparent',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded p-5 animate-pulse" style={{ background: '#1a1208', border: '1px solid #2e1e0e', height: 100 }} />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-3">
          <ArrowLeftRight size={40} style={{ color: '#2e1e0e' }} />
          <p className="text-xl font-bold" style={{ color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }}>No requests yet.</p>
          <p className="text-sm" style={{ color: '#7a6654', fontFamily: "'Barlow Condensed', sans-serif" }}>
            {tab === 'received' ? 'Partnership requests you receive will appear here.' : tab === 'sent' ? 'Requests you send will appear here.' : 'Accepted partnerships appear here.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map(req => {
            const isReceiver = req.receiver_id === company?.id
            const other = isReceiver ? req.sender : req.receiver
            const style = STATUS_STYLE[req.status] ?? STATUS_STYLE.pending

            return (
              <div key={req.id} className="rounded p-5 transition-all" style={{ background: '#1a1208', border: '1px solid #2e1e0e' }}>
                {/* Companies row */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <CompanyAvatar name={req.sender.name} logoUrl={req.sender.logo_url} size={32} />
                    <Link href={`/dashboard/company/${req.sender.handle}`} className="text-sm font-bold hover:underline" style={{ color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }}>{req.sender.name}</Link>
                  </div>
                  <ArrowLeftRight size={14} style={{ color: '#4a3828' }} />
                  <div className="flex items-center gap-2">
                    <CompanyAvatar name={req.receiver.name} logoUrl={req.receiver.logo_url} size={32} />
                    <Link href={`/dashboard/company/${req.receiver.handle}`} className="text-sm font-bold hover:underline" style={{ color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }}>{req.receiver.name}</Link>
                  </div>
                  <span className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded flex-shrink-0"
                    style={{ color: style.color, border: `1px solid ${style.border}`, fontFamily: "'IBM Plex Mono', monospace" }}>
                    {req.status}
                  </span>
                </div>

                {req.message && (
                  <p className="text-xs mb-3 leading-relaxed" style={{ color: '#7a6654', fontFamily: "'Barlow Condensed', sans-serif" }}>{req.message}</p>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono" style={{ color: '#4a3828', fontFamily: "'IBM Plex Mono', monospace" }}>
                    {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                  </span>

                  <div className="flex gap-2">
                    {tab === 'received' && req.status === 'pending' && (
                      <>
                        <button onClick={() => updateStatus(req.id, 'rejected')}
                          className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono transition-colors"
                          style={{ border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', fontFamily: "'IBM Plex Mono', monospace" }}>
                          <X size={10} /> Decline
                        </button>
                        <button onClick={() => updateStatus(req.id, 'accepted')}
                          className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono transition-colors"
                          style={{ border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80', fontFamily: "'IBM Plex Mono', monospace" }}>
                          <Check size={10} /> Accept
                        </button>
                      </>
                    )}
                    {tab === 'active' && (
                      <>
                        <Link href={`/dashboard/company/${other.handle}`}
                          className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono"
                          style={{ border: '1px solid #2e1e0e', color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>
                          <Eye size={10} /> View Profile
                        </Link>
                        <Link href={`/dashboard/legal?partner=${encodeURIComponent(other.name)}`}
                          className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono"
                          style={{ border: '1px solid rgba(201,90,42,0.3)', color: '#c95a2a', fontFamily: "'IBM Plex Mono', monospace" }}>
                          <FileText size={10} /> Generate Agreement
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

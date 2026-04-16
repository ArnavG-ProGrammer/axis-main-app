'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, Repeat2, MessageSquare, Plus, Check } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import CompanyAvatar from '@/components/CompanyAvatar'
import { createClient } from '@/lib/supabase'
import { useCompany } from '@/lib/company-context'

export type Post = {
  id: string
  content: string
  is_partnership_opportunity: boolean
  likes_count: number
  reposts_count: number
  comments_count: number
  created_at: string
  companies: {
    id: string
    name: string
    handle: string
    sector: string
    logo_url: string | null
    verified: boolean
  }
}

interface PostCardProps {
  post: Post
  onRequestSent?: () => void
}

export default function PostCard({ post, onRequestSent }: PostCardProps) {
  const { company } = useCompany()
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(post.likes_count)
  const [requested, setRequested] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [comment, setComment] = useState('')
  const supabase = createClient()

  const isOwnPost = company?.id === post.companies?.id

  async function handleLike() {
    if (!company) return
    if (liked) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('post_likes').delete().match({ post_id: post.id, company_id: company.id })
      setLikes(l => l - 1)
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('post_likes').insert({ post_id: post.id, company_id: company.id })
      setLikes(l => l + 1)
    }
    setLiked(v => !v)
  }

  async function handleRequest() {
    if (!company || isOwnPost) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('partnership_requests').insert({
      sender_id: company.id,
      receiver_id: post.companies.id,
      message: `Interested in your post: "${post.content.slice(0, 80)}..."`,
    })
    setRequested(true)
    onRequestSent?.()
  }

  async function handleComment() {
    if (!company || !comment.trim()) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('comments').insert({
      post_id: post.id,
      company_id: company.id,
      content: comment.trim(),
    })
    setComment('')
  }

  return (
    <article
      className="px-5 py-4 border-b"
      style={{ borderColor: '#1a1208' }}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <Link href={`/dashboard/company/${post.companies?.handle}`} className="flex-shrink-0">
          <CompanyAvatar
            name={post.companies?.name ?? '?'}
            logoUrl={post.companies?.logo_url}
            size={40}
          />
        </Link>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/dashboard/company/${post.companies?.handle}`}>
                <span className="font-bold text-sm hover:underline" style={{ color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {post.companies?.name}
                </span>
              </Link>
              {post.companies?.verified && (
                <span className="text-[10px]" style={{ color: '#c95a2a' }}>✦</span>
              )}
              <span className="text-[10px] font-mono" style={{ color: '#4a3828', fontFamily: "'IBM Plex Mono', monospace" }}>
                @{post.companies?.handle}
              </span>
              <span className="text-[10px] font-mono" style={{ color: '#4a3828', fontFamily: "'IBM Plex Mono', monospace" }}>
                · {formatDistanceToNow(new Date(post.created_at), { addSuffix: false })} ago
              </span>
            </div>
            <span
              className="text-[10px] font-mono flex-shrink-0 px-2 py-0.5 rounded"
              style={{
                color: '#7a6654',
                background: '#1a1208',
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              {post.companies?.sector}
            </span>
          </div>

          {/* Content */}
          <p className="text-sm leading-relaxed mb-2" style={{ color: '#e8ddd0', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 300, lineHeight: 1.65 }}>
            {post.content}
          </p>

          {/* Partnership badge */}
          {post.is_partnership_opportunity && (
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded mb-3 text-[10px] font-mono uppercase tracking-widest"
              style={{
                background: 'rgba(201,90,42,0.08)',
                border: '1px solid rgba(201,90,42,0.25)',
                color: '#c95a2a',
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              🤝 Partnership Opportunity
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-5">
            <button onClick={handleLike} className="flex items-center gap-1.5 group">
              <Heart
                size={14}
                style={{ color: liked ? '#c95a2a' : '#4a3828' }}
                fill={liked ? '#c95a2a' : 'none'}
                className="transition-colors group-hover:stroke-[#c95a2a]"
              />
              <span className="text-[11px] font-mono" style={{ color: '#4a3828', fontFamily: "'IBM Plex Mono', monospace" }}>{likes}</span>
            </button>

            <button className="flex items-center gap-1.5 group">
              <Repeat2 size={14} style={{ color: '#4a3828' }} className="group-hover:text-green-400 transition-colors" />
              <span className="text-[11px] font-mono" style={{ color: '#4a3828', fontFamily: "'IBM Plex Mono', monospace" }}>{post.reposts_count}</span>
            </button>

            <button onClick={() => setShowComments(v => !v)} className="flex items-center gap-1.5 group">
              <MessageSquare size={14} style={{ color: '#4a3828' }} className="group-hover:text-blue-400 transition-colors" />
              <span className="text-[11px] font-mono" style={{ color: '#4a3828', fontFamily: "'IBM Plex Mono', monospace" }}>{post.comments_count}</span>
            </button>

            {post.is_partnership_opportunity && !isOwnPost && (
              <button
                onClick={handleRequest}
                disabled={requested}
                className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider ml-auto transition-colors disabled:opacity-60"
                style={{
                  color: requested ? '#c95a2a' : '#7a6654',
                  fontFamily: "'IBM Plex Mono', monospace",
                }}
              >
                {requested ? (
                  <><Check size={11} /> Requested</>
                ) : (
                  <><Plus size={11} /> Request Partnership</>
                )}
              </button>
            )}
          </div>

          {/* Inline comments */}
          {showComments && (
            <div className="mt-3 pt-3 border-t" style={{ borderColor: '#1a1208' }}>
              <div className="flex gap-2">
                <CompanyAvatar name={company?.name ?? '?'} logoUrl={company?.logo_url} size={24} />
                <input
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleComment() }}
                  placeholder="Write a comment..."
                  className="flex-1 bg-transparent text-xs outline-none border-b pb-1"
                  style={{
                    color: '#f5ede3',
                    borderColor: '#2e1e0e',
                    fontFamily: "'Barlow Condensed', sans-serif",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

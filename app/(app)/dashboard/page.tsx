'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { useCompany } from '@/lib/company-context'
import CompanyAvatar from '@/components/CompanyAvatar'
import PostCard, { type Post } from '@/components/PostCard'

type FeedFilter = 'all' | 'opportunities' | 'tracking'

const POSTS_PER_PAGE = 20

export default function FeedPage() {
  const { company } = useCompany()
  const [posts, setPosts] = useState<Post[]>([])
  const [filter, setFilter] = useState<FeedFilter>('all')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [content, setContent] = useState('')
  const [isOpportunity, setIsOpportunity] = useState(false)
  const [posting, setPosting] = useState(false)
  const [newPostBanner, setNewPostBanner] = useState<string | null>(null)
  const supabase = createClient()
  const offsetRef = useRef(0)

  async function fetchPosts(reset = false) {
    const offset = reset ? 0 : offsetRef.current
    if (reset) setLoading(true)
    else setLoadingMore(true)

    let query = supabase
      .from('posts')
      .select('*, companies(id, name, handle, sector, logo_url, verified)')
      .order('created_at', { ascending: false })
      .range(offset, offset + POSTS_PER_PAGE - 1)

    if (filter === 'opportunities') {
      query = query.eq('is_partnership_opportunity', true)
    }

    if (filter === 'tracking' && company) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: follows } = await (supabase as any)
        .from('follows')
        .select('following_id')
        .eq('follower_id', company.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ids = follows?.map((f: any) => f.following_id) ?? []
      if (ids.length > 0) {
        query = query.in('company_id', ids)
      }
    }

    const { data } = await query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fetched = (data ?? []) as any[]

    if (reset) {
      setPosts(fetched)
      offsetRef.current = fetched.length
    } else {
      setPosts(prev => [...prev, ...fetched])
      offsetRef.current += fetched.length
    }

    setHasMore(fetched.length === POSTS_PER_PAGE)
    setLoading(false)
    setLoadingMore(false)
  }

  useEffect(() => {
    fetchPosts(true)
  }, [filter, company])

  // Real-time new posts
  useEffect(() => {
    const channel = supabase
      .channel('posts-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, async payload => {
        const { data } = await supabase
          .from('posts')
          .select('*, companies(id, name, handle, sector, logo_url, verified)')
          .eq('id', payload.new.id)
          .single()
        if (data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const newPost = data as any
          if (newPost.companies?.id !== company?.id) {
            setNewPostBanner(`New post from ${newPost.companies?.name}`)
            setTimeout(() => setNewPostBanner(null), 4000)
            setPosts(prev => [newPost, ...prev])
          }
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [company])

  async function handlePost() {
    if (!company || !content.trim()) return
    setPosting(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: post } = await (supabase as any)
      .from('posts')
      .insert({ company_id: company.id, content: content.trim(), is_partnership_opportunity: isOpportunity })
      .select('*, companies(id, name, handle, sector, logo_url, verified)')
      .single()

    if (post) {
      setPosts(prev => [post, ...prev])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('activity_history').insert({
        company_id: company.id,
        type: 'post',
        description: `Published a post${isOpportunity ? ' (Partnership Opportunity)' : ''}`,
      })
    }
    setContent('')
    setIsOpportunity(false)
    setPosting(false)
  }

  const FILTERS: { key: FeedFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'opportunities', label: 'Opportunities' },
    { key: 'tracking', label: 'Tracking' },
  ]

  return (
    <div className="max-w-2xl mx-auto">
      {/* New post banner */}
      {newPostBanner && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded text-xs font-mono"
          style={{ background: '#1a1208', border: '1px solid #c95a2a', color: '#c95a2a', fontFamily: "'IBM Plex Mono', monospace" }}
        >
          {newPostBanner}
        </motion.div>
      )}

      {/* Compose box */}
      {company && (
        <div className="px-5 py-4 border-b" style={{ borderColor: '#1a1208' }}>
          <div className="flex gap-3">
            <CompanyAvatar name={company.name} logoUrl={company.logo_url} size={40} />
            <div className="flex-1">
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Share a partnership opportunity..."
                rows={3}
                className="w-full bg-transparent outline-none resize-none text-sm leading-relaxed placeholder:text-[#3a2810]"
                style={{ color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15 }}
              />
              <div className="flex items-center justify-between mt-2 pt-2 border-t" style={{ borderColor: '#1a1208' }}>
                <button
                  onClick={() => setIsOpportunity(v => !v)}
                  className="text-[10px] font-mono px-3 py-1.5 rounded transition-all"
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    background: isOpportunity ? 'rgba(201,90,42,0.12)' : 'transparent',
                    border: isOpportunity ? '1px solid rgba(201,90,42,0.4)' : '1px solid #2e1e0e',
                    color: isOpportunity ? '#c95a2a' : '#7a6654',
                  }}
                >
                  🤝 Partnership Opportunity
                </button>
                <button
                  onClick={handlePost}
                  disabled={!content.trim() || posting}
                  className="px-4 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-opacity disabled:opacity-40"
                  style={{ background: '#c95a2a', color: '#0f0c08', fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {posting ? 'Posting...' : 'Publish'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex border-b" style={{ borderColor: '#1a1208' }}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="px-5 py-3 text-[11px] font-mono uppercase tracking-widest transition-colors"
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              color: filter === f.key ? '#c95a2a' : '#7a6654',
              borderBottom: filter === f.key ? '2px solid #c95a2a' : '2px solid transparent',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Posts */}
      {loading ? (
        <div className="flex flex-col">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-5 py-4 border-b animate-pulse" style={{ borderColor: '#1a1208' }}>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full" style={{ background: '#1a1208' }} />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="h-3 rounded w-32" style={{ background: '#1a1208' }} />
                  <div className="h-3 rounded w-full" style={{ background: '#1a1208' }} />
                  <div className="h-3 rounded w-3/4" style={{ background: '#1a1208' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <span className="text-4xl" style={{ color: '#2e1e0e' }}>◎</span>
          <p className="font-bold text-xl" style={{ color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }}>
            {filter === 'tracking' ? 'Track companies to see their posts.' : 'No posts yet.'}
          </p>
          <p className="text-sm" style={{ color: '#7a6654', fontFamily: "'Barlow Condensed', sans-serif" }}>
            Post your first partnership opportunity above.
          </p>
        </div>
      ) : (
        <>
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}

          {hasMore && (
            <div className="py-6 flex justify-center">
              <button
                onClick={() => fetchPosts(false)}
                disabled={loadingMore}
                className="text-xs font-mono uppercase tracking-widest px-6 py-2 rounded transition-colors disabled:opacity-50"
                style={{ border: '1px solid #2e1e0e', color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}
              >
                {loadingMore ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useRef } from 'react'
import { Star, StarOff, TrendingUp, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useCompany } from '@/lib/company-context'
import { formatCrore } from '@/lib/utils'

type MarketTab = 'stocks' | 'valuation'

const DEFAULT_TICKERS = [
  { ticker: 'SPY', name: 'S&P 500 ETF' },
  { ticker: 'AAPL', name: 'Apple Inc.' },
  { ticker: 'MSFT', name: 'Microsoft Corp.' },
  { ticker: 'GOOGL', name: 'Alphabet Inc.' },
  { ticker: 'NVDA', name: 'NVIDIA Corp.' },
  { ticker: 'META', name: 'Meta Platforms' },
]

const SECTOR_COMPARABLES: Record<string, { names: string[]; multiple: string }> = {
  'SaaS': { names: ['Salesforce (15x)', 'HubSpot (12x)', 'Atlassian (14x)'], multiple: '8-15x' },
  'Fintech': { names: ['Stripe (10x)', 'Razorpay (8x)', 'Pine Labs (7x)'], multiple: '5-12x' },
  'AI/ML': { names: ['OpenAI (20x)', 'Anthropic (18x)', 'Cohere (15x)'], multiple: '10-20x' },
  'E-commerce': { names: ['Shopify (2x)', 'BigCommerce (1.5x)', 'WooCommerce (1x)'], multiple: '1-3x' },
  'Healthcare': { names: ['Practo (8x)', 'PharmEasy (7x)', 'Nykaa Health (6x)'], multiple: '6-12x' },
  'Infrastructure': { names: ['Cloudflare (8x)', 'HashiCorp (7x)', 'Pulumi (6x)'], multiple: '6-10x' },
  'Technology': { names: ['ServiceNow (10x)', 'Freshworks (8x)', 'Zoho (7x)'], multiple: '5-12x' },
  'Education': { names: ['BYJU\'S (6x)', 'Coursera (5x)', 'Unacademy (4x)'], multiple: '3-8x' },
  'Other': { names: ['Various (5x avg)'], multiple: '3-8x' },
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Window { TradingView: any }
}

function TradingViewWidget({ ticker }: { ticker: string }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    containerRef.current.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: ticker,
      interval: 'D',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      backgroundColor: '#150e05',
      gridColor: '#1a1208',
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      calendar: false,
      support_host: 'https://www.tradingview.com',
    })

    const container = document.createElement('div')
    container.className = 'tradingview-widget-container__widget'
    container.style.height = 'calc(100% - 32px)'
    container.style.width = '100%'

    const copyright = document.createElement('div')
    copyright.className = 'tradingview-widget-copyright'
    copyright.innerHTML = '<a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank"><span style="color:#7a6654;font-size:10px;font-family:IBM Plex Mono">TradingView</span></a>'

    containerRef.current.appendChild(container)
    containerRef.current.appendChild(copyright)
    containerRef.current.appendChild(script)

    return () => { if (containerRef.current) containerRef.current.innerHTML = '' }
  }, [ticker])

  return (
    <div ref={containerRef} className="tradingview-widget-container" style={{ height: '420px', width: '100%' }} />
  )
}

function TradingViewNews() {
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!containerRef.current) return
    containerRef.current.innerHTML = ''
    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-timeline.js'
    script.async = true
    script.innerHTML = JSON.stringify({
      feedMode: 'all_symbols',
      isTransparent: true,
      displayMode: 'compact',
      width: '100%',
      height: 400,
      colorTheme: 'dark',
      locale: 'en',
    })
    containerRef.current.appendChild(script)
    return () => { if (containerRef.current) containerRef.current.innerHTML = '' }
  }, [])
  return <div ref={containerRef} className="tradingview-widget-container" />
}

// ── Valuation Tool ────────────────────────────────────────
const SECTORS = ['Technology', 'Fintech', 'AI/ML', 'SaaS', 'E-commerce', 'Healthcare', 'Education', 'Infrastructure', 'Other']
const SECTOR_MULTIPLES: Record<string, [number, number]> = {
  'SaaS': [8, 15], 'Fintech': [5, 12], 'AI/ML': [10, 20],
  'E-commerce': [1, 3], 'Healthcare': [6, 12], 'Infrastructure': [6, 10],
  'Technology': [5, 12], 'Education': [3, 8], 'Other': [3, 8],
}

type ValuationResult = { low: number; high: number; methodology: string; multiple?: number }
type ValSnapshot = { id: string; estimated_low: number; estimated_high: number; methodology: string; created_at: string }

export default function MarketsPage() {
  const { company } = useCompany()
  const [tab, setTab] = useState<MarketTab>('stocks')
  const [selectedTicker, setSelectedTicker] = useState('AAPL')
  const [watchlist, setWatchlist] = useState<string[]>([])
  const supabase = createClient()

  // Valuation state
  const [revenue, setRevenue] = useState(0)
  const [noRevenue, setNoRevenue] = useState(false)
  const [growthRate, setGrowthRate] = useState(0)
  const [sector, setSector] = useState('SaaS')
  const [stage, setStage] = useState('Pre-revenue')
  const [teamSize, setTeamSize] = useState('2-10')
  const [mau, setMau] = useState(0)
  const [nrr, setNrr] = useState(0)
  const [hasIP, setHasIP] = useState(false)
  const [hasPartnerships, setHasPartnerships] = useState(false)
  const [result, setResult] = useState<ValuationResult | null>(null)
  const [snapshots, setSnapshots] = useState<ValSnapshot[]>([])
  const [savingVal, setSavingVal] = useState(false)

  useEffect(() => {
    if (!company) return
    async function load() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: wl } = await (supabase as any).from('stock_watchlist').select('ticker').eq('company_id', company!.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setWatchlist((wl ?? []).map((w: any) => w.ticker))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: snaps } = await (supabase as any).from('valuation_snapshots').select('*').eq('company_id', company!.id).order('created_at', { ascending: false })
      setSnapshots(snaps ?? [])
    }
    load()
  }, [company])

  async function toggleWatchlist(ticker: string) {
    if (!company) return
    if (watchlist.includes(ticker)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('stock_watchlist').delete().match({ company_id: company.id, ticker })
      setWatchlist(prev => prev.filter(t => t !== ticker))
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('stock_watchlist').insert({ company_id: company.id, ticker })
      setWatchlist(prev => [...prev, ticker])
    }
  }

  function calculateValuation() {
    const [multLow, multHigh] = SECTOR_MULTIPLES[sector] ?? [3, 8]
    const multMid = (multLow + multHigh) / 2
    let base = 0
    let methodology = ''
    let usedMultiple = multMid

    if (!noRevenue && revenue > 0) {
      base = revenue * multMid
      methodology = `Revenue × ${multMid}x sector multiple (${sector}: ${multLow}-${multHigh}x range)`
      usedMultiple = multMid
    } else {
      const teamScore: Record<string, number> = { 'Just me': 50000, '2-10': 200000, '11-50': 800000, '51-200': 2000000, '200+': 5000000 }
      const stageScore: Record<string, number> = { 'Idea': 1, 'Pre-revenue': 2.5, 'Early Revenue under 10L': 5, 'Growth 10L-1Cr': 10, 'Scale 1Cr+': 20 }
      base = (teamScore[teamSize] ?? 200000) * (stageScore[stage] ?? 2.5) * multMid
      methodology = `Pre-revenue: Team score × Stage score × ${multMid}x sector multiple`
    }

    let adj = 1
    if (growthRate > 100) { adj *= 1.5; methodology += ' · growth >100% (+50%)' }
    else if (growthRate > 50) { adj *= 1.25; methodology += ' · growth >50% (+25%)' }
    if (nrr > 120) { adj *= 1.3; methodology += ' · NRR >120% (+30%)' }
    if (hasIP) { adj *= 1.2; methodology += ' · IP (+20%)' }
    if (hasPartnerships) { adj *= 1.15; methodology += ' · partnerships (+15%)' }
    if (mau > 10000) { adj *= 1.2; methodology += ' · MAU >10K (+20%)' }

    const adjusted = base * adj
    setResult({
      low: Math.round(adjusted * 0.8),
      high: Math.round(adjusted * 1.4),
      methodology,
      multiple: usedMultiple,
    })
  }

  async function saveSnapshot() {
    if (!company || !result) return
    setSavingVal(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).from('valuation_snapshots').insert({
      company_id: company.id,
      inputs: { revenue, growthRate, sector, stage, teamSize, mau, nrr, hasIP, hasPartnerships },
      estimated_low: result.low,
      estimated_high: result.high,
      methodology: result.methodology,
    }).select('*').single()
    if (data) setSnapshots(prev => [data, ...prev])
    setSavingVal(false)
  }

  const tickers = [...DEFAULT_TICKERS, ...watchlist.filter(t => !DEFAULT_TICKERS.find(d => d.ticker === t)).map(t => ({ ticker: t, name: t }))]

  return (
    <div className="max-w-6xl mx-auto px-5 py-6">
      {/* Tabs */}
      <div className="flex gap-0 mb-6 rounded overflow-hidden self-start" style={{ border: '1px solid #2e1e0e', display: 'inline-flex' }}>
        {[{ key: 'stocks', label: 'Stocks & Markets' }, { key: 'valuation', label: 'Valuation Tool' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as MarketTab)}
            className="px-5 py-2.5 text-xs font-mono uppercase tracking-widest transition-all"
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              background: tab === t.key ? '#1a1208' : 'transparent',
              color: tab === t.key ? '#c95a2a' : '#7a6654',
              borderRight: t.key === 'stocks' ? '1px solid #2e1e0e' : 'none',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── STOCKS TAB ── */}
      {tab === 'stocks' && (
        <div className="flex gap-5">
          {/* Ticker sidebar */}
          <div className="w-44 flex-shrink-0">
            <p className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: '#4a3828', fontFamily: "'IBM Plex Mono', monospace" }}>Tickers</p>
            <div className="flex flex-col gap-0.5">
              {tickers.map(t => (
                <div key={t.ticker} className="flex items-center justify-between group">
                  <button onClick={() => setSelectedTicker(t.ticker)}
                    className="flex-1 text-left px-2 py-2 rounded text-xs font-mono transition-all"
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      background: selectedTicker === t.ticker ? 'rgba(201,90,42,0.10)' : 'transparent',
                      color: selectedTicker === t.ticker ? '#c95a2a' : '#7a6654',
                    }}>
                    {t.ticker}
                  </button>
                  <button onClick={() => toggleWatchlist(t.ticker)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1">
                    {watchlist.includes(t.ticker)
                      ? <StarOff size={10} style={{ color: '#c95a2a' }} />
                      : <Star size={10} style={{ color: '#4a3828' }} />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Chart + news */}
          <div className="flex-1 flex flex-col gap-5">
            <div className="rounded overflow-hidden" style={{ border: '1px solid #2e1e0e' }}>
              <div className="px-4 py-3 flex items-center gap-3" style={{ background: '#150e05', borderBottom: '1px solid #2e1e0e' }}>
                <span className="text-xl font-bold" style={{ color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }}>{selectedTicker}</span>
                <span className="text-xs font-mono" style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>
                  {DEFAULT_TICKERS.find(d => d.ticker === selectedTicker)?.name ?? selectedTicker}
                </span>
              </div>
              <TradingViewWidget ticker={selectedTicker} />
            </div>

            {/* News */}
            <div className="rounded overflow-hidden" style={{ border: '1px solid #2e1e0e' }}>
              <div className="px-4 py-3" style={{ background: '#150e05', borderBottom: '1px solid #2e1e0e' }}>
                <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>Financial News</p>
              </div>
              <div style={{ background: '#150e05' }}>
                <TradingViewNews />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── VALUATION TAB ── */}
      {tab === 'valuation' && (
        <div className="max-w-3xl">
          <div className="mb-6">
            <h2 className="text-2xl font-bold" style={{ color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }}>Company Valuation Estimator</h2>
            <p className="text-xs font-mono mt-1" style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>
              Not an official valuation. A data-driven estimate based on your inputs and comparable companies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Section 1: Revenue */}
            <div className="rounded p-5" style={{ background: '#1a1208', border: '1px solid #2e1e0e' }}>
              <p className="text-[9px] font-mono uppercase tracking-widest mb-4" style={{ color: '#c95a2a', fontFamily: "'IBM Plex Mono', monospace" }}>Revenue</p>
              <div className="flex flex-col gap-4">
                <label className="flex items-center gap-2 text-xs font-mono cursor-pointer" style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>
                  <input type="checkbox" checked={noRevenue} onChange={e => setNoRevenue(e.target.checked)} />
                  We have no revenue yet
                </label>
                {!noRevenue && (
                  <div>
                    <label className="block text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: '#4a3828', fontFamily: "'IBM Plex Mono', monospace" }}>Annual Revenue (₹)</label>
                    <input type="number" value={revenue} onChange={e => setRevenue(Number(e.target.value))} className="w-full bg-transparent border-b py-1 text-sm outline-none" style={{ borderColor: '#2e1e0e', color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }} />
                  </div>
                )}
                <div>
                  <label className="block text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: '#4a3828', fontFamily: "'IBM Plex Mono', monospace" }}>Growth Rate % (last 12m)</label>
                  <input type="number" value={growthRate} onChange={e => setGrowthRate(Number(e.target.value))} className="w-full bg-transparent border-b py-1 text-sm outline-none" style={{ borderColor: '#2e1e0e', color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }} />
                </div>
              </div>
            </div>

            {/* Section 2: Business */}
            <div className="rounded p-5" style={{ background: '#1a1208', border: '1px solid #2e1e0e' }}>
              <p className="text-[9px] font-mono uppercase tracking-widest mb-4" style={{ color: '#c95a2a', fontFamily: "'IBM Plex Mono', monospace" }}>Business</p>
              <div className="flex flex-col gap-4">
                {[
                  { label: 'Sector', value: sector, set: setSector, options: SECTORS },
                  { label: 'Stage', value: stage, set: setStage, options: ['Idea', 'Pre-revenue', 'Early Revenue under 10L', 'Growth 10L-1Cr', 'Scale 1Cr+'] },
                  { label: 'Team Size', value: teamSize, set: setTeamSize, options: ['Just me', '2-10', '11-50', '51-200', '200+'] },
                ].map(f => (
                  <div key={f.label}>
                    <label className="block text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: '#4a3828', fontFamily: "'IBM Plex Mono', monospace" }}>{f.label}</label>
                    <select value={f.value} onChange={e => f.set(e.target.value)} className="w-full bg-transparent border-b py-1 text-sm outline-none appearance-none" style={{ borderColor: '#2e1e0e', color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif", background: '#1a1208' }}>
                      {f.options.map(o => <option key={o} value={o} style={{ background: '#1a1208' }}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Traction */}
            <div className="rounded p-5 md:col-span-2" style={{ background: '#1a1208', border: '1px solid #2e1e0e' }}>
              <p className="text-[9px] font-mono uppercase tracking-widest mb-4" style={{ color: '#c95a2a', fontFamily: "'IBM Plex Mono', monospace" }}>Traction</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'Monthly Active Users', value: mau, set: setMau },
                  { label: 'NRR %', value: nrr, set: setNrr },
                ].map(f => (
                  <div key={f.label}>
                    <label className="block text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: '#4a3828', fontFamily: "'IBM Plex Mono', monospace" }}>{f.label}</label>
                    <input type="number" value={f.value} onChange={e => f.set(Number(e.target.value))} className="w-full bg-transparent border-b py-1 text-sm outline-none" style={{ borderColor: '#2e1e0e', color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }} />
                  </div>
                ))}
                <div className="flex flex-col gap-3 pt-2">
                  <label className="flex items-center gap-2 text-xs font-mono cursor-pointer" style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>
                    <input type="checkbox" checked={hasIP} onChange={e => setHasIP(e.target.checked)} /> Has IP / Patents
                  </label>
                  <label className="flex items-center gap-2 text-xs font-mono cursor-pointer" style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>
                    <input type="checkbox" checked={hasPartnerships} onChange={e => setHasPartnerships(e.target.checked)} /> Key Partnerships
                  </label>
                </div>
              </div>
            </div>
          </div>

          <button onClick={calculateValuation}
            className="w-full py-3 rounded text-sm font-mono uppercase tracking-widest mb-6"
            style={{ background: '#c95a2a', color: '#0f0c08', fontFamily: "'IBM Plex Mono', monospace" }}>
            Estimate Valuation
          </button>

          {/* Result */}
          {result && (
            <div className="rounded p-6 mb-6" style={{ background: '#1a1208', border: '1px solid #2e1e0e' }}>
              <p className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>Estimated Range</p>
              <p className="text-5xl font-bold mb-2" style={{ color: '#c95a2a', fontFamily: "'Barlow Condensed', sans-serif" }}>
                {formatCrore(result.low)} — {formatCrore(result.high)}
              </p>
              <p className="text-xs font-mono mb-4" style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>
                Methodology: {result.methodology}
              </p>

              {/* Comparables */}
              {SECTOR_COMPARABLES[sector] && (
                <div className="mb-4 pb-4 border-b" style={{ borderColor: '#2e1e0e' }}>
                  <p className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: '#4a3828', fontFamily: "'IBM Plex Mono', monospace" }}>Comparable Companies</p>
                  <p className="text-xs font-mono" style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>
                    Your estimate uses a ~{result.multiple?.toFixed(1)}x multiple, comparable to: {SECTOR_COMPARABLES[sector].names.join(', ')} in the {sector} space.
                  </p>
                </div>
              )}

              {/* Disclaimer */}
              <div className="rounded p-3 mb-4" style={{ border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.05)' }}>
                <div className="flex items-start gap-2">
                  <AlertCircle size={13} style={{ color: '#f87171', marginTop: 1, flexShrink: 0 }} />
                  <p className="text-[11px] font-mono" style={{ color: '#f87171', fontFamily: "'IBM Plex Mono', monospace" }}>
                    This is an estimate only. It is not a legal or financial valuation. Do not use this for fundraising documentation without consulting a qualified financial advisor.
                  </p>
                </div>
              </div>

              <button onClick={saveSnapshot} disabled={savingVal}
                className="text-xs font-mono px-4 py-2 rounded transition-colors disabled:opacity-50"
                style={{ border: '1px solid #2e1e0e', color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>
                {savingVal ? 'Saving...' : 'Save Valuation Snapshot'}
              </button>
            </div>
          )}

          {/* History */}
          {snapshots.length > 0 && (
            <div>
              <p className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>Valuation History</p>
              <div className="flex flex-col gap-2">
                {snapshots.map(s => (
                  <div key={s.id} className="rounded px-4 py-3 flex items-center justify-between" style={{ background: '#1a1208', border: '1px solid #2e1e0e' }}>
                    <div>
                      <p className="text-sm font-bold" style={{ color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }}>
                        {formatCrore(s.estimated_low)} — {formatCrore(s.estimated_high)}
                      </p>
                      <p className="text-[10px] font-mono" style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>
                        {new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <TrendingUp size={14} style={{ color: '#4a3828' }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Check, X } from 'lucide-react'
import AxisLogo from '@/components/AxisLogo'
import { createClient } from '@/lib/supabase'
import { generateHandle } from '@/lib/utils'

// ── Schemas ────────────────────────────────────────────────
const step1Schema = z.object({
  name: z.string().min(2, 'Company name required'),
  handle: z.string().min(2, 'Handle required').regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, hyphens'),
  sector: z.string().min(1, 'Select a sector'),
  location: z.string().optional(),
  founded_year: z.string().optional(),
})

const step2Schema = z.object({
  bio: z.string().max(280, 'Max 280 characters').optional(),
  website: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  team_size: z.string().optional(),
})

type Step1Data = z.infer<typeof step1Schema>
type Step2Data = z.infer<typeof step2Schema>

// ── Constants ──────────────────────────────────────────────
const SECTORS = ['Technology', 'Fintech', 'AI/ML', 'SaaS', 'E-commerce', 'Healthcare', 'Education', 'Infrastructure', 'Other']
const TEAM_SIZES = ['Just me', '2-10', '11-50', '51-200', '200+']
const TAGS = ['Payments', 'API', 'B2B', 'SaaS', 'AI', 'DevTools', 'Design', 'Cloud', 'Fintech', 'Enterprise', 'Open Source', 'Mobile']
const SEEKING = ['Distribution', 'Technology', 'Capital', 'Co-marketing', 'Data', 'Infrastructure', 'Community', 'Other']

// ── Shared styles ──────────────────────────────────────────
const labelClass = "block font-mono text-[9px] uppercase tracking-widest mb-2"
const labelStyle = { color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }
const inputClass = "w-full bg-transparent border-0 border-b px-0 py-2 text-sm outline-none transition-colors placeholder:text-[#4a3828] text-[#f5ede3]"
const inputStyle = { borderColor: '#2e1e0e' }
const selectClass = "w-full bg-transparent border-0 border-b px-0 py-2 text-sm outline-none text-[#f5ede3] appearance-none cursor-pointer"
const errorClass = "text-[11px] mt-1"
const errorStyle = { color: '#c95a2a' }

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [tags, setTags] = useState<string[]>([])
  const [seeking, setSeeking] = useState<string[]>([])
  const [handleStatus, setHandleStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [loading, setLoading] = useState(false)
  const [allData, setAllData] = useState<Partial<Step1Data & Step2Data>>({})
  const router = useRouter()
  const supabase = createClient()

  const step1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema) })
  const step2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema) })

  const watchedName = step1.watch('name')
  const watchedHandle = step1.watch('handle')

  // Auto-generate handle from name
  useEffect(() => {
    if (watchedName && step1.getValues('handle') === '') {
      step1.setValue('handle', generateHandle(watchedName))
    }
  }, [watchedName])

  // Validate handle uniqueness
  useEffect(() => {
    if (!watchedHandle || watchedHandle.length < 2) {
      setHandleStatus('idle')
      return
    }
    setHandleStatus('checking')
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('companies')
        .select('id')
        .eq('handle', watchedHandle)
        .single()
      setHandleStatus(data ? 'taken' : 'available')
    }, 500)
    return () => clearTimeout(timer)
  }, [watchedHandle])

  function togglePill(list: string[], setList: (v: string[]) => void, value: string, max: number) {
    if (list.includes(value)) {
      setList(list.filter(t => t !== value))
    } else if (list.length < max) {
      setList([...list, value])
    }
  }

  async function handleStep1(data: Step1Data) {
    if (handleStatus === 'taken') return
    setAllData(prev => ({ ...prev, ...data }))
    setStep(2)
  }

  async function handleStep2(data: Step2Data) {
    setAllData(prev => ({ ...prev, ...data }))
    setStep(3)
  }

  async function handleStep3() {
    setStep(4)
  }

  async function handleFinish() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const payload = {
      user_id: user.id,
      name: allData.name!,
      handle: allData.handle!,
      sector: allData.sector!,
      bio: allData.bio || null,
      location: allData.location || null,
      website: allData.website || null,
      founded_year: allData.founded_year ? parseInt(allData.founded_year) : null,
      team_size: allData.team_size || null,
      tags,
      partnership_seeking: seeking,
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: company, error } = await (supabase as any).from('companies').insert(payload).select('id').single()

    if (error) {
      console.error(error)
      setLoading(false)
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('activity_history').insert({
      company_id: company.id,
      type: 'onboarding',
      description: 'Company created on AXIS',
    })

    router.push('/dashboard')
  }

  // ── Progress dots ──────────────────────────────────────────
  const Dots = () => (
    <div className="flex gap-2 mb-8">
      {[1, 2, 3, 4].map(n => (
        <div
          key={n}
          className="w-2 h-2 rounded-full transition-all duration-300"
          style={{
            background: n < step ? '#c95a2a' : n === step ? '#c95a2a' : '#2e1e0e',
            opacity: n < step ? 1 : n === step ? 1 : 0.4,
            transform: n === step ? 'scale(1.3)' : 'scale(1)',
          }}
        />
      ))}
    </div>
  )

  const PillButton = ({
    label,
    active,
    onClick,
  }: { label: string; active: boolean; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1 rounded-full text-[11px] font-mono transition-all"
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        background: active ? 'rgba(201,90,42,0.15)' : 'transparent',
        border: active ? '1px solid rgba(201,90,42,0.5)' : '1px solid #2e1e0e',
        color: active ? '#c95a2a' : '#7a6654',
      }}
    >
      {label}
    </button>
  )

  return (
    <div
      className="w-full max-w-[520px] rounded p-10"
      style={{ background: '#221508', border: '1px solid #2e1e0e' }}
    >
      <div className="mb-6">
        <AxisLogo size="sm" />
      </div>
      <Dots />

      <AnimatePresence mode="wait">
        {/* ── STEP 1 ─────────────────────────────────── */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <h2 className="text-2xl font-bold mb-1" style={{ color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }}>
              Tell us about your company.
            </h2>
            <p className="text-sm mb-6" style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>Step 1 of 4</p>

            <form onSubmit={step1.handleSubmit(handleStep1)} className="flex flex-col gap-5">
              <div>
                <label className={labelClass} style={labelStyle}>Company Name</label>
                <input placeholder="Acme Inc." className={inputClass} style={inputStyle} {...step1.register('name')} />
                {step1.formState.errors.name && <p className={errorClass} style={errorStyle}>{step1.formState.errors.name.message}</p>}
              </div>

              <div>
                <label className={labelClass} style={labelStyle}>Handle</label>
                <div className="flex items-center gap-2">
                  <span style={{ color: '#7a6654' }}>@</span>
                  <input
                    placeholder="acme-inc"
                    className={inputClass}
                    style={inputStyle}
                    {...step1.register('handle')}
                    onChange={e => {
                      step1.setValue('handle', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                    }}
                  />
                  {handleStatus === 'available' && <Check size={14} color="#4ade80" />}
                  {handleStatus === 'taken' && <X size={14} color="#c95a2a" />}
                  {handleStatus === 'checking' && <span className="text-[10px]" style={{ color: '#7a6654' }}>...</span>}
                </div>
                {handleStatus === 'taken' && <p className={errorClass} style={errorStyle}>Handle already taken</p>}
                {step1.formState.errors.handle && <p className={errorClass} style={errorStyle}>{step1.formState.errors.handle.message}</p>}
              </div>

              <div>
                <label className={labelClass} style={labelStyle}>Sector</label>
                <select className={selectClass} style={{ ...inputStyle, background: '#221508' }} {...step1.register('sector')}>
                  <option value="" style={{ background: '#221508' }}>Select sector...</option>
                  {SECTORS.map(s => <option key={s} value={s} style={{ background: '#221508' }}>{s}</option>)}
                </select>
                {step1.formState.errors.sector && <p className={errorClass} style={errorStyle}>{step1.formState.errors.sector.message}</p>}
              </div>

              <div>
                <label className={labelClass} style={labelStyle}>Location <span style={{ color: '#4a3828' }}>(optional)</span></label>
                <input placeholder="Delhi, India" className={inputClass} style={inputStyle} {...step1.register('location')} />
              </div>

              <div>
                <label className={labelClass} style={labelStyle}>Founded Year <span style={{ color: '#4a3828' }}>(optional)</span></label>
                <input type="number" placeholder="2023" className={inputClass} style={inputStyle} {...step1.register('founded_year')} />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded text-sm font-mono uppercase tracking-widest mt-2"
                style={{ background: '#c95a2a', color: '#0f0c08', fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Continue →
              </button>
            </form>
          </motion.div>
        )}

        {/* ── STEP 2 ─────────────────────────────────── */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <h2 className="text-2xl font-bold mb-1" style={{ color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }}>Your bio.</h2>
            <p className="text-sm mb-6" style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>Step 2 of 4</p>

            <form onSubmit={step2.handleSubmit(handleStep2)} className="flex flex-col gap-5">
              <div>
                <label className={labelClass} style={labelStyle}>Bio <span style={{ color: '#4a3828' }}>(max 280 chars)</span></label>
                <textarea
                  placeholder="What does your company do?"
                  rows={3}
                  className={`${inputClass} resize-none`}
                  style={inputStyle}
                  maxLength={280}
                  {...step2.register('bio')}
                />
                <p className="text-[10px] text-right mt-1" style={{ color: '#4a3828', fontFamily: "'IBM Plex Mono', monospace" }}>
                  {step2.watch('bio')?.length ?? 0}/280
                </p>
              </div>

              <div>
                <label className={labelClass} style={labelStyle}>Website <span style={{ color: '#4a3828' }}>(optional)</span></label>
                <input placeholder="https://yourcompany.com" className={inputClass} style={inputStyle} {...step2.register('website')} />
                {step2.formState.errors.website && <p className={errorClass} style={errorStyle}>{step2.formState.errors.website.message}</p>}
              </div>

              <div>
                <label className={labelClass} style={labelStyle}>Team Size</label>
                <select className={selectClass} style={{ ...inputStyle, background: '#221508' }} {...step2.register('team_size')}>
                  <option value="" style={{ background: '#221508' }}>Select size...</option>
                  {TEAM_SIZES.map(s => <option key={s} value={s} style={{ background: '#221508' }}>{s}</option>)}
                </select>
              </div>

              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 rounded text-sm font-mono uppercase tracking-widest" style={{ border: '1px solid #2e1e0e', color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>
                  ← Back
                </button>
                <button type="submit" className="flex-1 py-3 rounded text-sm font-mono uppercase tracking-widest" style={{ background: '#c95a2a', color: '#0f0c08', fontFamily: "'IBM Plex Mono', monospace" }}>
                  Continue →
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* ── STEP 3 ─────────────────────────────────── */}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <h2 className="text-2xl font-bold mb-1" style={{ color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }}>Tags and seeking.</h2>
            <p className="text-sm mb-6" style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>Step 3 of 4</p>

            <div className="flex flex-col gap-6">
              <div>
                <label className={labelClass} style={labelStyle}>Your tags <span style={{ color: '#4a3828' }}>(up to 5)</span></label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {TAGS.map(tag => (
                    <PillButton
                      key={tag}
                      label={tag}
                      active={tags.includes(tag)}
                      onClick={() => togglePill(tags, setTags, tag, 5)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass} style={labelStyle}>What kind of partner are you seeking?</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {SEEKING.map(s => (
                    <PillButton
                      key={s}
                      label={s}
                      active={seeking.includes(s)}
                      onClick={() => togglePill(seeking, setSeeking, s, 8)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setStep(2)} className="flex-1 py-3 rounded text-sm font-mono uppercase tracking-widest" style={{ border: '1px solid #2e1e0e', color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>
                  ← Back
                </button>
                <button type="button" onClick={handleStep3} className="flex-1 py-3 rounded text-sm font-mono uppercase tracking-widest" style={{ background: '#c95a2a', color: '#0f0c08', fontFamily: "'IBM Plex Mono', monospace" }}>
                  Continue →
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── STEP 4 ─────────────────────────────────── */}
        {step === 4 && (
          <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <h2 className="text-2xl font-bold mb-1" style={{ color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }}>Almost done.</h2>
            <p className="text-sm mb-6" style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>Step 4 of 4 — Review and launch</p>

            {/* Summary card */}
            <div className="rounded p-4 mb-6" style={{ background: '#150e05', border: '1px solid #2e1e0e' }}>
              {/* Avatar */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
                  style={{ background: '#c95a2a', color: '#0f0c08', fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  {allData.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-base" style={{ color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }}>{allData.name}</p>
                  <p className="text-xs font-mono" style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>@{allData.handle}</p>
                </div>
              </div>

              <div className="flex flex-col gap-1 text-xs font-mono" style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>
                <p>{allData.sector}{allData.location ? ` · ${allData.location}` : ''}</p>
                {allData.bio && <p className="mt-1" style={{ color: '#f5ede3' }}>{allData.bio}</p>}
                {tags.length > 0 && <p className="mt-2">{tags.join(' · ')}</p>}
              </div>
            </div>

            <p className="text-xs mb-6" style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>
              You can upload a logo and edit everything from your profile after launch.
            </p>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(3)} className="flex-1 py-3 rounded text-sm font-mono uppercase tracking-widest" style={{ border: '1px solid #2e1e0e', color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>
                ← Back
              </button>
              <button
                type="button"
                onClick={handleFinish}
                disabled={loading}
                className="flex-1 py-3 rounded text-sm font-mono uppercase tracking-widest disabled:opacity-50"
                style={{ background: '#c95a2a', color: '#0f0c08', fontFamily: "'IBM Plex Mono', monospace" }}
              >
                {loading ? 'Launching...' : '⊕ Launch on AXIS'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

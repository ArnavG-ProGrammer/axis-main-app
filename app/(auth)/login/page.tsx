'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Mail } from 'lucide-react'
import AxisLogo from '@/components/AxisLogo'
import { createClient } from '@/lib/supabase'

const signInSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

const signUpSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type SignInData = z.infer<typeof signInSchema>
type SignUpData = z.infer<typeof signUpSchema>

export default function LoginPage() {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  // When email confirmation is required, we show a "check email" state
  const [checkEmail, setCheckEmail] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const signInForm = useForm<SignInData>({ resolver: zodResolver(signInSchema) })
  const signUpForm = useForm<SignUpData>({ resolver: zodResolver(signUpSchema) })

  async function handleSignIn(data: SignInData) {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', user.id)
      .single()

    router.push(company ? '/dashboard' : '/onboarding')
  }

  async function handleSignUp(data: SignUpData) {
    setLoading(true)
    setError('')
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // If session exists immediately — email confirmation is OFF in Supabase (good for dev)
    if (authData.session) {
      router.push('/onboarding')
      return
    }

    // If no session — Supabase sent a confirmation email
    // Show "check your email" message instead of staying stuck
    setLoading(false)
    setCheckEmail(true)
  }

  const inputBase = `
    w-full bg-transparent border-0 border-b px-0 py-2 text-sm outline-none transition-colors
    placeholder:text-[#3a2810] text-[#f5ede3]
  `

  if (checkEmail) {
    return (
      <div
        className="w-full max-w-[440px] rounded p-12 flex flex-col items-center gap-4 text-center"
        style={{ background: '#221508', border: '1px solid #2e1e0e' }}
      >
        <AxisLogo size="md" />
        <div className="mt-4 w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(201,90,42,0.1)', border: '1px solid rgba(201,90,42,0.3)' }}>
          <Mail size={24} style={{ color: '#c95a2a' }} />
        </div>
        <h2 className="text-2xl font-bold" style={{ color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }}>Check your email</h2>
        <p className="text-sm" style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.7 }}>
          We sent a confirmation link to your email. Click it to activate your account, then sign in here.
        </p>
        <p className="text-[10px] font-mono mt-2" style={{ color: '#4a3828', fontFamily: "'IBM Plex Mono', monospace" }}>
          Tip: You can also disable email confirmation in Supabase → Authentication → Settings for faster testing.
        </p>
        <button
          onClick={() => { setCheckEmail(false); setTab('signin') }}
          className="mt-2 w-full py-3 rounded text-sm font-mono uppercase tracking-widest"
          style={{ background: '#c95a2a', color: '#0f0c08', fontFamily: "'IBM Plex Mono', monospace" }}
        >
          Back to Sign In
        </button>
      </div>
    )
  }

  return (
    <div
      className="w-full max-w-[440px] rounded p-12"
      style={{ background: '#221508', border: '1px solid #2e1e0e' }}
    >
      <div className="mb-8">
        <AxisLogo size="md" />
      </div>

      {/* Tab switcher */}
      <div className="flex gap-6 mb-8">
        {(['signin', 'signup'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setError('') }}
            className="font-mono text-xs uppercase tracking-widest pb-1 transition-colors"
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              color: tab === t ? '#c95a2a' : '#7a6654',
              borderBottom: tab === t ? '1px solid #c95a2a' : '1px solid transparent',
            }}
          >
            {t === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'signin' ? (
          <motion.form
            key="signin"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            onSubmit={signInForm.handleSubmit(handleSignIn)}
            className="flex flex-col gap-5"
          >
            <div>
              <label className="block font-mono text-[9px] uppercase tracking-widest mb-2" style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>Email</label>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                className={inputBase}
                style={{ borderColor: '#2e1e0e' }}
                {...signInForm.register('email')}
              />
              {signInForm.formState.errors.email && (
                <p className="text-[11px] mt-1" style={{ color: '#c95a2a' }}>{signInForm.formState.errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="block font-mono text-[9px] uppercase tracking-widest mb-2" style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>Password</label>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className={inputBase}
                style={{ borderColor: '#2e1e0e' }}
                {...signInForm.register('password')}
              />
              {signInForm.formState.errors.password && (
                <p className="text-[11px] mt-1" style={{ color: '#c95a2a' }}>{signInForm.formState.errors.password.message}</p>
              )}
            </div>

            {error && (
              <p className="text-[12px] text-center py-2 px-3 rounded" style={{ color: '#c95a2a', background: 'rgba(201,90,42,0.08)', border: '1px solid rgba(201,90,42,0.2)' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded text-sm font-mono uppercase tracking-widest transition-opacity disabled:opacity-50"
              style={{ background: '#c95a2a', color: '#0f0c08', fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <p className="text-center text-[11px] font-mono" style={{ color: '#4a3828', fontFamily: "'IBM Plex Mono', monospace" }}>
              Google Sign-In coming soon.
            </p>
          </motion.form>
        ) : (
          <motion.form
            key="signup"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            onSubmit={signUpForm.handleSubmit(handleSignUp)}
            className="flex flex-col gap-5"
          >
            <div>
              <label className="block font-mono text-[9px] uppercase tracking-widest mb-2" style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>Email</label>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                className={inputBase}
                style={{ borderColor: '#2e1e0e' }}
                {...signUpForm.register('email')}
              />
              {signUpForm.formState.errors.email && (
                <p className="text-[11px] mt-1" style={{ color: '#c95a2a' }}>{signUpForm.formState.errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="block font-mono text-[9px] uppercase tracking-widest mb-2" style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>Password</label>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Min 8 characters"
                className={inputBase}
                style={{ borderColor: '#2e1e0e' }}
                {...signUpForm.register('password')}
              />
              {signUpForm.formState.errors.password && (
                <p className="text-[11px] mt-1" style={{ color: '#c95a2a' }}>{signUpForm.formState.errors.password.message}</p>
              )}
            </div>
            <div>
              <label className="block font-mono text-[9px] uppercase tracking-widest mb-2" style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>Confirm Password</label>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className={inputBase}
                style={{ borderColor: '#2e1e0e' }}
                {...signUpForm.register('confirmPassword')}
              />
              {signUpForm.formState.errors.confirmPassword && (
                <p className="text-[11px] mt-1" style={{ color: '#c95a2a' }}>{signUpForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            {error && (
              <p className="text-[12px] text-center py-2 px-3 rounded" style={{ color: '#c95a2a', background: 'rgba(201,90,42,0.08)', border: '1px solid rgba(201,90,42,0.2)' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded text-sm font-mono uppercase tracking-widest transition-opacity disabled:opacity-50"
              style={{ background: '#c95a2a', color: '#0f0c08', fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

            <p className="text-center text-[11px] font-mono" style={{ color: '#4a3828', fontFamily: "'IBM Plex Mono', monospace" }}>
              Google Sign-Up coming soon.
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
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
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push('/onboarding')
  }

  const inputClass = `
    w-full bg-transparent border-0 border-b px-0 py-2 text-sm outline-none transition-colors
    placeholder:text-[#4a3828] text-[#f5ede3]
  `
  const borderStyle = { borderColor: '#2e1e0e' }

  return (
    <div
      className="w-full max-w-[440px] rounded p-12"
      style={{ background: '#1a1208', border: '1px solid #2e1e0e' }}
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
                placeholder="you@company.com"
                className={inputClass}
                style={borderStyle}
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
                placeholder="••••••••"
                className={inputClass}
                style={borderStyle}
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

            <button type="button" className="text-center text-[11px] font-mono" style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>
              Forgot password?
            </button>
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
                placeholder="you@company.com"
                className={inputClass}
                style={borderStyle}
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
                placeholder="Min 8 characters"
                className={inputClass}
                style={borderStyle}
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
                placeholder="••••••••"
                className={inputClass}
                style={borderStyle}
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
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}

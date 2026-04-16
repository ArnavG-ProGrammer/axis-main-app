'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useCompany } from '@/lib/company-context'

export default function SettingsPage() {
  const { company } = useCompany()
  const router = useRouter()
  const supabase = createClient()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [changingPw, setChangingPw] = useState(false)
  const [showPwForm, setShowPwForm] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [notifications, setNotifications] = useState({
    partnershipRequest: true,
    newFollower: true,
    postLiked: false,
    documentShared: false,
  })

  const inputStyle = { borderColor: '#2e1e0e', color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }
  const labelStyle = { color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }

  async function handlePasswordChange() {
    if (!newPassword || newPassword !== confirmPassword) {
      setPwError('Passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      setPwError('Min 8 characters')
      return
    }
    setChangingPw(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) { setPwError(error.message); setChangingPw(false); return }
    setPwSuccess(true)
    setNewPassword(''); setConfirmPassword('')
    setChangingPw(false)
    setTimeout(() => { setPwSuccess(false); setShowPwForm(false) }, 2000)
  }

  async function handleDeleteCompany() {
    if (!company || deleteConfirm !== company.name) return
    setDeleting(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('companies').delete().eq('id', company.id)
    await supabase.auth.signOut()
    router.push('/login')
  }

  function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
      <button onClick={() => onChange(!checked)} className="relative w-9 h-5 rounded-full transition-colors flex-shrink-0" style={{ background: checked ? '#c95a2a' : '#2e1e0e' }}>
        <span className="absolute top-0.5 transition-all w-4 h-4 rounded-full" style={{ background: '#f5ede3', left: checked ? '18px' : '2px' }} />
      </button>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-6">
      <h1 className="text-3xl font-bold mb-8" style={{ color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }}>Settings</h1>

      <div className="flex flex-col gap-6">
        {/* Account */}
        <section className="rounded p-6" style={{ background: '#1a1208', border: '1px solid #2e1e0e' }}>
          <p className="text-[10px] font-mono uppercase tracking-widest mb-4" style={{ color: '#c95a2a', fontFamily: "'IBM Plex Mono', monospace" }}>Account</p>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-[9px] font-mono uppercase tracking-widest mb-1" style={labelStyle}>Email</label>
              <p className="text-sm" style={{ color: '#7a6654', fontFamily: "'Barlow Condensed', sans-serif" }}>Logged in via Supabase Auth</p>
            </div>
            <div>
              <button onClick={() => setShowPwForm(v => !v)} className="text-xs font-mono px-3 py-2 rounded transition-colors"
                style={{ border: '1px solid #2e1e0e', color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>
                Change Password
              </button>
              {showPwForm && (
                <div className="mt-4 flex flex-col gap-3">
                  <div>
                    <label className="block text-[9px] font-mono uppercase tracking-widest mb-1" style={labelStyle}>New Password</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-transparent border-b py-1.5 text-sm outline-none" style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono uppercase tracking-widest mb-1" style={labelStyle}>Confirm Password</label>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-transparent border-b py-1.5 text-sm outline-none" style={inputStyle} />
                  </div>
                  {pwError && <p className="text-[11px]" style={{ color: '#c95a2a' }}>{pwError}</p>}
                  {pwSuccess && <p className="text-[11px]" style={{ color: '#4ade80' }}>Password updated.</p>}
                  <button onClick={handlePasswordChange} disabled={changingPw}
                    className="self-start px-4 py-2 rounded text-xs font-mono uppercase tracking-wider disabled:opacity-50"
                    style={{ background: '#c95a2a', color: '#0f0c08', fontFamily: "'IBM Plex Mono', monospace" }}>
                    {changingPw ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Company */}
        <section className="rounded p-6" style={{ background: '#1a1208', border: '1px solid #2e1e0e' }}>
          <p className="text-[10px] font-mono uppercase tracking-widest mb-4" style={{ color: '#c95a2a', fontFamily: "'IBM Plex Mono', monospace" }}>Company</p>
          <Link href="/dashboard/profile/edit" className="text-xs font-mono px-3 py-2 rounded inline-block transition-colors"
            style={{ border: '1px solid #2e1e0e', color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>
            Edit Company Profile →
          </Link>
        </section>

        {/* Notifications */}
        <section className="rounded p-6" style={{ background: '#1a1208', border: '1px solid #2e1e0e' }}>
          <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: '#c95a2a', fontFamily: "'IBM Plex Mono', monospace" }}>Notifications</p>
          <p className="text-[10px] font-mono mb-4" style={{ color: '#4a3828', fontFamily: "'IBM Plex Mono', monospace" }}>Email notifications coming soon</p>
          <div className="flex flex-col gap-4">
            {[
              { key: 'partnershipRequest', label: 'New partnership request' },
              { key: 'newFollower', label: 'Someone follows your company' },
              { key: 'postLiked', label: 'Post liked' },
              { key: 'documentShared', label: 'Document shared' },
            ].map(n => (
              <div key={n.key} className="flex items-center justify-between">
                <span className="text-sm" style={{ color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }}>{n.label}</span>
                <Toggle
                  checked={notifications[n.key as keyof typeof notifications]}
                  onChange={v => setNotifications(prev => ({ ...prev, [n.key]: v }))}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Danger Zone */}
        <section className="rounded p-6" style={{ border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.03)' }}>
          <p className="text-[10px] font-mono uppercase tracking-widest mb-4" style={{ color: '#f87171', fontFamily: "'IBM Plex Mono', monospace" }}>Danger Zone</p>
          <p className="text-sm mb-4" style={{ color: '#7a6654', fontFamily: "'Barlow Condensed', sans-serif" }}>
            Deleting your company will permanently remove all posts, documents, partnerships, and data. This cannot be undone.
          </p>
          <button onClick={() => setShowDeleteModal(true)}
            className="text-xs font-mono px-3 py-2 rounded transition-colors"
            style={{ border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', fontFamily: "'IBM Plex Mono', monospace" }}>
            Delete Company
          </button>
        </section>
      </div>

      {/* Delete modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="w-full max-w-md rounded p-6" style={{ background: '#1a1208', border: '1px solid rgba(248,113,113,0.3)' }}>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={18} style={{ color: '#f87171' }} />
              <p className="text-base font-bold" style={{ color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }}>Delete Company</p>
            </div>
            <p className="text-sm mb-4" style={{ color: '#7a6654', fontFamily: "'Barlow Condensed', sans-serif" }}>
              This will permanently delete your company, all posts, documents, and data. This cannot be undone.
            </p>
            <p className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>
              Type <span style={{ color: '#f5ede3' }}>{company?.name}</span> to confirm
            </p>
            <input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
              placeholder={company?.name}
              className="w-full bg-transparent border-b py-2 text-sm outline-none mb-4"
              style={{ borderColor: '#2e1e0e', color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }} />
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteModal(false); setDeleteConfirm('') }}
                className="flex-1 py-2.5 rounded text-xs font-mono uppercase tracking-wider"
                style={{ border: '1px solid #2e1e0e', color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>
                Cancel
              </button>
              <button onClick={handleDeleteCompany}
                disabled={deleteConfirm !== company?.name || deleting}
                className="flex-1 py-2.5 rounded text-xs font-mono uppercase tracking-wider disabled:opacity-40"
                style={{ background: '#f87171', color: '#0f0c08', fontFamily: "'IBM Plex Mono', monospace" }}>
                {deleting ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

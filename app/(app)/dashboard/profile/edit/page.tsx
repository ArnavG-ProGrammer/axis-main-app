'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useCompany } from '@/lib/company-context'
import CompanyAvatar from '@/components/CompanyAvatar'

const SECTORS = ['Technology', 'Fintech', 'AI/ML', 'SaaS', 'E-commerce', 'Healthcare', 'Education', 'Infrastructure', 'Other']
const TEAM_SIZES = ['Just me', '2-10', '11-50', '51-200', '200+']
const TAGS = ['Payments', 'API', 'B2B', 'SaaS', 'AI', 'DevTools', 'Design', 'Cloud', 'Fintech', 'Enterprise', 'Open Source', 'Mobile']
const SEEKING = ['Distribution', 'Technology', 'Capital', 'Co-marketing', 'Data', 'Infrastructure', 'Community', 'Other']

const schema = z.object({
  name: z.string().min(2),
  bio: z.string().max(280).optional(),
  sector: z.string().min(1),
  location: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  founded_year: z.string().optional(),
  team_size: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const labelStyle = { color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }
const inputStyle = { borderColor: '#2e1e0e', color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }

export default function EditProfilePage() {
  const { company, refresh } = useCompany()
  const router = useRouter()
  const [tags, setTags] = useState<string[]>([])
  const [seeking, setSeeking] = useState<string[]>([])
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (!company) return
    reset({
      name: company.name,
      bio: company.bio ?? '',
      sector: company.sector,
      location: company.location ?? '',
      website: company.website ?? '',
      founded_year: company.founded_year?.toString() ?? '',
      team_size: company.team_size ?? '',
    })
    setTags(company.tags ?? [])
    setSeeking(company.partnership_seeking ?? [])
    setLogoUrl(company.logo_url)
  }, [company])

  function togglePill(list: string[], setList: (v: string[]) => void, value: string, max: number) {
    if (list.includes(value)) setList(list.filter(t => t !== value))
    else if (list.length < max) setList([...list, value])
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !company) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${company.id}/logo.${ext}`
    const { error } = await supabase.storage.from('company-logos').upload(path, file, { upsert: true })
    if (!error) {
      const { data: urlData } = supabase.storage.from('company-logos').getPublicUrl(path)
      setLogoUrl(urlData.publicUrl)
    }
    setUploading(false)
  }

  async function onSubmit(data: FormData) {
    if (!company) return
    setSaving(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('companies').update({
      name: data.name,
      bio: data.bio || null,
      sector: data.sector,
      location: data.location || null,
      website: data.website || null,
      founded_year: data.founded_year ? parseInt(data.founded_year) : null,
      team_size: data.team_size || null,
      tags,
      partnership_seeking: seeking,
      logo_url: logoUrl,
    }).eq('id', company.id)
    await refresh()
    setSaving(false)
    setSaved(true)
    setTimeout(() => { setSaved(false); router.push(`/dashboard/company/${company.handle}`) }, 1200)
  }

  if (!company) return null

  return (
    <div className="max-w-2xl mx-auto px-5 py-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-xs font-mono mb-6" style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>
        <ArrowLeft size={13} /> Back
      </button>

      <h1 className="text-3xl font-bold mb-6" style={{ color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }}>Edit Profile</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* Logo */}
        <div>
          <label className="block text-[9px] font-mono uppercase tracking-widest mb-3" style={labelStyle}>Company Logo</label>
          <div className="flex items-center gap-4">
            <CompanyAvatar name={company.name} logoUrl={logoUrl} size={64} />
            <label className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer text-xs font-mono transition-colors"
              style={{ border: '1px solid #2e1e0e', color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>
              <Upload size={12} />
              {uploading ? 'Uploading...' : 'Upload Logo'}
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
            </label>
          </div>
        </div>

        {/* Basic fields */}
        {[
          { key: 'name', label: 'Company Name', placeholder: 'Acme Inc.' },
          { key: 'location', label: 'Location', placeholder: 'Delhi, India' },
          { key: 'website', label: 'Website', placeholder: 'https://yourcompany.com' },
          { key: 'founded_year', label: 'Founded Year', placeholder: '2023' },
        ].map(f => (
          <div key={f.key}>
            <label className="block text-[9px] font-mono uppercase tracking-widest mb-2" style={labelStyle}>{f.label}</label>
            <input
              {...register(f.key as keyof FormData)}
              placeholder={f.placeholder}
              className="w-full bg-transparent border-0 border-b px-0 py-2 text-sm outline-none"
              style={inputStyle}
            />
            {errors[f.key as keyof FormData] && (
              <p className="text-[11px] mt-1" style={{ color: '#c95a2a' }}>{errors[f.key as keyof FormData]?.message}</p>
            )}
          </div>
        ))}

        {/* Bio */}
        <div>
          <label className="block text-[9px] font-mono uppercase tracking-widest mb-2" style={labelStyle}>Bio</label>
          <textarea
            {...register('bio')}
            rows={3}
            maxLength={280}
            className="w-full bg-transparent border-0 border-b px-0 py-2 text-sm outline-none resize-none"
            style={inputStyle}
          />
          <p className="text-[10px] text-right mt-1" style={{ color: '#4a3828', fontFamily: "'IBM Plex Mono', monospace" }}>{watch('bio')?.length ?? 0}/280</p>
        </div>

        {/* Sector */}
        <div>
          <label className="block text-[9px] font-mono uppercase tracking-widest mb-2" style={labelStyle}>Sector</label>
          <select {...register('sector')} className="w-full bg-transparent border-0 border-b px-0 py-2 text-sm outline-none appearance-none" style={{ ...inputStyle, background: '#0f0c08' }}>
            {SECTORS.map(s => <option key={s} value={s} style={{ background: '#1a1208' }}>{s}</option>)}
          </select>
        </div>

        {/* Team size */}
        <div>
          <label className="block text-[9px] font-mono uppercase tracking-widest mb-2" style={labelStyle}>Team Size</label>
          <select {...register('team_size')} className="w-full bg-transparent border-0 border-b px-0 py-2 text-sm outline-none appearance-none" style={{ ...inputStyle, background: '#0f0c08' }}>
            <option value="" style={{ background: '#1a1208' }}>Select...</option>
            {TEAM_SIZES.map(s => <option key={s} value={s} style={{ background: '#1a1208' }}>{s}</option>)}
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-[9px] font-mono uppercase tracking-widest mb-3" style={labelStyle}>Tags (up to 5)</label>
          <div className="flex flex-wrap gap-2">
            {TAGS.map(tag => (
              <button key={tag} type="button" onClick={() => togglePill(tags, setTags, tag, 5)}
                className="px-3 py-1 rounded-full text-[11px] font-mono transition-all"
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  background: tags.includes(tag) ? 'rgba(201,90,42,0.15)' : 'transparent',
                  border: tags.includes(tag) ? '1px solid rgba(201,90,42,0.5)' : '1px solid #2e1e0e',
                  color: tags.includes(tag) ? '#c95a2a' : '#7a6654',
                }}>
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Seeking */}
        <div>
          <label className="block text-[9px] font-mono uppercase tracking-widest mb-3" style={labelStyle}>Seeking Partners For</label>
          <div className="flex flex-wrap gap-2">
            {SEEKING.map(s => (
              <button key={s} type="button" onClick={() => togglePill(seeking, setSeeking, s, 8)}
                className="px-3 py-1 rounded-full text-[11px] font-mono transition-all"
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  background: seeking.includes(s) ? 'rgba(201,90,42,0.15)' : 'transparent',
                  border: seeking.includes(s) ? '1px solid rgba(201,90,42,0.5)' : '1px solid #2e1e0e',
                  color: seeking.includes(s) ? '#c95a2a' : '#7a6654',
                }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || saved}
          className="w-full py-3 rounded text-sm font-mono uppercase tracking-widest transition-all"
          style={{ background: saved ? '#2a4a2a' : '#c95a2a', color: saved ? '#4ade80' : '#0f0c08', fontFamily: "'IBM Plex Mono', monospace" }}
        >
          {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}

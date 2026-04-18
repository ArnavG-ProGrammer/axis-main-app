/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { FileText, Download, Trash2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useCompany } from '@/lib/company-context'
import { generateNDAText, generateMOUText, generatePAText } from '@/lib/document-templates'
import type { NDAFields, MOUFields, PAFields } from '@/lib/document-templates'

type DocTab = 'NDA' | 'MOU' | 'PA'

const ndaSchema = z.object({
  partyA: z.string().min(1),
  partyB: z.string().min(1, 'Partner company name required'),
  date: z.string().min(1),
  duration: z.string().min(1),
  jurisdiction: z.string().min(1),
  purpose: z.string().min(1, 'Purpose required'),
  additionalClauses: z.string().optional(),
})
const mouSchema = z.object({
  partyA: z.string().min(1),
  partyB: z.string().min(1, 'Partner company name required'),
  date: z.string().min(1),
  objective: z.string().min(1, 'Objective required'),
  responsibilitiesA: z.string().min(1, 'Required'),
  responsibilitiesB: z.string().min(1, 'Required'),
  duration: z.string().min(1),
  jurisdiction: z.string().min(1),
})
const paSchema = z.object({
  partyA: z.string().min(1),
  partyB: z.string().min(1, 'Partner company name required'),
  effectiveDate: z.string().min(1),
  scope: z.string().min(1, 'Scope required'),
  revenueShare: z.string().min(1, 'Revenue share required'),
  term: z.string().min(1),
  noticePeriod: z.string().min(1),
  jurisdiction: z.string().min(1),
  additionalTerms: z.string().optional(),
})

type NDAForm = z.infer<typeof ndaSchema>
type MOUForm = z.infer<typeof mouSchema>
type PAForm = z.infer<typeof paSchema>

type SavedDoc = {
  id: string
  type: string
  title: string
  party_a: string
  party_b: string
  fields: Record<string, string>
  document_text: string
  created_at: string
}

const labelStyle = { color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }
const inputStyle = { borderColor: '#2e1e0e', color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14 }
const selectStyle = { ...inputStyle, background: '#1a1208' }

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[9px] font-mono uppercase tracking-widest mb-2" style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

const docTypeColor: Record<string, string> = { NDA: '#c95a2a', MOU: '#7ab8c9', PA: '#4ade80' }

export default function LegalPage() {
  const { company } = useCompany()
  const [tab, setTab] = useState<DocTab>('NDA')
  const [previewText, setPreviewText] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [docs, setDocs] = useState<SavedDoc[]>([])
  const supabase = createClient()

  const today = new Date().toISOString().split('T')[0]

  const ndaForm = useForm<NDAForm>({ resolver: zodResolver(ndaSchema), defaultValues: { partyA: company?.name ?? '', date: today, duration: '1 year', jurisdiction: 'State of Delaware, USA' } })
  const mouForm = useForm<MOUForm>({ resolver: zodResolver(mouSchema), defaultValues: { partyA: company?.name ?? '', date: today, duration: '1 year', jurisdiction: 'State of Delhi, India' } })
  const paForm = useForm<PAForm>({ resolver: zodResolver(paSchema), defaultValues: { partyA: company?.name ?? '', effectiveDate: today, term: '1 year', noticePeriod: '30 days', jurisdiction: 'State of Delaware, USA' } })

  useEffect(() => {
    if (company) {
      ndaForm.setValue('partyA', company.name)
      mouForm.setValue('partyA', company.name)
      paForm.setValue('partyA', company.name)
    }
  }, [company])

  useEffect(() => { fetchDocs() }, [company])

  async function fetchDocs() {
    if (!company) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).from('legal_documents').select('*').eq('company_id', company.id).order('created_at', { ascending: false })
    setDocs(data ?? [])
  }

  function getDocText(): string {
    if (tab === 'NDA') return generateNDAText(ndaForm.getValues() as NDAFields)
    if (tab === 'MOU') return generateMOUText(mouForm.getValues() as MOUFields)
    return generatePAText(paForm.getValues() as PAFields)
  }

  function handlePreview() {
    setPreviewText(getDocText())
  }

  async function downloadAsTxt(text: string, filename: string) {
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  async function handleGenerate(fields: Record<string, string>, partyA: string, partyB: string) {
    if (!company) return
    setSaving(true)
    const text = getDocText()
    const title = `${tab} — ${partyA} × ${partyB}`

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('legal_documents').insert({
      company_id: company.id,
      type: tab,
      title,
      party_a: partyA,
      party_b: partyB,
      fields,
      document_text: text,
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('activity_history').insert({
      company_id: company.id,
      type: 'document_created',
      description: `Generated ${tab}: ${title}`,
    })
    await downloadAsTxt(text, `${title.replace(/[^a-z0-9]/gi, '_')}.txt`)
    await fetchDocs()
    setSaving(false)
  }

  async function deleteDoc(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('legal_documents').delete().eq('id', id)
    setDocs(prev => prev.filter(d => d.id !== id))
  }

  const ic = "w-full bg-transparent border-0 border-b px-0 py-2 text-sm outline-none"
  const tc = `${ic} resize-none`

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="flex-1 px-6 py-6 border-r" style={{ borderColor: '#2e1e0e' }}>
        <h1 className="text-3xl font-bold mb-6" style={{ color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }}>Legal Documents</h1>

        {/* Doc type tabs */}
        <div className="flex gap-0 mb-6 rounded overflow-hidden" style={{ border: '1px solid #2e1e0e' }}>
          {(['NDA', 'MOU', 'PA'] as DocTab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2 text-xs font-mono uppercase tracking-widest transition-all"
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                background: tab === t ? '#1a1208' : 'transparent',
                color: tab === t ? '#c95a2a' : '#7a6654',
                borderRight: t !== 'PA' ? '1px solid #2e1e0e' : 'none',
              }}>
              {t === 'PA' ? 'Partnership Agmt' : t}
            </button>
          ))}
        </div>

        {/* NDA Form */}
        {tab === 'NDA' && (
          <form onSubmit={ndaForm.handleSubmit(f => handleGenerate(f as any, f.partyA, f.partyB))} className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <FieldGroup label="Party A (Your Company)"><input {...ndaForm.register('partyA')} className={ic} style={inputStyle} /></FieldGroup>
              <FieldGroup label="Party B (Partner)"><input {...ndaForm.register('partyB')} placeholder="Partner Company" className={ic} style={inputStyle} />{ndaForm.formState.errors.partyB && <p className="text-[11px] mt-1" style={{ color: '#c95a2a' }}>{ndaForm.formState.errors.partyB.message}</p>}</FieldGroup>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FieldGroup label="Agreement Date"><input type="date" {...ndaForm.register('date')} className={ic} style={inputStyle} /></FieldGroup>
              <FieldGroup label="Duration">
                <select {...ndaForm.register('duration')} className={ic} style={selectStyle}>
                  {['1 year', '2 years', '3 years', '5 years', 'Indefinite'].map(d => <option key={d} value={d} style={{ background: '#1a1208' }}>{d}</option>)}
                </select>
              </FieldGroup>
            </div>
            <FieldGroup label="Governing Jurisdiction"><input {...ndaForm.register('jurisdiction')} placeholder="State of Delaware, USA" className={ic} style={inputStyle} /></FieldGroup>
            <FieldGroup label="Purpose of Disclosure"><textarea {...ndaForm.register('purpose')} rows={3} placeholder="Exploring a potential partnership..." className={tc} style={inputStyle} />{ndaForm.formState.errors.purpose && <p className="text-[11px] mt-1" style={{ color: '#c95a2a' }}>{ndaForm.formState.errors.purpose.message}</p>}</FieldGroup>
            <FieldGroup label="Additional Clauses (optional)"><textarea {...ndaForm.register('additionalClauses')} rows={2} className={tc} style={inputStyle} /></FieldGroup>
            <div className="flex gap-3 mt-2">
              <button type="button" onClick={handlePreview} className="flex-1 py-2.5 rounded text-xs font-mono uppercase tracking-wider" style={{ border: '1px solid #2e1e0e', color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>Preview</button>
              <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded text-xs font-mono uppercase tracking-wider disabled:opacity-50" style={{ background: '#c95a2a', color: '#0f0c08', fontFamily: "'IBM Plex Mono', monospace" }}>{saving ? 'Saving...' : 'Generate & Save'}</button>
            </div>
          </form>
        )}

        {/* MOU Form */}
        {tab === 'MOU' && (
          <form onSubmit={mouForm.handleSubmit(f => handleGenerate(f as any, f.partyA, f.partyB))} className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <FieldGroup label="Party A"><input {...mouForm.register('partyA')} className={ic} style={inputStyle} /></FieldGroup>
              <FieldGroup label="Party B"><input {...mouForm.register('partyB')} placeholder="Partner Company" className={ic} style={inputStyle} /></FieldGroup>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FieldGroup label="Date"><input type="date" {...mouForm.register('date')} className={ic} style={inputStyle} /></FieldGroup>
              <FieldGroup label="Duration">
                <select {...mouForm.register('duration')} className={ic} style={selectStyle}>
                  {['3 months', '6 months', '1 year', '2 years'].map(d => <option key={d} value={d} style={{ background: '#1a1208' }}>{d}</option>)}
                </select>
              </FieldGroup>
            </div>
            <FieldGroup label="Partnership Objective"><textarea {...mouForm.register('objective')} rows={3} className={tc} style={inputStyle} /></FieldGroup>
            <FieldGroup label="Party A Responsibilities"><textarea {...mouForm.register('responsibilitiesA')} rows={3} className={tc} style={inputStyle} /></FieldGroup>
            <FieldGroup label="Party B Responsibilities"><textarea {...mouForm.register('responsibilitiesB')} rows={3} className={tc} style={inputStyle} /></FieldGroup>
            <FieldGroup label="Governing Jurisdiction"><input {...mouForm.register('jurisdiction')} className={ic} style={inputStyle} /></FieldGroup>
            <div className="flex gap-3 mt-2">
              <button type="button" onClick={handlePreview} className="flex-1 py-2.5 rounded text-xs font-mono uppercase tracking-wider" style={{ border: '1px solid #2e1e0e', color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>Preview</button>
              <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded text-xs font-mono uppercase tracking-wider disabled:opacity-50" style={{ background: '#c95a2a', color: '#0f0c08', fontFamily: "'IBM Plex Mono', monospace" }}>{saving ? 'Saving...' : 'Generate & Save'}</button>
            </div>
          </form>
        )}

        {/* PA Form */}
        {tab === 'PA' && (
          <form onSubmit={paForm.handleSubmit(f => handleGenerate(f as any, f.partyA, f.partyB))} className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <FieldGroup label="Partner A"><input {...paForm.register('partyA')} className={ic} style={inputStyle} /></FieldGroup>
              <FieldGroup label="Partner B"><input {...paForm.register('partyB')} placeholder="Partner Company" className={ic} style={inputStyle} /></FieldGroup>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FieldGroup label="Effective Date"><input type="date" {...paForm.register('effectiveDate')} className={ic} style={inputStyle} /></FieldGroup>
              <FieldGroup label="Term">
                <select {...paForm.register('term')} className={ic} style={selectStyle}>
                  {['6 months', '1 year', '2 years', '3 years', '5 years'].map(d => <option key={d} value={d} style={{ background: '#1a1208' }}>{d}</option>)}
                </select>
              </FieldGroup>
            </div>
            <FieldGroup label="Scope of Partnership"><textarea {...paForm.register('scope')} rows={3} className={tc} style={inputStyle} /></FieldGroup>
            <FieldGroup label="Revenue Share"><input {...paForm.register('revenueShare')} placeholder="e.g. 70/30 — Company A / Company B" className={ic} style={inputStyle} /></FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <FieldGroup label="Termination Notice">
                <select {...paForm.register('noticePeriod')} className={ic} style={selectStyle}>
                  {['15 days', '30 days', '60 days', '90 days'].map(d => <option key={d} value={d} style={{ background: '#1a1208' }}>{d}</option>)}
                </select>
              </FieldGroup>
              <FieldGroup label="Jurisdiction"><input {...paForm.register('jurisdiction')} className={ic} style={inputStyle} /></FieldGroup>
            </div>
            <FieldGroup label="Additional Terms (optional)"><textarea {...paForm.register('additionalTerms')} rows={2} className={tc} style={inputStyle} /></FieldGroup>
            <div className="flex gap-3 mt-2">
              <button type="button" onClick={handlePreview} className="flex-1 py-2.5 rounded text-xs font-mono uppercase tracking-wider" style={{ border: '1px solid #2e1e0e', color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>Preview</button>
              <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded text-xs font-mono uppercase tracking-wider disabled:opacity-50" style={{ background: '#c95a2a', color: '#0f0c08', fontFamily: "'IBM Plex Mono', monospace" }}>{saving ? 'Saving...' : 'Generate & Save'}</button>
            </div>
          </form>
        )}
      </div>

      {/* Right panel — saved docs */}
      <div className="w-80 flex-shrink-0 px-5 py-6 overflow-y-auto">
        <p className="text-[10px] font-mono uppercase tracking-widest mb-4" style={{ color: '#c95a2a', fontFamily: "'IBM Plex Mono', monospace" }}>Your Documents</p>
        {docs.length === 0 ? (
          <div className="flex flex-col items-center py-10 gap-2">
            <FileText size={32} style={{ color: '#2e1e0e' }} />
            <p className="text-sm font-bold text-center" style={{ color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }}>No documents yet.</p>
            <p className="text-xs text-center" style={{ color: '#7a6654', fontFamily: "'Barlow Condensed', sans-serif" }}>Generate your first NDA above.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {docs.map(doc => (
              <div key={doc.id} className="rounded p-4 transition-all" style={{ background: '#1a1208', border: '1px solid #2e1e0e' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#3a2810')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#2e1e0e')}>
                <div className="flex items-start justify-between mb-2">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ color: docTypeColor[doc.type], border: `1px solid ${docTypeColor[doc.type]}40`, fontFamily: "'IBM Plex Mono', monospace" }}>{doc.type}</span>
                  <button onClick={() => deleteDoc(doc.id)} className="opacity-40 hover:opacity-100 transition-opacity">
                    <Trash2 size={12} style={{ color: '#f87171' }} />
                  </button>
                </div>
                <p className="text-sm font-bold mb-1" style={{ color: '#f5ede3', fontFamily: "'Barlow Condensed', sans-serif" }}>{doc.party_b}</p>
                <p className="text-[10px] font-mono mb-3" style={{ color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>
                  {format(new Date(doc.created_at), 'MMM d, yyyy')}
                </p>
                <button onClick={() => downloadAsTxt(doc.document_text, `${doc.title.replace(/[^a-z0-9]/gi, '_')}.txt`)}
                  className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded w-full justify-center"
                  style={{ border: '1px solid #2e1e0e', color: '#7a6654', fontFamily: "'IBM Plex Mono', monospace" }}>
                  <Download size={10} /> Re-download
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview modal */}
      {previewText && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="w-full max-w-3xl max-h-[85vh] flex flex-col rounded overflow-hidden" style={{ background: '#fff' }}>
            <div className="flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: '#e5e5e5' }}>
              <span className="text-xs font-mono uppercase tracking-widest" style={{ color: '#333' }}>Document Preview</span>
              <div className="flex gap-2">
                <button onClick={() => downloadAsTxt(previewText, `document_preview.txt`)}
                  className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded"
                  style={{ background: '#c95a2a', color: '#fff' }}>
                  <Download size={11} /> Download
                </button>
                <button onClick={() => setPreviewText(null)}>
                  <X size={16} style={{ color: '#666' }} />
                </button>
              </div>
            </div>
            <pre className="flex-1 overflow-y-auto px-8 py-6 text-[11px] leading-relaxed whitespace-pre-wrap" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#111' }}>
              {previewText}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase'

type Company = {
  id: string
  user_id: string
  name: string
  handle: string
  sector: string
  bio: string | null
  location: string | null
  tags: string[]
  logo_url: string | null
  website: string | null
  founded_year: number | null
  team_size: string | null
  partnership_seeking: string[]
  followers_count: number
  following_count: number
  verified: boolean
  created_at: string
}

type CompanyContextType = {
  company: Company | null
  loading: boolean
  refresh: () => void
}

const CompanyContext = createContext<CompanyContextType>({
  company: null,
  loading: true,
  refresh: () => {},
})

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  async function fetchCompany() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setCompany(data as any)
    setLoading(false)
  }

  useEffect(() => { fetchCompany() }, [])

  return (
    <CompanyContext.Provider value={{ company, loading, refresh: fetchCompany }}>
      {children}
    </CompanyContext.Provider>
  )
}

export function useCompany() {
  return useContext(CompanyContext)
}

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCompany } from '@/lib/company-context'

export default function ProfileRedirect() {
  const { company } = useCompany()
  const router = useRouter()

  useEffect(() => {
    if (company) router.replace(`/dashboard/company/${company.handle}`)
  }, [company])

  return null
}

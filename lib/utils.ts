import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate a handle from a company name
export function generateHandle(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 30)
}

// Generate a deterministic gradient from a string (for company banners)
export function generateGradient(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }

  const hue1 = Math.abs(hash % 30) + 10   // warm range 10-40
  const hue2 = Math.abs((hash >> 4) % 30) + 20
  const direction = Math.abs((hash >> 8) % 360)

  return `linear-gradient(${direction}deg, hsl(${hue1}, 60%, 12%), hsl(${hue2}, 50%, 8%))`
}

// Format large numbers compactly
export function formatNumber(n: number): string {
  if (n >= 1_00_00_000) return `${(n / 1_00_00_000).toFixed(1)}Cr`
  if (n >= 1_00_000) return `${(n / 1_00_000).toFixed(1)}L`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

// Format currency in Indian style (₹ Cr)
export function formatCrore(amount: number): string {
  const crore = amount / 1_00_00_000
  if (crore >= 1) return `₹${crore.toFixed(1)} Cr`
  const lakh = amount / 1_00_000
  if (lakh >= 1) return `₹${lakh.toFixed(1)} L`
  return `₹${amount.toLocaleString('en-IN')}`
}

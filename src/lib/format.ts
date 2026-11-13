// Money is held in cents of a Leone (SLE) to avoid floating-point drift.
const le = new Intl.NumberFormat('en-SL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const count = new Intl.NumberFormat('en-SL')

export const formatLe = (cents: number) => `Le ${le.format(cents / 100)}`
export const formatCount = (n: number) => count.format(n)
const compact = new Intl.NumberFormat('en-SL', { notation: 'compact', maximumFractionDigits: 1 })
export const formatLeCompact = (cents: number) => `Le ${compact.format(cents / 100)}`

export function formatDateTime(iso: string) {
  const d = new Date(iso)
  return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} ${d
    .toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })
    .toUpperCase()}`
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function greeting(now = new Date()) {
  const h = now.getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

export const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ')

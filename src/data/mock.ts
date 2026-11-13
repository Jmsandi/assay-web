// Demo data for the UI until the portal API exists. Shapes follow the PRD: the
// portal only ever holds counts, outcomes, keys' metadata and money, never identity
// data or images. Prices are placeholders: pricing is still an open decision.

export type Outcome = 'approved' | 'review' | 'retake' | 'rejected' | 'processing'
export type Channel = 'capture_link' | 'api_upload'
export type Mode = 'live' | 'test'

export interface Verification {
  sessionId: string
  channel: Channel
  mode: Mode
  outcome: Outcome
  priceCents: number
  decidedAt: string
  reasons: string[]
}

export interface ApiKey {
  id: string
  name: string
  mode: Mode
  prefix: string
  last4: string
  createdBy: string
  createdAt: string
  expiresAt: string
  lastUsed: string | null
  cidrs: string[]
  status: 'active' | 'revoked' | 'expired'
}

export interface LedgerEntry {
  id: string
  kind: 'top_up' | 'charge' | 'refund'
  description: string
  amountCents: number
  method?: 'orange_money' | 'afrimoney' | 'card'
  reference: string
  status: 'completed' | 'pending' | 'failed'
  at: string
}

export const organisation = {
  name: 'Kora Microfinance',
  owner: { name: 'Aminata Kamara', email: 'aminata@kora.example', initials: 'AK' },
  liveAccess: 'approved' as 'approved' | 'pending' | 'not_started',
  plan: 'Pay as you go',
}

export const billing = {
  balanceCents: 4_825_000,
  changePct: 12,
  pricePerVerificationCents: 2_500, // placeholder
  monthlyCapCents: 6_000_000,
  spentThisMonthCents: 3_210_000,
}

export const stats = {
  verifications: { value: 1_284, changePct: 7 },
  approved: { value: 1_021, changePct: 9 },
  review: { value: 186, changePct: -5 },
  retake: { value: 77, changePct: 4 },
}

// Monthly outcomes for the chart (approved vs needed a person).
export const monthly = [
  { month: 'Jun', approved: 620, review: 180 },
  { month: 'Jul', approved: 410, review: 300 },
  { month: 'Aug', approved: 300, review: 230 },
  { month: 'Sep', approved: 470, review: 220 },
  { month: 'Oct', approved: 380, review: 340 },
  { month: 'Nov', approved: 780, review: 260 },
  { month: 'Dec', approved: 470, review: 230 },
  { month: 'Jan', approved: 330, review: 220 },
]

const iso = (daysAgo: number, h: number, m: number) => {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

export const verifications: Verification[] = [
  { sessionId: 'ses_3c1d9a7e-41b2-4f0e-9d6a-1e2f7c8b5a01', channel: 'capture_link', mode: 'live', outcome: 'approved', priceCents: 2_500, decidedAt: iso(0, 15, 45), reasons: ['checks_passed'] },
  { sessionId: 'ses_9b2e4f10-7a3c-4d5e-8f61-2a3b4c5d6e02', channel: 'capture_link', mode: 'live', outcome: 'review', priceCents: 2_500, decidedAt: iso(0, 11, 30), reasons: ['face_match_low'] },
  { sessionId: 'ses_a4d7e2c9-5b16-4a8f-b3c2-9d0e1f2a3b03', channel: 'api_upload', mode: 'live', outcome: 'approved', priceCents: 2_500, decidedAt: iso(1, 12, 0), reasons: ['checks_passed'] },
  { sessionId: 'ses_c7f0b3d2-8e49-4c1a-a5d6-4e3f2a1b0c04', channel: 'capture_link', mode: 'live', outcome: 'processing', priceCents: 0, decidedAt: iso(1, 21, 15), reasons: [] },
  { sessionId: 'ses_e1a2b3c4-d5e6-4f70-8a9b-0c1d2e3f4a05', channel: 'api_upload', mode: 'live', outcome: 'retake', priceCents: 2_500, decidedAt: iso(2, 6, 0), reasons: ['image_quality_low'] },
  { sessionId: 'ses_f6e5d4c3-b2a1-4098-b7c6-d5e4f3a2b106', channel: 'capture_link', mode: 'live', outcome: 'rejected', priceCents: 2_500, decidedAt: iso(2, 9, 40), reasons: ['active_risk_flag'] },
  { sessionId: 'ses_1b2c3d4e-5f60-4718-9a2b-3c4d5e6f7a07', channel: 'capture_link', mode: 'test', outcome: 'approved', priceCents: 0, decidedAt: iso(3, 14, 5), reasons: ['checks_passed'] },
  { sessionId: 'ses_2c3d4e5f-6a7b-4c8d-9e0f-1a2b3c4d5e08', channel: 'api_upload', mode: 'test', outcome: 'review', priceCents: 0, decidedAt: iso(3, 16, 20), reasons: ['liveness_unavailable'] },
]

export const apiKeys: ApiKey[] = [
  { id: 'key_1', name: 'Production server', mode: 'live', prefix: 'sk_live_', last4: '7f3a', createdBy: 'Aminata Kamara', createdAt: iso(40, 10, 0), expiresAt: iso(-50, 10, 0), lastUsed: iso(0, 9, 0), cidrs: ['203.0.113.0/24'], status: 'active' },
  { id: 'key_2', name: 'Staging', mode: 'test', prefix: 'sk_test_', last4: 'c41d', createdBy: 'Ibrahim Sesay', createdAt: iso(20, 10, 0), expiresAt: iso(-70, 10, 0), lastUsed: iso(1, 9, 0), cidrs: [], status: 'active' },
  { id: 'key_3', name: 'Old backend', mode: 'live', prefix: 'sk_live_', last4: '09be', createdBy: 'Aminata Kamara', createdAt: iso(120, 10, 0), expiresAt: iso(30, 10, 0), lastUsed: iso(31, 9, 0), cidrs: [], status: 'revoked' },
]

export const ledger: LedgerEntry[] = [
  { id: 'led_1', kind: 'top_up', description: 'Top-up', amountCents: 5_000_000, method: 'orange_money', reference: 'MNM-82731', status: 'completed', at: iso(1, 10, 12) },
  { id: 'led_2', kind: 'charge', description: 'Verifications (daily total, 48)', amountCents: -120_000, reference: 'Usage 12 Nov', status: 'completed', at: iso(1, 23, 59) },
  { id: 'led_3', kind: 'top_up', description: 'Top-up', amountCents: 500_000, method: 'afrimoney', reference: 'MNM-82802', status: 'pending', at: iso(0, 8, 40) },
  { id: 'led_4', kind: 'charge', description: 'Verifications (daily total, 51)', amountCents: -127_500, reference: 'Usage 11 Nov', status: 'completed', at: iso(2, 23, 59) },
  { id: 'led_5', kind: 'refund', description: 'Credit: outage on our side', amountCents: 25_000, reference: 'ADJ-0012', status: 'completed', at: iso(5, 14, 0) },
]

export const outcomeLabel: Record<Outcome, string> = {
  approved: 'Approved',
  review: 'In review',
  retake: 'Retake',
  rejected: 'Rejected',
  processing: 'Processing',
}

export const reasonLabel: Record<string, string> = {
  checks_passed: 'All checks passed',
  face_match_low: 'Face match below threshold',
  liveness_unavailable: 'Liveness check unavailable',
  image_quality_low: 'Photo quality too low',
  active_risk_flag: 'Matches a risk flag',
}

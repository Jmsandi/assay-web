// The portal API client. The session token is kept in this browser's storage and sent
// as a bearer token; the API answers only to this site's origin (CORS).
import { useCallback, useEffect, useState } from 'react'

const BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
const TOKEN_KEY = 'assay-session'

export type Mode = 'test' | 'live'
export type Role = 'owner' | 'admin' | 'developer' | 'billing' | 'viewer'
export type LiveStatus = 'not_started' | 'submitted' | 'approved' | 'rejected'

export interface Me {
  user: { name: string; email: string; is_staff: boolean }
  organisation: { name: string; partner_id: string; live_status: LiveStatus; role: Role; live_suspended: boolean }
}

export interface ApiKey {
  id: string
  name: string
  mode: Mode
  prefix: string
  last4: string
  allowed_cidrs: string[] | null
  created_at: string
  expires_at: string
  revoked_at: string | null
  last_used_on: string | null
}

export interface DayUsage {
  day: string
  sessions_created: number
  sessions_decided: number
  approved: number
  review: number
  retake: number
  rejected: number
  unfinished: number
}

export interface LedgerEntry {
  id: number
  kind: 'top_up' | 'charge' | 'credit' | 'refund'
  amount_cents: number
  description: string
  reference: string
  at: string
}

export interface Payment {
  id: string
  provider: string
  reference: string
  amount_cents: number
  method: string
  status: 'pending' | 'completed' | 'failed' | 'expired'
  created_at: string
  completed_at: string | null
}

export interface BillingSummary {
  currency: string
  balance_cents: number
  price_cents: number
  live_suspended: boolean
  payments_enabled: boolean
  entries: LedgerEntry[]
  payments: Payment[]
  min_top_up_cents: number
  max_top_up_cents: number
  verifications_remaining: number | null
}

export interface Activity {
  at: string
  user: string
  action: string
  detail: string
}

export interface LiveDetails {
  registration_number: string
  website: string
  use_case: string
  monthly_volume: string
  contact: string
}

export interface LiveRequest {
  status: LiveStatus
  details: LiveDetails
  requested_at: string | null
  decided_at: string | null
  note: string
}

export interface TeamMember {
  name: string
  email: string
  role: Role
  joined_at: string
}

export interface WebhookInfo {
  mode: Mode
  available: boolean
  url: string
  secret_set: boolean
}

export interface OrgSummary {
  id: string
  name: string
  partner_id: string
  live_status: LiveStatus
  live_suspended: boolean
  live_requested_at: string | null
  owner_name: string
  owner_email: string
  members: number
  balance_cents: number
  created_at: string
}

export interface AdminStats {
  organisations: number
  users: number
  live_pending: number
  live_approved: number
  suspended: number
  balance_total_cents: number
  top_ups_total_cents: number
  charges_total_cents: number
  pending_payments: number
  signups_last_30_days: number
  charges_last_30_days: number
}

export interface AdminOrganisation {
  organisation: OrgSummary
  live_request: LiveRequest
  members: TeamMember[]
  activity: Activity[]
  entries?: LedgerEntry[]
  payments?: Payment[]
  usage: { test?: DayUsage[]; live?: DayUsage[] }
}

export class ApiError extends Error {
  status: number
  code: string
  constructor(status: number, code: string) {
    super(messageFor(code))
    this.status = status
    this.code = code
  }
}

const messages: Record<string, string> = {
  wrong_credentials: 'That email and password do not match.',
  email_taken: 'An account with this email already exists. Log in instead.',
  invalid_email: 'Enter a valid email address.',
  weak_password: 'Use at least 12 characters for the password.',
  wrong_password: 'Your current password is not correct.',
  rate_limited: 'Too many attempts. Wait a minute and try again.',
  signed_out: 'Your session has ended. Log in again.',
  forbidden: 'Your role does not allow this. Ask an owner or admin.',
  live_not_allowed: 'Live mode needs approved live access and an owner or admin.',
  invalid_expiry: 'Choose an expiry period.',
  invalid_url: 'Enter an https:// address that can receive webhooks.',
  invalid_mode: 'Choose test or live mode.',
  already_requested: 'A live access request is already in review.',
  already_decided: 'This request has already been decided.',
  payments_not_configured: 'Online top-ups are not available yet. Contact us to add credit.',
  origin_not_allowed: 'This site is not allowed to use the API.',
  unavailable: 'The service is unavailable right now. Try again shortly.',
  network: 'Could not reach Assay. Check your connection and try again.',
  invalid_request: 'Check the details and try again.',
  not_found: 'Not found.',
}

export function messageFor(code: string) {
  return messages[code] ?? 'Something went wrong. Try again.'
}

// ---- session token ----

export function getToken(): string | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    if (!raw) return null
    const { token, expires_at } = JSON.parse(raw) as { token: string; expires_at: string }
    if (new Date(expires_at).getTime() <= Date.now()) {
      localStorage.removeItem(TOKEN_KEY)
      return null
    }
    return token
  } catch {
    return null
  }
}

export function setToken(token: string, expires_at: string) {
  try {
    localStorage.setItem(TOKEN_KEY, JSON.stringify({ token, expires_at }))
  } catch {
    /* storage unavailable: the session lasts until the page closes */
  }
  memoryToken = token
}

export function clearToken() {
  memoryToken = null
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

let memoryToken: string | null = null
const signedOutListeners = new Set<() => void>()
export function onSignedOut(fn: () => void) {
  signedOutListeners.add(fn)
  return () => {
    signedOutListeners.delete(fn)
  }
}

// ---- requests ----

export async function api<T = unknown>(method: 'GET' | 'POST' | 'DELETE', path: string, body?: unknown): Promise<T> {
  const token = getToken() ?? memoryToken
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`
  let res: Response
  try {
    res = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  } catch {
    throw new ApiError(0, 'network')
  }
  if (res.status === 204) return undefined as T
  let data: unknown = null
  try {
    data = await res.json()
  } catch {
    /* empty or not JSON */
  }
  if (!res.ok) {
    const code = (data as { error?: { code?: string } } | null)?.error?.code ?? 'unavailable'
    if (res.status === 401 && token) {
      clearToken()
      signedOutListeners.forEach((fn) => fn())
    }
    throw new ApiError(res.status, code)
  }
  return data as T
}

/** Loads a GET endpoint; `reload` fetches again. `path` null waits. */
export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [loading, setLoading] = useState(path !== null)
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (path === null) return
    let live = true
    setLoading(true)
    api<T>('GET', path).then(
      (d) => {
        if (!live) return
        setData(d)
        setError(null)
        setLoading(false)
      },
      (e: ApiError) => {
        if (!live) return
        setError(e)
        setLoading(false)
      },
    )
    return () => {
      live = false
    }
  }, [path, tick])
  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { data, error, loading, reload, setData }
}

// ---- helpers ----

export const roleLabel: Record<Role, string> = { owner: 'Owner', admin: 'Admin', developer: 'Developer', billing: 'Billing', viewer: 'Viewer' }
export const canManageKeys = (r: Role) => r === 'owner' || r === 'admin' || r === 'developer'
export const isOrgAdmin = (r: Role) => r === 'owner' || r === 'admin'
export const canPay = (r: Role) => r === 'owner' || r === 'admin' || r === 'billing'

/** Fills the days the API left out (no sessions) with zeros, oldest first. */
export function fillDays(days: DayUsage[], count: number, end = new Date()): DayUsage[] {
  const byDay = new Map(days.map((d) => [d.day, d]))
  const out: DayUsage[] = []
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() - i))
    const key = d.toISOString().slice(0, 10)
    out.push(byDay.get(key) ?? { day: key, sessions_created: 0, sessions_decided: 0, approved: 0, review: 0, retake: 0, rejected: 0, unfinished: 0 })
  }
  return out
}

export function totals(days: DayUsage[]) {
  return days.reduce(
    (t, d) => ({
      created: t.created + d.sessions_created,
      decided: t.decided + d.sessions_decided,
      approved: t.approved + d.approved,
      review: t.review + d.review,
      retake: t.retake + d.retake,
      rejected: t.rejected + d.rejected,
      unfinished: t.unfinished + d.unfinished,
    }),
    { created: 0, decided: 0, approved: 0, review: 0, retake: 0, rejected: 0, unfinished: 0 },
  )
}

export const keyStatus = (k: ApiKey): 'active' | 'revoked' | 'expired' =>
  k.revoked_at ? 'revoked' : new Date(k.expires_at).getTime() <= Date.now() ? 'expired' : 'active'

const actionLabels: Record<string, string> = {
  account_created: 'Created the account',
  key_created: 'Created an API key',
  key_revoked: 'Revoked an API key',
  top_up_started: 'Started a top-up',
  password_changed: 'Changed their password',
  organisation_renamed: 'Renamed the organisation',
  live_access_requested: 'Asked for live access',
  live_access_approved: 'Approved live access',
  live_access_rejected: 'Declined live access',
  webhook_changed: 'Changed the webhook',
  balance_adjusted: 'Adjusted the balance',
}
export const actionLabel = (a: string) => actionLabels[a] ?? a.replace(/_/g, ' ')

export const liveStatusLabel: Record<LiveStatus, string> = {
  not_started: 'Not requested',
  submitted: 'In review',
  approved: 'Approved',
  rejected: 'Declined',
}

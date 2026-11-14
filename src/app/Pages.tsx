import { useEffect, useState, type FormEvent } from 'react'
import { useLocation, useSearchParams } from 'react-router'
import { AlertTriangle, BadgeCheck, Check, Copy, Download, KeyRound, Plus, Smartphone, Trash2, Users } from 'lucide-react'
import { Button, Card, Empty, Field, Loading, Modal, Notice, PageHead, Pill, Segmented, inputClass } from '../components/ui'
import {
  api,
  ApiError,
  canManageKeys,
  canPay,
  fillDays,
  isOrgAdmin,
  keyStatus,
  liveStatusLabel,
  roleLabel,
  totals,
  useApi,
  type ApiKey,
  type BillingSummary,
  type DayUsage,
  type LiveRequest,
  type Mode,
  type TeamMember,
  type WebhookInfo,
} from '../lib/api'
import { useMe, useSession } from '../lib/session'
import { cx, formatCount, formatDate, formatDateTime, formatLe } from '../lib/format'

const errorText = (e: unknown) => (e instanceof ApiError ? e.message : 'Something went wrong. Try again.')

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard?.writeText(text).then(() => setCopied(true), () => setCopied(false))}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ink px-3 py-2 text-xs font-semibold text-panel"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function ModeSwitch({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  const me = useMe()
  return (
    <Segmented
      label="Mode"
      value={mode}
      onChange={setMode}
      options={[
        { value: 'test', label: 'Test' },
        { value: 'live', label: 'Live', disabled: me.organisation.live_status !== 'approved' },
      ]}
    />
  )
}

function downloadCsv(name: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => (/[",\n]/.test(String(c)) ? `"${String(c).replace(/"/g, '""')}"` : String(c))).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/* ---------- Verifications ---------- */

export function Verifications() {
  const me = useMe()
  const [mode, setMode] = useState<Mode>(me.organisation.live_status === 'approved' ? 'live' : 'test')
  const [range, setRange] = useState<'7' | '30' | '90'>('30')
  const { data, error, loading, reload } = useApi<{ days: DayUsage[] }>(`/api/usage?mode=${mode}&days=${range}`)
  const days = fillDays(data?.days ?? [], Number(range))
  const t = totals(days)
  const summary = [
    { label: 'Approved', value: t.approved, tone: 'bg-ok' },
    { label: 'In review', value: t.review, tone: 'bg-warn' },
    { label: 'Retake', value: t.retake, tone: 'bg-brand-500' },
    { label: 'Rejected', value: t.rejected, tone: 'bg-bad' },
  ]
  const exportCsv = () =>
    downloadCsv(`assay-${mode}-usage-${range}d.csv`, [
      ['day', 'sessions_created', 'sessions_decided', 'approved', 'review', 'retake', 'rejected', 'unfinished'],
      ...days.map((d) => [d.day, d.sessions_created, d.sessions_decided, d.approved, d.review, d.retake, d.rejected, d.unfinished]),
    ])
  return (
    <div className="rise">
      <PageHead
        title="Verifications"
        subtitle="Sessions and their outcomes per day. Images and ID details are never shown here; they go to your systems through the API."
        action={
          <Button variant="light" onClick={exportCsv} disabled={!data}>
            <Download className="size-4" /> Export CSV
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap gap-3">
        <ModeSwitch mode={mode} setMode={setMode} />
        <Segmented
          label="Period"
          value={range}
          onChange={setRange}
          options={[
            { value: '7', label: '7 days' },
            { value: '30', label: '30 days' },
            { value: '90', label: '90 days' },
          ]}
        />
      </div>
      {error ? (
        <Notice onRetry={reload}>{error.message}</Notice>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {summary.map((s) => (
              <Card key={s.label} className="p-4">
                <p className="flex items-center gap-2 text-sm text-muted">
                  <span className={cx('size-2 rounded-full', s.tone)} /> {s.label}
                </p>
                <p className="mt-2 text-2xl font-bold">{loading && !data ? '…' : formatCount(s.value)}</p>
              </Card>
            ))}
          </div>
          <Card>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold">By day</h2>
              <p className="text-sm text-muted">
                {formatCount(t.created)} created · {formatCount(t.decided)} decided · {formatCount(t.unfinished)} not finished
              </p>
            </div>
            {loading && !data ? (
              <Loading />
            ) : (
              <div className="mt-4 overflow-x-auto rounded-3xl border border-line">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-tile text-muted">
                    <tr>
                      <th className="py-3 pl-4 font-medium">Day</th>
                      <th className="py-3 text-right font-medium">Created</th>
                      <th className="py-3 text-right font-medium">Approved</th>
                      <th className="py-3 text-right font-medium">Review</th>
                      <th className="py-3 text-right font-medium">Retake</th>
                      <th className="py-3 text-right font-medium">Rejected</th>
                      <th className="py-3 pr-4 text-right font-medium">Unfinished</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...days].reverse().map((d) => (
                      <tr key={d.day} className={cx('border-t border-line', d.sessions_created === 0 && d.sessions_decided === 0 && 'text-muted')}>
                        <td className="py-3 pl-4 whitespace-nowrap">{formatDate(d.day + 'T12:00:00Z')}</td>
                        <td className="py-3 text-right font-medium">{d.sessions_created}</td>
                        <td className="py-3 text-right">{d.approved}</td>
                        <td className="py-3 text-right">{d.review}</td>
                        <td className="py-3 text-right">{d.retake}</td>
                        <td className="py-3 text-right">{d.rejected}</td>
                        <td className="py-3 pr-4 text-right">{d.unfinished}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}

/* ---------- API keys ---------- */

export function ApiKeys() {
  const me = useMe()
  const role = me.organisation.role
  const liveOk = me.organisation.live_status === 'approved'
  const [params, setParams] = useSearchParams()
  const test = useApi<{ keys: ApiKey[] }>('/api/keys?mode=test')
  const live = useApi<{ keys: ApiKey[] }>(liveOk ? '/api/keys?mode=live' : null)
  const [creating, setCreating] = useState(params.get('new') === '1' && canManageKeys(role))
  const [shown, setShown] = useState<{ name: string; secret: string } | null>(null)
  const [revoking, setRevoking] = useState<ApiKey | null>(null)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')

  const keys = [...(live.data?.keys ?? []), ...(test.data?.keys ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at))
  const reload = () => {
    test.reload()
    if (liveOk) live.reload()
  }
  const close = () => {
    setCreating(false)
    setShown(null)
    setFormError('')
    if (params.has('new')) setParams({}, { replace: true })
  }

  const create = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const cidrs = String(f.get('cidrs') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    setBusy(true)
    setFormError('')
    try {
      const res = await api<{ key: string; info: ApiKey }>('POST', '/api/keys', {
        name: String(f.get('name')).trim(),
        mode: f.get('mode'),
        expires_days: Number(f.get('expiry')),
        allowed_cidrs: cidrs,
      })
      setShown({ name: res.info.name, secret: res.key })
      reload()
    } catch (err) {
      setFormError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  const revoke = async () => {
    if (!revoking) return
    setBusy(true)
    setFormError('')
    try {
      await api('DELETE', `/api/keys/${revoking.id}?mode=${revoking.mode}`)
      setRevoking(null)
      reload()
    } catch (err) {
      setFormError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  const error = test.error ?? live.error
  return (
    <div className="rise">
      <PageHead
        title="API keys"
        subtitle="Keys are shown once when created. Assay stores only a fingerprint, so a lost key can't be recovered, only replaced."
        action={
          canManageKeys(role) && (
            <Button onClick={() => setCreating(true)}>
              <Plus className="size-4" /> New key
            </Button>
          )
        }
      />
      {!canManageKeys(role) && (
        <div className="mb-4">
          <Notice tone="neutral">Your role ({roleLabel[role]}) can view keys but not create or revoke them.</Notice>
        </div>
      )}
      {error ? (
        <Notice onRetry={reload}>{error.message}</Notice>
      ) : test.loading && !test.data ? (
        <Card>
          <Loading />
        </Card>
      ) : keys.length === 0 ? (
        <Card>
          <Empty>No keys yet. Create a test key to make your first API call.</Empty>
        </Card>
      ) : (
        <div className="grid gap-3">
          {keys.map((k) => {
            const status = keyStatus(k)
            const mayRevoke = status === 'active' && canManageKeys(role) && (k.mode === 'test' || isOrgAdmin(role))
            return (
              <Card key={k.mode + k.id} className={cx('flex flex-col gap-4 sm:flex-row sm:items-center', status !== 'active' && 'opacity-60')}>
                <span className={cx('grid size-12 shrink-0 place-items-center rounded-2xl text-white', k.mode === 'live' ? 'bg-[#1b1b1e]' : 'bg-brand-gradient')}>
                  <KeyRound className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{k.name}</p>
                    <Pill tone={k.mode === 'live' ? 'ok' : 'neutral'}>{k.mode === 'live' ? 'Live' : 'Test'}</Pill>
                    {status !== 'active' && <Pill tone="bad">{status === 'revoked' ? 'Revoked' : 'Expired'}</Pill>}
                  </div>
                  <p className="mt-1 font-mono text-sm text-muted">
                    {k.prefix}•••••••• {k.last4}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Created {formatDate(k.created_at)} · expires {formatDate(k.expires_at)} · {k.last_used_on ? `last used ${formatDate(k.last_used_on + 'T12:00:00Z')}` : 'never used'} ·{' '}
                    {k.allowed_cidrs?.length ? `only from ${k.allowed_cidrs.join(', ')}` : 'any IP'}
                  </p>
                </div>
                {mayRevoke && (
                  <Button variant="ghost" className="py-2.5 text-bad" onClick={() => setRevoking(k)}>
                    <Trash2 className="size-4" /> Revoke
                  </Button>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {revoking && (
        <Modal title="Revoke this key?" onClose={() => (setRevoking(null), setFormError(''))}>
          <p className="text-sm text-muted">
            <span className="font-semibold text-ink">{revoking.name}</span> ({revoking.prefix}…{revoking.last4}) stops working immediately. Anything still using it will get 401 errors. This cannot be undone.
          </p>
          {formError && (
            <div className="mt-4">
              <Notice>{formError}</Notice>
            </div>
          )}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button variant="light" onClick={() => setRevoking(null)}>
              Cancel
            </Button>
            <Button className="bg-bad text-white hover:bg-bad" onClick={revoke} disabled={busy}>
              Revoke key
            </Button>
          </div>
        </Modal>
      )}

      {creating && (
        <Modal title={shown ? 'Copy your key now' : 'New API key'} onClose={close}>
          {shown ? (
            <div>
              <div className="flex gap-3 rounded-2xl bg-warn-soft p-4 text-sm">
                <AlertTriangle className="size-5 shrink-0 text-warn" />
                <p>This is the only time the full key is shown. Store it in your secret manager; never put it in an app or a browser.</p>
              </div>
              <p className="mt-5 text-sm font-semibold">{shown.name}</p>
              <div className="mt-2 flex items-center gap-2 rounded-2xl bg-tile p-3">
                <code className="flex-1 truncate font-mono text-xs">{shown.secret}</code>
                <CopyButton text={shown.secret} />
              </div>
              <Button className="mt-6 w-full" onClick={close}>
                I&apos;ve stored it
              </Button>
            </div>
          ) : (
            <form onSubmit={create} className="space-y-4">
              {formError && <Notice>{formError}</Notice>}
              <Field label="Name" hint="Where it will be used, e.g. 'Production server'.">
                <input name="name" required maxLength={60} className={inputClass} placeholder="Production server" />
              </Field>
              <fieldset>
                <legend className="mb-1.5 text-sm font-semibold">Mode</legend>
                <div className="grid grid-cols-2 gap-2">
                  {(['test', 'live'] as const).map((m) => {
                    const disabled = m === 'live' && (!liveOk || !isOrgAdmin(role))
                    return (
                      <label key={m} className={cx('flex items-center gap-2 rounded-2xl border border-line p-3 text-sm has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 dark:has-[:checked]:bg-brand-500/10', disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer')}>
                        <input type="radio" name="mode" value={m} defaultChecked={m === 'test'} disabled={disabled} className="accent-[#f26430]" />
                        {m === 'live' ? 'Live (billed)' : 'Test (free)'}
                      </label>
                    )
                  })}
                </div>
                {!liveOk && <p className="mt-1.5 text-xs text-muted">Live keys become available once live access is approved.</p>}
              </fieldset>
              <Field label="Expires after">
                <select name="expiry" defaultValue="90" className={inputClass}>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="180">180 days</option>
                  <option value="365">1 year</option>
                </select>
              </Field>
              <Field label="Allowed IP ranges (optional)" hint="Comma-separated CIDRs, e.g. 203.0.113.0/24. The key is refused from anywhere else.">
                <input name="cidrs" className={inputClass} placeholder="203.0.113.0/24" />
              </Field>
              <Button type="submit" className="w-full" disabled={busy}>
                Create key
              </Button>
            </form>
          )}
        </Modal>
      )}
    </div>
  )
}

/* ---------- Billing ---------- */

const methodLabel: Record<string, string> = { orange_money: 'Orange Money', afrimoney: 'Afrimoney', card: 'Card' }
const kindLabel: Record<string, string> = { top_up: 'Top-up', charge: 'Verification', credit: 'Credit', refund: 'Refund' }

export function Billing() {
  const me = useMe()
  const [params, setParams] = useSearchParams()
  const { data, error, loading, reload } = useApi<BillingSummary>('/api/billing')
  const [topup, setTopup] = useState(params.get('topup') === '1')
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const close = () => {
    setTopup(false)
    setFormError('')
    if (params.has('topup')) setParams({}, { replace: true })
  }
  const start = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const amount = Math.round(Number(f.get('amount')) * 100)
    setBusy(true)
    setFormError('')
    try {
      const res = await api<{ redirect_url: string }>('POST', '/api/billing/topups', { amount_cents: amount, method: f.get('method') })
      window.location.assign(res.redirect_url)
    } catch (err) {
      setFormError(errorText(err))
      setBusy(false)
    }
  }
  const statement = () =>
    data &&
    downloadCsv('assay-statement.csv', [
      ['date', 'type', 'description', 'reference', 'amount_le'],
      ...data.entries.map((l) => [l.at, kindLabel[l.kind] ?? l.kind, l.description, l.reference, (l.amount_cents / 100).toFixed(2)]),
    ])

  return (
    <div className="rise">
      <PageHead
        title="Billing"
        subtitle="Prepaid in Leones. Each completed live verification is charged once; test mode is free."
        action={
          canPay(me.organisation.role) && (
            <Button variant="brand" onClick={() => setTopup(true)}>
              <Smartphone className="size-4" /> Top up
            </Button>
          )
        }
      />
      {error ? (
        <Notice onRetry={reload}>{error.message}</Notice>
      ) : loading && !data ? (
        <Card>
          <Loading />
        </Card>
      ) : data ? (
        <>
          {data.live_suspended && (
            <div className="mb-4">
              <Notice tone="warn">Live verifications are paused because the balance ran out. They resume as soon as a top-up is confirmed.</Notice>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="bg-ink text-panel">
              <p className="text-sm text-panel/60">Balance</p>
              <p className="mt-2 text-3xl font-bold">{formatLe(data.balance_cents)}</p>
              <p className="mt-2 text-sm text-panel/60">{data.verifications_remaining !== null ? `About ${formatCount(data.verifications_remaining)} live verifications left` : 'No live price set yet'}</p>
            </Card>
            <Card>
              <p className="text-sm text-muted">Price per live verification</p>
              <p className="mt-2 text-3xl font-bold">{data.price_cents > 0 ? formatLe(data.price_cents) : 'Not set'}</p>
              <p className="mt-2 text-sm text-muted">Charged once per completed decision. Retakes are free.</p>
            </Card>
            <Card>
              <p className="text-sm text-muted">Online top-ups</p>
              <p className="mt-2 text-3xl font-bold">{data.payments_enabled ? 'Available' : 'Coming soon'}</p>
              <p className="mt-2 text-sm text-muted">{data.payments_enabled ? 'Orange Money and Afrimoney' : 'Until then, Geneline-X adds credit for you on request.'}</p>
            </Card>
          </div>
          <Card className="mt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Transactions</h2>
              <Button variant="light" className="py-2.5" onClick={statement} disabled={data.entries.length === 0}>
                <Download className="size-4" /> Statement
              </Button>
            </div>
            {data.entries.length === 0 ? (
              <Empty>No transactions yet.</Empty>
            ) : (
              <div className="mt-4 overflow-x-auto rounded-3xl border border-line">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="bg-tile text-muted">
                    <tr>
                      <th className="py-3 pl-4 font-medium">Description</th>
                      <th className="py-3 font-medium">Type</th>
                      <th className="py-3 font-medium">Reference</th>
                      <th className="py-3 font-medium">Date</th>
                      <th className="py-3 pr-4 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.entries.map((l) => (
                      <tr key={l.id} className="border-t border-line">
                        <td className="py-3.5 pl-4 font-medium">{l.description || kindLabel[l.kind]}</td>
                        <td className="py-3.5 text-muted">{kindLabel[l.kind] ?? l.kind}</td>
                        <td className="max-w-[180px] truncate py-3.5 font-mono text-xs text-muted">{l.reference || '—'}</td>
                        <td className="py-3.5 whitespace-nowrap text-muted">{formatDateTime(l.at)}</td>
                        <td className={cx('py-3.5 pr-4 text-right font-semibold whitespace-nowrap', l.amount_cents > 0 ? 'text-ok' : 'text-ink')}>
                          {l.amount_cents > 0 ? '+' : '−'}
                          {formatLe(Math.abs(l.amount_cents))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          {data.payments.length > 0 && (
            <Card className="mt-4">
              <h2 className="text-lg font-semibold">Payments</h2>
              <ul className="mt-3 divide-y divide-line">
                {data.payments.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                    <span>
                      <span className="font-semibold">{formatLe(p.amount_cents)}</span> <span className="text-muted">· {methodLabel[p.method] ?? p.method}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <Pill tone={p.status === 'completed' ? 'ok' : p.status === 'pending' ? 'warn' : 'bad'}>{p.status[0]!.toUpperCase() + p.status.slice(1)}</Pill>
                      <span className="text-xs text-muted">{formatDateTime(p.created_at)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      ) : null}

      {topup && (
        <Modal title="Top up your balance" onClose={close}>
          {!canPay(me.organisation.role) ? (
            <Notice tone="neutral">Only owners, admins and billing members can top up.</Notice>
          ) : data && !data.payments_enabled ? (
            <div className="space-y-4">
              <Notice tone="neutral">Online top-ups with Orange Money and Afrimoney are being set up. Until then, contact Geneline-X and we will add credit to your balance.</Notice>
              <Button variant="light" className="w-full" onClick={close}>
                Close
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={start}>
              {formError && <Notice>{formError}</Notice>}
              <fieldset>
                <legend className="mb-1.5 text-sm font-semibold">Pay with</legend>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { v: 'orange_money', l: 'Orange Money', c: 'bg-[#ff7900]' },
                    { v: 'afrimoney', l: 'Afrimoney', c: 'bg-[#7b2d8e]' },
                  ].map((m) => (
                    <label key={m.v} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-line p-3 text-sm font-medium has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 dark:has-[:checked]:bg-brand-500/10">
                      <input type="radio" name="method" value={m.v} defaultChecked={m.v === 'orange_money'} className="sr-only" />
                      <span className={cx('size-6 rounded-full', m.c)} aria-hidden="true" />
                      {m.l}
                    </label>
                  ))}
                </div>
              </fieldset>
              <Field label="Amount (Le)" hint={data ? `Between ${formatLe(data.min_top_up_cents)} and ${formatLe(data.max_top_up_cents)}.` : undefined}>
                <input
                  name="amount"
                  type="number"
                  required
                  inputMode="decimal"
                  step="0.01"
                  min={data ? data.min_top_up_cents / 100 : 10}
                  max={data ? data.max_top_up_cents / 100 : 100000}
                  defaultValue={1000}
                  className={inputClass}
                />
              </Field>
              <Button type="submit" variant="brand" className="w-full" disabled={busy}>
                Continue to payment
              </Button>
              <p className="text-center text-xs text-muted">You approve the payment with the provider. We never see your PIN.</p>
            </form>
          )}
        </Modal>
      )}
    </div>
  )
}

/* ---------- Webhooks ---------- */

export function Webhooks() {
  const me = useMe()
  const role = me.organisation.role
  const [mode, setMode] = useState<Mode>('test')
  const { data, error, loading, reload } = useApi<WebhookInfo>(`/api/webhook?mode=${mode}`)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const [secret, setSecret] = useState<string | null>(null)
  const [url, setUrl] = useState('')
  useEffect(() => {
    setUrl(data?.url ?? '')
  }, [data])
  const mayEdit = canManageKeys(role) && (mode === 'test' || isOrgAdmin(role))

  const save = async (nextUrl: string) => {
    setBusy(true)
    setFormError('')
    try {
      const res = await api<{ url: string; secret: string }>('POST', '/api/webhook', { mode, url: nextUrl })
      setSecret(res.secret || null)
      reload()
    } catch (err) {
      setFormError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rise">
      <PageHead
        title="Webhooks"
        subtitle="Assay calls your URL when a decision is ready, signed with your secret. Verify the signature before trusting the event."
        action={<ModeSwitch mode={mode} setMode={(m) => (setMode(m), setSecret(null), setFormError(''))} />}
      />
      <Card className="max-w-2xl">
        <h2 className="font-semibold">{mode === 'live' ? 'Live' : 'Test'} endpoint</h2>
        {error ? (
          <div className="mt-4">
            <Notice onRetry={reload}>{error.message}</Notice>
          </div>
        ) : loading && !data ? (
          <Loading />
        ) : data && !data.available ? (
          <div className="mt-4">
            <Notice tone="neutral">Live webhooks are available once live access is approved.</Notice>
          </div>
        ) : data ? (
          <form
            className="mt-4 space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              void save(url.trim())
            }}
          >
            {formError && <Notice>{formError}</Notice>}
            <Field label="URL" hint="HTTPS only. Saving creates a new signing secret; the old one stops working.">
              <input type="url" required pattern="https://.*" maxLength={500} value={url} onChange={(e) => setUrl(e.target.value)} disabled={!mayEdit} placeholder="https://api.example.sl/assay/webhook" className={inputClass} />
            </Field>
            <p className="text-sm text-muted">
              Status: {data.url ? <span className="font-semibold text-ink">sending to {data.url}</span> : 'not set: no events are sent.'}
              {data.url && !data.secret_set && ' (no signing secret)'}
            </p>
            {secret && (
              <div className="rounded-2xl bg-warn-soft p-4">
                <p className="text-sm font-semibold">Signing secret: copy it now. It is shown only once.</p>
                <div className="mt-2 flex items-center gap-2 rounded-2xl bg-panel p-3">
                  <code className="flex-1 truncate font-mono text-xs">{secret}</code>
                  <CopyButton text={secret} />
                </div>
              </div>
            )}
            {mayEdit ? (
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={busy}>
                  {data.url ? 'Save and rotate secret' : 'Save'}
                </Button>
                {data.url && (
                  <Button type="button" variant="ghost" className="text-bad" disabled={busy} onClick={() => void save('')}>
                    Turn off
                  </Button>
                )}
              </div>
            ) : (
              <Notice tone="neutral">Your role ({roleLabel[role]}) cannot change webhooks.</Notice>
            )}
          </form>
        ) : null}
      </Card>
    </div>
  )
}

/* ---------- Settings ---------- */

export function Settings() {
  const { hash } = useLocation()
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hash])
  return (
    <div className="rise">
      <PageHead title="Settings" subtitle="Your organisation, live access, team and password." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="grid content-start gap-4">
          <LiveAccess />
          <Team />
        </div>
        <div className="grid content-start gap-4">
          <Organisation />
          <Password />
        </div>
      </div>
    </div>
  )
}

function LiveAccess() {
  const me = useMe()
  const { refresh } = useSession()
  const { data, error, loading, reload } = useApi<LiveRequest>('/api/live-access')
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setBusy(true)
    setFormError('')
    try {
      await api('POST', '/api/live-access', Object.fromEntries(['registration_number', 'website', 'use_case', 'monthly_volume', 'contact'].map((k) => [k, String(f.get(k) ?? '').trim()])))
      reload()
      await refresh()
    } catch (err) {
      setFormError(errorText(err))
    } finally {
      setBusy(false)
    }
  }
  const status = data?.status ?? me.organisation.live_status
  return (
    <Card>
      <div id="live" className="flex scroll-mt-24 items-center justify-between">
        <h2 className="font-semibold">Live access</h2>
        <Pill tone={status === 'approved' ? 'ok' : status === 'submitted' ? 'warn' : status === 'rejected' ? 'bad' : 'neutral'}>{liveStatusLabel[status]}</Pill>
      </div>
      {error ? (
        <div className="mt-4">
          <Notice onRetry={reload}>{error.message}</Notice>
        </div>
      ) : loading && !data ? (
        <Loading />
      ) : status === 'approved' ? (
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-ok-soft p-4 text-ok">
          <BadgeCheck className="size-6" />
          <p className="text-sm">Business review completed. Live keys and webhooks are enabled.</p>
        </div>
      ) : status === 'submitted' ? (
        <p className="mt-3 text-sm text-muted">Sent {data?.requested_at ? formatDateTime(data.requested_at) : ''}. Geneline-X reviews requests within one working day; we will contact {data?.details.contact || 'you'} if we need anything.</p>
      ) : !isOrgAdmin(me.organisation.role) ? (
        <p className="mt-3 text-sm text-muted">Ask an owner or admin of your organisation to request live access.</p>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-4">
          {status === 'rejected' && data?.note && <Notice tone="warn">Last request declined: {data.note}</Notice>}
          {formError && <Notice>{formError}</Notice>}
          <p className="text-sm text-muted">Tell us about your business. Live verifications are billed from your prepaid balance.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Business registration number">
              <input name="registration_number" required maxLength={80} defaultValue={data?.details.registration_number} className={inputClass} />
            </Field>
            <Field label="Website (optional)">
              <input name="website" maxLength={200} defaultValue={data?.details.website} className={inputClass} placeholder="https://" />
            </Field>
          </div>
          <Field label="What will you verify customers for?">
            <textarea name="use_case" required maxLength={1000} rows={3} defaultValue={data?.details.use_case} className={inputClass} placeholder="e.g. onboarding loan customers at our branches" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Expected verifications a month">
              <input name="monthly_volume" maxLength={40} defaultValue={data?.details.monthly_volume} className={inputClass} placeholder="e.g. 500" />
            </Field>
            <Field label="Contact phone or email">
              <input name="contact" required maxLength={120} defaultValue={data?.details.contact || me.user.email} className={inputClass} />
            </Field>
          </div>
          <Button type="submit" disabled={busy}>
            Request live access
          </Button>
        </form>
      )}
    </Card>
  )
}

function Team() {
  const { data, error, loading, reload } = useApi<{ members: TeamMember[] }>('/api/team')
  return (
    <Card>
      <h2 className="flex items-center gap-2 font-semibold">
        <Users className="size-5" /> Team
      </h2>
      {error ? (
        <div className="mt-4">
          <Notice onRetry={reload}>{error.message}</Notice>
        </div>
      ) : loading && !data ? (
        <Loading />
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {data?.members.map((m) => (
            <li key={m.email} className="flex flex-wrap items-center gap-3 py-3.5">
              <span className="grid size-10 place-items-center rounded-full bg-tile text-sm font-bold">
                {m.name
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((p) => p[0])
                  .join('')}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{m.name}</p>
                <p className="truncate text-xs text-muted">{m.email}</p>
              </div>
              <Pill>{roleLabel[m.role]}</Pill>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-xs text-muted">To add a teammate, contact Geneline-X support for now.</p>
    </Card>
  )
}

function Organisation() {
  const me = useMe()
  const { refresh } = useSession()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null)
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const name = String(new FormData(e.currentTarget).get('name')).trim()
    setBusy(true)
    setMsg(null)
    try {
      await api('POST', '/api/organisation', { name })
      await refresh()
      setMsg({ tone: 'ok', text: 'Saved.' })
    } catch (err) {
      setMsg({ tone: 'bad', text: errorText(err) })
    } finally {
      setBusy(false)
    }
  }
  return (
    <Card>
      <h2 className="font-semibold">Organisation</h2>
      <form onSubmit={submit} className="mt-4 space-y-4">
        {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
        <Field label="Name">
          <input name="name" required maxLength={120} defaultValue={me.organisation.name} disabled={!isOrgAdmin(me.organisation.role)} className={inputClass} />
        </Field>
        <Field label="Partner ID" hint="Quote this when you contact support.">
          <div className="flex items-center gap-2 rounded-2xl bg-tile p-3">
            <code className="flex-1 truncate font-mono text-xs">{me.organisation.partner_id}</code>
            <CopyButton text={me.organisation.partner_id} />
          </div>
        </Field>
        <p className="text-sm text-muted">
          You are signed in as <span className="font-semibold text-ink">{me.user.email}</span> ({roleLabel[me.organisation.role]}).
        </p>
        {isOrgAdmin(me.organisation.role) && (
          <Button type="submit" variant="light" disabled={busy}>
            Save name
          </Button>
        )}
      </form>
    </Card>
  )
}

function Password() {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null)
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const f = new FormData(form)
    if (f.get('new_password') !== f.get('confirm')) {
      setMsg({ tone: 'bad', text: 'The new passwords do not match.' })
      return
    }
    setBusy(true)
    setMsg(null)
    try {
      await api('POST', '/api/account/password', { current_password: f.get('current_password'), new_password: f.get('new_password') })
      form.reset()
      setMsg({ tone: 'ok', text: 'Password changed. Other devices have been signed out.' })
    } catch (err) {
      setMsg({ tone: 'bad', text: errorText(err) })
    } finally {
      setBusy(false)
    }
  }
  return (
    <Card>
      <h2 className="font-semibold">Password</h2>
      <form onSubmit={submit} className="mt-4 space-y-4">
        {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
        <Field label="Current password">
          <input name="current_password" type="password" required autoComplete="current-password" className={inputClass} />
        </Field>
        <Field label="New password" hint="At least 12 characters.">
          <input name="new_password" type="password" required minLength={12} maxLength={200} autoComplete="new-password" className={inputClass} />
        </Field>
        <Field label="Confirm new password">
          <input name="confirm" type="password" required minLength={12} maxLength={200} autoComplete="new-password" className={inputClass} />
        </Field>
        <Button type="submit" variant="light" disabled={busy}>
          Change password
        </Button>
      </form>
    </Card>
  )
}

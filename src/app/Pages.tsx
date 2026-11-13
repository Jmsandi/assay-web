import { useState, type FormEvent, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  CheckCircle2,
  Copy,
  Download,
  KeyRound,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Smartphone,
  Trash2,
  Users,
} from 'lucide-react'
import { Button, Card, Field, Modal, Pill, inputClass } from '../components/ui'
import { apiKeys as seedKeys, billing, ledger, organisation, stats, type ApiKey, type Mode } from '../data/mock'
import { cx, formatCount, formatDate, formatDateTime, formatLe } from '../lib/format'
import { VerificationTable } from './Overview'

function PageHead({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
      </div>
      {action}
    </div>
  )
}

/* ---------- Verifications ---------- */

export function Verifications() {
  const summary = [
    { label: 'Approved', value: stats.approved.value, tone: 'bg-ok' },
    { label: 'In review', value: stats.review.value, tone: 'bg-warn' },
    { label: 'Retake', value: stats.retake.value, tone: 'bg-brand-500' },
    { label: 'Rejected', value: 12, tone: 'bg-bad' },
  ]
  return (
    <div className="rise">
      <PageHead
        title="Verifications"
        subtitle="Sessions and their outcomes. Images and ID details are never shown here; they go to your systems through the API."
        action={
          <Button variant="light">
            <Download className="size-4" /> Export CSV
          </Button>
        }
      />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary.map((s) => (
          <Card key={s.label} className="p-4">
            <p className="flex items-center gap-2 text-sm text-muted">
              <span className={cx('size-2 rounded-full', s.tone)} /> {s.label}
            </p>
            <p className="mt-2 text-2xl font-bold">{formatCount(s.value)}</p>
          </Card>
        ))}
      </div>
      <Card>
        <VerificationTable showMode />
      </Card>
    </div>
  )
}

/* ---------- API keys ---------- */

function newSecret(mode: Mode) {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return `sk_${mode}_` + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function ApiKeys() {
  const [params, setParams] = useSearchParams()
  const [keys, setKeys] = useState<ApiKey[]>(seedKeys)
  const [creating, setCreating] = useState(params.get('new') === '1')
  const [shown, setShown] = useState<{ name: string; secret: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const close = () => {
    setCreating(false)
    setShown(null)
    setCopied(false)
    if (params.has('new')) setParams({}, { replace: true })
  }

  const create = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const mode = f.get('mode') as Mode
    const secret = newSecret(mode)
    const name = String(f.get('name'))
    const days = Number(f.get('expiry'))
    const cidrs = String(f.get('cidrs') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    setKeys((k) => [
      { id: crypto.randomUUID(), name, mode, prefix: `sk_${mode}_`, last4: secret.slice(-4), createdBy: organisation.owner.name, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + days * 864e5).toISOString(), lastUsed: null, cidrs, status: 'active' },
      ...k,
    ])
    setShown({ name, secret })
  }

  const revoke = (id: string) => setKeys((k) => k.map((x) => (x.id === id ? { ...x, status: 'revoked' } : x)))

  return (
    <div className="rise">
      <PageHead
        title="API keys"
        subtitle="Keys are shown once when created. We store only a fingerprint, so a lost key can't be recovered, only replaced."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" /> New key
          </Button>
        }
      />
      <div className="grid gap-3">
        {keys.map((k) => (
          <Card key={k.id} className={cx('flex flex-col gap-4 sm:flex-row sm:items-center', k.status !== 'active' && 'opacity-60')}>
            <span className={cx('grid size-12 shrink-0 place-items-center rounded-2xl text-white', k.mode === 'live' ? 'bg-[#1b1b1e]' : 'bg-brand-gradient')}>
              <KeyRound className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{k.name}</p>
                <Pill tone={k.mode === 'live' ? 'ok' : 'neutral'}>{k.mode === 'live' ? 'Live' : 'Test'}</Pill>
                {k.status !== 'active' && <Pill tone="bad">{k.status === 'revoked' ? 'Revoked' : 'Expired'}</Pill>}
              </div>
              <p className="mt-1 font-mono text-sm text-muted">
                {k.prefix}•••••••• {k.last4}
              </p>
              <p className="mt-1 text-xs text-muted">
                Created by {k.createdBy} · expires {formatDate(k.expiresAt)} · {k.lastUsed ? `last used ${formatDate(k.lastUsed)}` : 'never used'} · {k.cidrs.length ? `only from ${k.cidrs.join(', ')}` : 'any IP'}
              </p>
            </div>
            {k.status === 'active' && (
              <div className="flex gap-2">
                <Button variant="light" className="py-2.5" onClick={() => setCreating(true)}>
                  <RefreshCw className="size-4" /> Rotate
                </Button>
                <Button variant="ghost" className="py-2.5 text-bad" onClick={() => revoke(k.id)}>
                  <Trash2 className="size-4" /> Revoke
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>

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
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(shown.secret).then(() => setCopied(true), () => setCopied(false))
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-2 text-xs font-semibold text-panel"
                >
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <Button className="mt-6 w-full" onClick={close}>
                I've stored it
              </Button>
            </div>
          ) : (
            <form onSubmit={create} className="space-y-4">
              <Field label="Name" hint="Where it will be used, e.g. 'Production server'.">
                <input name="name" required maxLength={60} className={inputClass} placeholder="Production server" />
              </Field>
              <fieldset>
                <legend className="mb-1.5 text-sm font-semibold">Mode</legend>
                <div className="grid grid-cols-2 gap-2">
                  {(['test', 'live'] as const).map((m) => (
                    <label key={m} className="flex cursor-pointer items-center gap-2 rounded-2xl border border-line p-3 text-sm has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 dark:has-[:checked]:bg-brand-500/10">
                      <input type="radio" name="mode" value={m} defaultChecked={m === 'test'} className="accent-[#f26430]" />
                      {m === 'live' ? 'Live (billed)' : 'Test (free)'}
                    </label>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-muted">Live keys need two-step sign-in; you'll be asked for a code.</p>
              </fieldset>
              <Field label="Expires after">
                <select name="expiry" defaultValue="90" className={inputClass}>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="180">180 days</option>
                  <option value="365">1 year</option>
                </select>
              </Field>
              <Field label="Allowed IP ranges (optional)" hint="Comma-separated CIDRs. The key will be refused from anywhere else.">
                <input name="cidrs" className={inputClass} placeholder="203.0.113.0/24" />
              </Field>
              <Button type="submit" className="w-full">
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

const methodLabel = { orange_money: 'Orange Money', afrimoney: 'Afrimoney', card: 'Card' }

export function Billing() {
  const [params, setParams] = useSearchParams()
  const [topup, setTopup] = useState(params.get('topup') === '1')
  const [step, setStep] = useState<'form' | 'waiting'>('form')
  const close = () => {
    setTopup(false)
    setStep('form')
    if (params.has('topup')) setParams({}, { replace: true })
  }
  return (
    <div className="rise">
      <PageHead
        title="Billing"
        subtitle="Prepaid in Leones. Each completed live verification is charged once; test mode is free."
        action={
          <Button variant="brand" onClick={() => setTopup(true)}>
            <Smartphone className="size-4" /> Top up
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="bg-ink text-panel">
          <p className="text-sm text-panel/60">Balance</p>
          <p className="mt-2 text-3xl font-bold">{formatLe(billing.balanceCents)}</p>
          <p className="mt-2 text-sm text-panel/60">About {formatCount(Math.floor(billing.balanceCents / billing.pricePerVerificationCents))} verifications left</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Price per verification</p>
          <p className="mt-2 text-3xl font-bold">{formatLe(billing.pricePerVerificationCents)}</p>
          <p className="mt-2 text-sm text-muted">{organisation.plan} · placeholder price</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Low balance alert</p>
          <p className="mt-2 text-3xl font-bold">Le 10,000.00</p>
          <p className="mt-2 text-sm text-muted">Emails the owner and billing contacts</p>
        </Card>
      </div>
      <Card className="mt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Transactions</h2>
          <Button variant="light" className="py-2.5">
            <Download className="size-4" /> Statement
          </Button>
        </div>
        <div className="mt-4 overflow-x-auto rounded-3xl border border-line">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-tile text-muted">
              <tr>
                <th className="py-3 pl-4 font-medium">Description</th>
                <th className="py-3 font-medium">Method</th>
                <th className="py-3 font-medium">Reference</th>
                <th className="py-3 font-medium">Status</th>
                <th className="py-3 font-medium">Date</th>
                <th className="py-3 pr-4 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((l) => (
                <tr key={l.id} className="border-t border-line">
                  <td className="py-3.5 pl-4 font-medium">{l.description}</td>
                  <td className="py-3.5 text-muted">{l.method ? methodLabel[l.method] : '—'}</td>
                  <td className="py-3.5 font-mono text-xs text-muted">{l.reference}</td>
                  <td className="py-3.5">
                    <Pill tone={l.status === 'completed' ? 'ok' : l.status === 'pending' ? 'warn' : 'bad'}>{l.status[0].toUpperCase() + l.status.slice(1)}</Pill>
                  </td>
                  <td className="py-3.5 whitespace-nowrap text-muted">{formatDateTime(l.at)}</td>
                  <td className={cx('py-3.5 pr-4 text-right font-semibold whitespace-nowrap', l.amountCents > 0 ? 'text-ok' : 'text-ink')}>
                    {l.amountCents > 0 ? '+' : '−'}
                    {formatLe(Math.abs(l.amountCents)).replace('Le ', 'Le ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {topup && (
        <Modal title="Top up your balance" onClose={close}>
          {step === 'form' ? (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                setStep('waiting')
              }}
            >
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
              <Field label="Amount (Le)">
                <div className="grid grid-cols-4 gap-2">
                  {[500, 1000, 2500, 5000].map((a) => (
                    <label key={a} className="cursor-pointer rounded-2xl border border-line py-2.5 text-center text-sm font-semibold has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-panel">
                      <input type="radio" name="amount" value={a} defaultChecked={a === 1000} className="sr-only" />
                      {formatCount(a)}
                    </label>
                  ))}
                </div>
              </Field>
              <Field label="Mobile money number" hint="You'll approve the payment on this phone.">
                <input required inputMode="tel" autoComplete="tel" className={inputClass} placeholder="076 123 456" />
              </Field>
              <Button type="submit" variant="brand" className="w-full">
                Continue to payment
              </Button>
              <p className="text-center text-xs text-muted">Payments are handled by our mobile money provider. We never see your PIN.</p>
            </form>
          ) : (
            <div className="text-center">
              <span className="bg-brand-gradient mx-auto grid size-16 place-items-center rounded-full text-white">
                <Smartphone className="size-7" />
              </span>
              <p className="mt-5 text-lg font-bold">Approve the payment on your phone</p>
              <p className="mt-2 text-sm text-muted">Your balance updates as soon as the provider confirms it. You can close this window.</p>
              <div className="mt-5 flex justify-center">
                <Pill tone="warn">Waiting for confirmation</Pill>
              </div>
              <Button variant="light" className="mt-6 w-full" onClick={close}>
                Close
              </Button>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}

/* ---------- Webhooks ---------- */

export function Webhooks() {
  const [sent, setSent] = useState(false)
  const deliveries = [
    { at: new Date(Date.now() - 36e5).toISOString(), status: 200, attempts: 1 },
    { at: new Date(Date.now() - 5 * 36e5).toISOString(), status: 200, attempts: 1 },
    { at: new Date(Date.now() - 26 * 36e5).toISOString(), status: 503, attempts: 3 },
  ]
  return (
    <div className="rise">
      <PageHead title="Webhooks" subtitle="We call your URL when a decision is ready. Verify the signature with your signing secret before trusting it." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Card>
          <h2 className="font-semibold">Live endpoint</h2>
          <form className="mt-4 space-y-4" onSubmit={(e) => e.preventDefault()}>
            <Field label="URL" hint="HTTPS only.">
              <input type="url" required pattern="https://.*" defaultValue="https://api.kora.example/assay/webhook" className={inputClass} />
            </Field>
            <Field label="Signing secret">
              <div className="flex items-center gap-2 rounded-2xl bg-tile p-3">
                <code className="flex-1 font-mono text-xs text-muted">whsec_•••••••••••••••• 41fa</code>
                <button type="button" className="inline-flex items-center gap-1.5 rounded-full bg-panel px-3 py-2 text-xs font-semibold">
                  <RefreshCw className="size-3.5" /> Rotate
                </button>
              </div>
            </Field>
            <div className="flex gap-2">
              <Button type="submit">Save</Button>
              <Button type="button" variant="light" onClick={() => setSent(true)}>
                <Send className="size-4" /> {sent ? 'Test event sent' : 'Send test event'}
              </Button>
            </div>
          </form>
        </Card>
        <Card>
          <h2 className="font-semibold">Recent deliveries</h2>
          <ul className="mt-4 divide-y divide-line">
            {deliveries.map((d) => (
              <li key={d.at} className="flex items-center justify-between py-3 text-sm">
                <span className="flex items-center gap-2">
                  {d.status < 300 ? <CheckCircle2 className="size-4 text-ok" /> : <AlertTriangle className="size-4 text-bad" />}
                  {d.status} · {d.attempts} attempt{d.attempts > 1 ? 's' : ''}
                </span>
                <span className="text-muted">{formatDateTime(d.at)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">Payloads are not stored here; only the delivery result.</p>
        </Card>
      </div>
    </div>
  )
}

/* ---------- Settings ---------- */

export function Settings() {
  const team = [
    { name: organisation.owner.name, email: organisation.owner.email, role: 'Owner', mfa: true },
    { name: 'Ibrahim Sesay', email: 'ibrahim@kora.example', role: 'Developer', mfa: true },
    { name: 'Fatmata Bangura', email: 'fatmata@kora.example', role: 'Billing', mfa: false },
  ]
  return (
    <div className="rise">
      <PageHead title="Settings" subtitle="Your organisation, team and security." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="grid content-start gap-4">
          <Card>
            <h2 className="font-semibold">Live access</h2>
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-ok-soft p-4 text-ok">
              <BadgeCheck className="size-6" />
              <div>
                <p className="font-semibold">Approved</p>
                <p className="text-xs">Business review completed. Live keys enabled.</p>
              </div>
            </div>
          </Card>
          <Card>
            <h2 className="font-semibold">Two-step sign-in</h2>
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm">
                <ShieldCheck className="size-5 text-ok" /> Authenticator app on
              </span>
              <Button variant="light" className="py-2.5">
                Manage
              </Button>
            </div>
          </Card>
        </div>
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold">
              <Users className="size-5" /> Team
            </h2>
            <Button className="py-2.5">
              <Plus className="size-4" /> Invite
            </Button>
          </div>
          <ul className="mt-4 divide-y divide-line">
            {team.map((m) => (
              <li key={m.email} className="flex flex-wrap items-center gap-3 py-3.5">
                <span className="grid size-10 place-items-center rounded-full bg-tile text-sm font-bold">
                  {m.name
                    .split(' ')
                    .map((p) => p[0])
                    .join('')}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{m.name}</p>
                  <p className="truncate text-xs text-muted">{m.email}</p>
                </div>
                <Pill tone={m.mfa ? 'ok' : 'warn'}>{m.mfa ? '2-step on' : '2-step off'}</Pill>
                <Pill>{m.role}</Pill>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}

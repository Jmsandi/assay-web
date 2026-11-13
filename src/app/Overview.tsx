import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import {
  CheckCircle2,
  Clock3,
  FileText,
  Filter,
  KeyRound,
  Link2,
  MoreHorizontal,
  Plus,
  RotateCcw,
  ScanFace,
  Search,
  Upload,
  Wallet,
} from 'lucide-react'
import { Card, Change, OutcomeBadge, Pill } from '../components/ui'
import { apiKeys, billing, monthly, organisation, stats, verifications, type Channel } from '../data/mock'
import { cx, formatCount, formatDateTime, formatLe, formatLeCompact, greeting } from '../lib/format'

export default function Overview() {
  const first = organisation.owner.name.split(' ')[0]
  return (
    <div className="rise">
      <h1 className="text-3xl font-bold tracking-tight sm:text-[40px]">
        {greeting()}, {first}
      </h1>
      <p className="mt-1.5 text-sm text-muted sm:text-base">Keep an eye on your verifications, balance and keys.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(300px,0.95fr)_minmax(0,2.05fr)]">
        {/* Left column */}
        <div className="grid grid-cols-1 content-start gap-4 md:grid-cols-2 xl:grid-cols-1">
          <BalanceCard />
          <SpendingCap />
          <KeysCard />
        </div>

        {/* Right area */}
        <div className="grid grid-cols-1 content-start gap-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
            <StatTiles />
            <OutcomesChart />
          </div>
          <RecentVerifications />
        </div>
      </div>
    </div>
  )
}

function BalanceCard() {
  const left = Math.floor(billing.balanceCents / billing.pricePerVerificationCents)
  return (
    <Card>
      <div className="flex items-start justify-between">
        <p className="text-sm text-muted">Credit balance</p>
        <span className="flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs font-semibold">
          <span className="grid size-4 place-items-center rounded-full bg-gradient-to-b from-[#1eb53a] via-white to-[#0072c6] text-[7px]" aria-hidden="true" />
          SLE
        </span>
      </div>
      <p className="mt-1 text-[32px] font-bold tracking-tight">{formatLe(billing.balanceCents)}</p>
      <div className="mt-1 flex items-center gap-2 text-xs text-muted">
        <Change pct={billing.changePct} /> than last month · about {formatCount(left)} verifications left
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Link to="/app/billing?topup=1" className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-3.5 text-sm font-semibold text-panel hover:bg-ink-soft">
          <Wallet className="size-4" /> Top up
        </Link>
        <Link to="/app/billing" className="inline-flex items-center justify-center gap-2 rounded-full bg-tile px-4 py-3.5 text-sm font-semibold hover:bg-line">
          <FileText className="size-4" /> Statement
        </Link>
      </div>
      <div className="mt-4 rounded-3xl bg-tile p-3">
        <p className="px-1 text-sm">
          <span className="font-semibold">Modes</span>
          <span className="text-muted"> | Live and test</span>
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { label: 'Live', value: formatLeCompact(billing.balanceCents), note: 'Billed per decision', state: 'Active', tone: 'text-ok' },
            { label: 'Test', value: 'Free', note: '100 sessions a day', state: 'Active', tone: 'text-ok' },
            { label: 'Top-up', value: formatLeCompact(500_000), note: 'Afrimoney', state: 'Pending', tone: 'text-warn' },
          ].map((m) => (
            <div key={m.label} className="min-w-0 rounded-2xl bg-panel p-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">{m.label}</span>
                <MoreHorizontal className="size-3.5 text-muted" />
              </div>
              <p className="mt-2 truncate text-[13px] font-bold">{m.value}</p>
              <p className="truncate text-[10px] text-muted">{m.note}</p>
              <p className={cx('mt-1 text-[11px] font-medium', m.tone)}>{m.state}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

function SpendingCap() {
  const pct = Math.min(100, Math.round((billing.spentThisMonthCents / billing.monthlyCapCents) * 100))
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Monthly spending cap</h2>
        <Pill tone="brand">{pct}%</Pill>
      </div>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-[repeating-linear-gradient(135deg,var(--color-line)_0_3px,transparent_3px_7px)]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Spending this month">
        <div className="bg-brand-gradient h-full rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-3 flex justify-between text-xs">
        <span>
          <span className="font-semibold">{formatLe(billing.spentThisMonthCents)}</span> <span className="text-muted">spent out of</span>
        </span>
        <span className="font-semibold">{formatLe(billing.monthlyCapCents)}</span>
      </div>
    </Card>
  )
}

function KeysCard() {
  const keys = apiKeys.filter((k) => k.status === 'active')
  return (
    <Card className="overflow-hidden pr-0">
      <div className="flex items-center justify-between pr-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl border border-line">
            <KeyRound className="size-4" />
          </span>
          <h2 className="font-semibold">API keys</h2>
        </div>
        <Link to="/app/keys?new=1" className="inline-flex items-center gap-1 rounded-full bg-tile px-3.5 py-2 text-sm font-medium hover:bg-line">
          <Plus className="size-4" /> New key
        </Link>
      </div>
      <div className="mt-5 flex gap-3 overflow-x-auto pr-5 pb-1">
        {keys.map((k) => (
          <Link
            key={k.id}
            to="/app/keys"
            className={cx(
              'relative flex h-40 w-[230px] shrink-0 flex-col justify-between overflow-hidden rounded-3xl p-4 text-white',
              k.mode === 'live' ? 'bg-[#1b1b1e]' : 'bg-brand-gradient',
            )}
          >
            {k.mode === 'live' && (
              <div className="absolute inset-0 opacity-30" aria-hidden="true">
                <div className="absolute top-6 right-10 size-16 bg-white/10" />
                <div className="absolute top-14 right-2 size-12 bg-white/10" />
                <div className="absolute top-0 right-24 size-10 bg-white/5" />
              </div>
            )}
            <div className="relative flex items-center justify-between">
              <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-[#141416]">{k.mode === 'live' ? 'Live' : 'Test'}</span>
              <KeyRound className="size-5 text-white/80" />
            </div>
            <div className="relative">
              <p className="text-[10px] text-white/60">{k.name}</p>
              <div className="mt-1 flex items-end justify-between">
                <p className="font-mono text-sm tracking-wide">
                  {k.prefix}•••• {k.last4}
                </p>
                <p className="text-right text-[10px] text-white/60">
                  EXP
                  <br />
                  <span className="text-xs text-white">{new Date(k.expiresAt).toLocaleDateString('en-GB', { month: '2-digit', year: '2-digit' })}</span>
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  )
}

function StatTiles() {
  const tiles = [
    { label: 'Verifications', icon: ScanFace, ...stats.verifications, brand: true },
    { label: 'Approved', icon: CheckCircle2, ...stats.approved, brand: false },
    { label: 'In review', icon: Clock3, ...stats.review, brand: false },
    { label: 'Retakes', icon: RotateCcw, ...stats.retake, brand: false },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 rounded-[var(--radius-card)] bg-panel p-3">
      {tiles.map((t) => (
        <div key={t.label} className={cx('flex min-h-[132px] flex-col justify-between rounded-3xl p-4', t.brand ? 'bg-brand-gradient text-white shadow-[0_14px_28px_-14px_rgb(242_100_48/0.9)]' : 'bg-tile')}>
          <div className="flex items-start justify-between gap-2">
            <p className={cx('text-sm', t.brand ? 'text-white/90' : 'text-ink')}>{t.label}</p>
            <span className={cx('grid size-8 place-items-center rounded-full', t.brand ? 'bg-white/20' : 'bg-panel')}>
              <t.icon className="size-4" />
            </span>
          </div>
          <div>
            <p className="text-[28px] font-bold tracking-tight">{formatCount(t.value)}</p>
            <p className={cx('mt-1 flex items-center gap-1.5 text-xs', t.brand ? 'text-white/80' : 'text-muted')}>
              <Change pct={t.changePct} onBrand={t.brand} /> This month
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

function OutcomesChart() {
  const max = 1200
  const ticks = [1200, 1000, 800, 600, 400, 200, 0]
  return (
    <Card>
      <h2 className="text-lg font-semibold">Verification outcomes</h2>
      <p className="mt-0.5 text-sm text-muted">Decided automatically vs. sent to a person</p>
      <div className="mt-4 rounded-3xl bg-tile p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Last 8 months</p>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-ink" /> Approved
            </span>
            <span className="flex items-center gap-1.5">
              <span className="hatch-brand size-2.5 rounded-sm" /> Review
            </span>
          </div>
        </div>
        <div className="mt-4 flex h-48 gap-2">
          <div className="flex flex-col justify-between pb-6 text-[10px] text-muted">
            {ticks.map((t) => (
              <span key={t}>{t === 0 ? '0' : `${t / 1000}k`.replace('.', '.')}</span>
            ))}
          </div>
          <div className="flex flex-1 items-end justify-between gap-1.5">
            {monthly.map((m) => (
              <div key={m.month} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${m.month}: ${m.approved} approved, ${m.review} review`}>
                <div className="flex h-[calc(100%-1.5rem)] w-full max-w-7 flex-col justify-end gap-1">
                  <div className="hatch-brand w-full rounded-lg" style={{ height: `${(m.review / max) * 100}%` }} />
                  <div className="w-full rounded-lg bg-ink" style={{ height: `${(m.approved / max) * 100}%` }} />
                </div>
                <span className="text-[10px] text-muted">{m.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

const channel: Record<Channel, { label: string; icon: typeof Link2 }> = {
  capture_link: { label: 'Capture link', icon: Link2 },
  api_upload: { label: 'API upload', icon: Upload },
}

export function VerificationTable({ limit, showMode = false }: { limit?: number; showMode?: boolean }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const rows = useMemo(() => verifications.filter((v) => v.sessionId.includes(query.trim())).slice(0, limit), [query, limit])
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">Recent verifications</h2>
        <div className="flex gap-2">
          <label className="flex flex-1 items-center gap-2 rounded-full border border-line px-4 py-2.5 sm:w-56 sm:flex-none">
            <Search className="size-4 text-muted" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search session ID" className="w-full bg-transparent text-sm outline-none placeholder:text-muted" aria-label="Search session ID" />
          </label>
          <button className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-sm">
            Filter <Filter className="size-4" />
          </button>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto rounded-3xl border border-line">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-tile text-muted">
            <tr>
              <th className="w-12 py-3 pl-4 font-medium">
                <span className="sr-only">Select</span>
              </th>
              <th className="py-3 font-medium">Session</th>
              <th className="py-3 font-medium">Channel</th>
              {showMode && <th className="py-3 font-medium">Mode</th>}
              <th className="py-3 font-medium">Cost</th>
              <th className="py-3 font-medium">Outcome</th>
              <th className="py-3 font-medium">Date</th>
              <th className="w-10 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((v) => {
              const C = channel[v.channel]
              const isSel = selected.has(v.sessionId)
              return (
                <tr key={v.sessionId} className={cx('border-t border-line', isSel && 'bg-tile')}>
                  <td className="py-3.5 pl-4">
                    <input type="checkbox" checked={isSel} onChange={() => toggle(v.sessionId)} className="size-4 accent-[#141416]" aria-label={`Select ${v.sessionId}`} />
                  </td>
                  <td className="py-3.5 font-mono text-xs">{v.sessionId.slice(0, 17)}…</td>
                  <td className="py-3.5">
                    <span className="inline-flex items-center gap-2">
                      <span className="grid size-7 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/15">
                        <C.icon className="size-3.5" />
                      </span>
                      {C.label}
                    </span>
                  </td>
                  {showMode && (
                    <td className="py-3.5">
                      <Pill tone={v.mode === 'live' ? 'ok' : 'neutral'}>{v.mode === 'live' ? 'Live' : 'Test'}</Pill>
                    </td>
                  )}
                  <td className="py-3.5 font-medium">{v.priceCents ? formatLe(v.priceCents) : '—'}</td>
                  <td className="py-3.5">
                    <OutcomeBadge outcome={v.outcome} />
                  </td>
                  <td className="py-3.5 whitespace-nowrap text-muted">{formatDateTime(v.decidedAt)}</td>
                  <td className="py-3.5 pr-3">
                    <button className="grid size-8 place-items-center rounded-full text-muted hover:bg-tile" aria-label="More">
                      <MoreHorizontal className="size-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-muted">
                  No sessions match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}

function RecentVerifications() {
  return (
    <Card>
      <VerificationTable limit={5} />
      <div className="mt-4 flex justify-end">
        <Link to="/app/verifications" className="rounded-full bg-tile px-5 py-2.5 text-sm font-semibold hover:bg-line">
          View all
        </Link>
      </div>
    </Card>
  )
}

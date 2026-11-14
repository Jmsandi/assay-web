import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { BadgeCheck, CheckCircle2, Clock3, FileText, KeyRound, Plus, RotateCcw, ScanFace, Wallet } from 'lucide-react'
import { Card, Empty, Loading, Notice, Pill, Segmented } from '../components/ui'
import { actionLabel, fillDays, keyStatus, liveStatusLabel, totals, useApi, type Activity, type ApiKey, type BillingSummary, type DayUsage, type Mode } from '../lib/api'
import { useMe } from '../lib/session'
import { cx, formatCount, formatDateTime, formatLe, greeting } from '../lib/format'

export default function Overview() {
  const me = useMe()
  const [params, setParams] = useSearchParams()
  const live = me.organisation.live_status === 'approved'
  const [mode, setMode] = useState<Mode>(live ? 'live' : 'test')
  const first = me.user.name.split(' ')[0]
  return (
    <div className="rise">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-[40px]">
            {greeting()}, {first}
          </h1>
          <p className="mt-1.5 text-sm text-muted sm:text-base">Here&apos;s how your verifications went over the last 30 days.</p>
        </div>
        <Segmented
          label="Mode"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'test', label: 'Test' },
            { value: 'live', label: 'Live', disabled: !live },
          ]}
        />
      </div>

      {params.get('welcome') === '1' && (
        <div className="mt-6">
          <Notice tone="ok">
            Your account is ready in test mode. Create a test key to start, and ask for live access from{' '}
            <Link to="/app/settings" className="font-semibold underline underline-offset-2">
              Settings
            </Link>{' '}
            when you are ready.{' '}
            <button className="font-semibold underline underline-offset-2" onClick={() => setParams({}, { replace: true })}>
              Dismiss
            </button>
          </Notice>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(300px,0.95fr)_minmax(0,2.05fr)]">
        <div className="grid grid-cols-1 content-start gap-6 md:grid-cols-2 xl:grid-cols-1">
          <BalanceCard />
          <LiveAccessCard />
          <KeysCard />
        </div>
        <div className="grid grid-cols-1 content-start gap-6">
          <UsagePanels mode={mode} />
          <RecentActivity />
        </div>
      </div>
    </div>
  )
}

function BalanceCard() {
  const { data, error, loading, reload } = useApi<BillingSummary>('/api/billing')
  return (
    <Card>
      <div className="flex items-start justify-between">
        <p className="text-sm text-muted">Credit balance</p>
        <span className="rounded-full border border-line px-2.5 py-1 text-xs font-semibold">SLE</span>
      </div>
      {loading && !data ? (
        <Loading />
      ) : error ? (
        <div className="mt-3">
          <Notice onRetry={reload}>{error.message}</Notice>
        </div>
      ) : data ? (
        <>
          <p className="mt-1 text-[32px] font-bold tracking-tight">{formatLe(data.balance_cents)}</p>
          <p className="mt-1 text-xs text-muted">
            {data.verifications_remaining !== null ? `About ${formatCount(data.verifications_remaining)} live verifications left` : 'Test mode is free; live pricing is not set yet'}
          </p>
          {data.live_suspended && (
            <div className="mt-3">
              <Notice tone="warn">Live verifications are paused until you top up.</Notice>
            </div>
          )}
        </>
      ) : null}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Link to="/app/billing?topup=1" className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-3.5 text-sm font-semibold text-panel hover:bg-ink-soft">
          <Wallet className="size-4" /> Top up
        </Link>
        <Link to="/app/billing" className="inline-flex items-center justify-center gap-2 rounded-full bg-tile px-4 py-3.5 text-sm font-semibold hover:bg-line">
          <FileText className="size-4" /> Statement
        </Link>
      </div>
    </Card>
  )
}

function LiveAccessCard() {
  const me = useMe()
  const status = me.organisation.live_status
  const tone = status === 'approved' ? 'ok' : status === 'submitted' ? 'warn' : status === 'rejected' ? 'bad' : 'neutral'
  const text = {
    approved: 'Live keys are enabled for your organisation.',
    submitted: 'We are reviewing your business details. This usually takes one working day.',
    rejected: 'Your last request was declined. See the reason and ask again in Settings.',
    not_started: 'Test mode is free. Tell us about your business to verify real customers.',
  }[status]
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold">
          <BadgeCheck className="size-5" /> Live access
        </h2>
        <Pill tone={tone}>{liveStatusLabel[status]}</Pill>
      </div>
      <p className="mt-3 text-sm text-muted">{text}</p>
      {status !== 'approved' && status !== 'submitted' && (
        <Link to="/app/settings#live" className="mt-4 inline-flex rounded-full bg-tile px-4 py-2.5 text-sm font-semibold hover:bg-line">
          Request live access
        </Link>
      )}
    </Card>
  )
}

function KeysCard() {
  const me = useMe()
  const live = me.organisation.live_status === 'approved'
  const test = useApi<{ keys: ApiKey[] }>('/api/keys?mode=test')
  const liveKeys = useApi<{ keys: ApiKey[] }>(live ? '/api/keys?mode=live' : null)
  const keys = [...(liveKeys.data?.keys ?? []), ...(test.data?.keys ?? [])].filter((k) => keyStatus(k) === 'active')
  const error = test.error ?? liveKeys.error
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
      <div className="mt-5 pr-5">
        {test.loading && !test.data ? (
          <Loading />
        ) : error ? (
          <Notice onRetry={() => (test.reload(), liveKeys.reload())}>{error.message}</Notice>
        ) : keys.length === 0 ? (
          <p className="rounded-3xl bg-tile px-4 py-6 text-center text-sm text-muted">No active keys yet. Create one to call the API.</p>
        ) : null}
      </div>
      {keys.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pr-5 pb-1">
          {keys.map((k) => (
            <Link key={k.id} to="/app/keys" className={cx('relative flex h-36 w-[230px] shrink-0 flex-col justify-between overflow-hidden rounded-3xl p-4 text-white', k.mode === 'live' ? 'bg-[#1b1b1e]' : 'bg-brand-gradient')}>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-[#141416]">{k.mode === 'live' ? 'Live' : 'Test'}</span>
                <KeyRound className="size-5 text-white/80" />
              </div>
              <div>
                <p className="truncate text-xs text-white/70">{k.name}</p>
                <div className="mt-1 flex items-end justify-between">
                  <p className="font-mono text-sm tracking-wide">
                    {k.prefix}•••• {k.last4}
                  </p>
                  <p className="text-right text-[10px] text-white/60">
                    EXP
                    <br />
                    <span className="text-xs text-white">{new Date(k.expires_at).toLocaleDateString('en-GB', { month: '2-digit', year: '2-digit' })}</span>
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  )
}

function UsagePanels({ mode }: { mode: Mode }) {
  const { data, error, loading, reload } = useApi<{ days: DayUsage[] }>(`/api/usage?mode=${mode}&days=30`)
  if (loading && !data) return <Card><Loading /></Card>
  if (error) return <Card><Notice onRetry={reload}>{error.message}</Notice></Card>
  const days = fillDays(data?.days ?? [], 30)
  const t = totals(days)
  const tiles = [
    { label: 'Sessions', value: t.created, icon: ScanFace, brand: true },
    { label: 'Approved', value: t.approved, icon: CheckCircle2 },
    { label: 'In review', value: t.review, icon: Clock3 },
    { label: 'Retakes', value: t.retake, icon: RotateCcw },
  ]
  const recent = days.slice(-14)
  const max = Math.max(4, ...recent.map((d) => d.approved + d.review + d.retake + d.rejected))
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="grid grid-cols-2 gap-3 rounded-[var(--radius-card)] bg-panel p-3">
        {tiles.map((tile) => (
          <div key={tile.label} className={cx('flex min-h-[132px] flex-col justify-between rounded-3xl p-4', tile.brand ? 'bg-brand-gradient text-white' : 'bg-tile')}>
            <div className="flex items-start justify-between gap-2">
              <p className={cx('text-sm', tile.brand ? 'text-white/90' : 'text-ink')}>{tile.label}</p>
              <span className={cx('grid size-8 place-items-center rounded-full', tile.brand ? 'bg-white/20' : 'bg-panel')}>
                <tile.icon className="size-4" />
              </span>
            </div>
            <div>
              <p className="text-[28px] font-bold tracking-tight">{formatCount(tile.value)}</p>
              <p className={cx('mt-1 text-xs', tile.brand ? 'text-white/80' : 'text-muted')}>Last 30 days</p>
            </div>
          </div>
        ))}
      </div>
      <Card>
        <h2 className="text-lg font-semibold">Decisions</h2>
        <p className="mt-0.5 text-sm text-muted">Last 14 days, {mode} mode</p>
        <div className="mt-4 rounded-3xl bg-tile p-4">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-ink" /> Approved
            </span>
            <span className="flex items-center gap-1.5">
              <span className="hatch-brand size-2.5 rounded-sm" /> Review
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-muted/50" /> Retake or rejected
            </span>
          </div>
          <div className="mt-4 flex h-44 items-end justify-between gap-1">
            {recent.map((d) => {
              const other = d.retake + d.rejected
              return (
                <div key={d.day} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${d.day}: ${d.approved} approved, ${d.review} review, ${other} retake or rejected`}>
                  <div className="flex h-[calc(100%-1.25rem)] w-full max-w-6 flex-col justify-end gap-0.5">
                    {other > 0 && <div className="w-full rounded-md bg-muted/50" style={{ height: `${(other / max) * 100}%` }} />}
                    {d.review > 0 && <div className="hatch-brand w-full rounded-md" style={{ height: `${(d.review / max) * 100}%` }} />}
                    {d.approved > 0 && <div className="w-full rounded-md bg-ink" style={{ height: `${(d.approved / max) * 100}%` }} />}
                    {other + d.review + d.approved === 0 && <div className="h-1 w-full rounded-full bg-line" />}
                  </div>
                  <span className="text-[9px] text-muted">{Number(d.day.slice(8))}</span>
                </div>
              )
            })}
          </div>
        </div>
      </Card>
    </div>
  )
}

function RecentActivity() {
  const { data, error, loading, reload } = useApi<{ activity: Activity[] }>('/api/activity')
  const items = data?.activity.slice(0, 8) ?? []
  return (
    <Card>
      <h2 className="text-lg font-semibold">Recent activity</h2>
      <p className="mt-0.5 text-sm text-muted">Changes made in your organisation. Customer identity details are never shown here.</p>
      {loading && !data ? (
        <Loading />
      ) : error ? (
        <div className="mt-4">
          <Notice onRetry={reload}>{error.message}</Notice>
        </div>
      ) : items.length === 0 ? (
        <Empty>Nothing yet.</Empty>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {items.map((a, i) => (
            <li key={i} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <span>
                <span className="font-semibold">{a.user || 'Assay'}</span> <span className="text-muted">{actionLabel(a.action).replace(/^w/, (c) => c.toLowerCase())}</span>
                {a.detail && <span className="ml-1 font-mono text-xs text-muted">{a.detail}</span>}
              </span>
              <span className="text-xs text-muted">{formatDateTime(a.at)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

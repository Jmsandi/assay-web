// Geneline staff pages: every organisation, live access reviews and balance changes.
import { useState, type FormEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { ArrowLeft, Building2, ChevronRight, Search } from 'lucide-react'
import { Button, Card, Empty, Field, Loading, Modal, Notice, PageHead, Pill, Segmented, inputClass } from '../components/ui'
import { actionLabel, api, ApiError, fillDays, liveStatusLabel, roleLabel, totals, useApi, type AdminOrganisation, type AdminStats, type LiveStatus, type OrgSummary } from '../lib/api'
import { cx, formatCount, formatDate, formatDateTime, formatLe } from '../lib/format'

const statusTone = (s: LiveStatus) => (s === 'approved' ? 'ok' : s === 'submitted' ? 'warn' : s === 'rejected' ? 'bad' : 'neutral')
const errorText = (e: unknown) => (e instanceof ApiError ? e.message : 'Something went wrong. Try again.')

function OrgTable({ orgs }: { orgs: OrgSummary[] }) {
  if (orgs.length === 0) return <Empty>No organisations match.</Empty>
  return (
    <div className="mt-4 overflow-x-auto rounded-3xl border border-line">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-tile text-muted">
          <tr>
            <th className="py-3 pl-4 font-medium">Organisation</th>
            <th className="py-3 font-medium">Owner</th>
            <th className="py-3 font-medium">Live access</th>
            <th className="py-3 text-right font-medium">Balance</th>
            <th className="py-3 font-medium">Joined</th>
            <th className="w-10 py-3" />
          </tr>
        </thead>
        <tbody>
          {orgs.map((o) => (
            <tr key={o.id} className="border-t border-line hover:bg-tile/60">
              <td className="py-3.5 pl-4">
                <Link to={`/admin/organisations/${o.id}`} className="font-semibold hover:underline">
                  {o.name}
                </Link>
                <p className="font-mono text-xs text-muted">{o.partner_id}</p>
              </td>
              <td className="py-3.5">
                <p>{o.owner_name}</p>
                <p className="text-xs text-muted">{o.owner_email}</p>
              </td>
              <td className="py-3.5">
                <span className="flex flex-wrap gap-1">
                  <Pill tone={statusTone(o.live_status)}>{liveStatusLabel[o.live_status]}</Pill>
                  {o.live_suspended && <Pill tone="bad">Paused</Pill>}
                </span>
              </td>
              <td className="py-3.5 text-right font-medium whitespace-nowrap">{formatLe(o.balance_cents)}</td>
              <td className="py-3.5 whitespace-nowrap text-muted">{formatDate(o.created_at)}</td>
              <td className="py-3.5 pr-3">
                <Link to={`/admin/organisations/${o.id}`} aria-label={`Open ${o.name}`} className="grid size-8 place-items-center rounded-full text-muted hover:bg-tile">
                  <ChevronRight className="size-4" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function AdminOverview() {
  const { data, error, loading, reload } = useApi<{ stats: AdminStats; pending: OrgSummary[]; price_cents: number }>('/api/admin/overview')
  if (error) return <Notice onRetry={reload}>{error.message}</Notice>
  if (loading && !data) return <Loading />
  if (!data) return null
  const s = data.stats
  const tiles = [
    { label: 'Organisations', value: formatCount(s.organisations), note: `${formatCount(s.signups_last_30_days)} new in 30 days` },
    { label: 'Live access to review', value: formatCount(s.live_pending), note: `${formatCount(s.live_approved)} approved` },
    { label: 'Balances held', value: formatLe(s.balance_total_cents), note: `${formatCount(s.suspended)} paused for no balance` },
    { label: 'Charged verifications', value: formatCount(s.charges_last_30_days), note: `last 30 days · ${formatLe(s.charges_total_cents)} in total` },
  ]
  return (
    <div className="rise">
      <PageHead title="Staff overview" subtitle={`All Assay organisations. Price per live verification: ${data.price_cents > 0 ? formatLe(data.price_cents) : 'not set'}.`} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label} className="p-5">
            <p className="text-sm text-muted">{t.label}</p>
            <p className="mt-2 text-2xl font-bold">{t.value}</p>
            <p className="mt-1 text-xs text-muted">{t.note}</p>
          </Card>
        ))}
      </div>
      <Card className="mt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Waiting for a live access decision</h2>
          <Link to="/admin/organisations" className="rounded-full bg-tile px-4 py-2 text-sm font-semibold hover:bg-line">
            All organisations
          </Link>
        </div>
        {data.pending.length === 0 ? <Empty>Nothing to review.</Empty> : <OrgTable orgs={data.pending} />}
      </Card>
    </div>
  )
}

export function AdminOrganisations() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const status = (params.get('status') ?? '') as '' | LiveStatus
  const [text, setText] = useState(q)
  const query = new URLSearchParams()
  if (q) query.set('q', q)
  if (status) query.set('status', status)
  const { data, error, loading, reload } = useApi<{ organisations: OrgSummary[] }>(`/api/admin/organisations?${query}`)
  const set = (next: { q?: string; status?: string }) => {
    const p = new URLSearchParams(params)
    for (const [k, v] of Object.entries(next)) v ? p.set(k, v) : p.delete(k)
    setParams(p, { replace: true })
  }
  return (
    <div className="rise">
      <PageHead title="Organisations" subtitle="Search by name, partner ID or owner email." />
      <Card>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <form
            className="flex flex-1 gap-2 lg:max-w-md"
            onSubmit={(e) => {
              e.preventDefault()
              set({ q: text.trim() })
            }}
          >
            <label className="flex flex-1 items-center gap-2 rounded-full border border-line px-4 py-2.5">
              <Search className="size-4 text-muted" />
              <input value={text} onChange={(e) => setText(e.target.value)} maxLength={100} placeholder="Search" aria-label="Search organisations" className="w-full bg-transparent text-sm outline-none placeholder:text-muted" />
            </label>
            <Button type="submit" variant="light" className="py-2.5">
              Search
            </Button>
          </form>
          <Segmented
            label="Live access"
            value={status || 'all'}
            onChange={(v) => set({ status: v === 'all' ? '' : v })}
            options={[
              { value: 'all', label: 'All' },
              { value: 'submitted', label: 'In review' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Declined' },
              { value: 'not_started', label: 'Test only' },
            ]}
          />
        </div>
        {error ? (
          <div className="mt-4">
            <Notice onRetry={reload}>{error.message}</Notice>
          </div>
        ) : loading && !data ? (
          <Loading />
        ) : (
          <OrgTable orgs={data?.organisations ?? []} />
        )}
      </Card>
    </div>
  )
}

export function AdminOrganisation() {
  const { id = '' } = useParams()
  const { data, error, loading, reload } = useApi<AdminOrganisation>(`/api/admin/organisations/${encodeURIComponent(id)}`)
  const [deciding, setDeciding] = useState<'approve' | 'reject' | null>(null)
  const [crediting, setCrediting] = useState(false)
  if (error)
    return (
      <div className="rise">
        <BackLink />
        <Notice onRetry={error.code === 'not_found' ? undefined : reload}>{error.code === 'not_found' ? 'This organisation does not exist.' : error.message}</Notice>
      </div>
    )
  if (loading && !data) return <Loading />
  if (!data) return null
  const o = data.organisation
  const lr = data.live_request
  const usage = (['test', 'live'] as const).map((m) => ({ mode: m, days: data.usage[m], t: data.usage[m] ? totals(fillDays(data.usage[m]!, 30)) : null }))
  return (
    <div className="rise">
      <BackLink />
      <PageHead
        title={o.name}
        subtitle={`${o.partner_id} · joined ${formatDate(o.created_at)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="light" onClick={() => setCrediting(true)}>
              Adjust balance
            </Button>
            {o.live_status !== 'approved' && (
              <Button onClick={() => setDeciding('approve')}>Approve live access</Button>
            )}
          </div>
        }
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <p className="text-sm text-muted">Balance</p>
          <p className="mt-2 text-3xl font-bold">{formatLe(o.balance_cents)}</p>
          <p className="mt-2 text-sm text-muted">{o.live_suspended ? 'Live paused: no balance' : 'Live not paused'}</p>
        </Card>
        {usage.map((u) => (
          <Card key={u.mode}>
            <p className="text-sm text-muted">{u.mode === 'live' ? 'Live' : 'Test'} sessions, 30 days</p>
            {u.t ? (
              <>
                <p className="mt-2 text-3xl font-bold">{formatCount(u.t.created)}</p>
                <p className="mt-2 text-sm text-muted">
                  {u.t.approved} approved · {u.t.review} review · {u.t.retake} retake · {u.t.rejected} rejected
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">Usage unavailable right now.</p>
            )}
          </Card>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Live access</h2>
            <Pill tone={statusTone(lr.status)}>{liveStatusLabel[lr.status]}</Pill>
          </div>
          {lr.requested_at ? (
            <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              {[
                ['Registration number', lr.details.registration_number],
                ['Website', lr.details.website],
                ['Monthly volume', lr.details.monthly_volume],
                ['Contact', lr.details.contact],
                ['Requested', formatDateTime(lr.requested_at)],
                ['Decided', lr.decided_at ? formatDateTime(lr.decided_at) : '—'],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-muted">{k}</dt>
                  <dd className="mt-0.5 break-words font-medium">{v || '—'}</dd>
                </div>
              ))}
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted">Use case</dt>
                <dd className="mt-0.5 whitespace-pre-wrap">{lr.details.use_case || '—'}</dd>
              </div>
              {lr.note && (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted">Note</dt>
                  <dd className="mt-0.5">{lr.note}</dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="mt-3 text-sm text-muted">No request yet. You can still approve them directly.</p>
          )}
          {o.live_status === 'submitted' && (
            <div className="mt-5 flex gap-2">
              <Button onClick={() => setDeciding('approve')}>Approve</Button>
              <Button variant="ghost" className="text-bad" onClick={() => setDeciding('reject')}>
                Decline
              </Button>
            </div>
          )}
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Members</h2>
          <ul className="mt-3 divide-y divide-line">
            {data.members.map((m) => (
              <li key={m.email} className="flex items-center justify-between gap-2 py-3 text-sm">
                <span className="min-w-0">
                  <span className="block font-semibold">{m.name}</span>
                  <span className="block truncate text-xs text-muted">{m.email}</span>
                </span>
                <Pill>{roleLabel[m.role]}</Pill>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">Ledger</h2>
          {!data.entries?.length ? (
            <Empty>No entries.</Empty>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {data.entries.slice(0, 20).map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{e.description || e.kind}</span>
                    <span className="block text-xs text-muted">{formatDateTime(e.at)}</span>
                  </span>
                  <span className={cx('font-semibold whitespace-nowrap', e.amount_cents > 0 ? 'text-ok' : 'text-ink')}>
                    {e.amount_cents > 0 ? '+' : '−'}
                    {formatLe(Math.abs(e.amount_cents))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Activity</h2>
          {data.activity.length === 0 ? (
            <Empty>Nothing yet.</Empty>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {data.activity.slice(0, 20).map((a, i) => (
                <li key={i} className="py-3 text-sm">
                  <span className="font-semibold">{a.user || 'Assay'}</span> <span className="text-muted">{actionLabel(a.action).replace(/^w/, (c) => c.toLowerCase())}</span>
                  {a.detail && <span className="ml-1 text-xs text-muted">({a.detail})</span>}
                  <span className="block text-xs text-muted">{formatDateTime(a.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {deciding && <DecideModal org={o} decision={deciding} onClose={() => setDeciding(null)} onDone={() => (setDeciding(null), reload())} />}
      {crediting && <CreditModal org={o} onClose={() => setCrediting(false)} onDone={() => (setCrediting(false), reload())} />}
    </div>
  )
}

function BackLink() {
  return (
    <Link to="/admin/organisations" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
      <ArrowLeft className="size-4" /> Organisations
    </Link>
  )
}

function DecideModal({ org, decision, onClose, onDone }: { org: OrgSummary; decision: 'approve' | 'reject'; onClose: () => void; onDone: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setBusy(true)
    setError('')
    try {
      await api('POST', `/api/admin/organisations/${org.id}/live`, {
        decision,
        note: String(f.get('note') ?? '').trim(),
        requests_per_minute: decision === 'approve' ? Number(f.get('rpm')) : 0,
      })
      onDone()
    } catch (err) {
      setError(errorText(err))
      setBusy(false)
    }
  }
  return (
    <Modal title={decision === 'approve' ? `Approve live access for ${org.name}` : `Decline ${org.name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && <Notice>{error}</Notice>}
        {decision === 'approve' ? (
          <>
            <p className="text-sm text-muted">This creates their live account. Live verifications stay paused until their balance is above zero.</p>
            <Field label="Requests per minute" hint="Between 1 and 600.">
              <input name="rpm" type="number" min={1} max={600} required defaultValue={120} className={inputClass} />
            </Field>
            <Field label="Note (optional)">
              <input name="note" maxLength={500} className={inputClass} />
            </Field>
          </>
        ) : (
          <Field label="Reason" hint="The business sees this and can ask again.">
            <textarea name="note" required maxLength={500} rows={3} className={inputClass} />
          </Field>
        )}
        <Button type="submit" className={cx('w-full', decision === 'reject' && 'bg-bad text-white hover:bg-bad')} disabled={busy}>
          {decision === 'approve' ? 'Approve' : 'Decline'}
        </Button>
      </form>
    </Modal>
  )
}

function CreditModal({ org, onClose, onDone }: { org: OrgSummary; onClose: () => void; onDone: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const cents = Math.round(Number(f.get('amount')) * 100)
    if (!cents) {
      setError('Enter an amount other than zero.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await api('POST', `/api/admin/organisations/${org.id}/credit`, { amount_cents: cents, note: String(f.get('note')).trim() })
      onDone()
    } catch (err) {
      setError(errorText(err))
      setBusy(false)
    }
  }
  return (
    <Modal title={`Adjust balance: ${org.name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && <Notice>{error}</Notice>}
        <p className="text-sm text-muted">
          Current balance <span className="font-semibold text-ink">{formatLe(org.balance_cents)}</span>. A negative amount takes credit away. Every change is a new ledger entry.
        </p>
        <Field label="Amount (Le)">
          <input name="amount" type="number" step="0.01" required className={inputClass} placeholder="e.g. 5000 or -250" />
        </Field>
        <Field label="Reason" hint="Shown on the business's statement.">
          <input name="note" required maxLength={200} className={inputClass} placeholder="e.g. Bank transfer received" />
        </Field>
        <Button type="submit" className="w-full" disabled={busy}>
          <Building2 className="size-4" /> Save
        </Button>
      </form>
    </Modal>
  )
}

import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Check, Copy } from 'lucide-react'
import { MarketingFooter, MarketingHeader } from './Landing'

const BASE = 'https://assay.geneline-x.net'

const sections = [
  { id: 'overview', title: 'Overview' },
  { id: 'keys', title: 'API keys and modes' },
  { id: 'create', title: '1. Create a session' },
  { id: 'link', title: '2. Send the link' },
  { id: 'webhooks', title: '3. Receive the webhook' },
  { id: 'result', title: '4. Read the result' },
  { id: 'decisions', title: 'Acting on decisions' },
  { id: 'idempotency', title: 'Idempotency' },
  { id: 'errors', title: 'Errors and limits' },
  { id: 'usage', title: 'Usage' },
  { id: 'checklist', title: 'Go-live checklist' },
]

function Code({ children, lang }: { children: string; lang?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="relative mt-4 overflow-hidden rounded-2xl bg-[#17181b] text-[13px] text-white/90">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-[11px] text-white/50">
        <span>{lang ?? ''}</span>
        <button
          onClick={() => navigator.clipboard?.writeText(children).then(() => (setCopied(true), setTimeout(() => setCopied(false), 1500)))}
          className="inline-flex items-center gap-1 rounded-full px-2 py-1 hover:bg-white/10"
          aria-label="Copy code"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 leading-6">
        <code>{children}</code>
      </pre>
    </div>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-line pt-10 pb-4 first:border-t-0 first:pt-0">
      <h2 className="text-2xl font-extrabold tracking-tight">{title}</h2>
      <div className="mt-4 space-y-4 text-[15px] leading-7 text-muted [&_code]:rounded [&_code]:bg-tile [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px] [&_code]:text-ink [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit [&_strong]:text-ink">
        {children}
      </div>
    </section>
  )
}

function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead className="border-b border-line text-ink">
          <tr>
            {head.map((h) => (
              <th key={h} className="py-2 pr-4 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-line align-top">
              {r.map((c, j) => (
                <td key={j} className="py-2.5 pr-4">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Docs() {
  return (
    <div className="min-h-dvh overflow-x-hidden">
      <MarketingHeader />
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="section-kicker">DEVELOPERS</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">Integration guide</h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-muted">
          Verify a customer in four steps: create a session from your server, send the customer the link, receive a webhook when the decision is ready, then read the result.
        </p>

        <div className="mt-12 grid gap-12 lg:grid-cols-[220px_minmax(0,1fr)]">
          <nav aria-label="On this page" className="lg:sticky lg:top-24 lg:self-start">
            <p className="text-xs font-bold tracking-widest text-muted">ON THIS PAGE</p>
            <ul className="mt-3 space-y-1.5 text-sm">
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-muted hover:text-ink">
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <article className="min-w-0 max-w-3xl space-y-6">
            <Section id="overview" title="Overview">
              <p>
                All requests go to <code>{BASE}</code> over HTTPS and return JSON. Call the API only from your server: keys must never be in a mobile app, a browser or a public repository.
              </p>
              <p>
                The customer completes the identity checks (ID card front and back, selfie, a short head movement) in Assay&apos;s hosted capture page on their own phone. Your system never handles the photos, and this portal never shows them.
              </p>
              <Table
                head={['Step', 'Who', 'What happens']}
                rows={[
                  ['1', 'Your server', <>Creates a session with <code>POST /v1/sessions</code> and gets a <code>capture_url</code>.</>],
                  ['2', 'Your product', 'Sends the link to the customer (SMS, WhatsApp, app, in branch).'],
                  ['3', 'Assay', 'Checks the ID, face match and liveness, then calls your webhook.'],
                  ['4', 'Your server', <>Reads the decision with <code>GET /v1/sessions/&#123;id&#125;</code> and continues onboarding.</>],
                ]}
              />
            </Section>

            <Section id="keys" title="API keys and modes">
              <p>
                Create keys in the dashboard under <Link to="/app/keys" className="font-semibold text-brand-600">API keys</Link>. The full key is shown once; store it in your secret manager. Send it as a bearer token on every request:
              </p>
              <Code lang="http">{`Authorization: Bearer sk_test_...`}</Code>
              <Table
                head={['Mode', 'Key prefix', 'Use']}
                rows={[
                  ['Test', <code key="t">sk_test_</code>, 'Free. Build and try your integration; test data is kept apart from live data.'],
                  ['Live', <code key="l">sk_live_</code>, 'Real customers, charged from your prepaid balance. Available after live access is approved.'],
                ]}
              />
              <p>
                Optionally restrict a key to your servers&apos; IP ranges when you create it. Keys expire (30 days to 1 year); create the new key before the old one expires, switch, then revoke the old one.
              </p>
            </Section>

            <Section id="create" title="1. Create a session">
              <p>
                Every <code>POST</code> needs an <code>Idempotency-Key</code> header (see <a href="#idempotency" className="font-semibold text-brand-600">Idempotency</a>). The body may be empty, or carry your own reference for the customer:
              </p>
              <Code lang="bash">{`curl -X POST ${BASE}/v1/sessions \\
  -H "Authorization: Bearer $ASSAY_KEY" \\
  -H "Idempotency-Key: signup-8f14e45f" \\
  -H "Content-Type: application/json" \\
  -d '{"customer_reference": "cust_10293"}'`}</Code>
              <Code lang="json">{`{
  "session": {
    "id": "ses_3c1d9a7e-41b2-4f0e-9d6a-1e2f7c8b5a01",
    "status": "created",
    "attempt": 1,
    "decision": "",
    "risk_score": 0,
    "reasons": [],
    "created_at": "2026-11-14T10:00:00Z"
  },
  "capture_url": "${BASE}/#t=lnk_...",
  "capture_token": "cap_...",
  "capture_expires_at": "2026-11-14T10:15:00Z",
  "challenge": { "id": "...", "action": "head_turn_both" }
}`}</Code>
              <p>
                Save <code>session.id</code> against your customer. <code>customer_reference</code> is optional: an identifier from your own system (letters, digits and <code>_ . : @ -</code>, up to 128 characters). Assay stores only a keyed hash of it, so a returning customer is recognised rather than flagged as a duplicate. Never put a phone number, email or ID number in it.
              </p>
              <p>
                <code>capture_token</code> and <code>challenge</code> are for partners who build their own capture app. With the hosted link you can ignore them; never send the capture token to anyone but the customer&apos;s capture session.
              </p>
            </Section>

            <Section id="link" title="2. Send the link">
              <p>
                Send <code>capture_url</code> to the customer. It opens Assay&apos;s capture page in the phone&apos;s browser, with no app to install. The customer gives consent, photographs both sides of their ID and takes a selfie with a short head movement.
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>The link opens once and expires at <code>capture_expires_at</code>. If it expires unused, create a new session.</li>
                <li>Open it on the customer&apos;s phone, not on a shared or office device.</li>
                <li>Show the customer what to expect: good light, their physical ID card, about two minutes.</li>
              </ul>
            </Section>

            <Section id="webhooks" title="3. Receive the webhook">
              <p>
                Set your webhook URL in the dashboard under <Link to="/app/webhooks" className="font-semibold text-brand-600">Webhooks</Link> (one per mode, HTTPS only). Saving gives you a signing secret starting <code>whsec_</code>, shown once. When a decision is ready, Assay sends:
              </p>
              <Code lang="http">{`POST /your/webhook/path
Content-Type: application/json
X-Webhook-ID: 4b0f...
X-Webhook-Signature: t=1763114400,v1=5257a869e7ecebeda32affa62cdca3fa51cad7e77a0e56ff536d0ce8e108d8bd

{"session_id": "ses_3c1d9a7e-41b2-4f0e-9d6a-1e2f7c8b5a01"}`}</Code>
              <p>
                The body holds only the session ID, never personal data. <strong>Verify the signature before trusting it</strong>: compute HMAC-SHA256 with your secret over <code>timestamp + &quot;.&quot; + raw body</code>, compare it in constant time with <code>v1</code>, and reject timestamps older than five minutes.
              </p>
              <Code lang="javascript (Node.js, Express)">{`import crypto from 'node:crypto'
import express from 'express'

const app = express()
const secret = process.env.ASSAY_WEBHOOK_SECRET // whsec_...

// Use the raw body: re-serialised JSON will not match the signature.
app.post('/assay/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const header = req.get('X-Webhook-Signature') ?? ''
  const { t, v1 } = Object.fromEntries(header.split(',').map((p) => p.split('=')))
  const expected = crypto.createHmac('sha256', secret).update(t + '.').update(req.body).digest('hex')
  const fresh = Math.abs(Date.now() / 1000 - Number(t)) < 300
  const ok = fresh && v1?.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(expected))
  if (!ok) return res.sendStatus(400)

  const { session_id } = JSON.parse(req.body.toString('utf8'))
  res.sendStatus(200)            // answer quickly...
  await handleSession(session_id) // ...then fetch the result (step 4)
})`}</Code>
              <Code lang="python">{`import hashlib, hmac, json, time

def verify(secret: str, header: str, body: bytes) -> bool:
    parts = dict(p.split("=", 1) for p in header.split(","))
    t, v1 = parts.get("t", ""), parts.get("v1", "")
    if not t.isdigit() or abs(time.time() - int(t)) > 300:
        return False
    expected = hmac.new(secret.encode(), t.encode() + b"." + body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, v1)`}</Code>
              <ul className="list-disc space-y-1 pl-5">
                <li>Answer with any 2xx status within 10 seconds. Anything else is retried, so handle the same <code>X-Webhook-ID</code> more than once safely.</li>
                <li>Webhooks may arrive out of order or more than once. Always read the session (step 4) for the current state.</li>
                <li>If your endpoint was down, or as a fallback, poll <code>GET /v1/sessions/&#123;id&#125;</code> for sessions you are waiting on.</li>
              </ul>
            </Section>

            <Section id="result" title="4. Read the result">
              <Code lang="bash">{`curl ${BASE}/v1/sessions/ses_3c1d9a7e-41b2-4f0e-9d6a-1e2f7c8b5a01 \\
  -H "Authorization: Bearer $ASSAY_KEY"`}</Code>
              <Code lang="json">{`{
  "id": "ses_3c1d9a7e-41b2-4f0e-9d6a-1e2f7c8b5a01",
  "status": "decided",
  "attempt": 1,
  "decision": "review",
  "risk_score": 42,
  "reasons": ["face_mismatch"],
  "created_at": "2026-11-14T10:00:00Z"
}`}</Code>
              <Table
                head={['Field', 'Meaning']}
                rows={[
                  [<code key="s">status</code>, <>created, captured, processing, <strong>decided</strong>, expired or abandoned.</>],
                  [<code key="d">decision</code>, <>Empty until decided; then approve, review, retake or reject.</>],
                  [<code key="r">reasons</code>, 'Codes explaining the decision (see below). Log them; show customers your own wording.'],
                  [<code key="k">risk_score</code>, '0 (low) to 100 (high). Informational; act on the decision.'],
                  [<code key="a">attempt</code>, 'Which capture attempt this is (1 to 3).'],
                ]}
              />
              <p>The response never contains ID details or images.</p>
            </Section>

            <Section id="decisions" title="Acting on decisions">
              <Table
                head={['Decision', 'What to do']}
                rows={[
                  [<strong key="a">approve</strong>, 'All checks passed. Continue onboarding.'],
                  [<strong key="v">review</strong>, 'A person needs to look. Hold the customer in a pending state; the session updates when the review is done and you get another webhook.'],
                  [<strong key="t">retake</strong>, <>The photos or video could not be used (blur, glare, no head turn). Call <code key="r">POST /v1/sessions/&#123;id&#125;/retake</code> (with an Idempotency-Key and body <code key="b">&#123;&#125;</code>): it returns a new <code key="u">capture_url</code> for the same session. Up to 3 attempts; after that, create a new session.</>],
                  [<strong key="j">reject</strong>, 'Do not onboard. Do not tell the customer which check failed.'],
                ]}
              />
              <p>Common reason codes:</p>
              <Table
                head={['Code', 'Meaning']}
                rows={[
                  ['image_quality_low, image_unreadable', 'Photo too blurry, dark or cropped.'],
                  ['challenge_failed, liveness_failed', 'The head movement was not completed or the selfie did not look live.'],
                  ['face_mismatch', 'The selfie does not match the ID portrait.'],
                  ['tamper_detected, capture_integrity_suspicious', 'Signs the ID or the capture was altered.'],
                  ['nin_unreadable, cross_check_mismatch', 'The ID number could not be read, or the two sides disagree.'],
                  ['ncra_unavailable, ncra_required', 'The national registry check could not run; the case goes to review.'],
                  ['*_unavailable', 'A check was temporarily unavailable; the case goes to review rather than failing.'],
                ].map(([c, m]) => [<code key="c">{c}</code>, m])}
              />
            </Section>

            <Section id="idempotency" title="Idempotency">
              <p>
                Every <code>POST</code> needs an <code>Idempotency-Key</code> header, 8 to 128 characters, unique per action (for example your own signup ID). If a request times out, retry with the <strong>same key and same body</strong>: you get the original result instead of a second session. Reusing a key with a different body returns <code>409 idempotency_key_reused</code>.
              </p>
            </Section>

            <Section id="errors" title="Errors and limits">
              <p>
                Errors use <code>application/problem+json</code>. Branch on <code>code</code>, and quote <code>request_id</code> when you contact support.
              </p>
              <Code lang="json">{`{
  "type": "about:blank",
  "title": "Unauthorized",
  "status": 401,
  "code": "unauthorized",
  "request_id": "0b5d3c1e-6f0a-4a7b-9d1c-2e3f4a5b6c7d"
}`}</Code>
              <Table
                head={['Status', 'Meaning', 'What to do']}
                rows={[
                  ['400', 'Invalid request', 'Fix the request; do not retry unchanged.'],
                  ['401', 'Missing, wrong, expired or revoked key', 'Check the key and mode.'],
                  ['403', 'Not allowed (IP range, live paused for no balance)', 'Check key IP ranges; top up if live is paused.'],
                  ['404', 'Session not found in this mode', 'Test and live sessions are separate.'],
                  ['409', 'Conflict (idempotency key reused, wrong state)', 'Use a new key for a new action.'],
                  ['429', 'Rate limited', <>Wait for the <code key="r">Retry-After</code> seconds, then retry.</>],
                  ['5xx', 'Temporary problem', 'Retry with backoff and the same Idempotency-Key.'],
                ]}
              />
              <p>Each key has a per-minute request limit (test keys 60 a minute). Ask us if you need more for live traffic.</p>
            </Section>

            <Section id="usage" title="Usage">
              <p>
                <code>GET /v1/usage</code> returns your counts for the key&apos;s mode (<code>sessions_created</code>, <code>sessions_decided</code>, <code>api_calls</code>). Daily figures, charges and your balance are in the dashboard under{' '}
                <Link to="/app/verifications" className="font-semibold text-brand-600">
                  Verifications
                </Link>{' '}
                and{' '}
                <Link to="/app/billing" className="font-semibold text-brand-600">
                  Billing
                </Link>
                . Each live session is charged once, on its first decision; retakes are not charged again and test mode is free.
              </p>
            </Section>

            <Section id="checklist" title="Go-live checklist">
              <ul className="space-y-2">
                {[
                  'Live access approved (Settings → Live access) and balance topped up.',
                  'Live key created, stored in a secret manager, limited to your server IPs.',
                  'Live webhook URL set; signature checked; duplicates handled.',
                  'Idempotency-Key sent on every POST and reused on retries.',
                  'Each decision handled: approve, review (pending), retake (new link), reject.',
                  'Polling fallback for sessions with no webhook after a few minutes.',
                  'No keys, capture tokens or reason codes shown to customers.',
                ].map((t) => (
                  <li key={t} className="flex gap-3">
                    <Check className="mt-1 size-4 shrink-0 text-ok" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <p>
                Questions? Contact Geneline-X support with your partner ID (Settings → Organisation) and the <code>request_id</code> of the request.
              </p>
            </Section>
          </article>
        </div>
      </div>
      <MarketingFooter />
    </div>
  )
}

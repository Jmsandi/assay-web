import { useState } from 'react'
import { Link } from 'react-router'
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  Code2,
  Fingerprint,
  IdCard,
  Landmark,
  Lock,
  Menu,
  ScanFace,
  ShieldCheck,
  Smartphone,
  Timer,
  Trash2,
  Webhook,
  X,
  Zap,
} from 'lucide-react'
import { Logo } from '../components/ui'
import { cx } from '../lib/format'

const nav = [
  { href: '#product', label: 'Product' },
  { href: '#how', label: 'How it works' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#security', label: 'Security' },
]

function Header() {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 border-b border-transparent bg-page/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 rounded-full bg-panel p-1.5 md:flex" aria-label="Main">
          {nav.map((n) => (
            <a key={n.href} href={n.href} className="rounded-full px-4 py-2 text-sm font-medium text-muted transition hover:bg-tile hover:text-ink">
              {n.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Link to="/login" className="rounded-full px-4 py-2.5 text-sm font-semibold text-ink hover:bg-panel">
            Log in
          </Link>
          <Link to="/signup" className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-panel hover:bg-ink-soft">
            Get started
          </Link>
        </div>
        <button className="grid size-10 place-items-center rounded-full bg-panel md:hidden" onClick={() => setOpen((o) => !o)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <div className="mx-4 mb-4 rounded-3xl bg-panel p-3 shadow-[var(--shadow-float)] md:hidden">
          {nav.map((n) => (
            <a key={n.href} href={n.href} onClick={() => setOpen(false)} className="block rounded-2xl px-4 py-3 text-sm font-medium hover:bg-tile">
              {n.label}
            </a>
          ))}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Link to="/login" className="rounded-full bg-tile px-4 py-3 text-center text-sm font-semibold">
              Log in
            </Link>
            <Link to="/signup" className="rounded-full bg-ink px-4 py-3 text-center text-sm font-semibold text-panel">
              Get started
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

/** The capture flow on a phone, with result cards floating around it. */
function HeroVisual() {
  return (
    <div className="relative mx-auto h-[460px] w-full max-w-[420px] sm:h-[520px]">
      <div className="bg-brand-gradient absolute inset-x-6 top-10 bottom-6 rounded-[44px] opacity-90" aria-hidden="true" />
      <div className="absolute inset-x-6 top-10 bottom-6 rounded-[44px] bg-[radial-gradient(circle_at_30%_20%,rgb(255_255_255/0.35),transparent_55%)]" aria-hidden="true" />

      {/* Phone */}
      <div className="float-slower absolute top-0 left-1/2 w-[230px] -translate-x-1/2 rounded-[38px] border-[7px] border-[#141416] bg-[#141416] shadow-2xl sm:w-[250px]">
        <div className="overflow-hidden rounded-[31px] bg-white">
          <div className="flex items-center justify-between px-5 pt-3 pb-2 text-[10px] font-semibold text-[#141416]">
            <span>9:41</span>
            <span className="h-4 w-16 rounded-full bg-[#141416]" />
            <span>5G</span>
          </div>
          <div className="px-4 pb-5">
            <p className="text-[11px] font-semibold text-[#e14d1c]">Step 2 of 3</p>
            <p className="mt-1 text-base leading-tight font-bold text-[#141416]">Photograph the front of your ID</p>
            <div className="relative mt-3 aspect-[1.58] rounded-2xl bg-[#1f1f23] p-3">
              <div className="absolute inset-2 rounded-xl border-2 border-dashed border-white/50" />
              <div className="relative flex h-full gap-2 rounded-lg bg-gradient-to-br from-[#e8edf5] to-[#cfd8e6] p-2">
                <div className="grid w-1/3 place-items-center rounded-md bg-[#b6c2d4]">
                  <ScanFace className="size-6 text-[#5d6b82]" />
                </div>
                <div className="flex-1 space-y-1.5 pt-1">
                  <div className="h-1.5 w-4/5 rounded bg-[#9aa8bd]" />
                  <div className="h-1.5 w-3/5 rounded bg-[#9aa8bd]" />
                  <div className="h-1.5 w-2/3 rounded bg-[#9aa8bd]" />
                  <div className="h-1.5 w-1/2 rounded bg-[#9aa8bd]" />
                </div>
              </div>
            </div>
            <div className="mt-3 flex gap-1.5">
              {['Sharp', 'No glare', 'Well lit'].map((t) => (
                <span key={t} className="flex items-center gap-1 rounded-full bg-[#e7f6ec] px-2 py-1 text-[9px] font-semibold text-[#17a34a]">
                  <Check className="size-2.5" />
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-4 rounded-full bg-[#141416] py-2.5 text-center text-xs font-semibold text-white">Take photo</div>
          </div>
        </div>
      </div>

      {/* Floating results */}
      <div className="float-slow absolute top-24 -left-2 w-44 rounded-2xl bg-white p-3 shadow-[var(--shadow-float)] sm:-left-6">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-full bg-[#e7f6ec] text-[#17a34a]">
            <ScanFace className="size-4" />
          </span>
          <div>
            <p className="text-[11px] text-[#6f7178]">Face match</p>
            <p className="text-sm font-bold text-[#141416]">Strong match</p>
          </div>
        </div>
      </div>
      <div className="float-slower absolute top-56 -right-1 w-44 rounded-2xl bg-white p-3 shadow-[var(--shadow-float)] sm:-right-6">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-full bg-[#fff3ee] text-[#e14d1c]">
            <Fingerprint className="size-4" />
          </span>
          <div>
            <p className="text-[11px] text-[#6f7178]">Liveness</p>
            <p className="text-sm font-bold text-[#141416]">Head turn passed</p>
          </div>
        </div>
      </div>
      <div className="float-slow absolute bottom-0 left-1/2 w-60 -translate-x-1/2 rounded-2xl bg-[#141416] p-3.5 text-white shadow-[var(--shadow-float)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-white/60">Decision</p>
            <p className="text-base font-bold">Approved</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-white/60">Time</p>
            <p className="text-base font-bold">1.1 s</p>
          </div>
          <span className="grid size-9 place-items-center rounded-full bg-[#17a34a]">
            <BadgeCheck className="size-5" />
          </span>
        </div>
      </div>
    </div>
  )
}

function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-8 pb-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-14">
      <div className="rise">
        <span className="inline-flex items-center gap-2 rounded-full bg-panel px-3 py-1.5 text-xs font-semibold text-muted">
          <span className="size-1.5 rounded-full bg-brand-500" />
          ID verification for Sierra Leone
        </span>
        <h1 className="mt-5 text-4xl leading-[1.08] font-extrabold tracking-tight sm:text-5xl lg:text-[56px]">
          Know who your customers are, <span className="squiggle">in seconds.</span>
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
          Assay checks a national ID card, matches the face to the holder and confirms a real person is on camera, through one API. Send your customer a link, get the decision by webhook.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/signup" className="bg-brand-gradient inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white shadow-[0_12px_24px_-10px_rgb(242_100_48/0.8)] hover:brightness-105">
            Start free in test mode
            <ArrowRight className="size-4" />
          </Link>
          <a href="#how" className="inline-flex items-center justify-center gap-2 rounded-full bg-panel px-6 py-3.5 text-sm font-semibold hover:bg-white/70">
            <Code2 className="size-4" />
            See how it works
          </a>
        </div>
        <p className="mt-5 flex items-center gap-2 text-xs text-muted">
          <ShieldCheck className="size-4 text-ok" />
          No card needed for test mode. Live access after a short business review.
        </p>
      </div>
      <HeroVisual />
    </section>
  )
}

const facts = [
  { value: '1.1 s', label: 'Typical decision time after capture' },
  { value: '3', label: 'Checks in every verification' },
  { value: '30 days', label: 'Then images are deleted automatically' },
  { value: 'Le', label: 'Prepaid in Leones, mobile money top-ups' },
]

function FactsBand() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="bg-brand-gradient grid grid-cols-2 gap-6 rounded-[32px] px-6 py-8 text-white sm:px-10 lg:grid-cols-4">
        {facts.map((f) => (
          <div key={f.label} className="flex items-center gap-3">
            <span className="text-3xl font-extrabold tracking-tight sm:text-4xl">{f.value}</span>
            <span className="max-w-[9rem] text-xs leading-snug text-white/85">{f.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

const checks = [
  { icon: IdCard, title: 'Document check', body: 'Reads the front and back of the national ID card and checks the two agree. Blurry or glare-covered photos are sent back for a retake.' },
  { icon: ScanFace, title: 'Face match', body: 'Compares the selfie with the photo on the card and scores how closely they match.' },
  { icon: Fingerprint, title: 'Liveness', body: 'A short head-turn or blink challenge, checked on our servers, so a printed photo or a screen replay does not pass.' },
]

const extras = [
  { icon: Smartphone, title: 'Hosted capture link', body: 'Guides customers on their own phone. Nothing to build for the camera.' },
  { icon: Webhook, title: 'Webhooks', body: 'Signed notifications the moment a decision is ready.' },
  { icon: Zap, title: 'Test mode', body: 'A full sandbox from the minute you sign up, free.' },
]

function Product() {
  return (
    <section id="product" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Three checks.
          <br />
          One decision.
        </h2>
        <p className="max-w-xl text-muted">
          Every verification runs the same checks and comes back as approve, review, retake or reject, with plain reasons. You decide what to do with each outcome; we never hide behind a single score.
        </p>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {checks.map((c, i) => (
          <article key={c.title} className={cx('rounded-[28px] p-6', i === 0 ? 'bg-ink text-panel' : 'bg-panel')}>
            <span className={cx('grid size-12 place-items-center rounded-2xl', i === 0 ? 'bg-brand-gradient text-white' : 'bg-brand-50 text-brand-600 dark:bg-brand-500/15')}>
              <c.icon className="size-6" />
            </span>
            <h3 className="mt-6 text-lg font-bold">{c.title}</h3>
            <p className={cx('mt-2 text-sm leading-relaxed', i === 0 ? 'text-panel/70' : 'text-muted')}>{c.body}</p>
          </article>
        ))}
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {extras.map((e) => (
          <div key={e.title} className="flex gap-3 rounded-3xl bg-panel p-5">
            <e.icon className="size-5 shrink-0 text-brand-500" />
            <div>
              <h3 className="text-sm font-bold">{e.title}</h3>
              <p className="mt-1 text-sm text-muted">{e.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

const steps = [
  { n: '01', title: 'Create a session', body: 'One API call with your key. You get a capture link for your customer.' },
  { n: '02', title: 'Customer captures', body: 'They open the link on their phone: consent, ID front and back, a short selfie challenge.' },
  { n: '03', title: 'Get the decision', body: 'A signed webhook tells you it is ready; fetch the outcome and reasons.' },
]

function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-24 bg-panel py-20">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-sm font-semibold text-brand-500">How it works</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Live in an afternoon.</h2>
          <ol className="mt-8 space-y-3">
            {steps.map((s) => (
              <li key={s.n} className="flex gap-4 rounded-3xl bg-tile p-5">
                <span className="text-sm font-extrabold text-brand-500">{s.n}</span>
                <div>
                  <h3 className="font-bold">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="overflow-hidden rounded-[28px] bg-[#141416] text-[13px] text-white shadow-[var(--shadow-float)]">
          <div className="flex items-center gap-1.5 border-b border-white/10 px-5 py-3">
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 rounded-full bg-[#28c840]" />
            <span className="ml-3 text-xs text-white/50">Create a session</span>
          </div>
          <pre className="overflow-x-auto p-5 leading-relaxed">
            <code>
              <span className="text-[#ff9b72]">curl</span> -X POST https://assay.geneline-x.net/v1/sessions \{'\n'}
              {'  '}-H <span className="text-[#9fe3b4]">"Authorization: Bearer sk_test_…"</span> \{'\n'}
              {'  '}-H <span className="text-[#9fe3b4]">"Idempotency-Key: 4f1c…"</span> \{'\n'}
              {'  '}-d <span className="text-[#9fe3b4]">'{'{'}"customer_reference":"cust_1042"{'}'}'</span>
              {'\n\n'}
              <span className="text-white/45"># 201 Created</span>
              {'\n'}
              {'{'}
              {'\n  '}"session": {'{'} "id": <span className="text-[#9fe3b4]">"ses_3c1d…"</span>, "status": <span className="text-[#9fe3b4]">"created"</span> {'}'},
              {'\n  '}"capture_url": <span className="text-[#9fe3b4]">"https://assay.geneline-x.net/#t=lnk_…"</span>
              {'\n'}
              {'}'}
            </code>
          </pre>
        </div>
      </div>
    </section>
  )
}

function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-[32px] bg-ink p-8 text-panel sm:p-10">
          <p className="text-sm font-semibold text-brand-300">Pricing</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Pay only for decisions.</h2>
          <p className="mt-4 max-w-md text-panel/70">
            One price per completed verification, shown in your dashboard before you go live. Top up in Leones with Orange Money or Afrimoney; your balance goes down as you verify.
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {['Test mode is free', 'Retakes in a session are free', 'Abandoned sessions are free', 'Outages on our side are free'].map((t) => (
              <li key={t} className="flex items-center gap-2 text-sm">
                <span className="grid size-5 place-items-center rounded-full bg-brand-500 text-white">
                  <Check className="size-3" />
                </span>
                {t}
              </li>
            ))}
          </ul>
          <Link to="/signup" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-[#141416] hover:bg-zinc-200">
            Create an account
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid gap-4">
          {[
            { icon: Smartphone, title: 'Mobile money top-ups', body: 'Orange Money and Afrimoney, receipts for every payment.' },
            { icon: Timer, title: 'Spending cap', body: 'Set a monthly limit so a busy month never surprises you.' },
            { icon: Building2, title: 'Invoices for larger teams', body: 'Monthly invoicing for approved enterprise partners.' },
          ].map((c) => (
            <div key={c.title} className="flex gap-4 rounded-[28px] bg-panel p-6">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15">
                <c.icon className="size-5" />
              </span>
              <div>
                <h3 className="font-bold">{c.title}</h3>
                <p className="mt-1 text-sm text-muted">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const security = [
  { icon: Lock, title: 'Encrypted end to end', body: 'Images are encrypted with keys held in a separate key service, and every image read is logged.' },
  { icon: Trash2, title: 'Deleted after 30 days', body: 'ID photos and selfies are removed automatically. Decisions and reasons stay for your records.' },
  { icon: ShieldCheck, title: 'Your dashboard holds no ID data', body: 'This portal shows counts, outcomes and billing only. Results go straight to your own systems.' },
  { icon: Landmark, title: 'Reviewed partners only', body: 'Live keys are issued after a business check, so the service is not open to anyone with a stolen ID.' },
]

function Security() {
  return (
    <section id="security" className="scroll-mt-24 bg-panel py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-brand-500">Security</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Built for identity data from day one.</h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {security.map((s) => (
            <div key={s.title} className="rounded-[28px] bg-tile p-6">
              <s.icon className="size-6 text-brand-500" />
              <h3 className="mt-5 font-bold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Cta() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="bg-brand-gradient relative overflow-hidden rounded-[36px] px-6 py-14 text-center text-white sm:px-12">
        <div className="absolute -top-20 -right-16 size-64 rounded-full bg-white/10" aria-hidden="true" />
        <div className="absolute -bottom-24 -left-10 size-72 rounded-full bg-black/10" aria-hidden="true" />
        <h2 className="relative mx-auto max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">Make your first test verification today.</h2>
        <p className="relative mx-auto mt-4 max-w-lg text-white/85">Sign up, copy a test key, and send yourself a capture link. It takes about ten minutes.</p>
        <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/signup" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#141416] px-6 py-3.5 text-sm font-semibold text-white hover:bg-black">
            Get started free
            <ArrowRight className="size-4" />
          </Link>
          <Link to="/login" className="inline-flex items-center justify-center rounded-full bg-white/15 px-6 py-3.5 text-sm font-semibold text-white hover:bg-white/25">
            Log in
          </Link>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <Logo />
          <p className="mt-3 text-sm text-muted">ID verification for Sierra Leone. A Geneline-X product.</p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted" aria-label="Footer">
          <a href="#product" className="hover:text-ink">Product</a>
          <a href="#pricing" className="hover:text-ink">Pricing</a>
          <a href="#security" className="hover:text-ink">Security</a>
          <Link to="/login" className="hover:text-ink">Log in</Link>
        </nav>
      </div>
      <p className="mx-auto max-w-6xl px-4 pb-8 text-xs text-muted sm:px-6">© {new Date().getFullYear()} Geneline-X. All rights reserved.</p>
    </footer>
  )
}

export default function Landing() {
  return (
    <div className="min-h-dvh overflow-x-hidden">
      <Header />
      <main>
        <Hero />
        <FactsBand />
        <Product />
        <HowItWorks />
        <Pricing />
        <Security />
        <Cta />
      </main>
      <Footer />
    </div>
  )
}

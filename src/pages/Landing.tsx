import { useState } from 'react'
import { Link } from 'react-router'
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronRight,
  Fingerprint,
  Globe2,
  LockKeyhole,
  Menu,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Webhook,
  X,
} from 'lucide-react'
import { Logo } from '../components/ui'
import { Photo, Reveal } from '../components/motion'
import { FlatItem } from '../components/flat'
import { images } from '../content/images'

const nav = [
  { to: '/platform', label: 'Platform' },
  { to: '/coverage', label: 'Coverage' },
  { to: '/how-it-works', label: 'How it works' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/docs', label: 'Docs' },
]

export function MarketingHeader() {
  const [open, setOpen] = useState(false)
  return (
    <header className="site-header sticky top-0 z-40 border-b border-black/[0.04] bg-page/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="rounded-full px-4 py-2 text-sm font-medium text-muted transition hover:bg-panel hover:text-ink">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link to="/login" className="rounded-full px-4 py-2.5 text-sm font-semibold transition hover:bg-panel">Log in</Link>
          <Link to="/signup" className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-panel shadow-sm transition hover:bg-ink-soft">
            Create account <ArrowRight className="size-4" />
          </Link>
        </div>
        <button className="grid size-10 place-items-center rounded-full bg-panel md:hidden" onClick={() => setOpen((o) => !o)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <div className="mx-4 mb-4 rounded-3xl border border-line bg-panel p-3 shadow-[var(--shadow-float)] md:hidden">
          {nav.map((n) => <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="block rounded-2xl px-4 py-3 text-sm font-medium hover:bg-tile">{n.label}</Link>)}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Link to="/login" className="rounded-full bg-tile px-4 py-3 text-center text-sm font-semibold">Log in</Link>
            <Link to="/signup" className="rounded-full bg-ink px-4 py-3 text-center text-sm font-semibold text-panel">Get started</Link>
          </div>
        </div>
      )}
    </header>
  )
}

function Phone() {
  return (
    <div className="w-[190px] rounded-[32px] border-[6px] border-[#161719] bg-[#161719] shadow-2xl shadow-black/25 sm:w-[206px]">
      <div className="overflow-hidden rounded-[25px] bg-white text-[#17181a]">
        <div className="flex items-center justify-between px-4 pt-2.5 pb-1.5 text-[9px] font-semibold"><span>9:41</span><span className="h-3.5 w-14 rounded-full bg-[#161719]" /><span>5G</span></div>
        <div className="px-3.5 pb-4">
          <div className="flex items-center justify-between"><span className="text-[10px] font-bold text-brand-600">ASSAY</span><span className="text-[9px] text-muted">Step 2 of 3</span></div>
          <p className="mt-2 text-sm leading-tight font-bold">Photograph your ID</p>
          <p className="mt-1 text-[10px] leading-relaxed text-muted">Place the front of your card inside the frame.</p>
          <div className="relative mt-3 aspect-[1.58] rounded-xl bg-[#25272c] p-2">
            <div className="absolute inset-1.5 rounded-lg border-2 border-dashed border-white/70" />
            <div className="relative flex h-full gap-1.5 rounded-md bg-gradient-to-br from-[#eef0f4] to-[#d5d9e1] p-1.5">
              <div className="grid w-1/3 place-items-center rounded bg-[#c1c9d7]"><ScanLine className="size-5 text-[#667187]" /></div>
              <div className="flex-1 space-y-1 pt-1"><div className="h-1 w-4/5 rounded bg-[#9aa8bd]" /><div className="h-1 w-3/5 rounded bg-[#9aa8bd]" /><div className="h-1 w-2/3 rounded bg-[#9aa8bd]" /></div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[9px] font-semibold text-[#18864b]"><Check className="size-3" /> Card is in focus</div>
          <div className="mt-3 rounded-full bg-[#17181a] py-2.5 text-center text-[10px] font-semibold text-white">Continue</div>
        </div>
      </div>
    </div>
  )
}

function Hero() {
  return (
    <section className="hero-surface relative overflow-hidden">
      <div className="hero-orb hero-orb-one" aria-hidden="true" />
      <div className="hero-orb hero-orb-two" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16 lg:py-24">
        <Reveal effect="left" className="relative z-10">
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-wide text-brand-700">
            <span className="size-2 rounded-full bg-brand-500" /> ID verification, made practical
          </span>
          <h1 className="mt-6 max-w-[640px] text-[42px] leading-[1.05] font-extrabold tracking-[-0.045em] text-ink sm:text-6xl lg:text-[68px]">
            Trust every customer, <span className="text-brand-600">from anywhere.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-muted sm:text-lg">
            A simpler way to verify identity in Sierra Leone. Send a link, let your customer complete a few guided checks, and receive the result through your API.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/signup" className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-6 py-3.5 text-sm font-bold text-white shadow-[0_12px_25px_-12px_rgb(226_72_27/0.85)] transition hover:-translate-y-0.5 hover:brightness-105">
              Start building <ArrowRight className="size-4" />
            </Link>
            <Link to="/how-it-works" className="inline-flex items-center gap-2 rounded-full border border-line bg-white/70 px-5 py-3.5 text-sm font-semibold text-ink transition hover:bg-white">
              See how it works <ChevronRight className="size-4" />
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-semibold text-muted">
            <span className="inline-flex items-center gap-2"><LockKeyhole className="size-4 text-brand-600" /> Privacy-aware design</span>
            <span className="inline-flex items-center gap-2"><Smartphone className="size-4 text-brand-600" /> No app installation</span>
          </div>
        </Reveal>

        <Reveal effect="right" delay={120} className="relative mx-auto w-full max-w-[560px] lg:mr-0">
          <div className="hero-photo-frame relative aspect-[0.93] overflow-hidden rounded-[28px] bg-[#e4d9cf]">
            <Photo src={images.hero} alt="A customer checking a blank ID card with her smartphone" label="" size="" rounded="rounded-none" className="object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141416]/30 via-transparent to-white/5" />
          </div>
          <div className="float-slower absolute -bottom-7 -left-2 z-10 sm:-left-8"><Phone /></div>
        </Reveal>
      </div>
    </section>
  )
}

const features = [
  { key: 'feature1', eyebrow: '01 / DOCUMENT', title: 'Check the ID', body: 'Guide customers through a clear capture of both sides of their national ID card.', icon: ShieldCheck },
  { key: 'feature2', eyebrow: '02 / FACE MATCH', title: 'Match the person', body: 'Compare a quick selfie with the portrait on the submitted identity document.', icon: ScanLine },
  { key: 'feature3', eyebrow: '03 / LIVENESS', title: 'Confirm presence', body: 'A short guided movement helps confirm that a real person is completing the check.', icon: Fingerprint },
]

function Features() {
  return (
    <section id="features" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <Reveal effect="left" className="max-w-xl">
          <p className="section-kicker">THE ASSAY PLATFORM</p>
          <h2 className="section-title mt-3">Three checks. One clear flow.</h2>
        </Reveal>
        <Reveal effect="right" className="max-w-md text-sm leading-7 text-muted">Each step is designed to be easy for customers to complete and straightforward for your team to integrate.</Reveal>
      </div>
      <div className="mt-12 grid gap-10 md:grid-cols-3">
        {features.map((f, i) => (
          <Reveal key={f.key} delay={i * 120}>
            <div className="aspect-[1.16] overflow-hidden rounded-2xl bg-tile">
              <Photo src={images[f.key]} alt={f.title} label="" size="" rounded="rounded-none" />
            </div>
            <div className="mt-6">
              <FlatItem label={f.eyebrow} icon={f.icon} title={f.title} body={f.body} />
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

const towns = [
  { top: '63%', left: '29%', label: 'Freetown' },
  { top: '38%', left: '50%', label: 'Makeni' },
  { top: '66%', left: '52%', label: 'Bo' },
  { top: '61%', left: '64%', label: 'Kenema' },
  { top: '38%', left: '35%', label: 'Port Loko' },
]

function Coverage() {
  return (
    <section id="coverage" className="coverage-surface scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <Reveal effect="zoom" className="relative">
          <div className="relative overflow-hidden rounded-2xl">
            <div className="absolute left-5 top-5 z-10 flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-xs font-bold text-ink shadow-sm backdrop-blur"><Globe2 className="size-4 text-brand-600" /> Sierra Leone</div>
            <div className="relative aspect-[16/10] w-full">
              <Photo src={images.map} alt="Illustrated map of Sierra Leone" label="" size="" rounded="rounded-none" />
              {towns.map((p, i) => <div key={p.label} className="absolute" style={{ top: p.top, left: p.left }}><Reveal effect="pop" delay={200 + i * 100}><div className="-translate-x-1/2 -translate-y-1/2"><div className="relative grid size-5 place-items-center rounded-full border-[3px] border-white bg-brand-500 shadow-[0_3px_10px_rgb(0_0_0/0.25)]"><span className="absolute inset-[-5px] rounded-full border border-brand-500/50" /></div><span className="mt-1 block whitespace-nowrap rounded-md bg-white/90 px-2 py-1 text-[9px] font-bold text-ink shadow-sm">{p.label}</span></div></Reveal></div>)}
            </div>
          </div>
        </Reveal>
        <Reveal effect="right">
          <p className="section-kicker">MADE FOR SIERRA LEONE</p>
          <h2 className="section-title mt-3">A local experience, built for modern teams.</h2>
          <p className="mt-5 max-w-lg text-base leading-8 text-muted">Customers can complete identity checks from their own phone. Your team can integrate the result into the systems you already use.</p>
          <div className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {[
              { icon: Smartphone, title: 'Phone-first capture', body: 'A guided flow that opens from a link.' },
              { icon: Webhook, title: 'API and webhooks', body: 'Connect decisions to your product.' },
              { icon: LockKeyhole, title: 'Privacy-aware', body: 'Identity details stay out of the portal.' },
              { icon: Globe2, title: 'Country-focused', body: 'Designed around Sierra Leone ID checks.' },
            ].map(({ icon, title, body }) => <FlatItem key={title} icon={icon} title={title} body={body} />)}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

const steps = [
  { title: 'Create a session', body: 'Make one API request to start a verification and receive a secure customer link.', icon: Webhook },
  { title: 'Customer completes checks', body: 'The customer captures their ID and follows a short selfie challenge on their phone.', icon: Smartphone },
  { title: 'Receive the result', body: 'A signed webhook notifies your system when a decision is ready.', icon: BadgeCheck },
]

function HowItWorks() {
  return (
    <section id="how" className="process-surface scroll-mt-24 overflow-hidden py-20 text-white sm:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <Reveal effect="left" className="relative mx-auto w-full max-w-[460px]">
          <div className="overflow-hidden rounded-2xl"><div className="aspect-[0.83] w-full"><Photo src={images.app} alt="A shop owner helping a customer verify their identity" label="" size="" rounded="rounded-none" /></div></div>
        </Reveal>
        <div>
          <Reveal><p className="text-xs font-bold tracking-[0.18em] text-brand-300">SIMPLE TO START</p><h2 className="mt-3 max-w-xl text-3xl leading-tight font-extrabold tracking-tight sm:text-5xl">From first API call to verified customer.</h2><p className="mt-5 max-w-lg text-sm leading-7 text-white/65">Keep the experience simple for your customers and the integration familiar for your developers.</p></Reveal>
          <ol className="mt-9 space-y-6">
            {steps.map((st, i) => (
              <Reveal as="li" key={st.title} delay={i * 100}>
                <FlatItem dark label={'0' + (i + 1)} title={st.title} body={st.body} />
              </Reveal>
            ))}
          </ol>
          <Reveal delay={400} className="mt-6"><Link to="/signup" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-[#17181a] transition hover:bg-brand-50">Create your account <ArrowRight className="size-4" /></Link></Reveal>
        </div>
      </div>
    </section>
  )
}

function Integration() {
  const items = [
    { step: '01', title: 'Start with an API request', body: 'Create a verification session from your backend and get a customer link for that session.', icon: Webhook },
    { step: '02', title: 'Share the hosted link', body: 'Send the link through the channel your customer already uses. They complete the checks on their phone.', icon: Smartphone },
    { step: '03', title: 'Handle the outcome', body: 'Use the signed webhook to continue your own onboarding or review flow.', icon: BadgeCheck },
  ]
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
      <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
        <Reveal effect="left">
          <p className="section-kicker">FOR YOUR PRODUCT TEAM</p>
          <h2 className="section-title mt-3">A verification flow that fits your stack.</h2>
          <p className="mt-5 text-sm leading-7 text-muted">Keep the identity capture experience hosted while your app stays in control of the customer journey.</p>
          <Link to="/how-it-works" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-700 hover:text-brand-600">See the integration flow <ArrowRight className="size-4" /></Link>
        </Reveal>
        <div className="grid gap-8">
          {items.map(({ step, title, body, icon: Icon }, i) => (
            <Reveal key={step} delay={i * 90}>
              <FlatItem label={'STEP ' + step} icon={Icon} title={title} body={body} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function FaqPreview() {
  const questions = [
    { question: 'Does a customer need to install an app?', answer: 'No. They complete the guided capture from a link on their phone.' },
    { question: 'What does the dashboard show?', answer: 'The portal focuses on sessions, outcomes, keys and billing. Identity images and details are not displayed there.' },
    { question: 'Can we test the integration first?', answer: 'Yes. The portal includes a free test mode so your team can work through the integration before using live access.' },
  ]
  return (
    <section className="border-y border-line py-20 sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.7fr_1.3fr]">
        <Reveal effect="left"><p className="section-kicker">GOOD TO KNOW</p><h2 className="section-title mt-3">Questions teams ask first.</h2><Link to="/faq" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-700 hover:text-brand-600">Visit the FAQ <ArrowRight className="size-4" /></Link></Reveal>
        <div className="divide-y divide-line border-y border-line">
          {questions.map((item, i) => (
            <Reveal key={item.question} delay={i * 90} className="py-5">
              <h3 className="font-bold">{item.question}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{item.answer}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28">
      <Reveal effect="zoom" className="pricing-panel relative overflow-hidden rounded-[34px] px-6 py-10 sm:rounded-[42px] sm:px-12 sm:py-14 lg:px-16">
        <div className="pricing-orb" aria-hidden="true" />
        <div className="relative grid gap-10 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-white/65">CLEAR, FLEXIBLE PRICING</p>
            <h2 className="mt-3 max-w-xl text-3xl leading-tight font-extrabold tracking-tight text-white sm:text-5xl">Pay for completed decisions.</h2>
            <p className="mt-4 max-w-lg text-sm leading-7 text-white/75">Try the integration in test mode, then top up in Leones when you’re ready. Payments are available through Orange Money and Afrimoney.</p>
            <Link to="/signup" className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-[#17181a] shadow-lg transition hover:-translate-y-0.5 hover:bg-brand-50">Get started <ArrowRight className="size-4" /></Link>
          </div>
          <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {[
              { icon: Check, text: 'Free test mode' },
              { icon: Check, text: 'No charge for retakes' },
              { icon: LockKeyhole, text: 'Privacy-aware dashboard' },
              { icon: Smartphone, text: 'Mobile money top-ups' },
            ].map(({ icon: Icon, text }) => <div key={text} className="flex items-center gap-3 border-t border-white/25 pt-4 text-sm font-semibold text-white"><Icon className="size-4 shrink-0" />{text}</div>)}
          </div>
        </div>
      </Reveal>
    </section>
  )
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-line bg-panel">
      <div className="mx-auto flex max-w-7xl flex-col gap-7 px-5 py-9 sm:px-8 md:flex-row md:items-center md:justify-between">
        <div><Logo /><p className="mt-3 text-xs text-muted">Identity verification for Sierra Leone.</p></div>
        <nav className="flex flex-wrap gap-x-5 gap-y-3 text-xs font-medium text-muted" aria-label="Footer">
          {nav.map((n) => <Link key={n.to} to={n.to} className="transition hover:text-ink">{n.label}</Link>)}
          <Link to="/faq" className="transition hover:text-ink">FAQ</Link>
          <Link to="/login" className="transition hover:text-ink">Log in</Link>
        </nav>
        <p className="text-xs text-muted">© {new Date().getFullYear()} Geneline-X</p>
      </div>
    </footer>
  )
}

export default function Landing() {
  return (
    <div className="min-h-dvh overflow-x-hidden scroll-smooth">
      <MarketingHeader />
      <main>
        <Hero />
        <Features />
        <Coverage />
        <HowItWorks />
        <Integration />
        <FaqPreview />
        <Pricing />
      </main>
      <MarketingFooter />
    </div>
  )
}

import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, BadgeCheck, Check, Fingerprint, Lock, Menu, Quote, ScanFace, ShieldCheck, Smartphone, Star, Trash2, Webhook, X } from 'lucide-react'
import { Logo } from '../components/ui'
import { CountUp, Photo, Reveal } from '../components/motion'
import { images } from '../content/images'

const nav = [
  { href: '#features', label: 'Features' },
  { href: '#coverage', label: 'Coverage' },
  { href: '#how', label: 'How it works' },
  { href: '#pricing', label: 'Pricing' },
]

function Header() {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 bg-page/80 backdrop-blur-md">
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
          <Link to="/login" className="rounded-full px-4 py-2.5 text-sm font-semibold hover:bg-panel">
            Log in
          </Link>
          <Link to="/signup" className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-panel hover:bg-ink-soft">
            Register
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
              Register
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

function Phone({ className = '' }: { className?: string }) {
  return (
    <div className={'w-[200px] rounded-[34px] border-[6px] border-[#141416] bg-[#141416] shadow-2xl ' + className}>
      <div className="overflow-hidden rounded-[28px] bg-white">
        <div className="flex items-center justify-between px-4 pt-2.5 pb-1.5 text-[9px] font-semibold text-[#141416]">
          <span>9:41</span>
          <span className="h-3.5 w-14 rounded-full bg-[#141416]" />
          <span>5G</span>
        </div>
        <div className="px-3.5 pb-4">
          <p className="text-[10px] font-semibold text-[#e14d1c]">Step 2 of 3</p>
          <p className="mt-0.5 text-sm leading-tight font-bold text-[#141416]">Photograph the front of your ID</p>
          <div className="relative mt-2.5 aspect-[1.58] rounded-xl bg-[#1f1f23] p-2">
            <div className="absolute inset-1.5 rounded-lg border-2 border-dashed border-white/50" />
            <div className="relative flex h-full gap-1.5 rounded-md bg-gradient-to-br from-[#e8edf5] to-[#cfd8e6] p-1.5">
              <div className="grid w-1/3 place-items-center rounded bg-[#b6c2d4]">
                <ScanFace className="size-5 text-[#5d6b82]" />
              </div>
              <div className="flex-1 space-y-1 pt-1">
                <div className="h-1 w-4/5 rounded bg-[#9aa8bd]" />
                <div className="h-1 w-3/5 rounded bg-[#9aa8bd]" />
                <div className="h-1 w-2/3 rounded bg-[#9aa8bd]" />
              </div>
            </div>
          </div>
          <div className="mt-2.5 flex gap-1">
            {['Sharp', 'No glare'].map((t) => (
              <span key={t} className="flex items-center gap-0.5 rounded-full bg-[#e7f6ec] px-1.5 py-0.5 text-[8px] font-semibold text-[#17a34a]">
                <Check className="size-2" />
                {t}
              </span>
            ))}
          </div>
          <div className="mt-3 rounded-full bg-[#141416] py-2 text-center text-[10px] font-semibold text-white">Take photo</div>
        </div>
      </div>
    </div>
  )
}

function Hero() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 pt-6 sm:px-6 lg:pt-10">
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.05fr]">
        <Reveal effect="left">
          <span className="inline-flex items-center gap-2 rounded-full bg-panel px-3 py-1.5 text-xs font-semibold text-muted">
            <span className="size-1.5 rounded-full bg-brand-500" />
            ID verification for Sierra Leone
          </span>
          <h1 className="mt-5 text-[40px] leading-[1.05] font-extrabold tracking-tight sm:text-6xl">
            Verify customers
            <br />
            the <span className="squiggle">easy way!</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted sm:text-lg">Send a link. Your customer photographs their ID and takes a quick selfie. You get a clear decision in seconds.</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/signup" className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-panel hover:bg-ink-soft">
              Get started
              <ArrowRight className="size-4" />
            </Link>
            <a href="#how" className="rounded-full px-5 py-3.5 text-sm font-semibold text-ink hover:bg-panel">
              How it works
            </a>
          </div>
        </Reveal>

        <Reveal effect="right" delay={150} className="relative">
          <div className="relative ml-auto aspect-[5/6] w-full max-w-[460px]">
            <Photo src={images.hero} alt="A customer verifying their ID on a phone" label="Hero photo" size="1200 × 1400" rounded="rounded-[40px]" />
            {/* Phone over the photo */}
            <div className="float-slower absolute bottom-6 -left-4 sm:-left-12">
              <Phone />
            </div>
            <Reveal effect="pop" delay={600} className="absolute top-8 -right-2 sm:-right-6">
              <div className="float-slow flex items-center gap-2 rounded-2xl bg-white p-3 shadow-[var(--shadow-float)]">
                <span className="grid size-9 place-items-center rounded-full bg-[#e7f6ec] text-[#17a34a]">
                  <ScanFace className="size-4" />
                </span>
                <div>
                  <p className="text-[11px] text-[#6f7178]">Face match</p>
                  <p className="text-sm font-bold text-[#141416]">Strong match</p>
                </div>
              </div>
            </Reveal>
            <Reveal effect="pop" delay={850} className="absolute -right-2 bottom-24 sm:-right-8">
              <div className="float-slower flex items-center gap-3 rounded-2xl bg-[#141416] p-3 text-white shadow-[var(--shadow-float)]">
                <div>
                  <p className="text-[11px] text-white/60">Decision</p>
                  <p className="text-sm font-bold">Approved · 1.1 s</p>
                </div>
                <span className="grid size-8 place-items-center rounded-full bg-[#17a34a]">
                  <BadgeCheck className="size-4" />
                </span>
              </div>
            </Reveal>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function StatsBand() {
  const stats = [
    { node: <CountUp to={1.1} decimals={1} suffix=" s" />, label: 'Typical decision after capture' },
    { node: <CountUp to={3} />, label: 'Checks in every verification' },
    { node: <CountUp to={30} />, label: 'Days, then images are deleted' },
    { node: <>24/7</>, label: 'Automated decisions' },
  ]
  return (
    <section className="relative z-10 mx-auto -mt-6 max-w-6xl px-4 sm:-mt-10 sm:px-6">
      <Reveal effect="up">
        <div className="bg-brand-gradient grid grid-cols-2 gap-x-6 gap-y-8 rounded-[32px] px-6 py-9 text-white shadow-[0_24px_50px_-24px_rgb(242_100_48/0.9)] sm:px-12 lg:grid-cols-4">
          {stats.map((s, i) => (
            <div key={s.label} className={'flex items-center gap-3 ' + (i > 0 ? 'lg:border-l lg:border-white/25 lg:pl-8' : '')}>
              <span className="shrink-0 text-4xl font-extrabold tracking-tight whitespace-nowrap tabular-nums sm:text-5xl">{s.node}</span>
              <span className="max-w-[8rem] text-xs leading-snug text-white/85">{s.label}</span>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  )
}

const features = [
  { key: 'feature1', title: 'ID card check', body: 'Reads both sides of the national ID card and checks they agree.', icon: ShieldCheck },
  { key: 'feature2', title: 'Face match', body: 'Compares the selfie with the photo on the card.', icon: ScanFace },
  { key: 'feature3', title: 'Liveness', body: 'A short head turn or blink proves a real person is there.', icon: Fingerprint },
]

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-24 px-4 pt-24 pb-10 sm:px-6">
      <div className="grid gap-12 lg:grid-cols-[0.8fr_2fr] lg:items-start">
        <Reveal effect="left">
          <span className="text-2xl text-brand-500" aria-hidden="true">
            ✦
          </span>
          <h2 className="mt-2 text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">
            That&apos;s the way
            <br />
            to verify!
          </h2>
          <p className="mt-4 text-sm text-muted">Three checks, one clear decision.</p>
        </Reveal>
        <div className="grid gap-8 sm:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 150}>
              <div className="relative size-20">
                <Photo src={images[f.key]} alt={f.title} label="" size="400 × 400" rounded="rounded-3xl" />
                <span className="bg-brand-gradient absolute -right-2 -bottom-2 grid size-8 place-items-center rounded-full text-white ring-4 ring-page">
                  <f.icon className="size-4" />
                </span>
              </div>
              <h3 className="mt-5 text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// Pin positions (percent of the map box) for public/images/map.webp. Each pin's tip
// sits on the town; adjust these if the map image changes.
const pins = [
  { top: '63%', left: '29%', label: 'Freetown', avatar: 'avatar1' },
  { top: '38%', left: '35%', label: 'Port Loko', avatar: undefined },
  { top: '38%', left: '50%', label: 'Makeni', avatar: 'avatar2' },
  { top: '66%', left: '52%', label: 'Bo', avatar: 'avatar3' },
  { top: '61%', left: '64%', label: 'Kenema', avatar: undefined },
]

function Coverage() {
  return (
    <section id="coverage" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        <Reveal effect="zoom" className="relative">
          <div className="relative aspect-[16/10] w-full">
            <Photo src={images.map} alt="Map of Sierra Leone" label="Map of Sierra Leone" size="1600 × 1000" rounded="rounded-[36px]" />
            {pins.map((p, i) => (
              <div key={p.label} className="absolute" style={{ top: p.top, left: p.left }}>
                <Reveal effect="pop" delay={300 + i * 180}>
                  <div className="-translate-x-1/2 -translate-y-full">
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <span className="absolute inset-0 animate-ping rounded-full bg-brand-500/40" aria-hidden="true" />
                        <div className="relative size-11 overflow-hidden rounded-full border-[3px] border-white bg-tile shadow-lg">
                          {p.avatar && images[p.avatar] ? <img src={images[p.avatar]} alt="" className="h-full w-full object-cover" /> : <span className="bg-brand-gradient grid h-full w-full place-items-center text-white"><BadgeCheck className="size-4" /></span>}
                        </div>
                      </div>
                      <span className="mt-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-[#141416] shadow">{p.label}</span>
                    </div>
                  </div>
                </Reveal>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal effect="right">
          <p className="text-sm font-semibold text-brand-500">Coverage</p>
          <h2 className="mt-2 text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">Verify customers anywhere in Sierra Leone.</h2>
          <p className="mt-4 text-muted">All a customer needs is their national ID card and a phone with a camera. No branch visit, no app to install.</p>
          <ul className="mt-6 space-y-3">
            {['Works on low-end Android phones', 'Recovers from weak connections', 'Guides the customer at every step'].map((t) => (
              <li key={t} className="flex items-center gap-3 text-sm font-medium">
                <span className="grid size-6 place-items-center rounded-full bg-brand-500 text-white">
                  <Check className="size-3.5" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}

const steps = [
  { title: 'Create a session', body: 'One API call. You get a link for your customer.' },
  { title: 'Customer captures', body: 'ID front and back, then a short selfie challenge on their phone.' },
  { title: 'Get the decision', body: 'A signed webhook tells you; fetch the outcome and reasons.' },
]

function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-24 bg-panel py-24">
      <div className="mx-auto grid max-w-6xl gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
        <Reveal effect="left" className="relative mx-auto w-full max-w-[420px]">
          <div className="aspect-[5/6] w-full">
            <Photo src={images.app} alt="The capture app in use" label="App photo" size="1000 × 1200" rounded="rounded-[40px]" />
          </div>
          <div className="float-slow absolute -right-3 -bottom-8 sm:-right-10">
            <Phone />
          </div>
        </Reveal>
        <div>
          <Reveal>
            <p className="text-sm font-semibold text-brand-500">How it works</p>
            <h2 className="mt-2 text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">Live in an afternoon.</h2>
          </Reveal>
          <ol className="mt-8 space-y-4">
            {steps.map((s, i) => (
              <Reveal as="li" key={s.title} delay={i * 150} className="flex gap-5 rounded-3xl bg-tile p-5">
                <span className="bg-brand-gradient grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold text-white">{i + 1}</span>
                <div>
                  <h3 className="font-bold">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
          <Reveal delay={500} className="mt-6 flex flex-wrap gap-2">
            {[
              { icon: Smartphone, t: 'Hosted capture link' },
              { icon: Webhook, t: 'Signed webhooks' },
              { icon: Lock, t: 'Free test mode' },
            ].map(({ icon: Icon, t }) => (
              <span key={t} className="inline-flex items-center gap-2 rounded-full bg-tile px-3.5 py-2 text-xs font-semibold">
                <Icon className="size-3.5 text-brand-500" />
                {t}
              </span>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  )
}

const testimonials = [
  { avatar: 'avatar1', name: 'Customer name', role: 'Role, Company' },
  { avatar: 'avatar2', name: 'Customer name', role: 'Role, Company' },
  { avatar: 'avatar3', name: 'Customer name', role: 'Role, Company' },
]

function Testimonials() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <Reveal className="text-center">
        <span className="inline-block rounded-full bg-ink px-3 py-1 text-xs font-semibold text-panel">Our customers</span>
        <h2 className="mx-auto mt-4 max-w-xl text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">Satisfied customers are our best ads.</h2>
      </Reveal>
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {testimonials.map((t, i) => (
          <Reveal key={i} delay={i * 150} className="rounded-[28px] bg-panel p-6">
            <Quote className="size-7 fill-brand-500 text-brand-500" />
            <p className="mt-4 text-sm leading-relaxed text-muted">Add a short quote from a customer here: what they verify with Assay and what changed for them.</p>
            <div className="mt-6 flex items-center gap-3">
              <div className="size-11 shrink-0">
                <Photo src={images[t.avatar]} alt={t.name} label="" size="" rounded="rounded-full" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{t.name}</p>
                <p className="text-xs text-muted">{t.role}</p>
              </div>
              <div className="flex text-brand-500" aria-label="5 stars">
                {Array.from({ length: 5 }, (_, s) => (
                  <Star key={s} className="size-3.5 fill-current" />
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-24 sm:px-6">
      <Reveal effect="zoom">
        <div className="bg-brand-gradient relative overflow-hidden rounded-[40px] px-6 py-14 text-white sm:px-14">
          <div className="absolute -top-24 -right-16 size-72 rounded-full bg-white/10" aria-hidden="true" />
          <div className="absolute -bottom-28 -left-10 size-80 rounded-full bg-black/10" aria-hidden="true" />
          <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl leading-tight font-extrabold tracking-tight sm:text-5xl">Pay only for decisions.</h2>
              <p className="mt-4 max-w-md text-white/85">Top up in Leones with Orange Money or Afrimoney. Test mode is free, and you only pay when a verification is completed.</p>
              <Link to="/signup" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#141416] px-6 py-3.5 text-sm font-semibold text-white hover:bg-black">
                Start free
                <ArrowRight className="size-4" />
              </Link>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: Check, t: 'Free test mode' },
                { icon: Check, t: 'Free retakes' },
                { icon: Trash2, t: 'Images deleted after 30 days' },
                { icon: ShieldCheck, t: 'No ID data in your dashboard' },
              ].map(({ icon: Icon, t }) => (
                <li key={t} className="flex items-center gap-3 rounded-2xl bg-white/12 px-4 py-3.5 text-sm font-medium backdrop-blur-sm">
                  <span className="grid size-7 place-items-center rounded-full bg-white text-brand-600">
                    <Icon className="size-3.5" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>
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
          {nav.map((n) => (
            <a key={n.href} href={n.href} className="hover:text-ink">
              {n.label}
            </a>
          ))}
          <Link to="/login" className="hover:text-ink">
            Log in
          </Link>
        </nav>
      </div>
      <p className="mx-auto max-w-6xl px-4 pb-8 text-xs text-muted sm:px-6">© {new Date().getFullYear()} Geneline-X. All rights reserved.</p>
    </footer>
  )
}

export default function Landing() {
  return (
    <div className="min-h-dvh overflow-x-hidden scroll-smooth">
      <Header />
      <main>
        <Hero />
        <StatsBand />
        <Features />
        <Coverage />
        <HowItWorks />
        <Testimonials />
        <Pricing />
      </main>
      <Footer />
    </div>
  )
}

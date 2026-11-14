import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowRight, BadgeCheck, Check, Fingerprint, Globe2, LockKeyhole, ScanLine, ShieldCheck, Smartphone, Webhook } from 'lucide-react'
import { Photo, Reveal } from '../components/motion'
import { FlatItem } from '../components/flat'
import { MarketingFooter, MarketingHeader } from './Landing'
import { images } from '../content/images'

function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh overflow-x-hidden">
      <MarketingHeader />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  )
}

function PageHero({ eyebrow, title, body, cta = 'Create your account' }: { eyebrow: string; title: string; body: string; cta?: string }) {
  return (
    <section className="hero-surface">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
        <Reveal effect="up" className="max-w-3xl">
          <p className="section-kicker">{eyebrow}</p>
          <h1 className="mt-4 text-4xl leading-[1.06] font-extrabold tracking-[-0.045em] text-ink sm:text-6xl">{title}</h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-muted sm:text-lg">{body}</p>
          <Link to="/signup" className="bg-brand-gradient mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold text-white">
            {cta}
            <ArrowRight className="size-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  )
}

/** The closing call to action: a plain band, no panel. */
function ClosingCta({ title, body, cta }: { title: string; body: string; cta: string }) {
  return (
    <section className="border-t border-line">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-16 sm:px-8 sm:py-20 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <h2 className="section-title">{title}</h2>
          <p className="mt-4 text-sm leading-7 text-muted">{body}</p>
        </div>
        <Link to="/signup" className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-ink px-6 py-3.5 text-sm font-bold text-panel md:self-auto">
          {cta} <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  )
}

const checks = [
  { key: 'feature1', label: '01 / DOCUMENT', title: 'National ID capture', body: 'A guided camera flow helps the customer photograph both sides of their ID card.' },
  { key: 'feature2', label: '02 / FACE MATCH', title: 'Face comparison', body: 'A selfie is compared with the portrait on the submitted identity document.' },
  { key: 'feature3', label: '03 / LIVENESS', title: 'Liveness check', body: 'A short movement prompt helps check that a person is present during capture.' },
]

export function PlatformPage() {
  return (
    <MarketingLayout>
      <PageHero
        eyebrow="THE PLATFORM"
        title="Identity checks that feel clear to customers and practical for developers."
        body="Assay brings document capture, face matching and liveness into one hosted flow. Your team starts the session through an API and receives the outcome in your own system."
      />
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="grid gap-10 md:grid-cols-3">
          {checks.map((item, i) => (
            <Reveal key={item.key} delay={i * 100}>
              <div className="aspect-[1.15] overflow-hidden rounded-2xl bg-tile">
                <Photo src={images[item.key]} alt={item.title} label="" size="" rounded="rounded-none" />
              </div>
              <div className="mt-6">
                <FlatItem label={item.label} title={item.title} body={item.body} />
              </div>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="coverage-surface py-16 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal effect="left">
            <p className="section-kicker">BUILT AROUND A COMPLETE FLOW</p>
            <h2 className="section-title mt-3">A guided customer journey, with your product in control.</h2>
            <p className="mt-5 text-sm leading-7 text-muted">
              The hosted capture experience handles the identity steps. Your integration creates the session, shares the link and decides what happens next using the verification outcome.
            </p>
          </Reveal>
          <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
            <FlatItem icon={Smartphone} title="Hosted capture" body="Customers open a link and follow the prompts on their phone." />
            <FlatItem icon={Webhook} title="Webhook delivery" body="A signed event tells your system when the result is ready." />
            <FlatItem icon={LockKeyhole} title="Portal privacy" body="Identity images and details stay out of the client dashboard." />
            <FlatItem icon={ShieldCheck} title="Three checks" body="Document, face match and liveness come together in one session." />
          </div>
        </div>
      </section>
      <ClosingCta title="Bring identity checks into your onboarding." body="Create an account to explore the developer portal and begin in test mode." cta="Get started" />
    </MarketingLayout>
  )
}

export function CoveragePage() {
  const benefits = [
    { icon: Smartphone, title: 'Customers use their own phone', body: 'The verification link opens a guided capture flow without asking customers to install a separate app.' },
    { icon: Globe2, title: 'Designed for Sierra Leone', body: 'The product is focused on the national ID verification journey and customer onboarding in Sierra Leone.' },
    { icon: Webhook, title: 'Your systems receive the outcome', body: 'Use the API and signed webhooks to connect verification results with your existing workflow.' },
  ]
  return (
    <MarketingLayout>
      <PageHero eyebrow="COVERAGE" title="Bring customer verification closer to where business happens." body="Assay is focused on helping teams verify customers across Sierra Leone with a phone-first flow that can be completed remotely." cta="Start in test mode" />
      <section className="coverage-surface py-12 sm:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal effect="zoom">
            <div className="aspect-[16/10] overflow-hidden rounded-2xl">
              <Photo src={images.map} alt="Illustrated map of Sierra Leone" label="" size="" rounded="rounded-none" />
            </div>
            <p className="mt-3 text-xs text-muted">A country-focused identity verification experience.</p>
          </Reveal>
          <Reveal effect="right">
            <p className="section-kicker">REMOTE BY DESIGN</p>
            <h2 className="section-title mt-3">A straightforward path from customer to decision.</h2>
            <p className="mt-5 text-sm leading-7 text-muted">Customers can complete ID capture and selfie checks from their own device. Your team can keep the rest of the onboarding in the product you already operate.</p>
            <div className="mt-8 space-y-6">
              {benefits.map((b) => (
                <FlatItem key={b.title} icon={b.icon} title={b.title} body={b.body} />
              ))}
            </div>
          </Reveal>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="grid gap-10 md:grid-cols-3">
          <FlatItem icon={ScanLine} title="Capture" body="A guided process helps customers submit clear ID photos." />
          <FlatItem icon={Fingerprint} title="Verify" body="Face matching and liveness checks complete the identity flow." />
          <FlatItem icon={BadgeCheck} title="Continue" body="Receive a result and apply your own onboarding rules." />
        </div>
      </section>
      <ClosingCta title="Start verifying customers remotely." body="Open a free test account and try the customer flow on your own phone." cta="Create account" />
    </MarketingLayout>
  )
}

const flow = [
  { no: '01', icon: Webhook, title: 'Create a session', body: 'Your backend requests a verification session through the API. Assay returns a link for the customer.' },
  { no: '02', icon: Smartphone, title: 'Customer completes capture', body: 'The customer opens the link, photographs their ID and completes the face and liveness prompts.' },
  { no: '03', icon: BadgeCheck, title: 'Receive the outcome', body: 'A signed webhook notifies your service. Your product can continue onboarding, pause for review or ask for another capture.' },
]

export function HowItWorksPage() {
  return (
    <MarketingLayout>
      <PageHero eyebrow="HOW IT WORKS" title="A clean handoff from your product to the customer and back." body="Keep your application in charge of onboarding while Assay guides customers through identity capture and sends the result back to your system." />
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-3">
          {flow.map((s, i) => (
            <Reveal key={s.no} delay={i * 100}>
              <FlatItem label={`STEP ${s.no}`} icon={s.icon} title={s.title} body={s.body} />
            </Reveal>
          ))}
        </div>
      </section>
      <section className="process-surface py-16 text-white sm:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2">
          <Reveal effect="left">
            <p className="text-xs font-bold tracking-[0.18em] text-brand-300">A HOSTED CUSTOMER FLOW</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Less custom capture code to maintain.</h2>
            <p className="mt-5 text-sm leading-7 text-white/65">
              Your product starts a session and receives its outcome. The customer capture experience is handled through the hosted link, so your team can focus on the surrounding onboarding.
            </p>
          </Reveal>
          <Reveal effect="right" className="aspect-[1.15] overflow-hidden rounded-2xl">
            <Photo src={images.app} alt="Customer verification at a local shop" label="" size="" rounded="rounded-none" />
          </Reveal>
        </div>
      </section>
      <ClosingCta title="Ready to try the flow?" body="Create a portal account and begin exploring the integration in test mode." cta="Create account" />
    </MarketingLayout>
  )
}

export function PricingPage() {
  const points = [
    { icon: Check, title: 'Try before going live', body: 'Use test mode to explore the integration before switching to live access.' },
    { icon: Check, title: 'Pay for completed decisions', body: 'Billing is based on completed verification decisions, rather than link creation.' },
    { icon: Smartphone, title: 'Top up in Leones', body: 'Prepaid balance in Leones, with Orange Money and Afrimoney top-ups.' },
    { icon: LockKeyhole, title: 'No charge for retakes', body: 'Customers can retry a capture without an extra charge for the retake.' },
  ]
  return (
    <MarketingLayout>
      <PageHero eyebrow="PRICING" title="Straightforward billing for verification decisions." body="Start with a free test integration. When you are ready for live verification, top up in Leones and pay for completed decisions." cta="Explore test mode" />
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-20">
        <div className="grid gap-x-12 gap-y-10 md:grid-cols-2">
          {points.map((p, i) => (
            <Reveal key={p.title} delay={i * 75}>
              <FlatItem icon={p.icon} title={p.title} body={p.body} />
            </Reveal>
          ))}
        </div>
      </section>
      <section className="coverage-surface py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <p className="section-kicker">PAYMENT OPTIONS</p>
          <h2 className="section-title mt-3">Top up with local mobile money.</h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-muted">Orange Money and Afrimoney are used for account top-ups. Your balance and transaction history are in the billing area of the portal.</p>
          <p className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm font-bold">
            <span className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-[#ff7900]" /> Orange Money
            </span>
            <span className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-[#7b2d8e]" /> Afrimoney
            </span>
          </p>
        </div>
      </section>
      <ClosingCta title="Start with test mode." body="Explore the portal and connect your first test flow before using live access." cta="Create account" />
    </MarketingLayout>
  )
}

const faqs = [
  { q: 'What does Assay check?', a: 'The verification flow checks a customer’s national ID, compares a selfie with the document portrait and includes a liveness prompt.' },
  { q: 'Does a customer need to install an app?', a: 'No. They open a hosted link on their phone and follow the capture instructions there.' },
  { q: 'How does the result reach my product?', a: 'Your backend starts a session through the API. Assay sends a signed webhook when the result is ready, and your product can then fetch the outcome.' },
  { q: 'Does the client portal store identity images?', a: 'No. The portal does not show or store identity images or identity details. It shows session counts, outcomes, key details and billing.' },
  { q: 'Can I test before using live access?', a: 'Yes. Every account starts in free test mode. Live access follows a short business review.' },
  { q: 'How do top-ups work?', a: 'Your balance is prepaid in Leones. Top-ups use Orange Money or Afrimoney from the billing area.' },
]

export function FaqPage() {
  return (
    <MarketingLayout>
      <PageHero eyebrow="HELP CENTER" title="Frequently asked questions." body="Quick answers about the customer flow, integration, privacy and billing." cta="Create an account" />
      <section className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-20">
        <div className="divide-y divide-line border-y border-line">
          {faqs.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold">
                {item.q}
                <span className="text-xl leading-none text-muted transition group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-7 text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
      <ClosingCta title="Still have a question?" body="Create an account to explore the portal and the integration flow." cta="Get started" />
    </MarketingLayout>
  )
}

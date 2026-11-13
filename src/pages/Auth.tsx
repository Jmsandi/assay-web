import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowRight, BadgeCheck, Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react'
import { Button, Field, Logo, inputClass } from '../components/ui'

function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-4 py-6 sm:px-10">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-6 text-center text-sm text-muted">{footer}</p>
        </div>
      </div>
      <aside className="bg-brand-gradient relative hidden overflow-hidden lg:block" aria-hidden="true">
        <div className="absolute -top-24 -right-24 size-96 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 -left-20 size-[28rem] rounded-full bg-black/10" />
        <div className="relative flex h-full flex-col justify-center px-14 text-white">
          <p className="max-w-md text-4xl leading-tight font-extrabold tracking-tight">Verify customers with a link, decide with confidence.</p>
          <div className="mt-10 grid max-w-md gap-3">
            {[
              { icon: KeyRound, t: 'Test keys the minute you sign up' },
              { icon: BadgeCheck, t: 'Document, face and liveness in one call' },
              { icon: ShieldCheck, t: 'No ID data ever shown in this portal' },
            ].map(({ icon: Icon, t }) => (
              <div key={t} className="flex items-center gap-3 rounded-2xl bg-white/12 px-4 py-3 backdrop-blur-sm">
                <span className="grid size-9 place-items-center rounded-full bg-white text-brand-600">
                  <Icon className="size-4" />
                </span>
                <span className="text-sm font-medium">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}

function PasswordInput({ id, autoComplete }: { id: string; autoComplete: string }) {
  const [shown, setShown] = useState(false)
  return (
    <div className="relative">
      <input id={id} name={id} type={shown ? 'text' : 'password'} required minLength={12} autoComplete={autoComplete} className={inputClass + ' pr-12'} placeholder="At least 12 characters" />
      <button type="button" onClick={() => setShown((s) => !s)} className="absolute top-1/2 right-3 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-tile" aria-label={shown ? 'Hide password' : 'Show password'}>
        {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}

export function Login() {
  const navigate = useNavigate()
  const submit = (e: FormEvent) => {
    e.preventDefault()
    navigate('/app') // demo: no backend yet
  }
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to manage your keys, usage and billing."
      footer={
        <>
          New to Assay?{' '}
          <Link to="/signup" className="font-semibold text-brand-600">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Work email">
          <input name="email" type="email" required autoComplete="email" className={inputClass} placeholder="you@company.sl" />
        </Field>
        <Field label="Password">
          <PasswordInput id="password" autoComplete="current-password" />
        </Field>
        <div className="flex justify-end">
          <a href="#" className="text-sm font-semibold text-brand-600">
            Forgot password?
          </a>
        </div>
        <Button type="submit" className="w-full">
          Log in
          <ArrowRight className="size-4" />
        </Button>
      </form>
    </AuthLayout>
  )
}

export function Signup() {
  const navigate = useNavigate()
  const [sent, setSent] = useState(false)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSent(true)
  }
  if (sent) {
    return (
      <AuthLayout title="Check your email" subtitle="We sent a confirmation link. Open it to finish creating your account." footer={<Link to="/login" className="font-semibold text-brand-600">Back to log in</Link>}>
        <div className="rounded-3xl bg-panel p-5 text-sm text-muted">
          The link works for 24 hours. Didn&apos;t get it? Check spam, or{' '}
          <button className="font-semibold text-brand-600" onClick={() => setSent(false)}>
            try again
          </button>
          .
          <Button variant="light" className="mt-4 w-full" onClick={() => navigate('/app')}>
            Continue to the demo dashboard
          </Button>
        </div>
      </AuthLayout>
    )
  }
  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start in test mode for free. Live access after a short business review."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-600">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <input name="name" required autoComplete="name" className={inputClass} placeholder="Aminata Kamara" />
          </Field>
          <Field label="Company">
            <input name="company" required autoComplete="organization" className={inputClass} placeholder="Kora Microfinance" />
          </Field>
        </div>
        <Field label="Work email">
          <input name="email" type="email" required autoComplete="email" className={inputClass} placeholder="you@company.sl" />
        </Field>
        <Field label="Password" hint="Use 12 or more characters. You'll set up two-step sign-in before going live.">
          <PasswordInput id="new-password" autoComplete="new-password" />
        </Field>
        <label className="flex items-start gap-3 text-sm text-muted">
          <input type="checkbox" required className="mt-0.5 size-4 accent-[#f26430]" />
          <span>
            I agree to the{' '}
            <a href="#" className="font-semibold text-ink underline-offset-2 hover:underline">
              terms of service
            </a>{' '}
            and{' '}
            <a href="#" className="font-semibold text-ink underline-offset-2 hover:underline">
              privacy notice
            </a>
            .
          </span>
        </label>
        <Button type="submit" variant="brand" className="w-full">
          Create account
          <ArrowRight className="size-4" />
        </Button>
      </form>
    </AuthLayout>
  )
}

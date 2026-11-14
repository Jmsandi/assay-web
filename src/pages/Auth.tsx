import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { ArrowRight, BadgeCheck, Eye, EyeOff, KeyRound, Loader2, ShieldCheck } from 'lucide-react'
import { Button, Field, Logo, Notice, inputClass } from '../components/ui'
import { ApiError } from '../lib/api'
import { useSession } from '../lib/session'

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
      <input id={id} name="password" type={shown ? 'text' : 'password'} required minLength={12} maxLength={200} autoComplete={autoComplete} className={inputClass + ' pr-12'} placeholder="At least 12 characters" />
      <button type="button" onClick={() => setShown((s) => !s)} className="absolute top-1/2 right-3 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-tile" aria-label={shown ? 'Hide password' : 'Show password'}>
        {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}

/** Where to go after signing in: a safe in-site path from ?next=, else the dashboard. */
function useNext() {
  const [params] = useSearchParams()
  const next = params.get('next') ?? ''
  return next.startsWith('/app') || next.startsWith('/admin') ? next : '/app'
}

export function Login() {
  const navigate = useNavigate()
  const next = useNext()
  const { me, signIn } = useSession()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  if (me) return <Navigate to={next} replace />
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setBusy(true)
    setError('')
    try {
      await signIn('/api/auth/login', { email: String(f.get('email')).trim(), password: String(f.get('password')) })
      navigate(next, { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.')
      setBusy(false)
    }
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
        {error && <Notice>{error}</Notice>}
        <Field label="Work email">
          <input name="email" type="email" required autoComplete="email" className={inputClass} placeholder="you@company.sl" />
        </Field>
        <Field label="Password" hint="Forgot it? Ask your organisation's owner, or contact Geneline-X support.">
          <PasswordInput id="password" autoComplete="current-password" />
        </Field>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          Log in
          <ArrowRight className="size-4" />
        </Button>
      </form>
    </AuthLayout>
  )
}

export function Signup() {
  const navigate = useNavigate()
  const { me, signIn } = useSession()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  if (me) return <Navigate to="/app" replace />
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setBusy(true)
    setError('')
    try {
      await signIn('/api/auth/signup', {
        name: String(f.get('name')).trim(),
        company: String(f.get('company')).trim(),
        email: String(f.get('email')).trim(),
        password: String(f.get('password')),
      })
      navigate('/app?welcome=1', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.')
      setBusy(false)
    }
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
        {error && <Notice>{error}</Notice>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <input name="name" required maxLength={100} autoComplete="name" className={inputClass} placeholder="Aminata Kamara" />
          </Field>
          <Field label="Company">
            <input name="company" required maxLength={120} autoComplete="organization" className={inputClass} placeholder="Kora Microfinance" />
          </Field>
        </div>
        <Field label="Work email">
          <input name="email" type="email" required maxLength={254} autoComplete="email" className={inputClass} placeholder="you@company.sl" />
        </Field>
        <Field label="Password" hint="Use 12 or more characters.">
          <PasswordInput id="new-password" autoComplete="new-password" />
        </Field>
        <label className="flex items-start gap-3 text-sm text-muted">
          <input type="checkbox" required className="mt-0.5 size-4 accent-[#f26430]" />
          <span>I agree to the terms of service and privacy notice.</span>
        </label>
        <Button type="submit" variant="brand" className="w-full" disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          Create account
          <ArrowRight className="size-4" />
        </Button>
      </form>
    </AuthLayout>
  )
}

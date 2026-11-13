import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router'
import { ArrowDownRight, ArrowUpRight, X } from 'lucide-react'
import { cx } from '../lib/format'
import { outcomeLabel, type Outcome } from '../data/mock'

export function Logo({ to = '/', invert = false }: { to?: string; invert?: boolean }) {
  return (
    <Link to={to} className="flex items-center gap-2.5" aria-label="Assay home">
      <span className="bg-brand-gradient grid size-9 place-items-center rounded-full shadow-[0_6px_16px_-6px_rgb(242_100_48/0.8)]">
        <svg viewBox="0 0 64 64" className="size-5" aria-hidden="true">
          <path d="M20 46 32 16l12 30" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="m25 36 5 5 10-11" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className={cx('text-lg font-bold tracking-tight', invert ? 'text-white' : 'text-ink')}>Assay</span>
    </Link>
  )
}

type Variant = 'dark' | 'light' | 'brand' | 'ghost'
const variants: Record<Variant, string> = {
  dark: 'bg-ink text-panel hover:bg-ink-soft dark:bg-white dark:text-[#141416] dark:hover:bg-zinc-200',
  light: 'bg-tile text-ink hover:bg-line',
  brand: 'bg-brand-gradient text-white hover:brightness-105',
  ghost: 'text-ink hover:bg-tile',
}

export function Button({
  variant = 'dark',
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cx('rounded-[var(--radius-card)] bg-panel p-5', className)}>{children}</section>
}

export function Change({ pct, onBrand = false }: { pct: number; onBrand?: boolean }) {
  const up = pct >= 0
  return (
    <span
      className={cx(
        'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold',
        onBrand ? 'bg-white/20 text-white' : up ? 'bg-ok-soft text-ok' : 'bg-bad-soft text-bad',
      )}
    >
      {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
      {Math.abs(pct)}%
    </span>
  )
}

const outcomeDot: Record<Outcome, string> = {
  approved: 'bg-ok',
  review: 'bg-warn',
  retake: 'bg-brand-500',
  rejected: 'bg-bad',
  processing: 'bg-muted',
}

export function OutcomeBadge({ outcome }: { outcome: Outcome }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-ink">
      <span className={cx('size-1.5 rounded-full', outcomeDot[outcome])} aria-hidden="true" />
      {outcomeLabel[outcome]}
    </span>
  )
}

export function Pill({ tone = 'neutral', children }: { tone?: 'neutral' | 'ok' | 'warn' | 'bad' | 'brand'; children: ReactNode }) {
  const tones = {
    neutral: 'bg-tile text-muted',
    ok: 'bg-ok-soft text-ok',
    warn: 'bg-warn-soft text-[#9a7300] dark:text-warn',
    bad: 'bg-bad-soft text-bad',
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300',
  }
  return <span className={cx('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', tones[tone])}>{children}</span>
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  // Portalled to <body> so no animated ancestor's stacking context can put it
  // under the phone tab bar.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-panel p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-[28px]" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="grid size-9 place-items-center rounded-full bg-tile text-muted hover:text-ink" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

export const inputClass =
  'w-full rounded-2xl border border-line bg-panel px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand-400 focus:ring-4 focus:ring-brand-500/15'

/** Dark mode, remembered per browser. Storage may be unavailable; the UI still works. */
export function useTheme() {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem('assay-theme')
      return saved ? saved === 'dark' : false
    } catch {
      return false
    }
  })
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try {
      localStorage.setItem('assay-theme', dark ? 'dark' : 'light')
    } catch {
      /* private mode: not remembered */
    }
  }, [dark])
  return [dark, setDark] as const
}

import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import {
  Bell,
  BookOpen,
  ChevronDown,
  CircleHelp,
  Info,
  KeyRound,
  LayoutGrid,
  LogOut,
  Moon,
  ScanFace,
  Search,
  Settings,
  Sun,
  Wallet,
  Webhook,
  X,
} from 'lucide-react'
import { Logo, useTheme } from '../components/ui'
import { cx } from '../lib/format'
import { organisation } from '../data/mock'

const tabs = [
  { to: '/app', label: 'Overview', icon: LayoutGrid, end: true },
  { to: '/app/verifications', label: 'Verifications', icon: ScanFace },
  { to: '/app/keys', label: 'API keys', icon: KeyRound },
  { to: '/app/billing', label: 'Billing', icon: Wallet },
  { to: '/app/webhooks', label: 'Webhooks', icon: Webhook },
  { to: '/app/settings', label: 'Settings', icon: Settings },
]

function RailButton({ label, children, onClick, active }: { label: string; children: React.ReactNode; onClick?: () => void; active?: boolean }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} className={cx('grid size-10 place-items-center rounded-full transition', active ? 'bg-ink text-panel' : 'text-muted hover:bg-tile hover:text-ink')}>
      {children}
    </button>
  )
}

export default function AppLayout() {
  const [dark, setDark] = useTheme()
  const [menu, setMenu] = useState(false)
  const { pathname } = useLocation()
  return (
    <div className="min-h-dvh p-0 sm:p-4 lg:p-6">
      <div className="mx-auto min-h-[calc(100dvh-3rem)] max-w-[1400px] bg-shell px-3 pt-3 pb-24 sm:rounded-[36px] sm:px-5 sm:pt-5 lg:pb-6">
        {/* Top bar */}
        <header className="flex items-center gap-3">
          <div className="rounded-full bg-panel py-1.5 pr-4 pl-1.5">
            <Logo to="/app" />
          </div>
          <nav className="mx-auto hidden items-center gap-1 rounded-full bg-panel p-1.5 lg:flex" aria-label="Dashboard">
            {tabs.map((t) => (
              <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => cx('rounded-full px-4 py-2 text-sm font-medium transition', isActive ? 'bg-ink text-panel' : 'text-muted hover:text-ink')}>
                {t.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <div className="hidden items-center gap-1 rounded-full bg-panel p-1.5 sm:flex">
              <RailButton label="Search">
                <Search className="size-[18px]" />
              </RailButton>
              <RailButton label="Notifications">
                <span className="relative">
                  <Bell className="size-[18px]" />
                  <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-brand-500 ring-2 ring-panel" />
                </span>
              </RailButton>
              <RailButton label="Status">
                <Info className="size-[18px]" />
              </RailButton>
            </div>
            <div className="relative">
              <button onClick={() => setMenu((m) => !m)} className="flex items-center gap-2.5 rounded-full bg-panel p-1.5 pr-3" aria-expanded={menu} aria-haspopup="menu">
                <span className="bg-brand-gradient grid size-9 place-items-center rounded-full text-xs font-bold text-white">{organisation.owner.initials}</span>
                <span className="hidden text-left leading-tight md:block">
                  <span className="block text-sm font-semibold">{organisation.owner.name}</span>
                  <span className="block max-w-[150px] truncate text-xs text-muted">{organisation.name}</span>
                </span>
                <ChevronDown className="size-4 text-muted" />
              </button>
              {menu && (
                <div role="menu" className="absolute right-0 z-30 mt-2 w-56 rounded-3xl bg-panel p-2 shadow-[var(--shadow-float)]">
                  <Link role="menuitem" to="/app/settings" onClick={() => setMenu(false)} className="flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm hover:bg-tile">
                    <Settings className="size-4" /> Settings
                  </Link>
                  <Link role="menuitem" to="/" className="flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm text-bad hover:bg-tile">
                    <LogOut className="size-4" /> Log out
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="mt-5 flex gap-5">
          {/* Left rail (desktop) */}
          <aside className="hidden w-14 shrink-0 flex-col items-center gap-4 md:flex" aria-label="Quick actions">
            <div className="flex flex-col gap-1 rounded-full bg-panel p-1.5">
              <RailButton label="Light mode" active={!dark} onClick={() => setDark(false)}>
                <Sun className="size-[18px]" />
              </RailButton>
              <RailButton label="Dark mode" active={dark} onClick={() => setDark(true)}>
                <Moon className="size-[18px]" />
              </RailButton>
            </div>
            <nav className="flex flex-col gap-1 rounded-full bg-panel p-1.5" aria-label="Sections">
              {tabs.map((t) => (
                <NavLink key={t.to} to={t.to} end={t.end} title={t.label} aria-label={t.label} className={({ isActive }) => cx('grid size-10 place-items-center rounded-full transition', isActive ? 'bg-ink text-panel' : 'text-muted hover:bg-tile hover:text-ink')}>
                  <t.icon className="size-[18px]" />
                </NavLink>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-1 rounded-full bg-panel p-1.5">
              <a href="https://assay.geneline-x.net" target="_blank" rel="noreferrer" title="API docs" aria-label="API docs" className="grid size-10 place-items-center rounded-full text-muted hover:bg-tile hover:text-ink">
                <BookOpen className="size-[18px]" />
              </a>
              <RailButton label="Help">
                <CircleHelp className="size-[18px]" />
              </RailButton>
              <Link to="/" title="Log out" aria-label="Log out" className="grid size-10 place-items-center rounded-full text-muted hover:bg-tile hover:text-ink">
                <LogOut className="size-[18px]" />
              </Link>
            </div>
          </aside>

          <main className="min-w-0 flex-1" key={pathname}>
            <DemoNotice />
            <Outlet />
          </main>
        </div>
      </div>

      {/* Bottom tab bar (phones and tablets) */}
      <nav className="fixed inset-x-3 bottom-3 z-40 flex justify-between rounded-full bg-ink p-1.5 shadow-[var(--shadow-float)] lg:hidden" style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }} aria-label="Dashboard">
        {tabs.slice(0, 5).map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end} aria-label={t.label} className={({ isActive }) => cx('flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 text-[10px] font-medium', isActive ? 'bg-panel text-ink' : 'text-panel/70')}>
            <t.icon className="size-[18px]" />
            {t.label.split(' ')[0]}
          </NavLink>
        ))}
        <button onClick={() => setDark(!dark)} aria-label={dark ? 'Light mode' : 'Dark mode'} className="flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 text-[10px] font-medium text-panel/70 md:hidden">
          {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
          Theme
        </button>
      </nav>
    </div>
  )
}

function DemoNotice() {
  const [hidden, setHidden] = useState(false)
  if (hidden) return null
  return (
    <div className="mb-4 flex items-center gap-3 rounded-2xl bg-brand-50 px-4 py-2.5 text-sm text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
      <Info className="size-4 shrink-0" />
      <span className="flex-1">Demo data. The portal is not connected to the Assay API yet, and prices are placeholders.</span>
      <button onClick={() => setHidden(true)} aria-label="Dismiss" className="grid size-7 place-items-center rounded-full hover:bg-brand-100 dark:hover:bg-brand-500/20">
        <X className="size-3.5" />
      </button>
    </div>
  )
}

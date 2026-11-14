import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { BookOpen, Building2, ChevronDown, Gauge, KeyRound, LayoutGrid, LogOut, Moon, ScanFace, Settings, Shield, Sun, Wallet, Webhook } from 'lucide-react'
import { Logo, useTheme } from '../components/ui'
import { cx } from '../lib/format'
import { roleLabel } from '../lib/api'
import { useMe, useSession } from '../lib/session'

const appTabs = [
  { to: '/app', label: 'Overview', icon: LayoutGrid, end: true },
  { to: '/app/verifications', label: 'Verifications', icon: ScanFace },
  { to: '/app/keys', label: 'API keys', icon: KeyRound },
  { to: '/app/billing', label: 'Billing', icon: Wallet },
  { to: '/app/webhooks', label: 'Webhooks', icon: Webhook },
  { to: '/app/settings', label: 'Settings', icon: Settings },
]

const adminTabs = [
  { to: '/admin', label: 'Overview', icon: Gauge, end: true },
  { to: '/admin/organisations', label: 'Organisations', icon: Building2 },
]

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')

function RailButton({ label, children, onClick, active }: { label: string; children: React.ReactNode; onClick?: () => void; active?: boolean }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} className={cx('grid size-10 place-items-center rounded-full transition', active ? 'bg-ink text-panel' : 'text-muted hover:bg-tile hover:text-ink')}>
      {children}
    </button>
  )
}

export default function AppLayout() {
  const me = useMe()
  const { signOut } = useSession()
  const navigate = useNavigate()
  const [dark, setDark] = useTheme()
  const [menu, setMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()
  const admin = pathname.startsWith('/admin')
  const tabs = admin ? adminTabs : appTabs

  useEffect(() => {
    if (!menu) return
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenu(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menu])

  const logOut = async () => {
    setMenu(false)
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-dvh p-0 sm:p-4 lg:p-6">
      <div className="mx-auto min-h-[calc(100dvh-3rem)] max-w-[1400px] bg-shell px-3 pt-3 pb-24 sm:rounded-[36px] sm:px-5 sm:pt-5 lg:pb-6">
        <header className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-panel py-1.5 pr-4 pl-1.5">
            <Logo to={admin ? '/admin' : '/app'} />
            {admin && <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold tracking-wide text-panel">STAFF</span>}
          </div>
          <nav className="mx-auto hidden items-center gap-1 rounded-full bg-panel p-1.5 lg:flex" aria-label="Dashboard">
            {tabs.map((t) => (
              <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => cx('rounded-full px-4 py-2 text-sm font-medium transition', isActive ? 'bg-ink text-panel' : 'text-muted hover:text-ink')}>
                {t.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            {me.user.is_staff && (
              <Link to={admin ? '/app' : '/admin'} className="hidden items-center gap-2 rounded-full bg-panel px-4 py-3 text-sm font-semibold hover:bg-tile sm:inline-flex">
                {admin ? <LayoutGrid className="size-4" /> : <Shield className="size-4" />}
                {admin ? 'My dashboard' : 'Staff'}
              </Link>
            )}
            <div className="relative" ref={menuRef}>
              <button onClick={() => setMenu((m) => !m)} className="flex items-center gap-2.5 rounded-full bg-panel p-1.5 pr-3" aria-expanded={menu} aria-haspopup="menu">
                <span className="bg-brand-gradient grid size-9 place-items-center rounded-full text-xs font-bold text-white">{initials(me.user.name)}</span>
                <span className="hidden text-left leading-tight md:block">
                  <span className="block text-sm font-semibold">{me.user.name}</span>
                  <span className="block max-w-[150px] truncate text-xs text-muted">{me.organisation.name}</span>
                </span>
                <ChevronDown className="size-4 text-muted" />
              </button>
              {menu && (
                <div role="menu" className="absolute right-0 z-30 mt-2 w-60 rounded-3xl bg-panel p-2 shadow-[var(--shadow-float)]">
                  <div className="px-3 py-2">
                    <p className="truncate text-sm font-semibold">{me.user.email}</p>
                    <p className="text-xs text-muted">
                      {roleLabel[me.organisation.role]} · {me.organisation.name}
                    </p>
                  </div>
                  <Link role="menuitem" to="/app/settings" onClick={() => setMenu(false)} className="flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm hover:bg-tile">
                    <Settings className="size-4" /> Settings
                  </Link>
                  {me.user.is_staff && (
                    <Link role="menuitem" to={admin ? '/app' : '/admin'} onClick={() => setMenu(false)} className="flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm hover:bg-tile sm:hidden">
                      <Shield className="size-4" /> {admin ? 'My dashboard' : 'Staff pages'}
                    </Link>
                  )}
                  <button role="menuitem" onClick={logOut} className="flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-sm text-bad hover:bg-tile">
                    <LogOut className="size-4" /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="mt-6 flex gap-6">
          <aside className="sticky top-6 hidden h-[calc(100dvh-10rem)] w-14 shrink-0 flex-col items-center gap-4 md:flex" aria-label="Quick actions">
            <div className="flex flex-col gap-1 rounded-full bg-panel p-1.5">
              <RailButton label="Light mode" active={!dark} onClick={() => setDark(false)}>
                <Sun className="size-[18px]" />
              </RailButton>
              <RailButton label="Dark mode" active={dark} onClick={() => setDark(true)}>
                <Moon className="size-[18px]" />
              </RailButton>
            </div>
            <div className="mt-auto flex flex-col gap-1 rounded-full bg-panel p-1.5">
              <Link to="/docs" title="Integration guide" aria-label="Integration guide" className="grid size-10 place-items-center rounded-full text-muted hover:bg-tile hover:text-ink">
                <BookOpen className="size-[18px]" />
              </Link>
              <RailButton label="Log out" onClick={logOut}>
                <LogOut className="size-[18px]" />
              </RailButton>
            </div>
          </aside>

          <main className="min-w-0 flex-1" key={pathname}>
            <Outlet />
          </main>
        </div>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-40 flex justify-between rounded-full bg-ink p-1.5 shadow-[var(--shadow-float)] lg:hidden" style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }} aria-label="Dashboard">
        {tabs.slice(0, 5).map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end} aria-label={t.label} className={({ isActive }) => cx('flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 text-[10px] font-medium', isActive ? 'bg-panel text-ink' : 'text-panel/70')}>
            <t.icon className="size-[18px]" />
            {t.label.split(' ')[0]}
          </NavLink>
        ))}
        {admin && (
          <NavLink to="/app" aria-label="My dashboard" className="flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 text-[10px] font-medium text-panel/70">
            <LayoutGrid className="size-[18px]" />
            Mine
          </NavLink>
        )}
        <button onClick={() => setDark(!dark)} aria-label={dark ? 'Light mode' : 'Dark mode'} className="flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 text-[10px] font-medium text-panel/70 md:hidden">
          {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
          Theme
        </button>
      </nav>
    </div>
  )
}

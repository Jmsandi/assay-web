import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { Loader2 } from 'lucide-react'
import { api, clearToken, getToken, onSignedOut, setToken, type Me } from './api'

interface Session {
  me: Me | null
  loading: boolean
  refresh: () => Promise<void>
  signIn: (path: '/api/auth/login' | '/api/auth/signup', body: object) => Promise<Me>
  signOut: () => Promise<void>
}

const SessionContext = createContext<Session | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(() => getToken() !== null)

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setMe(null)
      setLoading(false)
      return
    }
    try {
      setMe(await api<Me>('GET', '/api/me'))
    } catch {
      setMe(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    return onSignedOut(() => setMe(null))
  }, [refresh])

  const signIn = useCallback(async (path: '/api/auth/login' | '/api/auth/signup', body: object) => {
    const res = await api<{ token: string; expires_at: string }>('POST', path, body)
    setToken(res.token, res.expires_at)
    const next = await api<Me>('GET', '/api/me')
    setMe(next)
    return next
  }, [])

  const signOut = useCallback(async () => {
    try {
      await api('POST', '/api/auth/logout')
    } catch {
      /* signed out locally either way */
    }
    clearToken()
    setMe(null)
  }, [])

  return <SessionContext.Provider value={{ me, loading, refresh, signIn, signOut }}>{children}</SessionContext.Provider>
}

export function useSession() {
  const s = useContext(SessionContext)
  if (!s) throw new Error('useSession outside SessionProvider')
  return s
}

/** The signed-in user's details; only use inside RequireAuth. */
export function useMe(): Me {
  const { me } = useSession()
  if (!me) throw new Error('useMe outside RequireAuth')
  return me
}

export function FullPageSpinner() {
  return (
    <div className="grid min-h-dvh place-items-center" role="status" aria-label="Loading">
      <Loader2 className="size-6 animate-spin text-muted" />
    </div>
  )
}

export function RequireAuth({ staff = false, children }: { staff?: boolean; children: ReactNode }) {
  const { me, loading } = useSession()
  const location = useLocation()
  if (loading) return <FullPageSpinner />
  if (!me) return <Navigate to={staff ? '/admin/login' : `/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  if (staff && !me.user.is_staff) return <Navigate to="/app" replace />
  return <>{children}</>
}

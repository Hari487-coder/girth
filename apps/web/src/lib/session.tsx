import { createContext, useCallback, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { UserRole } from '@girth/domain'
import { api, ApiError } from './api'
import { Loading } from '../components/ui'

export interface SessionUser {
  id: string
  name: string
  role: UserRole
  organisationId: string | null
  farmerId: string | null
}

interface SessionValue {
  user: SessionUser | null
  loading: boolean
  login: (identifier: string, password: string) => Promise<SessionUser>
  logout: () => Promise<void>
}

const SessionContext = createContext<SessionValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const me = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        const data = await api<{ user: SessionUser | null }>('/auth/me')
        return data.user
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null
        throw error
      }
    },
    retry: false,
    staleTime: 5 * 60_000,
  })

  const login = useCallback(
    async (identifier: string, password: string) => {
      const data = await api<{ user: SessionUser }>('/auth/login', { body: { identifier, password } })
      queryClient.setQueryData(['me'], data.user)
      return data.user
    },
    [queryClient],
  )

  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' })
    queryClient.setQueryData(['me'], null)
    queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== 'me' })
  }, [queryClient])

  const value = useMemo<SessionValue>(
    () => ({ user: me.data ?? null, loading: me.isPending, login, logout }),
    [me.data, me.isPending, login, logout],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext)
  if (!value) throw new Error('useSession must be used inside SessionProvider')
  return value
}

/** Where each role lands after signing in. */
export function homeFor(role: UserRole): string {
  switch (role) {
    case 'FARMER':
      return '/farm'
    case 'FIELD_AUDITOR':
      return '/review'
    case 'ADMIN':
      return '/admin'
    case 'ORGANISATION':
      return '/org'
    case 'CUSTOMER':
      return '/my-trees'
  }
}

export function RequireRole({ roles, children }: { roles: UserRole[]; children: ReactNode }) {
  const { user, loading } = useSession()
  const location = useLocation()
  if (loading) return <Loading label="Checking your session" />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!roles.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />
  return <>{children}</>
}

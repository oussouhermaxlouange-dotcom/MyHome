import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { router } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { apiRequest, type ApiUser, type AuthResponse } from './api'

const TOKEN_KEY = 'myhome-token'

interface AuthContextValue {
  user: ApiUser | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<ApiUser>
  register: (payload: RegisterPayload) => Promise<ApiUser>
  logout: () => Promise<void>
  requireAuth: (redirectPath?: string) => boolean
  refreshUser: () => Promise<void>
}

export interface RegisterPayload {
  firstName: string
  lastName: string
  email: string
  password: string
  role: 'tenant' | 'landlord'
  phone?: string
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const bootstrap = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY)
        if (!storedToken) return
        const me = await apiRequest<ApiUser>('/api/auth/me', { token: storedToken })
        if (!cancelled) { setToken(storedToken); setUser(me) }
      } catch {
        await SecureStore.deleteItemAsync(TOKEN_KEY)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    void bootstrap()
    return () => { cancelled = true }
  }, [])

  const persist = useCallback(async (auth: AuthResponse) => {
    await SecureStore.setItemAsync(TOKEN_KEY, auth.token)
    setToken(auth.token)
    setUser(auth.user)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const auth = await apiRequest<AuthResponse>('/api/auth/login', { method: 'POST', body: { email, password } })
    await persist(auth)
    return auth.user
  }, [persist])

  const register = useCallback(async (payload: RegisterPayload) => {
    const auth = await apiRequest<AuthResponse>('/api/auth/register', { method: 'POST', body: payload })
    await persist(auth)
    return auth.user
  }, [persist])

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const requireAuth = useCallback((redirectPath?: string) => {
    if (token) return true
    const query = redirectPath ? '?redirect=' + encodeURIComponent(redirectPath) : ''
    router.push('/auth' + query)
    return false
  }, [token])

  const refreshUser = useCallback(async () => {
    if (!token) return
    setUser(await apiRequest<ApiUser>('/api/auth/me', { token }))
  }, [token])

  const value = useMemo(
    () => ({ user, token, isLoading, login, register, logout, requireAuth, refreshUser }),
    [user, token, isLoading, login, register, logout, requireAuth, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth doit être utilisé dans AuthProvider.')
  return context
}

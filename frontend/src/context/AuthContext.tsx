import React, { createContext, useContext, useEffect, useState } from 'react'
import { apiRequest, type ApiUser, type AuthResponse } from '@/lib/api'

export interface UserProfile extends ApiUser {}

export interface RegisterInput {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  role: 'tenant' | 'landlord'
}

interface AuthContextValue {
  user: UserProfile | null
  token: string | null
  login: (role: 'tenant' | 'landlord') => void
  loginWithPassword: (email: string, password: string) => Promise<UserProfile>
  registerAccount: (input: RegisterInput) => Promise<UserProfile>
  logout: () => void
  isAuthModalOpen: boolean
  openAuthModal: () => void
  closeAuthModal: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)
const SESSION_KEY = 'myhome_auth_session'

type AuthState = { user: UserProfile | null; token: string | null }

const DEFAULT_USERS: Record<'tenant' | 'landlord', UserProfile> = {
  tenant: {
    id: 'user-tenant', firstName: 'Marc', lastName: 'Durand',
    email: 'marc.durand@example.com', role: 'tenant',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80',
    isVerified: true, fileCompletionPercent: 100,
  },
  landlord: {
    id: 'user-landlord', firstName: 'Sophie', lastName: 'Martin',
    email: 'sophie.martin@example.com', role: 'landlord',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&q=80',
    isVerified: true,
  },
}

function readSession(): AuthState {
  try {
    const saved = sessionStorage.getItem(SESSION_KEY)
    if (!saved) return { user: null, token: null }
    const parsed = JSON.parse(saved) as Partial<AuthResponse>
    if (parsed.token && parsed.user?.id && parsed.user?.email) {
      return { user: parsed.user, token: parsed.token }
    }
  } catch {
    return { user: null, token: null }
  }
  return { user: null, token: null }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(readSession)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  useEffect(() => {
    const state = auth.token ? { token: auth.token, user: auth.user } : null
    if (state) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(state))
    } else {
      sessionStorage.removeItem(SESSION_KEY)
    }
  }, [auth])

  const login = (role: 'tenant' | 'landlord') => {
    const demoUser = DEFAULT_USERS[role]
    setAuth({ user: demoUser, token: `demo-${role}` })
    setIsAuthModalOpen(false)
  }

  const acceptResponse = (response: AuthResponse) => {
    setAuth({ user: response.user, token: response.token })
    setIsAuthModalOpen(false)
    return response.user
  }

  const loginWithPassword = async (email: string, password: string) => {
    const response = await apiRequest<AuthResponse>('/api/auth/login', {
      method: 'POST', body: { email, password },
    })
    return acceptResponse(response)
  }

  const registerAccount = async (input: RegisterInput) => {
    const response = await apiRequest<AuthResponse>('/api/auth/register', {
      method: 'POST', body: input,
    })
    return acceptResponse(response)
  }

  const logout = () => {
    setAuth({ user: null, token: null })
    setIsAuthModalOpen(false)
  }

  return (
    <AuthContext.Provider value={{
      user: auth.user,
      token: auth.token,
      login,
      loginWithPassword,
      registerAccount,
      logout,
      isAuthModalOpen,
      openAuthModal: () => setIsAuthModalOpen(true),
      closeAuthModal: () => setIsAuthModalOpen(false),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

/**
 * Types métiers pour les utilisateurs
 */

export type UserRole = 'tenant' | 'landlord' | 'admin'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  avatarUrl?: string
  role: UserRole
  isEmailVerified: boolean
  createdAt: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

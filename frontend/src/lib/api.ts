export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  token?: string | null
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, token, headers, ...requestOptions } = options
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
  const response = await fetch(API_BASE_URL + path, {
    ...requestOptions,
    headers: {
      ...(body === undefined || isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...headers,
    },
    ...(body === undefined ? {} : { body: isFormData ? body : JSON.stringify(body) }),
  })

  const payload: unknown = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) {
    const detail = payload && typeof payload === 'object' && 'detail' in payload
      ? (payload as { detail?: unknown }).detail
      : null
    const message = typeof detail === 'string'
      ? detail
      : Array.isArray(detail) && typeof detail[0]?.msg === 'string'
        ? detail[0].msg
        : 'Une erreur est survenue. Réessayez.'
    throw new ApiError(message, response.status)
  }

  return payload as T
}

export interface ApiUser {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  role: 'tenant' | 'landlord' | 'admin'
  avatarUrl?: string | null
  isVerified?: boolean
  fileCompletionPercent?: number
}

export interface AuthResponse {
  token: string
  user: ApiUser
}

export interface ApiApartment {
  id: string
  title: string
  description: string
  type: 'apartment' | 'house' | 'room' | 'studio' | 'loft'
  status: 'available' | 'rented' | 'pending' | 'reserved'
  price: number
  charges?: number
  surface: number
  rooms: number
  bedrooms: number
  bathrooms?: number
  floor?: number | null
  totalFloors?: number | null
  address: { street: string; city: string; zipCode: string; country: string; lat?: number | null; lng?: number | null }
  photos: string[]
  hasVirtualTour: boolean
  hasVideo: boolean
  energyScore: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'
  amenities: string[]
  badges: { id: string; label: string; variant: 'primary' | 'success' | 'warning' | 'info' }[]
  landlord: { id: string; firstName: string; lastName: string; avatarUrl?: string | null; isVerified: boolean; responseRate?: number | null }
  publishedAt: string
  updatedAt: string
  isFeatured: boolean
  isOneClickCompatible: boolean
}

export interface ApiApplication {
  id: string
  apartmentId: string
  firstName: string
  lastName: string
  situation: string
  monthlyIncome: number
  guarantorIncome?: number | null
  solvabilityScore: 'green' | 'orange' | 'red'
  solvabilityRatio: number
  fileCompletionPercent: number
  isFileVerified: boolean
  submittedAt: string
  status: 'pending' | 'pre_validated' | 'rejected' | 'accepted'
  message?: string | null
}

export interface ApiVisitSlot {
  id: string
  date: string
  startTime: string
  endTime: string
  isAvailable: boolean
  isBooked: boolean
}


export interface ApiConversation {
  apartmentId: string
  apartmentTitle: string
  otherUserId: string
  otherUserName: string
  lastMessage: string
  lastTimestamp: string
  unreadCount: number
}

export interface ApiMessage {
  id: string
  senderId: string
  receiverId: string
  apartmentId: string
  apartmentTitle: string
  content: string
  timestamp: string
}

export interface AdminUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role: 'tenant' | 'landlord'
  isBlocked: boolean
  createdAt: string
}

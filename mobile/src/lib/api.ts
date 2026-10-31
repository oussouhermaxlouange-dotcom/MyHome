import { API_BASE_URL, COLORS } from '../config'

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
      ...(token ? { Authorization: 'Bearer ' + String(token) } : {}),
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
      : Array.isArray(detail) && detail.length > 0 && typeof detail[0] === 'object' && detail[0] !== null && 'msg' in detail[0]
        ? String((detail[0] as { msg?: unknown }).msg)
        : 'Une erreur est survenue. Réessayez.'
    throw new ApiError(message, response.status)
  }

  return payload as T
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA'
}

export const ENERGY_COLORS: Record<string, string> = {
  A: COLORS.success,
  B: COLORS.success,
  C: COLORS.primary,
  D: COLORS.warning,
  E: COLORS.warning,
  F: COLORS.danger,
  G: COLORS.danger,
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

export interface ApiAddress {
  street: string
  city: string
  zipCode: string
  country: string
  lat?: number | null
  lng?: number | null
}

export interface ApiBadge {
  id: string
  label: string
  variant: 'primary' | 'success' | 'warning' | 'info'
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
  address: ApiAddress
  photos: string[]
  hasVirtualTour: boolean
  hasVideo: boolean
  energyScore: string
  amenities: string[]
  badges: ApiBadge[]
  landlord: { id: string; firstName: string; lastName: string; avatarUrl?: string | null; isVerified: boolean; responseRate?: number | null }
  publishedAt: string
  updatedAt: string
  isFeatured: boolean
  isOneClickCompatible: boolean
}

export interface ApiVisitSlot {
  id: string
  date: string
  startTime: string
  endTime: string
  isAvailable: boolean
  isBooked: boolean
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

export interface ApiConversation {
  id: string
  tenantId: string
  landlordId: string
  createdAt: string
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
  conversationId?: string | null
  senderId: string
  receiverId: string
  apartmentId: string
  apartmentTitle: string
  content: string
  isRead?: boolean
  timestamp: string
  createdAt?: string
}

export interface ApiPassDocument {
  id: string
  kind: 'identity' | 'income'
  label: string
  status: string
}

export interface ApiPass {
  userId: string
  completionPercent: number
  isReady: boolean
  documents: ApiPassDocument[]
}

export const TYPE_LABELS: Record<string, string> = {
  apartment: 'Appartement',
  house: 'Maison',
  room: 'Chambre',
  studio: 'Studio',
  loft: 'Loft',
}

export const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  pre_validated: 'Pré- validée',
  accepted: 'Acceptée',
  rejected: 'Rejetée',
  available: 'Disponible',
  rented: 'Loué',
  reserved: 'Réservé',
}

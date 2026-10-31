/**
 * Types métiers pour les annonces immobilières
 */

// ─── Énumérations ─────────────────────────────────────────────────────────────

export type ApartmentType = 'apartment' | 'house' | 'room' | 'studio' | 'loft'

export type EnergyScore = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'

export type ApartmentStatus = 'available' | 'rented' | 'pending' | 'reserved'

export type DocumentStatus = 'validated' | 'pending' | 'rejected'

// ─── Entités ──────────────────────────────────────────────────────────────────

export interface Address {
  street: string
  city: string
  zipCode: string
  country: string
  /** Coordonnées GPS pour la carte */
  lat?: number
  lng?: number
}

export interface Landlord {
  id: string
  firstName: string
  lastName: string
  avatarUrl?: string
  /** Vérifié par la plateforme */
  isVerified: boolean
  responseRate?: number // 0-100%
}

export interface ApartmentBadge {
  id: string
  label: string
  /** Nom d'icône Lucide */
  icon?: string
  variant: 'primary' | 'success' | 'warning' | 'info'
}

export interface Apartment {
  id: string
  title: string
  description: string
  type: ApartmentType
  status: ApartmentStatus

  // Informations de base
  price: number              // Loyer mensuel en XOF (FCFA)
  charges?: number           // Charges mensuelles en XOF (FCFA)
  surface: number            // Surface en m²
  rooms: number              // Nombre de pièces
  bedrooms: number           // Nombre de chambres
  floor?: number
  totalFloors?: number

  // Localisation
  address: Address

  // Médias
  photos: string[]           // URLs des photos
  hasVirtualTour: boolean    // Visite 3D disponible
  hasVideo: boolean          // Vidéo/Reels disponible

  // Qualités
  energyScore: EnergyScore
  amenities: string[]        // ['parking', 'balcony', 'elevator', ...]

  // Badges dynamiques affichés sur la carte
  badges: ApartmentBadge[]

  // Meta
  landlord: Landlord
  publishedAt: string        // ISO date string
  updatedAt: string
  isFeatured: boolean
  isOneClickCompatible: boolean  // Dossier candidature en 1 clic
}

// ─── Filtres de recherche ─────────────────────────────────────────────────────

export interface SearchFilters {
  query?: string
  city?: string
  minPrice?: number
  maxPrice?: number
  minSurface?: number
  maxSurface?: number
  minRooms?: number
  maxRooms?: number
  type?: ApartmentType[]
  energyScore?: EnergyScore[]
  hasVirtualTour?: boolean
  hasVideo?: boolean
  isOneClickCompatible?: boolean
  /** Commute Search — lieu de travail */
  commuteLocation?: string
  maxCommuteMinutes?: number
  /** Animaux de compagnie acceptés */
  petsAllowed?: boolean
}

export type ViewMode = 'grid' | 'map' | 'video'

// ─── Dossier de candidature ───────────────────────────────────────────────────

export interface Document {
  id: string
  name: string
  type: string               // 'id_card' | 'payslip' | 'tax_notice' | ...
  status: DocumentStatus
  uploadedAt?: string
  expiresAt?: string
  /** Message d'erreur de validation IA */
  rejectionReason?: string
}

export interface CandidatureFile {
  id: string
  userId: string
  completionPercent: number  // 0-100
  documents: Document[]
  isOneClickReady: boolean
  lastUpdated: string
}

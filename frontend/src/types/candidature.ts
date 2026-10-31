/**
 * Types pour la candidature et la réservation de créneau de visite.
 */

export type CandidatureStatus =
  | 'not_started'
  | 'draft'
  | 'submitted'
  | 'pre_validated'
  | 'rejected'

export interface VisitSlot {
  id: string
  date: string        // ISO date string (jour)
  startTime: string   // "HH:mm"
  endTime: string     // "HH:mm"
  isAvailable: boolean
  isBooked: boolean
}

export interface BookingRequest {
  apartmentId: string
  slotId: string
  tenantId: string
}

export interface PassVerifie {
  userId: string
  completionPercent: number
  isReady: boolean        // true si 100% et tous les docs validés
  documents: PassDocument[]
}

export interface PassDocument {
  id: string
  label: string
  /** 'validated' = validé, 'pending' = en attente, 'missing' = manquant */
  status: 'validated' | 'pending' | 'missing'
}

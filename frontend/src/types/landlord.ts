/**
 * Types pour le scénario propriétaire (Sophie).
 */

export type SolvabilityScore = 'green' | 'orange' | 'red'

export interface TenantApplication {
  id: string
  apartmentId: string
  /** Prénom + Nom anonymisés jusqu'à pré-validation */
  firstName: string
  lastName: string
  /** Situation professionnelle */
  situation: string         // ex. "CDI", "CDD", "Fonctionnaire", "Étudiant"
  monthlyIncome: number     // Revenus nets mensuels en €
  guarantorIncome?: number  // Garant éventuel
  /** Score de solvabilité calculé (revenu / loyer) */
  solvabilityScore: SolvabilityScore
  solvabilityRatio: number  // ex. 3.2 (revenu = 3.2x le loyer)
  /** Complétude du dossier 0-100 */
  fileCompletionPercent: number
  isFileVerified: boolean   // Tous les docs validés par la plateforme
  submittedAt: string       // ISO date
  status: 'pending' | 'pre_validated' | 'rejected' | 'accepted'
  message?: string          // Message d'introduction du candidat
}

export interface PublishFormData {
  // Bien
  title: string
  description: string
  type: string
  surface: string
  rooms: string
  floor: string
  totalFloors: string
  // Localisation
  street: string
  city: string
  zipCode: string
  // Loyer
  price: string
  charges: string
  // Équipements
  amenities: string[]
  // Photos (fichiers locaux)
  photoFiles: File[]
  // Disponibilités
  availableSlots: AvailabilitySlotInput[]
}

export interface AvailabilitySlotInput {
  id: string
  date: string      // "YYYY-MM-DD"
  startTime: string // "HH:mm"
  endTime: string   // "HH:mm"
}

import { Platform } from 'react-native'

/**
 * URL de l'API MyHome.
 * - Android (écran/emulateur): 10.0.2.2 pointe vers la machine hôte.
 * - iOS: les simulators/simulateurs peuvent joindre localhost directement.
 * - Téléphone physique ou build de production: définissez EXPO_PUBLIC_API_URL
 *   (variable d'environnement) pour pointer sur l'IP publique du backend.
 */
const DEV_FALLBACK = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000'

export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || DEV_FALLBACK).replace(/\/$/, '')

/** Palette alignée sur le web MyHome. */
export const COLORS = {
  primary: '#0284c7',
  primaryDark: '#075985',
  slate900: '#0f172a',
  slate600: '#475569',
  slate500: '#64748b',
  slate400: '#94a3b8',
  slate200: '#e2e8f0',
  slate100: '#f1f5f9',
  white: '#ffffff',
  danger: '#dc2626',
  success: '#15803d',
  warning: '#b45309',
  background: '#f8fafc',
}

export const ROLE_LABELS: Record<string, string> = {
  tenant: 'Locataire',
  landlord: 'Bailleur',
  admin: 'Administrateur',
}

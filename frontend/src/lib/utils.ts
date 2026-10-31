import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Fusionne des classes Tailwind CSS en gérant les conflits.
 * Utilise clsx pour la logique conditionnelle + tailwind-merge pour la déduplication.
 *
 * @example
 * cn('px-4 py-2', isActive && 'bg-primary', className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Formate un prix en Franc CFA (FCFA)
 * @example formatPrice(150000) → "150 000 FCFA"
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0,
  }).format(price)
}


/**
 * Formate une surface en m²
 * @example formatSurface(45) → "45 m²"
 */
export function formatSurface(surface: number): string {
  return `${surface} m²`
}

/**
 * Retourne "il y a X jours" depuis une date ISO
 */
export function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return "Aujourd'hui"
  if (days === 1) return 'Hier'
  if (days < 7) return `Il y a ${days} jours`
  if (days < 30) return `Il y a ${Math.floor(days / 7)} semaine${days >= 14 ? 's' : ''}`
  return `Il y a ${Math.floor(days / 30)} mois`
}

/**
 * Tronque un texte à une longueur maximale
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '…'
}

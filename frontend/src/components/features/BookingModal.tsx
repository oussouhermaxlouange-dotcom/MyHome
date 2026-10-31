import { useState, useMemo } from 'react'
import { X, Calendar, Clock, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import type { VisitSlot } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BookingModalProps {
  apartmentTitle: string
  slots: VisitSlot[]
  onClose: () => void
  onConfirm: (slot: VisitSlot) => void | Promise<void>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const MONTHS_FR = ['jan.', 'fév.', 'mar.', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sep.', 'oct.', 'nov.', 'déc.']

function formatDay(isoDate: string): { short: string; dayNum: number; month: string } {
  const d = new Date(isoDate)
  return {
    short:  DAYS_FR[d.getDay()],
    dayNum: d.getDate(),
    month:  MONTHS_FR[d.getMonth()],
  }
}

function groupSlotsByDate(slots: VisitSlot[]): Map<string, VisitSlot[]> {
  const map = new Map<string, VisitSlot[]>()
  for (const slot of slots) {
    // Normalise la date au jour (sans heure)
    const key = slot.date.slice(0, 10)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(slot)
  }
  return map
}

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Modal de réservation de créneau de visite.
 *
 * Affiche les jours disponibles sous forme de colonnes,
 * avec les créneaux horaires cliquables pour chaque jour.
 * Confirmation en deux étapes : sélection puis validation.
 */
export function BookingModal({ apartmentTitle, slots, onClose, onConfirm }: BookingModalProps) {
  const [selectedSlot, setSelectedSlot] = useState<VisitSlot | null>(null)
  const [step, setStep] = useState<'select' | 'confirm' | 'done'>('select')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const slotsByDate = useMemo(() => groupSlotsByDate(slots), [slots])
  const sortedDates = useMemo(() => [...slotsByDate.keys()].sort(), [slotsByDate])

  const handleConfirm = async () => {
    if (!selectedSlot) return
    setIsSubmitting(true)
    try {
      await onConfirm(selectedSlot)
      setStep('done')
    } catch {
      // Le composant parent affiche le message retourné par l’API.
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="overlay"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50',
          'sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2',
          'sm:max-w-lg sm:w-full',
          'bg-white dark:bg-dark-card',
          'rounded-t-xl sm:rounded-xl',
          'border border-slate-200 dark:border-dark-border',
          'shadow-modal',
          'flex flex-col max-h-[90vh]',
        )}
      >
        {/* En-tête */}
        <div className="flex items-start justify-between p-4 border-b border-slate-100 dark:border-dark-border flex-shrink-0">
          <div>
            <h2
              id="booking-modal-title"
              className="text-sm font-semibold text-slate-900 dark:text-white"
            >
              {step === 'done' ? 'Visite confirmée' : 'Choisir un créneau'}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
              {apartmentTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-dark-surface transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Corps */}
        <div className="flex-1 overflow-y-auto p-4">

          {/* Étape : sélection */}
          {step === 'select' && (
            <div className="space-y-5">
              {sortedDates.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">
                  Aucun créneau disponible pour le moment.
                </p>
              ) : (
                sortedDates.map((dateKey) => {
                  const daySlots = slotsByDate.get(dateKey)!
                  const { short, dayNum, month } = formatDay(daySlots[0].date)
                  const availableSlots = daySlots.filter((s) => s.isAvailable)

                  return (
                    <div key={dateKey}>
                      {/* En-tête du jour */}
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar size={13} className="text-slate-400" aria-hidden="true" />
                        <h3 className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {short} {dayNum} {month}
                        </h3>
                        <span className="text-[10px] text-slate-400">
                          {availableSlots.length} créneau{availableSlots.length > 1 ? 'x' : ''}
                        </span>
                      </div>

                      {/* Grille de créneaux */}
                      <div
                        role="radiogroup"
                        aria-label={`Créneaux du ${short} ${dayNum} ${month}`}
                        className="flex flex-wrap gap-2"
                      >
                        {daySlots.map((slot) => {
                          const isSelected = selectedSlot?.id === slot.id
                          return (
                            <button
                              key={slot.id}
                              type="button"
                              role="radio"
                              aria-checked={isSelected}
                              aria-label={`${slot.startTime} – ${slot.endTime}${!slot.isAvailable ? ', indisponible' : ''}`}
                              disabled={!slot.isAvailable}
                              onClick={() => setSelectedSlot(slot)}
                              className={cn(
                                'flex items-center gap-1 px-3 py-1.5 text-xs border rounded transition-colors duration-150',
                                'disabled:opacity-40 disabled:cursor-not-allowed',
                                isSelected
                                  ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                                  : slot.isAvailable
                                    ? 'border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-300 hover:border-slate-400'
                                    : 'border-slate-100 dark:border-dark-border/50 text-slate-300 dark:text-slate-600',
                              )}
                            >
                              <Clock size={10} aria-hidden="true" />
                              {slot.startTime}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* Étape : confirmation */}
          {step === 'confirm' && selectedSlot && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-dark-surface rounded-lg border border-slate-200 dark:border-dark-border">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Créneau sélectionné</p>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-slate-400" aria-hidden="true" />
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {(() => {
                      const { short, dayNum, month } = formatDay(selectedSlot.date)
                      return `${short} ${dayNum} ${month}`
                    })()}
                  </p>
                  <Clock size={14} className="text-slate-400 ml-1" aria-hidden="true" />
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {selectedSlot.startTime} – {selectedSlot.endTime}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Confirmez ce créneau pour enregistrer votre réservation auprès du bailleur.
              </p>
            </div>
          )}

          {/* Étape : succès */}
          {step === 'done' && selectedSlot && (
            <div className="py-6 text-center space-y-3">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={20} className="text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  Visite confirmée
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {(() => {
                    const { short, dayNum, month } = formatDay(selectedSlot.date)
                    return `${short} ${dayNum} ${month} à ${selectedSlot.startTime}`
                  })()}
                </p>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Votre créneau a bien été réservé auprès du bailleur.
              </p>
            </div>
          )}
        </div>

        {/* Pied de page */}
        {step !== 'done' && (
          <div className="flex items-center justify-between gap-2 p-4 border-t border-slate-100 dark:border-dark-border flex-shrink-0">
            {step === 'confirm' ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep('select')}
                >
                  Retour
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                  onClick={handleConfirm}
                >
                  Confirmer la visite
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!selectedSlot}
                  onClick={() => setStep('confirm')}
                >
                  Continuer
                </Button>
              </>
            )}
          </div>
        )}

        {step === 'done' && (
          <div className="p-4 border-t border-slate-100 dark:border-dark-border flex-shrink-0">
            <Button variant="outline" size="sm" className="w-full" onClick={onClose}>
              Fermer
            </Button>
          </div>
        )}
      </div>
    </>
  )
}

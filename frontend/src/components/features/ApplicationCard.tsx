import { useState } from 'react'
import { CheckCircle, X, ChevronDown, ChevronUp, FileCheck, Clock } from 'lucide-react'
import { cn, timeAgo } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import type { TenantApplication, SolvabilityScore } from '@/types'

// ─── Config solvabilité ───────────────────────────────────────────────────────

const solvabilityConfig: Record<SolvabilityScore, { label: string; color: string; bg: string }> = {
  green:  { label: 'Solvable',    color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  orange: { label: 'Acceptable',  color: 'text-amber-700 dark:text-amber-400',     bg: 'bg-amber-50 dark:bg-amber-900/20'     },
  red:    { label: 'Insuffisant', color: 'text-red-700 dark:text-red-400',          bg: 'bg-red-50 dark:bg-red-900/20'         },
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApplicationCardProps {
  application: TenantApplication
  rentAmount: number
  onAccept: (id: string) => void
  onReject: (id: string) => void
}

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Fiche candidature pour le tableau de bord propriétaire.
 *
 * Affiche : nom, situation, ratio solvabilité, complétude dossier.
 * Actions : accepter (pré-valider) ou refuser.
 * Données discriminatoires exclues — uniquement solvabilité et garantie.
 */
export function ApplicationCard({ application, rentAmount, onAccept, onReject }: ApplicationCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [actionDone, setActionDone] = useState<'accepted' | 'rejected' | null>(
    application.status === 'accepted' ? 'accepted'
    : application.status === 'rejected' ? 'rejected'
    : null,
  )

  const solvCfg = solvabilityConfig[application.solvabilityScore]

  const handleAccept = () => {
    setActionDone('accepted')
    onAccept(application.id)
  }
  const handleReject = () => {
    setActionDone('rejected')
    onReject(application.id)
  }

  return (
    <article
      aria-label={`Candidature de ${application.firstName} ${application.lastName}`}
      className={cn(
        'border rounded-lg overflow-hidden transition-colors duration-150',
        actionDone === 'accepted' ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-900/10'
        : actionDone === 'rejected' ? 'border-slate-100 dark:border-dark-border opacity-50'
        : 'border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card',
      )}
    >
      {/* Ligne principale */}
      <div className="flex items-center gap-3 p-3">

        {/* Initiales */}
        <div
          className="w-9 h-9 rounded-full bg-slate-100 dark:bg-dark-surface flex items-center justify-center flex-shrink-0 text-sm font-semibold text-slate-500 dark:text-slate-400"
          aria-hidden="true"
        >
          {application.firstName[0]}{application.lastName[0]}
        </div>

        {/* Infos */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {application.firstName} {application.lastName}
            </p>
            <span className="text-xs text-slate-400">{application.situation}</span>

            {/* Badge solvabilité */}
            <span className={cn(
              'text-[10px] font-medium px-1.5 py-0.5 rounded',
              solvCfg.bg, solvCfg.color,
            )}>
              {application.solvabilityRatio.toFixed(1)}x le loyer
            </span>
          </div>

          {/* Dossier */}
          <div className="flex items-center gap-3 mt-1">
            <span className={cn(
              'flex items-center gap-1 text-[10px]',
              application.isFileVerified
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-400',
            )}>
              {application.isFileVerified
                ? <><FileCheck size={10} aria-hidden="true" />Dossier vérifié</>
                : <><Clock size={10} aria-hidden="true" />Dossier {application.fileCompletionPercent}%</>
              }
            </span>
            <span className="text-[10px] text-slate-400">
              {timeAgo(application.submittedAt)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {actionDone === 'accepted' && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle size={13} aria-hidden="true" />
              Pré-validé
            </span>
          )}
          {actionDone === 'rejected' && (
            <span className="text-xs text-slate-400">Refusé</span>
          )}
          {!actionDone && (
            <>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Refuser la candidature de ${application.firstName}`}
                onClick={handleReject}
                className="w-7 h-7 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <X size={14} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Accepter la candidature de ${application.firstName}`}
                onClick={handleAccept}
                className="w-7 h-7 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
              >
                <CheckCircle size={14} />
              </Button>
            </>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-label={expanded ? 'Réduire les détails' : 'Voir les détails'}
            className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-dark-surface transition-colors"
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Détails dépliables */}
      {expanded && (
        <div className="px-3 pb-3 pt-0 border-t border-slate-100 dark:border-dark-border space-y-3">

          {/* Revenus */}
          <dl className="grid grid-cols-3 gap-3 mt-3">
            <div>
              <dt className="text-[10px] text-slate-400 uppercase tracking-wide">Revenus nets</dt>
              <dd className="text-sm font-medium text-slate-900 dark:text-white mt-0.5">
                {application.monthlyIncome.toLocaleString('fr-FR')} FCFA/mois
              </dd>
            </div>
            {application.guarantorIncome && (
              <div>
                <dt className="text-[10px] text-slate-400 uppercase tracking-wide">Garant</dt>
                <dd className="text-sm font-medium text-slate-900 dark:text-white mt-0.5">
                  {application.guarantorIncome.toLocaleString('fr-FR')} FCFA/mois
                </dd>
              </div>
            )}
            <div>
              <dt className="text-[10px] text-slate-400 uppercase tracking-wide">Loyer demandé</dt>
              <dd className="text-sm font-medium text-slate-900 dark:text-white mt-0.5">
                {rentAmount.toLocaleString('fr-FR')} FCFA/mois
              </dd>
            </div>
          </dl>

          {/* Ratio solvabilité */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-slate-400">Ratio revenus / loyer</span>
              <span className={cn('text-[10px] font-semibold', solvCfg.color)}>
                {application.solvabilityRatio.toFixed(1)}x {solvCfg.label.toLowerCase()}
              </span>
            </div>
            <div
              role="meter"
              aria-valuenow={Math.min(application.solvabilityRatio * 25, 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Ratio de solvabilité : ${application.solvabilityRatio.toFixed(1)}x`}
              className="h-1.5 bg-slate-100 dark:bg-dark-surface rounded-full overflow-hidden"
            >
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  application.solvabilityScore === 'green'  ? 'bg-emerald-500' :
                  application.solvabilityScore === 'orange' ? 'bg-amber-400' : 'bg-red-400',
                )}
                style={{ width: `${Math.min(application.solvabilityRatio / 5 * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Message du candidat */}
          {application.message && (
            <div className="p-2.5 bg-slate-50 dark:bg-dark-surface rounded">
              <p className="text-[10px] text-slate-400 mb-1">Message du candidat</p>
              <p className="text-xs text-slate-600 dark:text-slate-300">{application.message}</p>
            </div>
          )}

          {/* Actions détaillées */}
          {!actionDone && (
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" className="flex-1" onClick={handleReject}
                leftIcon={<X size={13} />}>
                Refuser
              </Button>
              <Button variant="primary" size="sm" className="flex-1" onClick={handleAccept}
                leftIcon={<CheckCircle size={13} />}>
                Pré-valider et inviter à une visite
              </Button>
            </div>
          )}
        </div>
      )}
    </article>
  )
}

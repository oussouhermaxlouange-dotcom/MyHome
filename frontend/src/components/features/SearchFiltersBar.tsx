import { useState } from 'react'
import { Bike, Train, X, SlidersHorizontal, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import type { SearchFilters } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchFiltersBarProps {
  filters: SearchFilters
  onChange: (filters: SearchFilters) => void
  resultCount: number
}

type CommuteMode = 'bike' | 'transit'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BUDGET_PRESETS = [
  { label: 'Moins de 500 €', max: 500 },
  { label: '500 – 700 €',    min: 500, max: 700 },
  { label: '700 – 900 €',    min: 700, max: 900 },
  { label: 'Plus de 900 €',  min: 900 },
]

const COMMUTE_TIMES = [10, 15, 20, 30, 45]

// ─── Sous-composant : Panneau de filtre collapsable ───────────────────────────

interface FilterPanelProps {
  label: string
  isActive: boolean
  children: React.ReactNode
  onClear?: () => void
}

function FilterChip({ label, isActive, children, onClear }: FilterPanelProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          'flex items-center gap-1.5 h-8 px-3 text-sm border rounded transition-colors duration-150',
          isActive
            ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
            : 'border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500',
        )}
      >
        <span>{label}</span>
        {isActive && onClear ? (
          <span
            role="button"
            tabIndex={0}
            aria-label={`Effacer le filtre ${label}`}
            onClick={(e) => { e.stopPropagation(); onClear() }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onClear() } }}
            className="ml-0.5"
          >
            <X size={12} />
          </span>
        ) : (
          <ChevronDown
            size={12}
            className={cn('transition-transform duration-150', open && 'rotate-180')}
          />
        )}
      </button>

      {open && (
        <>
          {/* Overlay pour fermer au clic extérieur */}
          <div
            className="fixed inset-0 z-10"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-label={`Filtre ${label}`}
            className={cn(
              'absolute top-full left-0 mt-1 z-20 min-w-[220px]',
              'bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border',
              'rounded-lg shadow-soft p-3',
            )}
          >
            <div onClick={() => setOpen(false)}>
              {children}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

/**
 * Barre de filtres de recherche pour le Scénario 1.
 * Filtres : commute (trajet), budget, animaux acceptés.
 * Design : chips horizontaux, panneaux dropdown au clic.
 */
export function SearchFiltersBar({ filters, onChange, resultCount }: SearchFiltersBarProps) {
  const [commuteMode, setCommuteMode] = useState<CommuteMode>('transit')

  // Dérivés d'état
  const hasCommute = !!(filters.commuteLocation && filters.maxCommuteMinutes)
  const hasBudget  = !!(filters.maxPrice || filters.minPrice)
  const hasPets    = !!filters.petsAllowed

  const clearCommute = () => onChange({ ...filters, commuteLocation: undefined, maxCommuteMinutes: undefined })
  const clearBudget  = () => onChange({ ...filters, minPrice: undefined, maxPrice: undefined })
  const clearPets    = () => onChange({ ...filters, petsAllowed: false })

  const clearAll = () => onChange({})

  const hasAnyFilter = hasCommute || hasBudget || hasPets

  return (
    <div className="space-y-3">
      {/* Ligne de chips de filtres */}
      <div
        role="group"
        aria-label="Filtres de recherche"
        className="flex items-center gap-2 flex-wrap"
      >
        {/* Filtre Temps de trajet */}
        <FilterChip
          label={hasCommute ? `${filters.maxCommuteMinutes} min` : 'Temps de trajet'}
          isActive={hasCommute}
          onClear={clearCommute}
        >
          <fieldset className="space-y-3">
            <legend className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              Lieu de travail
            </legend>

            {/* Input adresse */}
            <input
              type="text"
              value={filters.commuteLocation ?? ''}
              onChange={(e) => onChange({ ...filters, commuteLocation: e.target.value })}
              placeholder="Ex. : 15 rue de Rivoli, Paris"
              aria-label="Adresse du lieu de travail"
              className={cn(
                'w-full h-8 px-2.5 text-sm rounded border',
                'border-slate-200 dark:border-dark-border',
                'bg-white dark:bg-dark-surface',
                'text-slate-800 dark:text-slate-200 placeholder:text-slate-400',
                'focus:outline-none focus:ring-1 focus:ring-primary/30',
              )}
              onClick={(e) => e.stopPropagation()}
            />

            {/* Mode de transport */}
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">Mode de transport</p>
              <div
                role="radiogroup"
                aria-label="Mode de transport"
                className="flex gap-1"
              >
                {([
                  { value: 'transit', label: 'Transports',  Icon: Train },
                  { value: 'bike',    label: 'Vélo',        Icon: Bike  },
                ] as const).map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={commuteMode === value}
                    onClick={(e) => { e.stopPropagation(); setCommuteMode(value) }}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 text-xs border rounded transition-colors',
                      commuteMode === value
                        ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                        : 'border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-400',
                    )}
                  >
                    <Icon size={11} aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Temps max */}
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">Temps max</p>
              <div
                role="radiogroup"
                aria-label="Temps de trajet maximum"
                className="flex flex-wrap gap-1"
              >
                {COMMUTE_TIMES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={filters.maxCommuteMinutes === t}
                    onClick={(e) => { e.stopPropagation(); onChange({ ...filters, maxCommuteMinutes: t }) }}
                    className={cn(
                      'px-2 py-0.5 text-xs border rounded transition-colors',
                      filters.maxCommuteMinutes === t
                        ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                        : 'border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-400 hover:border-slate-400',
                    )}
                  >
                    {t} min
                  </button>
                ))}
              </div>
            </div>
          </fieldset>
        </FilterChip>

        {/* Filtre Budget */}
        <FilterChip
          label={
            hasBudget
              ? filters.minPrice && filters.maxPrice
                ? `${filters.minPrice} – ${filters.maxPrice} €`
                : filters.maxPrice
                  ? `Max ${filters.maxPrice} €`
                  : `Min ${filters.minPrice} €`
              : 'Budget'
          }
          isActive={hasBudget}
          onClear={clearBudget}
        >
          <fieldset className="space-y-2">
            <legend className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              Budget mensuel
            </legend>

            {/* Presets */}
            <div
              role="radiogroup"
              aria-label="Presets de budget"
              className="space-y-1"
            >
              {BUDGET_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  role="radio"
                  aria-checked={filters.minPrice === p.min && filters.maxPrice === p.max}
                  onClick={(e) => {
                    e.stopPropagation()
                    onChange({ ...filters, minPrice: p.min, maxPrice: p.max })
                  }}
                  className={cn(
                    'w-full text-left px-2.5 py-1.5 text-xs rounded transition-colors',
                    filters.minPrice === p.min && filters.maxPrice === p.max
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'hover:bg-slate-50 dark:hover:bg-dark-surface text-slate-700 dark:text-slate-300',
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Inputs libres */}
            <div className="pt-1 border-t border-slate-100 dark:border-dark-border">
              <p className="text-[10px] text-slate-400 mb-1.5">Ou saisir un montant précis</p>
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min={0}
                    value={filters.minPrice ?? ''}
                    onChange={(e) => onChange({ ...filters, minPrice: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="Min"
                    aria-label="Budget minimum en euros"
                    onClick={(e) => e.stopPropagation()}
                    className="w-full h-7 px-2 pr-5 text-xs rounded border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">€</span>
                </div>
                <span className="text-xs text-slate-400" aria-hidden="true">–</span>
                <div className="relative flex-1">
                  <input
                    type="number"
                    min={0}
                    value={filters.maxPrice ?? ''}
                    onChange={(e) => onChange({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="Max"
                    aria-label="Budget maximum en euros"
                    onClick={(e) => e.stopPropagation()}
                    className="w-full h-7 px-2 pr-5 text-xs rounded border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">€</span>
                </div>
              </div>
            </div>
          </fieldset>
        </FilterChip>

        {/* Filtre Animaux */}
        <button
          type="button"
          role="checkbox"
          aria-checked={hasPets}
          onClick={() => onChange({ ...filters, petsAllowed: !hasPets })}
          className={cn(
            'flex items-center gap-1.5 h-8 px-3 text-sm border rounded transition-colors duration-150',
            hasPets
              ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
              : 'border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-700 dark:text-slate-300 hover:border-slate-300',
          )}
        >
          Animaux acceptés
          {hasPets && <X size={12} onClick={(e) => { e.stopPropagation(); clearPets() }} />}
        </button>

        {/* Autres filtres */}
        <Button
          variant="outline"
          size="sm"
          leftIcon={<SlidersHorizontal size={13} />}
          className="h-8"
        >
          Plus de filtres
        </Button>

        {/* Effacer tout */}
        {hasAnyFilter && (
          <button
            type="button"
            onClick={clearAll}
            className="h-8 px-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white underline-offset-2 hover:underline transition-colors"
          >
            Effacer tout
          </button>
        )}
      </div>

      {/* Résultat count */}
      <p className="text-sm text-slate-600 dark:text-slate-400">
        <span className="font-medium text-slate-900 dark:text-white">{resultCount}</span>{' '}
        {resultCount > 1 ? 'annonces' : 'annonce'}
        {hasCommute && (
          <span className="text-slate-500">
            {' '}dont le trajet est inférieur à {filters.maxCommuteMinutes} min
          </span>
        )}
      </p>
    </div>
  )
}

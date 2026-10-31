import { useState, useCallback } from 'react'
import {
  Heart,
  MapPin,
  BedDouble,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  Sparkles,
} from 'lucide-react'
import { cn, formatPrice, timeAgo } from '@/lib/utils'
import type { Apartment, EnergyScore } from '@/types'
import { useFavorites } from '@/context/FavoritesContext'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import { apiRequest } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApartmentCardProps {
  apartment: Apartment
  variant?: 'grid' | 'list'
  isFavorited?: boolean
  onFavoriteToggle?: (id: string, value: boolean) => void
  onClick?: (id: string) => void
  className?: string
}

// ─── DPE colors ───────────────────────────────────────────────────────────────

const dpeConfig: Record<EnergyScore, { bg: string; text: string }> = {
  A: { bg: 'bg-emerald-600', text: 'text-white' },
  B: { bg: 'bg-emerald-500', text: 'text-white' },
  C: { bg: 'bg-lime-500',    text: 'text-slate-900' },
  D: { bg: 'bg-yellow-400',  text: 'text-slate-900' },
  E: { bg: 'bg-amber-500',   text: 'text-white' },
  F: { bg: 'bg-orange-500',  text: 'text-white' },
  G: { bg: 'bg-red-600',     text: 'text-white' },
}

// ─── Type labels in French ────────────────────────────────────────────────────

const typeLabels: Record<string, string> = {
  room: 'Chambre',
  studio: 'Studio',
  apartment: 'Appartement',
  house: 'Maison',
  loft: 'Loft',
}

// ─── Galerie photos ───────────────────────────────────────────────────────────

function CardGallery({ photos, title }: { photos: string[]; title: string }) {
  const [idx, setIdx] = useState(0)
  const [hovered, setHovered] = useState(false)

  const prev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIdx((i) => (i === 0 ? photos.length - 1 : i - 1))
  }, [photos.length])

  const next = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIdx((i) => (i === photos.length - 1 ? 0 : i + 1))
  }, [photos.length])

  return (
    <div
      className="relative w-full aspect-[4/3] overflow-hidden bg-slate-100 group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img
        key={idx}
        src={photos[idx]}
        alt={`${title} — photo ${idx + 1}`}
        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        loading="lazy"
        onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80' }}
      />

      {/* Navigation arrows */}
      {hovered && photos.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Photo précédente"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white text-slate-800 shadow-md transition-all active:scale-95"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={next}
            aria-label="Photo suivante"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white text-slate-800 shadow-md transition-all active:scale-95"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}

      {/* Dots indicator */}
      {photos.length > 1 && (
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-10 flex gap-1.5 items-center bg-black/35 backdrop-blur-sm px-2 py-1 rounded-full">
          {photos.map((_, i) => (
            <span
              key={i}
              className={cn(
                'rounded-full transition-all',
                i === idx ? 'w-3.5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/60',
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── ApartmentCard ────────────────────────────────────────────────────────────

export function ApartmentCard({
  apartment,
  variant = 'grid',
  isFavorited: isFavProp,
  onFavoriteToggle,
  onClick,
  className,
}: ApartmentCardProps) {
  const { isFavorited, toggleFavorite } = useFavorites()
  const { showToast } = useToast()
  const { user, token, openAuthModal } = useAuth()

  const currentIsFav = isFavProp !== undefined ? isFavProp : isFavorited(apartment.id)

  const handleFav = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!token || user?.role !== 'tenant') { openAuthModal(); return }
    apiRequest<{ favorited: boolean }>('/api/apartments/' + apartment.id + '/favorite', { method: 'PUT', token })
      .then(({ favorited }) => {
        toggleFavorite(apartment.id)
        onFavoriteToggle?.(apartment.id, favorited)
        showToast(favorited ? 'Annonce ajoutée à vos favoris' : 'Annonce retirée de vos favoris', 'info')
      })
      .catch((error: unknown) => showToast(error instanceof Error ? error.message : 'Favoris indisponibles.', 'error'))
  }, [apartment.id, toggleFavorite, onFavoriteToggle, showToast, token, user?.role, openAuthModal])

  const handleClick   = useCallback(() => onClick?.(apartment.id), [apartment.id, onClick])
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(apartment.id) }
  }, [apartment.id, onClick])

  const dpe = dpeConfig[apartment.energyScore] || dpeConfig.C

  // ── Variante liste ────────────────────────────────────────────────────────
  if (variant === 'list') {
    return (
      <article
        role="article"
        aria-label={apartment.title}
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex flex-col sm:flex-row overflow-hidden cursor-pointer group',
          'bg-white border border-slate-200/90 rounded-2xl',
          'hover:border-primary-400 hover:shadow-card-hover',
          'transition-all duration-300',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600',
          className,
        )}
      >
        {/* Photo */}
        <div className="relative sm:w-64 flex-shrink-0 aspect-[4/3] sm:aspect-auto">
          <img
            src={apartment.photos[0]}
            alt={apartment.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80' }}
          />
          {/* Badge one-click */}
          {apartment.isOneClickCompatible && (
            <div className="absolute top-3 left-3 bg-emerald-600 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
              <ShieldCheck size={13} />
              Pass Vérifié
            </div>
          )}
        </div>

        {/* Contenu */}
        <div className="flex flex-col flex-1 p-5 min-w-0 justify-between">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider">
                  {typeLabels[apartment.type] || apartment.type} · {apartment.address.city}
                </span>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-1 mt-0.5">
                  {apartment.title}
                </h3>
              </div>
              <button
                onClick={handleFav}
                aria-label={currentIsFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                className="p-2 rounded-full hover:bg-slate-100 transition-colors flex-shrink-0"
              >
                <Heart
                  size={18}
                  className={cn(
                    'transition-colors',
                    currentIsFav ? 'fill-rose-500 text-rose-500' : 'text-slate-400 hover:text-slate-600',
                  )}
                />
              </button>
            </div>

            <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
              <MapPin size={13} className="text-slate-400 flex-shrink-0" />
              <span>{apartment.address.street}, {apartment.address.city} ({apartment.address.zipCode})</span>
            </p>

            <p className="text-xs text-slate-600 line-clamp-2 mt-2.5 leading-relaxed">
              {apartment.description}
            </p>
          </div>

          <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
              <span className="flex items-center gap-1">
                <Maximize2 size={13} className="text-slate-400" />
                {apartment.surface} m²
              </span>
              <span className="flex items-center gap-1">
                <BedDouble size={14} className="text-slate-400" />
                {apartment.rooms} pièce{apartment.rooms > 1 ? 's' : ''}
              </span>
              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded', dpe.bg, dpe.text)}>
                DPE {apartment.energyScore}
              </span>
            </div>

            <div className="text-right">
              <span className="text-lg font-extrabold text-slate-900">
                {formatPrice(apartment.price)}
              </span>
              <span className="text-xs text-slate-500 font-normal"> /mois</span>
              {apartment.charges && (
                <p className="text-[10px] text-slate-400">dont {apartment.charges}€ charges</p>
              )}
            </div>
          </div>
        </div>
      </article>
    )
  }

  // ── Variante grille (défaut) ──────────────────────────────────────────────
  return (
    <article
      role="article"
      aria-label={apartment.title}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'group relative flex flex-col overflow-hidden cursor-pointer',
        'bg-white border border-slate-200/80 rounded-2xl',
        'hover:shadow-card-hover hover:border-primary-300 hover:-translate-y-1',
        'transition-all duration-300',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600',
        className,
      )}
    >
      {/* ── Photo + overlays ── */}
      <div className="relative flex-shrink-0">
        <CardGallery photos={apartment.photos} title={apartment.title} />

        {/* Badges gauche (Coup de cœur / Pass Vérifié) */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start pointer-events-none">
          {apartment.badges?.[0] && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-primary-600/90 backdrop-blur-sm text-white shadow-sm">
              <Sparkles size={11} />
              {apartment.badges[0].label}
            </span>
          )}
          {apartment.isOneClickCompatible && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-600/90 backdrop-blur-sm text-white shadow-sm">
              <ShieldCheck size={11} />
              Pass Vérifié
            </span>
          )}
        </div>

        {/* Bouton favoris haut droit */}
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={handleFav}
            aria-label={currentIsFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-md',
              currentIsFav
                ? 'bg-white text-rose-500 scale-105'
                : 'bg-white/80 text-slate-600 hover:bg-white hover:text-slate-900',
            )}
          >
            <Heart
              size={15}
              className={cn(
                'transition-all duration-200',
                currentIsFav && 'fill-rose-500 text-rose-500 animate-heart-pop',
              )}
            />
          </button>
        </div>

        {/* Badges bas gauche (Visite 3D, DPE) */}
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 pointer-events-none">
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded shadow-sm', dpe.bg, dpe.text)}>
            <Zap size={10} className="inline mr-0.5 -mt-0.5" />
            DPE {apartment.energyScore}
          </span>
          {apartment.hasVirtualTour && (
            <span className="text-[10px] font-semibold bg-slate-950/80 backdrop-blur-sm text-white px-2 py-0.5 rounded shadow-sm">
              Visite 3D
            </span>
          )}
        </div>
      </div>

      {/* ── Corps ── */}
      <div className="flex flex-col flex-1 p-4 gap-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">
              {formatPrice(apartment.price)}
            </span>
            <span className="text-xs text-slate-500 font-medium">/mois</span>
          </div>
          {apartment.charges && (
            <span className="text-[11px] text-slate-400">
              +{apartment.charges}€ ch.
            </span>
          )}
        </div>

        {/* Titre */}
        <h3 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2 group-hover:text-primary-600 transition-colors">
          {apartment.title}
        </h3>

        {/* Localisation */}
        <p className="flex items-center gap-1 text-xs text-slate-500">
          <MapPin size={12} className="flex-shrink-0 text-slate-400" />
          <span className="truncate">{apartment.address.street}, {apartment.address.city}</span>
        </p>

        {/* Caractéristiques */}
        <div className="pt-2.5 mt-auto border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-medium">
              <Maximize2 size={12} className="text-slate-400" />
              {apartment.surface} m²
            </span>
            <span className="flex items-center gap-1 font-medium">
              <BedDouble size={13} className="text-slate-400" />
              {apartment.rooms} p.
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            {timeAgo(apartment.publishedAt)}
          </span>
        </div>
      </div>
    </article>
  )
}

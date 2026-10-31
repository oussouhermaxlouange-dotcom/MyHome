import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  LayoutGrid,
  List,
  SlidersHorizontal,
  MapPin,
  X,
  Search,
  RotateCcw,
  BellRing,
  Heart,
  Check,
  Building,
  Sparkles,
  Map,
} from 'lucide-react'
import { ApartmentCard } from '@/components/features/ApartmentCard'
import { Button } from '@/components/ui/Button'
import { cn, formatPrice } from '@/lib/utils'
import { mockApartments } from '@/data/mockApartments'
import { useFavorites } from '@/context/FavoritesContext'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import { apiRequest, type ApiApartment } from '@/lib/api'
import type { Apartment } from '@/types'
import type { ApartmentType, EnergyScore, ViewMode } from '@/types'

const BENIN_LOCATIONS = [
  'Cotonou',
  'Haie Vive',
  'Cadjehoun',
  'Akpakpa',
  'Fidjrossè',
  'Abomey-Calavi',
  'Porto-Novo',
  'Parakou',
]

const PROPERTY_TYPES: { value: ApartmentType; label: string }[] = [
  { value: 'studio',    label: 'Studio & Meublé' },
  { value: 'apartment', label: 'Appartement' },
  { value: 'room',      label: 'Chambre / Entrée perso' },
  { value: 'house',     label: 'Villa & Maison' },
  { value: 'loft',      label: 'Loft de standing' },
]

const AMENITY_LIST = [
  { id: 'furnished',        label: 'Meublé' },
  { id: 'air_conditioning', label: 'Climatisation' },
  { id: 'wifi',             label: 'Wi-Fi fibre' },
  { id: 'parking',          label: 'Garage / Parking' },
  { id: 'generator',        label: 'Groupe électrogène' },
  { id: 'water_tank',       label: 'Forage / Suppresseur' },
  { id: 'balcony',          label: 'Balcon / Terrasse' },
  { id: 'garden',           label: 'Cour / Jardin' },
  { id: 'washing_machine',  label: 'Lave-linge' },
  { id: 'pets',             label: 'Animaux acceptés' },
]

type SortOption = 'recent' | 'price-asc' | 'price-desc' | 'surface-desc'

export default function AnnoncesPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { isFavorited, favoritesCount } = useFavorites()
  const { showToast } = useToast()
  const { token, openAuthModal } = useAuth()
  const isAuthenticated = Boolean(token)
  const [apiCatalog, setApiCatalog] = useState<Apartment[] | null>(null)

  useEffect(() => {
    apiRequest<ApiApartment[]>('/api/apartments?limit=100', { token })
      .then((items) => setApiCatalog(items as unknown as Apartment[]))
      .catch(() => setApiCatalog(null))
  }, [token])

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedTypes, setSelectedTypes] = useState<ApartmentType[]>(() => {
    const typeParam = searchParams.get('type')
    return typeParam ? [typeParam as ApartmentType] : []
  })
  const [minPrice, setMinPrice] = useState<number | ''>(
    searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : '',
  )
  const [maxPrice, setMaxPrice] = useState<number | ''>(
    searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : '',
  )
  const [minSurface, setMinSurface] = useState<number | ''>('')
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [only3D, setOnly3D] = useState(false)
  const [onlyOneClick, setOnlyOneClick] = useState(false)
  const [onlyFavorites, setOnlyFavorites] = useState(searchParams.get('favoris') === 'true')
  const [selectedEnergyScores, setSelectedEnergyScores] = useState<EnergyScore[]>([])

  // Sorting
  const [sortBy, setSortBy] = useState<SortOption>('recent')

  // Advanced filters drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Alert modal state
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false)
  const [alertEmail, setAlertEmail] = useState('')

  // Sync with searchParams on initial load or param change
  useEffect(() => {
    const q = searchParams.get('q')
    if (q !== null) setSearchQuery(q)
    const type = searchParams.get('type')
    if (type) setSelectedTypes([type as ApartmentType])
    const maxP = searchParams.get('maxPrice')
    if (maxP) setMaxPrice(Number(maxP))
    if (searchParams.get('favoris') === 'true') setOnlyFavorites(true)
  }, [searchParams])

  // Toggle helpers
  const toggleType = (type: ApartmentType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    )
  }

  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenityId) ? prev.filter((a) => a !== amenityId) : [...prev, amenityId],
    )
  }

  const toggleEnergyScore = (score: EnergyScore) => {
    setSelectedEnergyScores((prev) =>
      prev.includes(score) ? prev.filter((s) => s !== score) : [...prev, score],
    )
  }

  const resetAllFilters = () => {
    setSearchQuery('')
    setSelectedTypes([])
    setMinPrice('')
    setMaxPrice('')
    setMinSurface('')
    setSelectedAmenities([])
    setOnly3D(false)
    setOnlyOneClick(false)
    setOnlyFavorites(false)
    setSelectedEnergyScores([])
    setSearchParams({})
    showToast('Tous les filtres ont été réinitialisés.', 'info')
  }

  // Active filter count calculation
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (searchQuery.trim()) count++
    if (selectedTypes.length > 0) count += selectedTypes.length
    if (minPrice !== '') count++
    if (maxPrice !== '') count++
    if (minSurface !== '') count++
    if (selectedAmenities.length > 0) count += selectedAmenities.length
    if (only3D) count++
    if (onlyOneClick) count++
    if (onlyFavorites) count++
    if (selectedEnergyScores.length > 0) count += selectedEnergyScores.length
    return count
  }, [
    searchQuery,
    selectedTypes,
    minPrice,
    maxPrice,
    minSurface,
    selectedAmenities,
    only3D,
    onlyOneClick,
    onlyFavorites,
    selectedEnergyScores,
  ])

  // Filtering & Sorting pipeline
  const filteredApartments = useMemo(() => {
    return (apiCatalog ?? mockApartments)
      .filter((apt) => {
        // Query search in title, city, street, description
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim()
          const matchTitle = apt.title.toLowerCase().includes(q)
          const matchCity = apt.address.city.toLowerCase().includes(q)
          const matchStreet = apt.address.street.toLowerCase().includes(q)
          const matchDesc = apt.description.toLowerCase().includes(q)
          if (!matchTitle && !matchCity && !matchStreet && !matchDesc) return false
        }

        // Favorites only filter
        if (onlyFavorites && !isFavorited(apt.id)) {
          return false
        }

        // Property types
        if (selectedTypes.length > 0 && !selectedTypes.includes(apt.type)) {
          return false
        }

        // Budget in FCFA
        if (minPrice !== '' && apt.price < Number(minPrice)) return false
        if (maxPrice !== '' && apt.price > Number(maxPrice)) return false

        // Surface
        if (minSurface !== '' && apt.surface < Number(minSurface)) return false

        // Amenities
        if (selectedAmenities.length > 0) {
          const hasAll = selectedAmenities.every((amenity) => apt.amenities.includes(amenity))
          if (!hasAll) return false
        }

        // 3D Tour
        if (only3D && !apt.hasVirtualTour) return false

        // One click / Pass vérifié
        if (onlyOneClick && !apt.isOneClickCompatible) return false

        // Energy score
        if (selectedEnergyScores.length > 0 && !selectedEnergyScores.includes(apt.energyScore)) {
          return false
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price
        if (sortBy === 'price-desc') return b.price - a.price
        if (sortBy === 'surface-desc') return b.surface - a.surface
        // recent
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      })
  }, [
    searchQuery,
    selectedTypes,
    minPrice,
    maxPrice,
    minSurface,
    selectedAmenities,
    only3D,
    onlyOneClick,
    onlyFavorites,
    selectedEnergyScores,
    sortBy,
    isFavorited,
    apiCatalog,
  ])

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault()
    if (!alertEmail.trim() || !alertEmail.includes('@')) {
      showToast('Veuillez renseigner une adresse email valide.', 'error')
      return
    }
    setIsAlertModalOpen(false)
    setAlertEmail('')
    showToast(
      'Alerte e-mail créée avec succès ! Vous serez notifié dès qu\'un logement correspondant sera disponible au Bénin.',
      'success',
      'Alerte activée',
    )
  }

  return (
    <div className="w-full px-4 sm:px-6 py-6 space-y-6">

      {/* ── En-tête & Barre de recherche principale (Full width) ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
            {onlyFavorites ? 'Vos logements favoris' : 'Annonces de location vérifiées au Bénin'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {onlyFavorites
              ? `${filteredApartments.length} logement${filteredApartments.length > 1 ? 's' : ''} sauvegardé${filteredApartments.length > 1 ? 's' : ''}`
              : 'Logements disponibles à Cotonou, Abomey-Calavi, Porto-Novo et Parakou.'}
          </p>
        </div>

        {/* Search bar pill */}
        <div className="relative flex-1 max-w-lg">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par quartier ou ville (Haie Vive, Cadjehoun, Calavi...)"
            className="w-full h-11 pl-10 pr-9 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 shadow-xs transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Barre de Filtres Rapides (Chips horizontaux) ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap pt-2">
        <div className="flex items-center gap-2 flex-wrap">

          {/* Quick Location Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 max-w-full">
            {BENIN_LOCATIONS.map((loc) => {
              const active = searchQuery.toLowerCase() === loc.toLowerCase()
              return (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setSearchQuery(active ? '' : loc)}
                  className={cn(
                    'h-9 px-3 rounded-xl text-xs font-medium transition-all whitespace-nowrap',
                    active
                      ? 'bg-primary-600 text-white shadow-xs font-semibold'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50',
                  )}
                >
                  {loc}
                </button>
              )
            })}
          </div>

          {/* Quick Types pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {PROPERTY_TYPES.slice(0, 3).map((pt) => {
              const active = selectedTypes.includes(pt.value)
              return (
                <button
                  key={pt.value}
                  type="button"
                  onClick={() => toggleType(pt.value)}
                  className={cn(
                    'h-9 px-3 rounded-xl text-xs font-medium transition-all whitespace-nowrap',
                    active
                      ? 'bg-slate-900 text-white shadow-xs font-semibold'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50',
                  )}
                >
                  {pt.label}
                </button>
              )
            })}
          </div>

          {/* Quick Favorite Filter */}
          <button
            type="button"
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={cn(
              'h-9 px-3 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all',
              onlyFavorites
                ? 'bg-rose-50 border border-rose-200 text-rose-700 font-semibold'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50',
            )}
          >
            <Heart size={14} className={onlyFavorites ? 'fill-rose-500 text-rose-500' : 'text-slate-400'} />
            <span>Favoris ({favoritesCount})</span>
          </button>

          {/* Quick 3D filter */}
          <button
            type="button"
            onClick={() => setOnly3D(!only3D)}
            className={cn(
              'h-9 px-3 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all',
              only3D
                ? 'bg-sky-50 border border-sky-200 text-sky-700 font-semibold'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50',
            )}
          >
            <Sparkles size={13} className={only3D ? 'text-primary-600' : 'text-slate-400'} />
            <span>Visite 3D</span>
          </button>
        </div>

        {/* All Filters Button & Create Alert */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDrawerOpen(true)}
            leftIcon={<SlidersHorizontal size={14} />}
            className={cn(
              'h-9 rounded-xl font-medium text-xs',
              activeFiltersCount > 0 ? 'border-primary-500 text-primary-700 bg-primary-50/50' : '',
            )}
          >
            Filtres avancés
            {activeFiltersCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary-600 text-white text-[10px] font-bold">
                {activeFiltersCount}
              </span>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAlertModalOpen(true)}
            leftIcon={<BellRing size={14} />}
            className="h-9 rounded-xl text-xs text-slate-600 hover:text-slate-900"
          >
            Créer une alerte
          </Button>
        </div>
      </div>

      {/* ── Active Filter Pills (Removable) ── */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
          <span className="text-slate-500 font-medium">Filtres actifs :</span>

          {searchQuery && (
            <span className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-800 px-2.5 py-1 rounded-lg">
              Zone : "{searchQuery}"
              <X size={12} className="cursor-pointer hover:text-red-500" onClick={() => setSearchQuery('')} />
            </span>
          )}

          {selectedTypes.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-800 px-2.5 py-1 rounded-lg">
              {PROPERTY_TYPES.find((pt) => pt.value === t)?.label}
              <X size={12} className="cursor-pointer hover:text-red-500" onClick={() => toggleType(t)} />
            </span>
          ))}

          {minPrice !== '' && (
            <span className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-800 px-2.5 py-1 rounded-lg">
              Min {formatPrice(Number(minPrice))}
              <X size={12} className="cursor-pointer hover:text-red-500" onClick={() => setMinPrice('')} />
            </span>
          )}

          {maxPrice !== '' && (
            <span className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-800 px-2.5 py-1 rounded-lg">
              Max {formatPrice(Number(maxPrice))}
              <X size={12} className="cursor-pointer hover:text-red-500" onClick={() => setMaxPrice('')} />
            </span>
          )}

          {selectedAmenities.map((amenityId) => (
            <span key={amenityId} className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-800 px-2.5 py-1 rounded-lg">
              {AMENITY_LIST.find((a) => a.id === amenityId)?.label}
              <X size={12} className="cursor-pointer hover:text-red-500" onClick={() => toggleAmenity(amenityId)} />
            </span>
          ))}

          {onlyFavorites && (
            <span className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 text-rose-700 px-2.5 py-1 rounded-lg">
              Favoris uniquement
              <X size={12} className="cursor-pointer hover:text-red-500" onClick={() => setOnlyFavorites(false)} />
            </span>
          )}

          <button
            onClick={resetAllFilters}
            className="text-primary-600 hover:text-primary-700 hover:underline font-semibold ml-auto flex items-center gap-1 text-[11px]"
          >
            <RotateCcw size={12} />
            Effacer tout
          </button>
        </div>
      )}

      {/* ── Toolbar : Résultats & Tri & Affichage ── */}
      <div className="flex items-center justify-between gap-4 py-3 border-y border-slate-100 flex-wrap">
        <p className="text-xs sm:text-sm text-slate-600 font-medium">
          <span className="font-bold text-slate-900 text-base">{filteredApartments.length}</span>{' '}
          {filteredApartments.length > 1 ? 'logements disponibles' : 'logement disponible'}
        </p>

        <div className="flex items-center gap-3">
          {/* Sorting */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden sm:inline-block">Trier par :</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="Trier par"
              className="h-9 pl-3 pr-8 text-xs font-semibold border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 cursor-pointer shadow-2xs"
            >
              <option value="recent">Plus récentes d'abord</option>
              <option value="price-asc">Loyer croissant (FCFA)</option>
              <option value="price-desc">Loyer décroissant (FCFA)</option>
              <option value="surface-desc">Surface décroissante</option>
            </select>
          </div>

          {/* View mode switcher */}
          <div className="flex border border-slate-200 rounded-xl p-0.5 bg-slate-50">
            <button
              onClick={() => setViewMode('grid')}
              aria-label="Affichage en grille"
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600',
              )}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode('map')}
              aria-label="Affichage en liste"
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                viewMode === 'map'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600',
              )}
            >
              <List size={16} />
            </button>
          </div>

          {/* Quick link to map */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/carte')}
            leftIcon={<Map size={14} className="text-primary-600" />}
            className="hidden md:inline-flex h-9 text-xs rounded-xl"
          >
            Vue Carte Bénin
          </Button>
        </div>
      </div>

      {/* ── Feed d'annonces (Full width grid) ── */}
      <section aria-label="Liste des logements">
        {filteredApartments.length === 0 ? (
          <div className="py-20 text-center max-w-md mx-auto space-y-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-xs text-slate-400">
              <Building size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Aucun logement ne correspond à vos critères
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Essayez de sélectionner une autre zone (ex. Cotonou, Calavi) ou d'ajuster votre budget en FCFA.
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={resetAllFilters}
                className="rounded-xl text-xs"
              >
                Réinitialiser les filtres
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAlertModalOpen(true)}
                leftIcon={<BellRing size={13} />}
                className="rounded-xl text-xs"
              >
                Créer une alerte
              </Button>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'flex flex-col gap-4',
            )}
          >
            {(isAuthenticated ? filteredApartments : filteredApartments.slice(0, 6)).map((apt) => (
              <ApartmentCard
                key={apt.id}
                apartment={apt}
                variant={viewMode === 'map' ? 'list' : 'grid'}
                onClick={(id) => navigate(`/annonces/${id}`)}
              />
            ))}
          </div>
        )}
        {!isAuthenticated && (
          <div className="mt-8 rounded-2xl border border-cyan-100 bg-cyan-50 p-6 text-center">
            <p className="text-sm font-semibold text-slate-900">Vous voyez une sélection de 6 annonces.</p>
            <p className="mt-1 text-xs text-slate-600">Connectez-vous pour parcourir tout le catalogue et contacter les bailleurs.</p>
            <Button className="mt-4" onClick={openAuthModal}>Se connecter / créer un compte</Button>
          </div>
        )}
      </section>

      {/* ── Slide-over Drawer des Filtres Avancés ── */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">

              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Filtres avancés — Marché Bénin</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Personnalisez vos critères de recherche en FCFA</p>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Body (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">

                {/* Budget in FCFA */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    Loyer mensuel charges comprises (FCFA)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="number"
                        placeholder="Min FCFA"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder="Max FCFA"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Surface */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    Surface minimum (m²)
                  </label>
                  <input
                    type="number"
                    placeholder="Ex. : 30 m²"
                    value={minSurface}
                    onChange={(e) => setMinSurface(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>

                {/* Type de bien */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    Types de biens
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PROPERTY_TYPES.map((pt) => {
                      const isSel = selectedTypes.includes(pt.value)
                      return (
                        <button
                          key={pt.value}
                          type="button"
                          onClick={() => toggleType(pt.value)}
                          className={cn(
                            'px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors',
                            isSel
                              ? 'bg-slate-900 border-slate-900 text-white'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300',
                          )}
                        >
                          {pt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Équipements Bénin */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    Commodités indispensables
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {AMENITY_LIST.map((amenity) => {
                      const isChecked = selectedAmenities.includes(amenity.id)
                      return (
                        <button
                          key={amenity.id}
                          type="button"
                          onClick={() => toggleAmenity(amenity.id)}
                          className={cn(
                            'flex items-center gap-2 p-2 rounded-xl border text-xs text-left transition-colors',
                            isChecked
                              ? 'border-primary-500 bg-primary-50/50 text-primary-900 font-semibold'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700',
                          )}
                        >
                          <div className={cn(
                            'w-4 h-4 rounded flex items-center justify-center border text-white',
                            isChecked ? 'bg-primary-600 border-primary-600' : 'border-slate-300',
                          )}>
                            {isChecked && <Check size={12} />}
                          </div>
                          <span className="truncate">{amenity.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-slate-50">
                    <span className="text-xs font-medium text-slate-800">Candidature Pass Vérifié en 1 clic</span>
                    <input
                      type="checkbox"
                      checked={onlyOneClick}
                      onChange={(e) => setOnlyOneClick(e.target.checked)}
                      className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-slate-50">
                    <span className="text-xs font-medium text-slate-800">Visite virtuelle 3D disponible</span>
                    <input
                      type="checkbox"
                      checked={only3D}
                      onChange={(e) => setOnly3D(e.target.checked)}
                      className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                  </label>
                </div>

              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetAllFilters}
                  className="text-xs font-semibold text-slate-600"
                >
                  Réinitialiser
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex-1 rounded-xl font-bold text-xs"
                >
                  Voir les {filteredApartments.length} logements
                </Button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── Modal de Création d'Alerte ── */}
      {isAlertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsAlertModalOpen(false)}
          />

          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 z-10 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                  <BellRing size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Créer une alerte au Bénin</h3>
                  <p className="text-xs text-slate-400">Soyez alerté par email dès qu'un bien est publié</p>
                </div>
              </div>
              <button
                onClick={() => setIsAlertModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">Critères enregistrés :</p>
              <p>• {searchQuery ? `Zone : ${searchQuery}` : 'Tout le Bénin'}</p>
              <p>• {selectedTypes.length > 0 ? `Types : ${selectedTypes.join(', ')}` : 'Tous types de biens'}</p>
              {maxPrice && <p>• Budget maximum : {formatPrice(Number(maxPrice))}/mois</p>}
            </div>

            <form onSubmit={handleCreateAlert} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Votre adresse e-mail
                </label>
                <input
                  type="email"
                  required
                  value={alertEmail}
                  onChange={(e) => setAlertEmail(e.target.value)}
                  placeholder="votre-email@exemple.com"
                  className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAlertModalOpen(false)}
                  className="text-xs"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="rounded-xl text-xs font-semibold"
                >
                  Activer l'alerte
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Maximize2,
  Zap,
  Box,
  Video,
  Wifi,
  Car,
  Bike,
  TreePine,
  WashingMachine,
  AirVent,
  Building2,
  CheckCircle,
  Heart,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  ShieldCheck,
  Share2,
  Calculator,
  Compass,
  Train,
  Store,
  GraduationCap,
  Sparkles,
  X,
} from 'lucide-react'

import { cn, formatPrice, formatSurface, timeAgo } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { BookingModal } from '@/components/features/BookingModal'
import { ApartmentCard } from '@/components/features/ApartmentCard'
import { useFavorites } from '@/context/FavoritesContext'
import { useToast } from '@/context/ToastContext'
import type { Apartment, EnergyScore, VisitSlot } from '@/types'
import { apiRequest, ApiError, mediaUrl, type ApiApartment } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

// ─── DPE Config ───────────────────────────────────────────────────────────────

const DPE_LEVELS: { score: EnergyScore; color: string; label: string }[] = [
  { score: 'A', color: 'bg-emerald-600', label: '≤ 70 kWh/m²' },
  { score: 'B', color: 'bg-emerald-500', label: '71 à 110' },
  { score: 'C', color: 'bg-lime-500',    label: '111 à 180' },
  { score: 'D', color: 'bg-yellow-400',  label: '181 à 250' },
  { score: 'E', color: 'bg-amber-500',   label: '251 à 330' },
  { score: 'F', color: 'bg-orange-500',  label: '331 à 420' },
  { score: 'G', color: 'bg-red-600',     label: '> 420' },
]

// ─── Amenity Icons Map ────────────────────────────────────────────────────────

const AMENITY_CONFIG: Record<string, { label: string; Icon: React.FC<{ size?: number; className?: string }> }> = {
  wifi:             { label: 'Wi-Fi inclus',        Icon: Wifi },
  parking:          { label: 'Place de parking',    Icon: Car },
  parking_bike:     { label: 'Local vélos',         Icon: Bike },
  garden:           { label: 'Jardin / Terrasse',   Icon: TreePine },
  washing_machine:  { label: 'Lave-linge',          Icon: WashingMachine },
  air_conditioning: { label: 'Climatisation',       Icon: AirVent },
  elevator:         { label: 'Ascenseur',           Icon: Building2 },
}

export default function ApartmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { isFavorited, toggleFavorite } = useFavorites()
  const { showToast } = useToast()
  const { user, token, openAuthModal } = useAuth()
  const [remoteApartment, setRemoteApartment] = useState<Apartment | null>(null)
  const [apartmentLoading, setApartmentLoading] = useState(true)
  const [apartmentError, setApartmentError] = useState<string | null>(null)
  const [slots, setSlots] = useState<VisitSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsError, setSlotsError] = useState<string | null>(null)
  const [similarApartments, setSimilarApartments] = useState<Apartment[]>([])
  const [messageText, setMessageText] = useState('')
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [applicationSubmitted, setApplicationSubmitted] = useState(false)

  useEffect(() => {
    if (!id) {
      setApartmentLoading(false)
      setApartmentError('Cette annonce est introuvable.')
      return
    }

    let cancelled = false
    setApartmentLoading(true)
    setApartmentError(null)
    setRemoteApartment(null)
    apiRequest<ApiApartment>('/api/apartments/' + id, { token })
      .then((value) => { if (!cancelled) setRemoteApartment(value as unknown as Apartment) })
      .catch((error: unknown) => {
        if (!cancelled) setApartmentError(error instanceof Error ? error.message : 'Impossible de charger cette annonce.')
      })
      .finally(() => { if (!cancelled) setApartmentLoading(false) })

    return () => { cancelled = true }
  }, [id, token])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setSlotsLoading(true)
    setSlotsError(null)
    apiRequest<VisitSlot[]>('/api/apartments/' + id + '/slots', { token })
      .then((items) => { if (!cancelled) setSlots(items.filter((slot) => slot.isAvailable && !slot.isBooked)) })
      .catch((error: unknown) => {
        if (!cancelled) {
          setSlots([])
          setSlotsError(error instanceof Error ? error.message : 'Impossible de charger les créneaux.')
        }
      })
      .finally(() => { if (!cancelled) setSlotsLoading(false) })
    return () => { cancelled = true }
  }, [id, token])

  useEffect(() => {
    let cancelled = false
    apiRequest<ApiApartment[]>('/api/apartments?limit=6', { token })
      .then((items) => {
        if (!cancelled) setSimilarApartments(items.filter((item) => item.id !== id).slice(0, 3) as unknown as Apartment[])
      })
      .catch(() => { if (!cancelled) setSimilarApartments([]) })
    return () => { cancelled = true }
  }, [id, token])

  const apartment = remoteApartment

  if (apartmentLoading) {
    return <main className="container-app py-20 text-center text-sm text-slate-500" aria-live="polite">Chargement de l’annonce…</main>
  }

  if (!apartment) {
    return (
      <div className="container-app py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">{apartmentError ?? 'Cette annonce n’existe pas ou a été retirée.'}</h2>
        <p className="text-xs text-slate-500">Parcourez les autres logements disponibles sur MyHome.</p>
        <Button variant="primary" size="md" onClick={() => navigate('/annonces')}>Voir toutes les annonces</Button>
      </div>
    )
  }

  const currentIsFav = isFavorited(apartment.id)

  const handleToggleFav = async () => {
    if (!token || user?.role !== 'tenant') { openAuthModal(); return }
    try {
      const result = await apiRequest<{ favorited: boolean }>('/api/apartments/' + apartment.id + '/favorite', { method: 'PUT', token })
      toggleFavorite(apartment.id)
      showToast(result.favorited ? 'Annonce ajoutée à vos favoris' : 'Annonce retirée de vos favoris', 'info')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Favoris indisponibles.', 'error')
    }
  }

  const handleSendMessage = async () => {
    if (!token || user?.role !== 'tenant') { openAuthModal(); return }
    if (!messageText.trim()) return
    setIsSendingMessage(true)
    try {
      await apiRequest('/api/apartments/' + apartment.id + '/messages', { method: 'POST', token, body: { content: messageText } })
      setMessageText('')
      showToast('Votre message a été envoyé au bailleur.', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Message non envoyé.', 'error')
    } finally {
      setIsSendingMessage(false)
    }
  }

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href)
    showToast('Lien de l\'annonce copié dans le presse-papier !', 'success')
  }

  const requireTenant = (action: string) => {
    if (!token) {
      navigate('/auth', { state: { from: { pathname: location.pathname, search: location.search } } })
      return false
    }
    if (user?.role !== 'tenant') {
      showToast(action + ' est réservée aux comptes locataires.', 'error')
      return false
    }
    return true
  }

  const handleApply = async () => {
    if (!requireTenant('La candidature')) return
    setIsApplying(true)
    try {
      await apiRequest('/api/apartments/' + apartment.id + '/applications', {
        method: 'POST',
        token,
        body: {},
      })
      setApplicationSubmitted(true)
      showToast('Votre candidature a bien été envoyée au bailleur.', 'success', 'Candidature envoyée')
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        navigate('/auth', { state: { from: { pathname: location.pathname, search: location.search } } })
      } else {
        showToast(error instanceof Error ? error.message : 'Impossible d’envoyer votre candidature.', 'error')
      }
    } finally {
      setIsApplying(false)
    }
  }

  const openBooking = () => {
    if (!requireTenant('La réservation')) return
    setShowBookingModal(true)
  }

  const handleBookingConfirmed = async (slot: VisitSlot) => {
    if (!requireTenant('La réservation')) throw new Error('Connectez-vous avec un compte locataire pour réserver.')
    try {
      await apiRequest('/api/apartments/' + apartment.id + '/slots/' + slot.id + '/book', {
        method: 'POST',
        token,
      })
      setSlots((current) => current.filter((item) => item.id !== slot.id))
      showToast('Votre créneau de visite a bien été réservé.', 'success', 'Visite réservée')
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        navigate('/auth', { state: { from: { pathname: location.pathname, search: location.search } } })
      } else {
        showToast(error instanceof Error ? error.message : 'Impossible de réserver ce créneau.', 'error')
      }
      throw error
    }
  }

  const totalMonthlyBudget = apartment.price + (apartment.charges || 0) + 10000 + 25000

  return (
    <div className="w-full px-4 sm:px-6 py-6 space-y-8">

      {/* ── Breadcrumb & Top Bar ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/" className="hover:text-slate-900 transition-colors">Accueil</Link>
          <span>/</span>
          <Link to="/annonces" className="hover:text-slate-900 transition-colors">Annonces</Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold truncate max-w-[200px] sm:max-w-md">
            {apartment.title}
          </span>
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
          >
            <Share2 size={14} />
            <span>Partager</span>
          </button>
          <button
            onClick={handleToggleFav}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
          >
            <Heart size={14} className={currentIsFav ? 'fill-rose-500 text-rose-500' : ''} />
            <span>{currentIsFav ? 'Enregistré' : 'Sauvegarder'}</span>
          </button>
        </div>
      </div>

      {/* ── Titre & Localisation ── */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-2.5 py-0.5 rounded-full">
            {apartment.type}
          </span>
          {apartment.badges?.[0] && (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-900 text-white flex items-center gap-1">
              <Sparkles size={11} />
              {apartment.badges[0].label}
            </span>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
          {apartment.title}
        </h1>
        <p className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 mt-1.5">
          <MapPin size={15} className="text-primary-600 flex-shrink-0" />
          <span>{apartment.address.street}, {apartment.address.city} ({apartment.address.zipCode})</span>
        </p>
      </div>

      {/* ── Modern Photo Mosaic ── */}
      <div className="relative rounded-2xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 aspect-[16/9] md:aspect-[21/9] max-h-[480px]">
          {/* Main Large Photo */}
          <div
            className="md:col-span-2 relative h-full cursor-pointer overflow-hidden group"
            onClick={() => { setLightboxIndex(0); setLightboxOpen(true) }}
          >
            <img
              src={mediaUrl(apartment.photos[0])}
              alt={apartment.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>

          {/* Secondary Photo 1 */}
          <div
            className="hidden md:block relative h-full cursor-pointer overflow-hidden group"
            onClick={() => { setLightboxIndex(1); setLightboxOpen(true) }}
          >
            <img
              src={mediaUrl(apartment.photos[1]) || mediaUrl(apartment.photos[0])}
              alt=""
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>

          {/* Secondary Photo 2 / 3 */}
          <div className="hidden md:flex flex-col gap-2 h-full">
            <div
              className="flex-1 relative cursor-pointer overflow-hidden group"
              onClick={() => { setLightboxIndex(2); setLightboxOpen(true) }}
            >
              <img
                src={mediaUrl(apartment.photos[2]) || mediaUrl(apartment.photos[0])}
                alt=""
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>
            <div
              className="flex-1 relative cursor-pointer overflow-hidden group"
              onClick={() => { setLightboxIndex(3); setLightboxOpen(true) }}
            >
              <img
                src={mediaUrl(apartment.photos[3]) || mediaUrl(apartment.photos[0])}
                alt=""
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>
          </div>
        </div>

        {/* View all photos button */}
        <button
          onClick={() => { setLightboxIndex(0); setLightboxOpen(true) }}
          className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md hover:bg-white text-slate-800 text-xs font-semibold px-3 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5"
        >
          <span>Afficher les {apartment.photos.length} photos</span>
        </button>
      </div>

      {/* ── Main Layout Columns ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* ── Left Column (2/3) ── */}
        <div className="lg:col-span-2 space-y-10">

          {/* Quick Specifications Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Surface</span>
              <p className="text-base font-extrabold text-slate-900 mt-1">{apartment.surface} m²</p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pièces</span>
              <p className="text-base font-extrabold text-slate-900 mt-1">{apartment.rooms} pièce{apartment.rooms > 1 ? 's' : ''}</p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Étage</span>
              <p className="text-base font-extrabold text-slate-900 mt-1">
                {apartment.floor != null ? `${apartment.floor}e sur ${apartment.totalFloors || apartment.floor}` : 'RDC'}
              </p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Disponibilité</span>
              <p className="text-base font-extrabold text-emerald-600 mt-1">Immédiate</p>
            </div>
          </div>

          {/* Description */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              À propos de ce logement
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {apartment.description}
            </p>
          </section>

          {/* Équipements */}
          <section className="space-y-4 pt-4 border-t border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Équipements & Prestations
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {apartment.amenities.map((item) => {
                const conf = AMENITY_CONFIG[item]
                const Icon = conf?.Icon || Sparkles
                const label = conf?.label || item
                return (
                  <div key={item} className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 text-slate-800 text-xs font-medium">
                    <Icon size={16} className="text-primary-600 flex-shrink-0" />
                    <span>{label}</span>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Diagnostic DPE */}
          <section className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Performance énergétique
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Diagnostic officiel de performance énergétique (DPE)</p>
              </div>
              <span className="text-xs font-extrabold px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800">
                Logement économe
              </span>
            </div>

            {/* DPE Gradient Bar */}
            <div className="space-y-2 pt-2">
              <div className="grid grid-cols-7 gap-1 h-7 rounded-lg overflow-hidden">
                {DPE_LEVELS.map((lvl) => {
                  const isCurrent = apartment.energyScore === lvl.score
                  return (
                    <div
                      key={lvl.score}
                      className={cn(
                        lvl.color,
                        'flex items-center justify-center text-xs font-bold text-white relative transition-all',
                        isCurrent ? 'ring-4 ring-slate-900 scale-105 z-10 rounded-sm' : 'opacity-80',
                      )}
                    >
                      {lvl.score}
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>A (très performant)</span>
                <span className="font-bold text-slate-800">Votre logement : classe {apartment.energyScore}</span>
                <span>G (passoire)</span>
              </div>
            </div>
          </section>

          {/* Quartier & Temps de transport */}
          <section className="space-y-4 pt-4 border-t border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Quartier & Mobilités
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200">
                <Train size={18} className="text-primary-600 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Axes & Zémidjans (Taxi-moto)</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Accès immédiat aux voies pavées et goudronnées</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200">
                <Store size={18} className="text-primary-600 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Commerces & Supermarchés</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Boutiques, pharmacies et marchés à proximité</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200">
                <GraduationCap size={18} className="text-primary-600 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Écoles & Campus</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Accès rapide aux universités et instituts</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200">
                <Bike size={18} className="text-primary-600 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Parking & Sécurité</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Garage fermé pour motos et véhicules</p>
                </div>
              </div>
            </div>
          </section>

          {/* Simulateur de budget mensuel */}
          <section className="space-y-4 pt-4 border-t border-slate-100 bg-sky-50/50 p-5 rounded-2xl border border-sky-100">
            <div className="flex items-center gap-2">
              <Calculator size={18} className="text-primary-600" />
              <h2 className="text-base font-bold text-slate-900">
                Estimation de votre budget global mensuel
              </h2>
            </div>
            <p className="text-xs text-slate-600">
              Anticipez vos dépenses mensuelles réelles pour vivre sereinement dans ce logement au Bénin.
            </p>

            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex justify-between py-1 border-b border-sky-100">
                <span>Loyer mensuel principal</span>
                <span className="font-semibold text-slate-900">{formatPrice(apartment.price)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-sky-100">
                <span>Charges (gardiennage, eau, entretien)</span>
                <span className="font-semibold text-slate-900">+{formatPrice(apartment.charges || 0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-sky-100">
                <span>Entretien & électricité courante (estimé)</span>
                <span className="font-semibold text-slate-900">+10 000 FCFA</span>
              </div>
              <div className="flex justify-between py-1 border-b border-sky-100">
                <span>Abonnement internet fibre illimitée (estimé)</span>
                <span className="font-semibold text-slate-900">+25 000 FCFA</span>
              </div>
              <div className="flex justify-between pt-2 text-sm font-extrabold text-slate-900">
                <span>Coût mensuel total estimé</span>
                <span className="text-primary-600">{formatPrice(totalMonthlyBudget)} /mois</span>
              </div>
            </div>
          </section>

          {/* Propriétaire Card */}
          <section className="p-5 border border-slate-200 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Propriétaire du bien</h3>
            <div className="flex items-center gap-4">
              <img
                src={apartment.landlord.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&q=80'}
                alt=""
                className="w-14 h-14 rounded-full object-cover ring-2 ring-primary-500"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">
                    {apartment.landlord.firstName} {apartment.landlord.lastName}
                  </h4>
                  {apartment.landlord.isVerified && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <CheckCircle size={12} />
                      Identité vérifiée
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Répond habituellement en moins de 2h ({apartment.landlord.responseRate || 95}% de taux de réponse)
                </p>
              </div>
            </div>
          </section>

        </div>

        {/* ── Right Column (1/3 Sticky Aside) ── */}
        <div className="space-y-6">
          <div className="sticky top-20 bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-5">

            {/* Price Box */}
            <div className="flex items-baseline justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-2xl font-black text-slate-900 tracking-tight">
                  {formatPrice(apartment.price)}
                </span>
                <span className="text-xs text-slate-500 font-medium"> /mois</span>
                {apartment.charges && (
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    dont {apartment.charges}€ de charges forfaitaires
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-500">Dépôt de garantie</span>
                <p className="text-xs font-bold text-slate-900">{formatPrice(apartment.price)}</p>
              </div>
            </div>

            {/* Pass Vérifié One-Click Apply */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-900">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  Candidature en ligne
                </div>
                <span className="text-[10px] font-bold bg-emerald-200/80 text-emerald-800 px-2 py-0.5 rounded-full">
                  Envoi au bailleur
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Envoyez une candidature au bailleur pour ce logement.
              </p>
              <Button
                variant="primary"
                size="md"
                isLoading={isApplying}
                disabled={applicationSubmitted}
                onClick={handleApply}
                className="w-full rounded-xl font-bold text-xs"
              >
                {applicationSubmitted ? 'Candidature envoyée ✓' : 'Postuler en 1 clic'}
              </Button>
            </div>

            {/* Schedule a Visit */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CalendarDays size={16} className="text-primary-600" />
                <h4 className="text-xs font-bold text-slate-900">Planifier une visite</h4>
              </div>
              <p className="text-xs text-slate-500">
                {slotsLoading ? 'Chargement des créneaux…' : slotsError ?? (slots.length ? `${slots.length} créneau${slots.length > 1 ? 'x' : ''} disponible${slots.length > 1 ? 's' : ''}.` : 'Aucun créneau disponible pour le moment.')}
              </p>
              <Button
                variant="outline"
                size="md"
                onClick={openBooking}
                disabled={slotsLoading || slots.length === 0}
                className="w-full rounded-xl font-semibold text-xs"
              >
                Choisir un créneau de visite
              </Button>
            </div>

            <div className="space-y-3 rounded-xl border border-cyan-100 bg-cyan-50/60 p-4">
              <h4 className="text-xs font-bold text-slate-900">Contacter le bailleur</h4>
              <textarea value={messageText} onChange={(event) => setMessageText(event.target.value)} rows={3} maxLength={4000} placeholder="Présentez-vous et posez vos questions…" className="w-full resize-y rounded-lg border border-slate-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              <Button variant="primary" size="sm" className="w-full" isLoading={isSendingMessage} disabled={!messageText.trim() || user?.role !== 'tenant'} onClick={() => void handleSendMessage()}>Envoyer un message</Button>
              {user?.role !== 'tenant' && <p className="text-xs text-slate-500">La messagerie est réservée aux locataires.</p>}
            </div>

            {/* Guarantee trust points */}
            <div className="pt-2 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                <span>Zéro frais d'agence supplémentaire</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                <span>Protection anti-fraude garantie MyHome</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                <span>Compatible garantie Visale & Garantme</span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* ── Similar Apartments ── */}
      <section className="pt-12 border-t border-slate-200 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Logements similaires qui pourraient vous plaire
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Découvrez d'autres biens certifiés dans les mêmes critères.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {similarApartments.map((apt) => (
            <ApartmentCard
              key={apt.id}
              apartment={apt}
              variant="grid"
              onClick={(similarId) => {
                navigate(`/annonces/${similarId}`)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            />
          ))}
        </div>
      </section>

      {/* ── Fullscreen Lightbox Modal ── */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 sm:p-6 animate-fade-in">
          <div className="flex items-center justify-between text-white">
            <span className="text-xs font-semibold">
              Photo {lightboxIndex + 1} sur {apartment.photos.length} — {apartment.title}
            </span>
            <button
              onClick={() => setLightboxOpen(false)}
              className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="relative flex-1 flex items-center justify-center max-h-[80vh]">
            <img
              src={apartment.photos[lightboxIndex]}
              alt=""
              className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
            />
            {apartment.photos.length > 1 && (
              <>
                <button
                  onClick={() => setLightboxIndex((i) => (i === 0 ? apartment.photos.length - 1 : i - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={() => setLightboxIndex((i) => (i === apartment.photos.length - 1 ? 0 : i + 1))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails row */}
          <div className="flex gap-2 justify-center overflow-x-auto py-2">
            {apartment.photos.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setLightboxIndex(idx)}
                className={cn(
                  'w-14 h-10 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0',
                  lightboxIndex === idx ? 'border-primary-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100',
                )}
              >
                <img src={p} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Booking Modal ── */}
      {showBookingModal && (
        <BookingModal
          apartmentTitle={apartment.title}
          slots={slots}
          onClose={() => setShowBookingModal(false)}
          onConfirm={handleBookingConfirmed}
        />
      )}

    </div>
  )
}

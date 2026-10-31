import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Search,
  MapPin,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
  Users,
  Building,
  KeyRound,
  FileCheck,
  ChevronDown,
  Star,
  Zap,
} from 'lucide-react'
import { ApartmentCard } from '@/components/features/ApartmentCard'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { apiRequest, type ApiApartment } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { mockApartments } from '@/data/mockApartments'
import type { Apartment } from '@/types'

const POPULAR_CITIES = [
  'Cotonou',
  'Haie Vive',
  'Cadjehoun',
  'Akpakpa',
  'Fidjrossè',
  'Abomey-Calavi',
  'Porto-Novo',
  'Parakou',
]

const CATEGORIES = [
  {
    type: 'studio',
    label: 'Studios & Meublés',
    description: 'Idéal consultant, étudiant & séjour',
    count: '320+ annonces',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80',
  },
  {
    type: 'apartment',
    label: 'Appartements T2 & T3',
    description: 'Cadjehoun, Fidjrossè, Akpakpa',
    count: '540+ annonces',
    image: 'https://images.unsplash.com/photo-1502005229762-ee1b2da97e06?w=600&q=80',
  },
  {
    type: 'room',
    label: 'Chambres & Entrées perso',
    description: 'Calavi UAC, Cotonou centre',
    count: '210+ annonces',
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80',
  },
  {
    type: 'house',
    label: 'Villas & Concessions',
    description: 'Jardin, cour privée, parking sécurisé',
    count: '95+ annonces',
    image: 'https://images.unsplash.com/photo-1571508601891-ca5e7a713859?w=600&q=80',
  },
]

const STATS = [
  { value: '1 200+', label: 'Logements vérifiés au Bénin' },
  { value: '24h', label: 'Délai moyen de réponse bailleur' },
  { value: '100%', label: 'Loyers transparents en FCFA' },
  { value: '4.9/5', label: 'Satisfaction locataires et propriétaires' },
]

const STEPS = [
  {
    step: '01',
    title: 'Trouvez votre bien idéal',
    description: 'Parcourez des annonces certifiées avec visites virtuelles 3D, photos réelles et localisation précise à Cotonou et partout au Bénin.',
    icon: Search,
  },
  {
    step: '02',
    title: 'Postulez avec le Pass Vérifié',
    description: 'Constituez votre dossier numérique une seule fois (identité, caution, revenus). Postulez en 1 clic sans démarches répétitives.',
    icon: FileCheck,
  },
  {
    step: '03',
    title: 'Planifiez votre visite en ligne',
    description: 'Choisissez directement votre créneau dans l\'agenda partagé du propriétaire, sans intermédiaires informels douteux.',
    icon: Calendar,
  },
  {
    step: '04',
    title: 'Emménagez en toute sérénité',
    description: 'Contrat de bail certifié conforme à la législation béninoise, inventaire précis et sécurité garantie pour votre caution.',
    icon: KeyRound,
  },
]

const TESTIMONIALS = [
  {
    name: 'Marc Dossou',
    role: 'Locataire à Cotonou (Haie Vive)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80',
    content: 'J\'ai trouvé mon appartement meublé à la Haie Vive en 3 jours ! Les prix en FCFA sont clairs, sans faux frais de démarcheurs. Le propriétaire était très réactif.',
    rating: 5,
  },
  {
    name: 'Sophie Houngbo',
    role: 'Propriétaire bailleur à Cadjehoun',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&q=80',
    content: 'En tant que propriétaire, la plateforme MyHome m\'a permis de louer ma villa sans payer de commission abusive et en sélectionnant des locataires sérieux avec dossier vérifié.',
    rating: 5,
  },
  {
    name: 'Aïcha Mensah',
    role: 'Étudiante à Abomey-Calavi (UAC)',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&q=80',
    content: 'Le studio que j\'ai réservé à Arconville est exactement comme sur les photos. Le système de réservation en ligne évite les arnaques fréquentes sur le terrain.',
    rating: 5,
  },
]

const FAQS = [
  {
    q: 'Comment s\'effectuent les paiements des loyers et cautions au Bénin ?',
    a: 'Les loyers sont affichés en Franc CFA (FCFA). Conformément aux règles en vigueur au Bénin, les modalités de paiement (virement bancaire, chèque ou Mobile Money MTN/Moov) sont convenues directement avec le propriétaire en toute transparence, sans frais cachés.',
  },
  {
    q: 'Comment fonctionne le Pass Vérifié ?',
    a: 'Le Pass Vérifié est votre dossier numérique sécurisé. Vous déposez vos pièces (carte d\'identité / passeport / CIP, justificatifs professionnels ou garant). Une fois certifié, vous postulez en un seul clic à n\'importe quel logement.',
  },
  {
    q: 'Y a-t-il des frais de commission ou de visite ?',
    a: 'Non ! Sur MyHome, la consultation des annonces, les candidatures et la réservation de visites sont 100% gratuites pour les locataires. Vous ne payez aucun frais de visite fantôme.',
  },
  {
    q: 'Comment sont certifiés les logements à Cotonou et dans les autres villes ?',
    a: 'Chaque logement publié fait l\'objet d\'une vérification préalable du titre de propriété ou du mandat de gestion, ainsi que d\'un contrôle de la conformité des photos et des commodités (forage, SBEE, climatisation).',
  },
]

export default function HomePage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const [searchCity, setSearchCity] = useState('')
  const [propertyType, setPropertyType] = useState('all')
  const [budgetMax, setBudgetMax] = useState('')
  const [featuredTab, setFeaturedTab] = useState<'all' | 'cotonou' | 'calavi' | '3d'>('all')
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)
  const [apiApartments, setApiApartments] = useState<Apartment[] | null>(null)

  useEffect(() => {
    let cancelled = false
    apiRequest<ApiApartment[]>('/api/apartments?limit=100', { token })
      .then((items) => { if (!cancelled && Array.isArray(items) && items.length > 0) setApiApartments(items as unknown as Apartment[]) })
      .catch(() => { /* repli silencieux sur les données de démonstration */ })
    return () => { cancelled = true }
  }, [token])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchCity.trim()) params.set('q', searchCity.trim())
    if (propertyType !== 'all') params.set('type', propertyType)
    if (budgetMax) params.set('maxPrice', budgetMax)
    navigate(`/annonces${params.toString() ? `?${params.toString()}` : ''}`)
  }

  // Filter featured preview — catalogue API si disponible, repli sur les données de démo
  const catalog = apiApartments ?? mockApartments
  const featuredApartments = catalog.filter((apt) => {
    if (featuredTab === 'cotonou') return apt.address.city.toLowerCase() === 'cotonou'
    if (featuredTab === 'calavi') return apt.address.city.toLowerCase().includes('calavi')
    if (featuredTab === '3d') return apt.hasVirtualTour
    return true
  }).slice(0, 6)

  return (
    <div className="w-full space-y-16 sm:space-y-24 pb-16">

      {/* ── 1. Hero Section (Full width) ───────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-50/80 via-white to-white pt-8 pb-16 lg:pt-14 lg:pb-24 border-b border-slate-100 w-full px-4 sm:px-6">
        {/* Decorative background glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-96 bg-gradient-to-r from-sky-400/10 via-primary-500/10 to-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="w-full relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-4">

            {/* Badge pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-sky-200/80 shadow-xs text-xs font-semibold text-primary-700 animate-fade-in">
              <Sparkles size={14} className="text-primary-600" />
              <span>Plateforme n°1 de location immobilière vérifiée au Bénin</span>
            </div>

            {/* Main title */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] font-display">
              Trouvez votre futur chez-vous au Bénin{' '}
              <span className="bg-gradient-to-r from-primary-600 to-sky-500 bg-clip-text text-transparent">
                en toute sérénité.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Chambres, studios, appartements et villas de standing à Cotonou, Abomey-Calavi, Porto-Novo et Parakou. Tarifs clairs en FCFA et candidature en 1 clic.
            </p>

            {/* ── Search Widget Box ── */}
            <div className="pt-4 w-full">
              <form
                onSubmit={handleSearch}
                className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-3 sm:p-5 text-left transition-shadow hover:shadow-2xl"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 items-center">

                  {/* Field 1: Localisation */}
                  <div className="relative p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Ville ou Quartier
                    </label>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-primary-600 flex-shrink-0" />
                      <input
                        type="text"
                        value={searchCity}
                        onChange={(e) => setSearchCity(e.target.value)}
                        placeholder="Haie Vive, Cadjehoun, Calavi..."
                        className="w-full text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 bg-transparent focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Field 2: Type de bien */}
                  <div className="relative p-2 rounded-xl hover:bg-slate-50 transition-colors border-t sm:border-t-0 sm:border-l border-slate-100">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Type de bien
                    </label>
                    <select
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value)}
                      className="w-full text-xs sm:text-sm font-medium text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                    >
                      <option value="all">Tous les types</option>
                      <option value="studio">Studio & Meublé</option>
                      <option value="apartment">Appartement</option>
                      <option value="room">Chambre / Entrée perso</option>
                      <option value="house">Villa & Maison</option>
                      <option value="loft">Loft de prestige</option>
                    </select>
                  </div>

                  {/* Field 3: Budget Max (en FCFA) */}
                  <div className="relative p-2 rounded-xl hover:bg-slate-50 transition-colors border-t sm:border-t-0 sm:border-l border-slate-100">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Budget max (FCFA)
                    </label>
                    <select
                      value={budgetMax}
                      onChange={(e) => setBudgetMax(e.target.value)}
                      className="w-full text-xs sm:text-sm font-medium text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                    >
                      <option value="">Tous les budgets</option>
                      <option value="75000">Jusqu'à 75 000 FCFA</option>
                      <option value="150000">Jusqu'à 150 000 FCFA</option>
                      <option value="300000">Jusqu'à 300 000 FCFA</option>
                      <option value="500000">Jusqu'à 500 000 FCFA</option>
                      <option value="1000000">Jusqu'à 1 000 000 FCFA</option>
                    </select>
                  </div>

                  {/* Submit CTA */}
                  <div className="sm:col-span-3 lg:col-span-1 pt-2 sm:pt-0">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-full h-12 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all"
                      leftIcon={<Search size={16} />}
                    >
                      Rechercher
                    </Button>
                  </div>
                </div>
              </form>

              {/* Popular quick links */}
              <div className="mt-4 flex items-center justify-center gap-2 flex-wrap text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Zones populaires au Bénin :</span>
                {POPULAR_CITIES.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => { setSearchCity(city); navigate(`/annonces?q=${encodeURIComponent(city)}`) }}
                    className="px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-primary-500 hover:text-primary-600 transition-colors text-slate-700 shadow-2xs"
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ── Key stats bar (Full width) ── */}
        <div className="w-full mt-12 pt-8 border-t border-slate-100">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {STATS.map(({ value, label }) => (
              <div key={label} className="p-3">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
                  {value}
                </div>
                <div className="text-xs text-slate-500 mt-1 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. Popular Categories (Full width) ────────────────────────────── */}
      <section className="w-full px-4 sm:px-6">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Explorez les biens par catégorie au Bénin
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Des logements contrôlés et sécurisés adaptés à tous les budgets.
            </p>
          </div>
          <Link
            to="/annonces"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 group"
          >
            <span>Voir toutes les offres</span>
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.type}
              onClick={() => navigate(`/annonces?type=${cat.type}`)}
              className="group relative h-64 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-card-hover transition-all duration-300"
            >
              <img
                src={cat.image}
                alt={cat.label}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <span className="text-[11px] font-semibold text-sky-300 uppercase tracking-wider">
                  {cat.count}
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5 leading-snug">
                  {cat.label}
                </h3>
                <p className="text-xs text-slate-300 mt-1 line-clamp-1">
                  {cat.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. Featured Listings (Full width) ──────────────────────────────── */}
      <section className="w-full px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary-600 animate-pulse" />
              <span className="text-xs font-bold text-primary-600 uppercase tracking-wider">
                Sélection vérifiée au Bénin
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
              Les coups de cœur de la semaine
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Cotonou, Abomey-Calavi, Porto-Novo et Parakou — disponibles de suite.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
            <button
              onClick={() => setFeaturedTab('all')}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
                featuredTab === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900',
              )}
            >
              Tous
            </button>
            <button
              onClick={() => setFeaturedTab('cotonou')}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
                featuredTab === 'cotonou'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900',
              )}
            >
              Cotonou
            </button>
            <button
              onClick={() => setFeaturedTab('calavi')}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
                featuredTab === 'calavi'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900',
              )}
            >
              Calavi
            </button>
            <button
              onClick={() => setFeaturedTab('3d')}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
                featuredTab === '3d'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900',
              )}
            >
              Visite 3D
            </button>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {featuredApartments.map((apartment) => (
            <ApartmentCard
              key={apartment.id}
              apartment={apartment}
              variant="grid"
              onClick={(id) => navigate(`/annonces/${id}`)}
            />
          ))}
        </div>

        <div className="text-center pt-8">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/annonces')}
            rightIcon={<ArrowRight size={16} />}
            className="rounded-xl px-6 font-semibold shadow-xs"
          >
            Explorer les {catalog.length} logements disponibles au Bénin
          </Button>
        </div>
      </section>

      {/* ── 4. How It Works (Full width) ──────────────────────────────────── */}
      <section className="bg-slate-50 py-16 lg:py-24 border-y border-slate-200/70 w-full px-4 sm:px-6">
        <div className="w-full">
          <div className="max-w-2xl mx-auto text-center mb-14 space-y-3">
            <span className="text-xs font-bold text-primary-600 uppercase tracking-wider">
              Simple, transparent et sans intermédiaire douteux
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-display">
              Comment louer avec MyHome au Bénin ?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Une expérience moderne conçue pour vous épargner les tracas des démarcheurs et les fausses annonces.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step) => {
              const Icon = step.icon
              return (
                <div
                  key={step.step}
                  className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs relative hover:shadow-card transition-shadow"
                >
                  <div className="text-3xl font-extrabold text-slate-200 mb-3 font-display">
                    {step.step}
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-primary-600 flex items-center justify-center mb-4">
                    <Icon size={20} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── 5. Landlord CTA Banner (Full width) ────────────────────────────── */}
      <section className="w-full px-4 sm:px-6">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 p-8 sm:p-12 lg:p-16 text-white shadow-xl">
          <div className="max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-sky-200 text-xs font-semibold backdrop-blur-md">
              <Building size={14} />
              Propriétaires & Bailleurs au Bénin
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight font-display">
              Louez vos biens sans vacance locative et sécurisez vos loyers en FCFA.
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Dépôt d'annonce 100% gratuit, sélection rigoureuse de candidats avec revenus et identité vérifiés, agenda de visite automatisé. Fini les retards de paiement et les litiges.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 pb-2 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                <span>Publication gratuite</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                <span>Candidats solvables vérifiés</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                <span>Bail conforme loi béninoise</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/proprietaire/publier')}
                className="rounded-xl font-bold text-sm bg-primary-500 hover:bg-primary-400 text-white"
              >
                Déposer une annonce gratuite
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/proprietaire/dashboard')}
                className="rounded-xl font-medium text-sm bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Accéder à mon espace bailleur
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Testimonials (Full width) ──────────────────────────────────── */}
      <section className="w-full px-4 sm:px-6">
        <div className="max-w-xl mx-auto text-center mb-12 space-y-2">
          <span className="text-xs font-bold text-primary-600 uppercase tracking-wider">
            Témoignages vérifiés
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Ils louent en toute confiance au Bénin
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Découvrez les retours d'expérience de notre communauté à Cotonou et Calavi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-3">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} size={14} className="fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-700 leading-relaxed italic">
                  "{t.content}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-5 mt-4 border-t border-slate-100">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{t.name}</h4>
                  <p className="text-[11px] text-slate-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 7. FAQ Accordion (Full width container) ────────────────────────── */}
      <section className="w-full px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="text-center mb-10 space-y-2">
          <span className="text-xs font-bold text-primary-600 uppercase tracking-wider">
            Questions fréquentes
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Tout comprendre sur la location au Bénin
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => (
            <div
              key={idx}
              className="border border-slate-200 rounded-2xl overflow-hidden bg-white transition-colors"
            >
              <button
                type="button"
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-semibold text-slate-900 text-sm hover:text-primary-600 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  size={18}
                  className={cn(
                    'text-slate-400 transition-transform duration-200 flex-shrink-0 ml-2',
                    openFaqIndex === idx && 'rotate-180 text-primary-600',
                  )}
                />
              </button>
              {openFaqIndex === idx && (
                <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}

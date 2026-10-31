import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  PlusCircle,
  BellRing,
  SlidersHorizontal,
  FileCheck,
  Clock,
  TrendingUp,
  Eye,
  Calendar,
  Users,
  Building,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Search,
  MessageSquare,
  Send,
  Trash2,
} from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { ApplicationCard } from '@/components/features/ApplicationCard'
import { mockApplications } from '@/data/mockApplications'
import { mockApartments } from '@/data/mockApartments'
import { useToast } from '@/context/ToastContext'
import type { TenantApplication } from '@/types'
import { useAuth } from '@/context/AuthContext'
import { apiRequest, type ApiApplication, type ApiApartment, type ApiVisitSlot, type ApiConversation, type ApiMessage } from '@/lib/api'

type FilterKey = 'all' | 'verified' | 'pending'
type DashboardTab = 'applications' | 'visits' | 'properties' | 'messages'
type DashboardVisit = { id: string; apartmentTitle: string; date: string; startTime: string; endTime: string }

const DEMO_VISITS: DashboardVisit[] = [
  { id: 'demo-visit-1', apartmentTitle: 'Appartement Haie Vive', date: '2030-10-16', startTime: '14:30', endTime: '15:00' },
  { id: 'demo-visit-2', apartmentTitle: 'Appartement Haie Vive', date: '2030-10-17', startTime: '11:00', endTime: '11:30' },
  { id: 'demo-visit-3', apartmentTitle: 'Appartement Haie Vive', date: '2030-10-18', startTime: '10:15', endTime: '10:45' },
]

const isValidApplication = (application: unknown): application is TenantApplication => {
  if (!application || typeof application !== 'object') return false
  const item = application as Partial<TenantApplication>
  return typeof item.id === 'string'
    && typeof item.firstName === 'string'
    && typeof item.lastName === 'string'
    && typeof item.situation === 'string'
    && typeof item.monthlyIncome === 'number'
    && ['green', 'orange', 'red'].includes(String(item.solvabilityScore))
    && typeof item.solvabilityRatio === 'number'
    && typeof item.fileCompletionPercent === 'number'
    && typeof item.isFileVerified === 'boolean'
    && typeof item.submittedAt === 'string'
    && ['pending', 'accepted', 'pre_validated', 'rejected'].includes(String(item.status))
}

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',      label: 'Toutes les candidatures' },
  { key: 'verified', label: 'Dossiers vérifiés' },
  { key: 'pending',  label: 'En attente de traitement' },
]

export default function LandlordDashboardPage() {
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const { showToast } = useToast()
  const isDemo = user?.id === 'user-landlord' && !token
  const [applications, setApplications] = useState<TenantApplication[]>([])
  const [apartments, setApartments] = useState<ApiApartment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [bookedVisits, setBookedVisits] = useState<DashboardVisit[]>([])
  const [filter, setFilter] = useState<FilterKey>('all')
  const [activeTab, setActiveTab] = useState<DashboardTab>('applications')
  const [searchCandidate, setSearchCandidate] = useState('')
  const [sortBySolvability, setSortBySolvability] = useState(true)
  const [conversations, setConversations] = useState<ApiConversation[]>([])
  const [activeConversation, setActiveConversation] = useState<ApiConversation | null>(null)
  const [thread, setThread] = useState<ApiMessage[]>([])
  const [reply, setReply] = useState('')

  const apartment = apartments[0] ?? (isDemo ? mockApartments.find((item) => item?.id === '1') ?? mockApartments[0] : null)

  const pendingCount = applications?.filter((application) => application?.status === 'pending').length ?? 0

  useEffect(() => {
    let cancelled = false

    if (isDemo) {
      setApplications(Array.isArray(mockApplications) ? mockApplications.filter(isValidApplication) : [])
      setApartments(Array.isArray(mockApartments) ? mockApartments : [])
      setBookedVisits(DEMO_VISITS)
      setIsLoading(false)
      return () => { cancelled = true }
    }

    if (!user || !token || (user.role !== 'landlord' && user.role !== 'admin')) {
      setApplications([])
      setApartments([])
      setBookedVisits([])
      setIsLoading(false)
      return () => { cancelled = true }
    }

    setIsLoading(true)
    Promise.all([
      apiRequest<ApiApplication[]>('/api/landlord/applications', { token }),
      apiRequest<ApiApartment[]>('/api/me/apartments', { token }),
    ]).then(async ([apiApplications, apiApartments]) => {
      if (cancelled) return
      const safeApartments = Array.isArray(apiApartments) ? apiApartments : []
      setApplications(Array.isArray(apiApplications) ? apiApplications.filter(isValidApplication) : [])
      setApartments(safeApartments)
      const visitGroups = await Promise.all(safeApartments.map(async (listing) => {
        try {
          const slots = await apiRequest<ApiVisitSlot[]>('/api/apartments/' + listing.id + '/slots', { token })
          return (Array.isArray(slots) ? slots : []).filter((slot) => slot?.isBooked).map((slot) => ({
            id: slot.id, apartmentTitle: listing.title, date: slot.date, startTime: slot.startTime, endTime: slot.endTime,
          }))
        } catch {
          return []
        }
      }))
      if (!cancelled) setBookedVisits(visitGroups.flat())
    }).catch((error: unknown) => {
      if (!cancelled) {
        setApplications([])
        setApartments([])
        showToast(error instanceof Error ? error.message : 'Impossible de charger le tableau de bord.', 'error')
      }
    }).finally(() => {
      if (!cancelled) setIsLoading(false)
    })

    return () => { cancelled = true }
  }, [isDemo, token, user, showToast])

  useEffect(() => {
    if (!token || user?.role !== 'landlord') { setConversations([]); return }
    apiRequest<ApiConversation[]>('/api/me/conversations', { token }).then(setConversations).catch((error: unknown) => showToast(error instanceof Error ? error.message : 'Impossible de charger les messages.', 'error'))
  }, [token, user?.role, showToast])

  const openConversation = async (conversation: ApiConversation) => {
    if (!token) return
    setActiveConversation(conversation)
    try {
      const items = await apiRequest<ApiMessage[]>('/api/conversations/' + conversation.apartmentId + '/' + conversation.otherUserId + '/messages', { token })
      setThread(items)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Conversation inaccessible.', 'error')
    }
  }

  const sendReply = async () => {
    if (!token || !activeConversation || !reply.trim()) return
    try {
      const item = await apiRequest<ApiMessage>('/api/conversations/' + activeConversation.apartmentId + '/' + activeConversation.otherUserId + '/messages', { method: 'POST', token, body: { content: reply } })
      setThread((previous) => [...previous, item])
      setReply('')
      setConversations((previous) => previous.map((conversation) => conversation.apartmentId === item.apartmentId && conversation.otherUserId === activeConversation.otherUserId ? { ...conversation, lastMessage: item.content, lastTimestamp: item.timestamp } : conversation))
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Message non envoyé.', 'error')
    }
  }

  const updateListing = async (listing: ApiApartment) => {
    if (!token) return
    const nextTitle = window.prompt('Titre de l’annonce', listing.title)
    if (!nextTitle?.trim()) return
    const nextPrice = window.prompt('Loyer mensuel en FCFA', String(listing.price))
    if (!nextPrice || !Number.isFinite(Number(nextPrice))) return
    try {
      const updated = await apiRequest<ApiApartment>('/api/apartments/' + listing.id, { method: 'PATCH', token, body: { title: nextTitle.trim(), price: Number(nextPrice) } })
      setApartments((previous) => previous.map((item) => item.id === updated.id ? updated : item))
      showToast('Annonce modifiée.', 'success')
    } catch (error) { showToast(error instanceof Error ? error.message : 'Modification impossible.', 'error') }
  }

  const changeListingStatus = async (listing: ApiApartment) => {
    if (!token) return
    const status = listing.status === 'rented' ? 'available' : 'rented'
    try {
      await apiRequest('/api/apartments/' + listing.id + '/status?status=' + status, { method: 'PUT', token })
      setApartments((previous) => previous.map((item) => item.id === listing.id ? { ...item, status } : item))
      showToast(status === 'rented' ? 'Annonce marquée comme louée.' : 'Annonce remise en disponibilité.', 'success')
    } catch (error) { showToast(error instanceof Error ? error.message : 'Statut non modifié.', 'error') }
  }

  const removeListing = async (listing: ApiApartment) => {
    if (!token || !window.confirm('Supprimer « ' + listing.title + ' » ?')) return
    try {
      await apiRequest('/api/apartments/' + listing.id, { method: 'DELETE', token })
      setApartments((previous) => previous.filter((item) => item.id !== listing.id))
      showToast('Annonce supprimée.', 'success')
    } catch (error) { showToast(error instanceof Error ? error.message : 'Suppression impossible.', 'error') }
  }


  const handleAccept = async (id: string) => {
    try {
      if (token) await apiRequest('/api/applications/' + id + '/status', { method: 'PATCH', token, body: { status: 'pre_validated' } })
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'La candidature n’a pas pu être mise à jour.', 'error')
      return
    }
    setApplications((prev) =>
      (Array.isArray(prev) ? prev : []).map((a) => a?.id === id ? { ...a, status: 'pre_validated' as const } : a),
    )
    showToast('Candidat pré-validé ! Une invitation pour une visite lui a été adressée.', 'success')
  }

  const handleReject = async (id: string) => {
    try {
      if (token) await apiRequest('/api/applications/' + id + '/status', { method: 'PATCH', token, body: { status: 'rejected' } })
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'La candidature n’a pas pu être mise à jour.', 'error')
      return
    }
    setApplications((prev) =>
      (Array.isArray(prev) ? prev : []).map((a) => a?.id === id ? { ...a, status: 'rejected' as const } : a),
    )
    showToast('La candidature a été refusée.', 'info')
  }

  const filteredApplications = useMemo(() => {
    let list = (Array.isArray(applications) ? applications : []).filter(isValidApplication)

    if (filter === 'verified') list = list.filter((application) => application?.isFileVerified)
    if (filter === 'pending')  list = list.filter((application) => application?.status === 'pending')

    if (searchCandidate.trim()) {
      const q = searchCandidate.toLowerCase()
      list = list.filter(
        (application) =>
          (application?.firstName ?? '').toLowerCase().includes(q) ||
          (application?.lastName ?? '').toLowerCase().includes(q) ||
          (application?.situation ?? '').toLowerCase().includes(q),
      )
    }

    if (sortBySolvability) {
      list.sort((a, b) => (b?.solvabilityRatio ?? 0) - (a?.solvabilityRatio ?? 0))
    }

    return list
  }, [applications, filter, searchCandidate, sortBySolvability])

  if (!user || (user.role !== 'landlord' && user.role !== 'admin')) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-extrabold text-slate-900">Espace réservé aux bailleurs</h1>
        <p className="mt-2 text-sm text-slate-500">Connectez-vous avec un compte bailleur pour gérer vos annonces et candidatures.</p>
        <Link to="/auth" state={{ from: '/proprietaire/dashboard' }} className="mt-6 inline-flex rounded-xl bg-sky-600 px-5 py-3 text-sm font-bold text-white hover:bg-sky-700">Se connecter</Link>
      </section>
    )
  }

  return (
    <div className="w-full px-4 sm:px-6 py-8 space-y-8">

      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Espace Bailleur Certifié
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
            Tableau de bord propriétaire
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gérez vos annonces, vos candidatures et suivez l'agenda de vos visites.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<PlusCircle size={15} />}
          onClick={() => navigate('/proprietaire/publier')}
          className="rounded-xl font-bold text-xs shadow-sm hover:shadow-md transition-shadow"
        >
          Déposer une nouvelle annonce
        </Button>
      </div>

      {/* ── Key Metrics Cards (SaaS KPI) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Annonces actives</span>
            <Building size={16} className="text-primary-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{apartments?.filter((item) => item?.status === 'available').length ?? 0}</p>
          <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 size={12} />
            Annonce(s) en ligne
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Vues totales</span>
            <Eye size={16} className="text-sky-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">1 420</p>
          <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp size={12} />
            +24% cette semaine
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Candidatures</span>
            <Users size={16} className="text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{applications?.length ?? 0}</p>
          <p className="text-[11px] text-primary-600 font-semibold">
            {pendingCount} en attente de réponse
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Visites confirmées</span>
            <Calendar size={16} className="text-amber-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{bookedVisits?.length ?? 0}</p>
          <p className="text-[11px] text-slate-500">
            {bookedVisits?.length ? 'Créneaux réservés' : 'Aucune visite confirmée'}
          </p>
        </div>
      </div>

      {/* ── Active Listing Card ── */}
      {apartment && (
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <img
            src={apartment?.photos?.[0] ?? '/placeholder-apartment.svg'}
            alt=""
            className="w-20 h-16 rounded-xl object-cover flex-shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded', apartment.status === 'available' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800')}>
                {apartment.status === 'pending' ? 'À approuver' : apartment.status === 'rented' ? 'Loué' : apartment.status === 'available' ? 'Disponible' : 'Réservé'}
              </span>
              <span className="text-xs text-slate-400">Réf : {apartment?.id ?? '—'}</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 line-clamp-1 mt-0.5">
              {apartment?.title ?? 'Annonce sans titre'}
            </h3>
            <p className="text-xs text-slate-500">
              {apartment?.address?.street ?? 'Adresse non renseignée'}, {apartment?.address?.city ?? 'Bénin'} · {apartment?.surface ?? 0} m² · {formatPrice(apartment?.price ?? 0)}/mois
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/annonces/${apartment?.id ?? ''}`)}
            leftIcon={<ExternalLink size={13} />}
            className="text-xs rounded-xl"
          >
            Voir l'annonce
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/proprietaire/publier')}
            className="text-xs rounded-xl"
          >
            Modifier
          </Button>
        </div>
      </div>

      )}

      {/* ── Dashboard Tabs ── */}
      <div className="border-b border-slate-200 flex gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('applications')}
          className={cn(
            'pb-3 relative transition-colors',
            activeTab === 'applications'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-slate-500 hover:text-slate-800',
          )}
        >
          Candidatures reçues ({applications.length})
        </button>
        <button
          onClick={() => setActiveTab('visits')}
          className={cn('pb-3 relative transition-colors', activeTab === 'visits' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-500 hover:text-slate-800')}
        >Créneaux & Visites ({bookedVisits.length})</button>
        <button onClick={() => setActiveTab('properties')} className={cn('pb-3 relative transition-colors', activeTab === 'properties' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-500 hover:text-slate-800')}>Mes annonces ({apartments.length})</button>
        <button onClick={() => setActiveTab('messages')} className={cn('pb-3 relative transition-colors', activeTab === 'messages' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-500 hover:text-slate-800')}><span className="inline-flex items-center gap-1"><MessageSquare size={14} />Messages ({conversations.length})</span></button>
      </div>

      {activeTab === 'properties' && (
        <div className="space-y-3">
          {apartments.length === 0 && <p className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">Vous n’avez pas encore publié d’annonce.</p>}
          {apartments.map((listing) => <article key={listing.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3"><img src={listing.photos?.[0] || '/placeholder-apartment.svg'} alt="" className="h-16 w-20 rounded-lg object-cover" /><div><h3 className="font-semibold">{listing.title}</h3><p className="text-xs text-slate-500">{listing.address.city} · {formatPrice(listing.price)}/mois · {listing.status === 'rented' ? 'Loué' : listing.status === 'pending' ? 'En modération' : 'Disponible'}</p></div></div>
            <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => void updateListing(listing)}>Modifier</Button><Button variant="outline" size="sm" onClick={() => void changeListingStatus(listing)}>{listing.status === 'rented' ? 'Rendre disponible' : 'Marquer loué'}</Button><Button variant="ghost" size="sm" onClick={() => void removeListing(listing)} aria-label="Supprimer l’annonce"><Trash2 size={15} /></Button></div>
          </article>)}
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="space-y-2">{conversations.length === 0 && <p className="text-sm text-slate-500">Aucun message reçu pour l’instant.</p>}{conversations.map((conversation) => <button key={conversation.apartmentId + conversation.otherUserId} onClick={() => void openConversation(conversation)} className={cn('w-full rounded-xl border p-3 text-left', activeConversation?.otherUserId === conversation.otherUserId && activeConversation?.apartmentId === conversation.apartmentId ? 'border-cyan-500 bg-cyan-50' : 'border-slate-200 bg-white')}><span className="block text-sm font-semibold">{conversation.otherUserName}</span><span className="block truncate text-xs text-slate-500">{conversation.apartmentTitle} · {conversation.lastMessage}</span></button>)}</div>
          <div className="flex min-h-80 flex-col rounded-2xl border border-slate-200 bg-white p-4">{activeConversation ? <><h3 className="border-b pb-3 text-sm font-semibold">{activeConversation.otherUserName} · {activeConversation.apartmentTitle}</h3><div className="flex-1 space-y-3 overflow-y-auto py-4">{thread.map((message) => <div key={message.id} className={cn('max-w-[85%] rounded-xl p-3 text-sm', message.senderId === user?.id ? 'ml-auto bg-cyan-100' : 'bg-slate-100')}><p>{message.content}</p><time className="mt-1 block text-right text-[10px] text-slate-500">{new Date(message.timestamp).toLocaleString('fr-FR')}</time></div>)}</div><div className="flex gap-2"><input value={reply} onChange={(event) => setReply(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void sendReply() }} placeholder="Votre réponse…" className="min-w-0 flex-1 rounded-xl border px-3 text-sm" /><Button onClick={() => void sendReply()} disabled={!reply.trim()} aria-label="Envoyer"><Send size={15} /></Button></div></> : <p className="m-auto text-sm text-slate-500">Sélectionnez une conversation pour lire et répondre.</p>}</div>
        </div>
      )}

      {/* ── Tab Content : Applications ── */}
      {activeTab === 'applications' && (
        <div className="space-y-6">

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              {FILTERS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={cn(
                    'h-9 px-3.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors',
                    filter === key
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-60">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchCandidate}
                  onChange={(e) => setSearchCandidate(e.target.value)}
                  placeholder="Chercher un candidat..."
                  className="w-full h-9 pl-9 pr-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortBySolvability(!sortBySolvability)}
                className={cn('text-xs h-9 rounded-xl', sortBySolvability ? 'bg-primary-50 text-primary-700 border-primary-200' : '')}
                leftIcon={<SlidersHorizontal size={13} />}
              >
                Solvabilité max
              </Button>
            </div>
          </div>

          {/* Applications Feed */}
          {isLoading ? (
            <div className="py-12 text-center text-sm text-slate-500">Chargement du tableau de bord…</div>
          ) : filteredApplications?.length === 0 ? (
            <div className="py-16 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 space-y-2">
              <Users size={28} className="mx-auto text-slate-400" />
              <p className="text-sm font-bold text-slate-800">Aucune candidature ne correspond à ce filtre</p>
              <p className="text-xs text-slate-500">Réinitialisez la recherche pour voir tous les candidats.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredApplications?.map((app) => (
                <ApplicationCard
                  key={app?.id}
                  application={app}
                  rentAmount={apartment?.price ?? 0}
                  onAccept={handleAccept}
                  onReject={handleReject}
                />
              ))}
            </div>
          )}

        </div>
      )}

      {/* ── Tab Content : Visits Agenda ── */}
      {activeTab === 'visits' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Agenda des visites programmées</h3>
              <p className="text-xs text-slate-500 mt-0.5">Visites individuelles confirmées par vos candidats</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => showToast('Nouveau créneau ajouté à votre agenda !', 'success')}
              className="rounded-xl text-xs"
            >
              + Ouvrir de nouveaux créneaux
            </Button>
          </div>

          <div className="space-y-3">
            {bookedVisits.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">Aucune visite réservée pour le moment.</p>
            ) : bookedVisits.map((visit) => (
              <div key={visit.id} className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{visit.apartmentTitle || 'Annonce sans titre'}</h4>
                  <p className="text-xs text-slate-500">Visite réservée · {visit.startTime}–{visit.endTime}</p>
                </div>
                <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800">
                  {visit.date ? new Date(visit.date + 'T12:00:00').toLocaleDateString('fr-FR', { dateStyle: 'full' }) : 'Date à confirmer'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

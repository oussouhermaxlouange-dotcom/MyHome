import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, EyeOff, Trash2, Users, Building2, ShieldAlert, FileCheck2 } from 'lucide-react'
import { apiRequest, type AdminUser, type ApiApartment } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { Button } from '@/components/ui/Button'

type ModeratedApartment = ApiApartment & { isApproved: boolean; isHidden: boolean }
type AdminTab = 'listings' | 'users' | 'documents'
type AdminDocument = {
  id: string
  kind: 'identity' | 'income'
  filename: string
  status: 'pending' | 'approved' | 'rejected'
  size: number
  createdAt: string
  owner: { id: string; firstName: string; lastName: string; email: string }
}
const DOCUMENT_STATUS_LABELS: Record<AdminDocument['status'], string> = {
  pending: 'À vérifier',
  approved: 'Approuvé',
  rejected: 'Rejeté',
}

export default function AdminDashboardPage() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [tab, setTab] = useState<AdminTab>('listings')
  const [listings, setListings] = useState<ModeratedApartment[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [documents, setDocuments] = useState<AdminDocument[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!token || user?.role !== 'admin') return
    setLoading(true)
    try {
      const [allListings, allUsers, allDocuments] = await Promise.all([
        apiRequest<ModeratedApartment[]>('/api/admin/apartments', { token }),
        apiRequest<AdminUser[]>('/api/admin/users', { token }),
        apiRequest<AdminDocument[]>('/api/admin/documents', { token }),
      ])
      setListings(allListings)
      setUsers(allUsers)
      setDocuments(allDocuments)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Chargement de la modération impossible.', 'error')
    } finally { setLoading(false) }
  }, [token, user?.role, showToast])

  useEffect(() => { if (user?.role !== 'admin') { navigate('/', { replace: true }); return } void reload() }, [user?.role, navigate, reload])

  const moderate = async (listing: ModeratedApartment, action: 'approve' | 'hide' | 'publish') => {
    if (!token) return
    try {
      await apiRequest('/api/admin/apartments/' + listing.id + '/moderation?action=' + action, { method: 'PATCH', token })
      showToast(action === 'approve' ? 'Annonce approuvée et publiée.' : action === 'hide' ? 'Annonce masquée du catalogue.' : 'Annonce réaffichée.', 'success')
      await reload()
    } catch (error) { showToast(error instanceof Error ? error.message : 'Action de modération impossible.', 'error') }
  }

  const deleteListing = async (listing: ModeratedApartment) => {
    if (!token || !window.confirm('Supprimer définitivement « ' + listing.title + ' » ?')) return
    try {
      await apiRequest('/api/admin/apartments/' + listing.id, { method: 'DELETE', token })
      setListings((current) => current.filter((item) => item.id !== listing.id))
      showToast('Annonce supprimée.', 'success')
    } catch (error) { showToast(error instanceof Error ? error.message : 'Suppression impossible.', 'error') }
  }

  const verifyDocument = async (document: AdminDocument, status: 'approved' | 'rejected') => {
    if (!token) return
    try {
      const updated = await apiRequest<AdminDocument>('/api/admin/documents/' + document.id + '/verify', { method: 'PATCH', token, body: { status } })
      setDocuments((current) => current.map((item) => item.id === updated.id ? updated : item))
      showToast(status === 'approved' ? 'Document approuvé.' : 'Document rejeté.', 'success')
    } catch (error) { showToast(error instanceof Error ? error.message : 'Vérification impossible.', 'error') }
  }

  const blockUser = async (account: AdminUser) => {
    if (!token) return
    try {
      await apiRequest('/api/admin/users/' + account.id + '/block?blocked=' + String(!account.isBlocked), { method: 'PATCH', token })
      setUsers((current) => current.map((item) => item.id === account.id ? { ...item, isBlocked: !item.isBlocked } : item))
      showToast(account.isBlocked ? 'Compte débloqué.' : 'Compte bloqué.', 'success')
    } catch (error) { showToast(error instanceof Error ? error.message : 'Modification du compte impossible.', 'error') }
  }

  if (user?.role !== 'admin') return null
  return <main className="container-app max-w-6xl py-8 sm:py-12">
    <header className="mb-7 flex items-center gap-3"><div className="rounded-xl bg-violet-100 p-3 text-violet-700"><ShieldAlert size={24} /></div><div><h1 className="text-2xl font-bold text-slate-900 dark:text-white">Administration MyHome</h1><p className="mt-1 text-sm text-slate-500">Modération des annonces et gestion des comptes.</p></div></header>
    <nav className="mb-5 flex gap-3 border-b border-slate-200"><button onClick={() => setTab('listings')} className={'flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold ' + (tab === 'listings' ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-500')}><Building2 size={16} />Annonces ({listings.length})</button><button onClick={() => setTab('users')} className={'flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold ' + (tab === 'users' ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-500')}><Users size={16} />Utilisateurs ({users.length})</button><button onClick={() => setTab('documents')} className={'flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold ' + (tab === 'documents' ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-500')}><FileCheck2 size={16} />Dossiers ({documents.length})</button></nav>
    {loading ? <p className="py-12 text-center text-sm text-slate-500">Chargement…</p> : tab === 'listings' ? <div className="space-y-3">{listings.map((listing) => <article key={listing.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><img src={listing.photos?.[0] || '/placeholder-apartment.svg'} alt="" className="h-16 w-20 rounded-lg object-cover" /><div><h2 className="font-semibold">{listing.title}</h2><p className="text-xs text-slate-500">{listing.address.city} · {listing.price.toLocaleString('fr-BJ')} FCFA · {listing.isApproved ? listing.isHidden ? 'Masquée' : 'Approuvée' : 'À approuver'}</p></div></div><div className="flex flex-wrap gap-2">{!listing.isApproved && <Button size="sm" onClick={() => void moderate(listing, 'approve')}><Check size={14} className="mr-1" />Approuver</Button>}<Button variant="outline" size="sm" onClick={() => void moderate(listing, listing.isHidden ? 'publish' : 'hide')}><EyeOff size={14} className="mr-1" />{listing.isHidden ? 'Réafficher' : 'Masquer'}</Button><Button variant="ghost" size="sm" aria-label="Supprimer l’annonce" onClick={() => void deleteListing(listing)}><Trash2 size={15} /></Button></div></article>)}</div> : tab === 'documents' ? <div className="space-y-3">{documents.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">Aucun document déposé pour le moment.</p> : documents.map((document) => <article key={document.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold">{document.filename}</h2><p className="text-xs text-slate-500">{document.owner.firstName} {document.owner.lastName} · {document.owner.email} · {document.kind === 'identity' ? 'Pièce d’identité' : 'Preuves de revenus'} · {(document.size / 1024).toFixed(0)} Ko</p><p className="mt-1 text-xs"><span className={'rounded-full px-2 py-0.5 ' + (document.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : document.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800')}>{DOCUMENT_STATUS_LABELS[document.status]}</span><span className="ml-2 text-slate-400">{new Date(document.createdAt).toLocaleDateString('fr-FR')}</span></p></div>{document.status === 'pending' && <div className="flex gap-2"><Button size="sm" onClick={() => void verifyDocument(document, 'approved')}><Check size={14} className="mr-1" />Approuver</Button><Button variant="danger" size="sm" onClick={() => void verifyDocument(document, 'rejected')}>Rejeter</Button></div>}</article>)}</div> : <div className="space-y-3">{users.map((account) => <article key={account.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4"><div><h2 className="font-semibold">{account.firstName} {account.lastName}</h2><p className="text-xs text-slate-500">{account.email} · {account.role === 'landlord' ? 'Bailleur' : 'Locataire'}</p></div><Button variant={account.isBlocked ? 'outline' : 'danger'} size="sm" onClick={() => void blockUser(account)}>{account.isBlocked ? 'Débloquer' : 'Bloquer'}</Button></article>)}</div>}
  </main>
}

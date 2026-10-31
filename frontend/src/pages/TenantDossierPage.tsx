import { useCallback, useEffect, useState } from 'react'
import { FileText, Trash2, UploadCloud, CheckCircle2, ShieldCheck, Download } from 'lucide-react'
import { apiRequest, API_BASE_URL } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { Button } from '@/components/ui/Button'

type DocumentKind = 'identity' | 'income'
type TenantDocument = { id: string; kind: DocumentKind; label: string; status: string }
type TenantPass = { completionPercent: number; isReady: boolean; documents: TenantDocument[] }
const kinds: { id: DocumentKind; title: string; description: string; formats: string }[] = [
  { id: 'identity', title: 'Pièce d’identité', description: 'CIP ou passeport en cours de validité', formats: 'PDF, JPG, PNG, WEBP' },
  { id: 'income', title: 'Preuves de revenus', description: 'Bulletins de salaire, attestation ou relevés', formats: 'PDF, JPG, PNG, WEBP' },
]

export default function TenantDossierPage() {
  const { user, token } = useAuth()
  const { showToast } = useToast()
  const [pass, setPass] = useState<TenantPass | null>(null)
  const [busy, setBusy] = useState<DocumentKind | null>(null)

  const refresh = useCallback(async () => {
    if (!token) return
    try {
      setPass(await apiRequest<TenantPass>('/api/me/pass', { token }))
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Impossible de charger votre dossier.', 'error')
    }
  }, [token, showToast])

  useEffect(() => { void refresh() }, [refresh])

  const upload = async (kind: DocumentKind, file?: File) => {
    if (!file || !token) return
    if (file.size > 10 * 1024 * 1024) {
      showToast('Le fichier doit faire 10 Mo maximum.', 'error')
      return
    }
    setBusy(kind)
    try {
      const data = new FormData()
      data.append('file', file)
      await apiRequest('/api/me/documents?kind=' + kind, { method: 'POST', body: data, token })
      showToast('Document ajouté. Il sera vérifié par notre équipe.', 'success')
      await refresh()
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Échec du téléversement.', 'error')
    } finally {
      setBusy(null)
    }
  }

  const download = async (document: TenantDocument) => {
    if (!token) return
    try {
      const response = await fetch(API_BASE_URL + '/api/me/documents/' + document.id + '/download', { headers: { Authorization: 'Bearer ' + token } })
      if (!response.ok) throw new Error('Téléchargement impossible.')
      const url = URL.createObjectURL(await response.blob())
      const link = Object.assign(window.document.createElement('a'), { href: url, download: document.label })
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Téléchargement impossible.', 'error')
    }
  }

  const remove = async (document: TenantDocument) => {
    if (!token) return
    try {
      await apiRequest('/api/me/documents/' + document.id, { method: 'DELETE', token })
      await refresh()
      showToast('Document supprimé.', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Suppression impossible.', 'error')
    }
  }

  if (!user || !token) return <main className="container-app max-w-xl py-16"><h1 className="text-2xl font-semibold">Mon dossier locataire</h1><p className="mt-3 text-slate-600">Connectez-vous avec un compte locataire pour déposer vos justificatifs.</p><a className="mt-5 inline-block text-primary underline" href="/auth">Se connecter</a></main>
  if (user.role !== 'tenant') return <main className="container-app max-w-xl py-16"><h1 className="text-2xl font-semibold">Dossier locataire</h1><p className="mt-3 text-slate-600">Cette page est réservée aux locataires.</p></main>

  const documents = pass?.documents ?? []
  return <main className="container-app max-w-3xl py-8 sm:py-12">
    <header className="mb-7">
      <div className="flex items-center gap-3"><div className="rounded-xl bg-cyan-50 p-3 text-cyan-700"><ShieldCheck size={24} /></div><div><h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Mon dossier locataire</h1><p className="mt-1 text-sm text-slate-500">Ajoutez vos justificatifs en lieu sûr pour faciliter vos candidatures.</p></div></div>
    </header>
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-dark-border dark:bg-dark-card" aria-label="Progression du dossier">
      <div className="mb-2 flex justify-between text-sm"><span className="font-medium">Complétude du dossier</span><span>{pass?.completionPercent ?? 0}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-cyan-600 transition-all" style={{ width: (pass?.completionPercent ?? 0) + '%' }} /></div>
      <p className="mt-3 text-xs text-slate-500">Vos fichiers sont privés et accessibles uniquement depuis votre compte.</p>
    </section>
    <div className="space-y-4">{kinds.map((kind) => {
      const relatedDocuments = documents.filter((item) => item.kind === kind.id)
      return <section key={kind.id} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-dark-border dark:bg-dark-card">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="font-semibold text-slate-900 dark:text-white">{kind.title}</h2><p className="mt-1 text-sm text-slate-500">{kind.description}</p><p className="mt-1 text-xs text-slate-400">{kind.formats} · 10 Mo maximum</p></div>
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-cyan-700 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-800">{busy === kind.id ? 'Envoi…' : <><UploadCloud size={16} />{kind.id === 'identity' && relatedDocuments.length ? 'Remplacer' : 'Ajouter un fichier'}</>}<input type="file" className="sr-only" accept=".pdf,.jpg,.jpeg,.png,.webp" multiple={kind.id === 'income'} disabled={busy !== null} onChange={(event) => { const selected = Array.from(event.currentTarget.files ?? []); void selected.reduce((chain, file) => chain.then(() => upload(kind.id, file)), Promise.resolve()); event.currentTarget.value = '' }} /></label>
        </div>
        {relatedDocuments.map((related) => <div key={related.id} className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 dark:bg-dark-bg"><div className="flex items-center gap-2 text-sm"><FileText size={18} className="text-cyan-700" /><span className="max-w-56 truncate">{related.label}</span><span className={'rounded-full px-2 py-0.5 text-xs ' + (related.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : related.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800')}>{related.status === 'approved' ? 'Vérifié' : related.status === 'rejected' ? 'Rejeté' : 'À vérifier'}</span></div><div className="flex gap-2"><Button variant="ghost" size="sm" onClick={() => void download(related)} aria-label="Télécharger le document"><Download size={15} /></Button><Button variant="ghost" size="sm" onClick={() => void remove(related)} aria-label="Supprimer le document"><Trash2 size={15} /></Button></div></div>)}
      </section>
    })}</div>
    {pass?.isReady && <p className="mt-5 flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 size={18} />Votre dossier est complet.</p>}
  </main>
}

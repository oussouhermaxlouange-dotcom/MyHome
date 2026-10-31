import { useState } from 'react'
import { Link } from 'react-router-dom'
import { X, ShieldCheck, KeyRound, Building, User, Check, ArrowRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, login, loginWithPassword } = useAuth()
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<'tenant' | 'landlord'>('tenant')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isAuthModalOpen) return null

  const handleQuickLogin = (role: 'tenant' | 'landlord') => {
    login(role)
    showToast(
      role === 'tenant'
        ? 'Bienvenue Marc ! Vous êtes connecté en tant que locataire.'
        : 'Bienvenue Sophie ! Vous êtes connectée à votre espace propriétaire.',
      'success',
      'Connexion réussie',
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      showToast('Renseignez votre e-mail et votre mot de passe.', 'error')
      return
    }
    setIsSubmitting(true)
    try {
      const account = await loginWithPassword(email.trim(), password)
      closeAuthModal()
      showToast('Bienvenue ' + account.firstName + ' !', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Connexion impossible.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={closeAuthModal}
      />

      {/* Modal Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-10 transition-all"
      >
        {/* Header gradient banner */}
        <div className="bg-gradient-to-r from-sky-600 via-primary-600 to-indigo-700 p-6 text-white relative">
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-xs font-medium mb-3 backdrop-blur-md">
            <ShieldCheck size={14} className="text-sky-200" />
            Espace Sécurisé MyHome
          </div>
          <h2 id="auth-modal-title" className="text-xl font-bold tracking-tight">
            Accédez à votre compte
          </h2>
          <p className="text-xs text-sky-100 mt-1">
            Gérez vos candidatures, vos annonces et réservez vos visites en quelques secondes.
          </p>
        </div>

        {/* Role Switcher */}
        <div className="p-6">
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('tenant')}
              className={cn(
                'flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all',
                activeTab === 'tenant'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900',
              )}
            >
              <User size={14} className={activeTab === 'tenant' ? 'text-primary-600' : ''} />
              Je suis Locataire
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('landlord')}
              className={cn(
                'flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all',
                activeTab === 'landlord'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900',
              )}
            >
              <Building size={14} className={activeTab === 'landlord' ? 'text-primary-600' : ''} />
              Je suis Propriétaire
            </button>
          </div>

          {/* Quick Demo Access Box (User friendly showcase) */}
          <div className="mb-6 p-4 rounded-xl bg-sky-50/70 border border-sky-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-900 uppercase tracking-wider">
                Démo en un clic
              </span>
              <span className="text-[10px] bg-sky-200/80 text-sky-800 font-semibold px-2 py-0.5 rounded-full">
                Accès instantané
              </span>
            </div>
            <p className="text-xs text-slate-600">
              {activeTab === 'tenant'
                ? 'Testez la plateforme avec le profil pré-rempli de Marc (Dossier vérifié à 100%).'
                : 'Accédez au tableau de bord bailleur de Sophie (1 annonce, 4 candidatures à traiter).'}
            </p>
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="w-full justify-between"
              onClick={() => handleQuickLogin(activeTab)}
              rightIcon={<ArrowRight size={14} />}
            >
              <span>
                {activeTab === 'tenant' ? 'Connexion en tant que Marc (Locataire)' : 'Connexion en tant que Sophie (Bailleur)'}
              </span>
            </Button>
          </div>

          <div className="relative flex py-2 items-center mb-4">
            <div className="flex-grow border-t border-slate-200" />
            <span className="flex-shrink mx-3 text-xs text-slate-400">ou avec vos identifiants</span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          {/* Standard Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Adresse e-mail
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre-email@exemple.fr"
                className="w-full h-10 px-3.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mot de passe
              </label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-10 px-3.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              variant="outline"
              size="md"
              leftIcon={<KeyRound size={14} />}
              className="w-full mt-2 font-medium"
            >
              {isSubmitting ? 'Connexion…' : 'Se connecter'}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-500">Nouveau sur MyHome ? <Link to="/inscription" onClick={closeAuthModal} className="font-semibold text-primary-700 hover:underline">Créer un compte</Link></p>

          {/* Trust bullet */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
            <Check size={14} className="text-emerald-500" />
            <span>Données protégées et conformes RGPD</span>
          </div>
        </div>
      </div>
    </div>
  )
}

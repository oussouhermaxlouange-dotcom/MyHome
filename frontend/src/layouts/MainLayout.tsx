import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  Building2,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Heart,
  ArrowRight,
  Phone,
  Sparkles,
} from 'lucide-react'
import { Header } from './Header'
import { AuthModal } from '@/components/features/AuthModal'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'

export function MainLayout() {
  const location = useLocation()
  const { showToast } = useToast()
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)

  // Map page uses full screen without standard container & footer
  const isMapPage = location.pathname === '/carte'

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newsletterEmail.trim() || !newsletterEmail.includes('@')) {
      showToast('Veuillez renseigner une adresse email valide.', 'error')
      return
    }
    setIsSubscribed(true)
    showToast('Merci ! Vous recevrez nos meilleures annonces en avant-première.', 'success', 'Inscription confirmée')
    setNewsletterEmail('')
  }

  return (
    <div className="min-h-screen flex flex-col bg-white selection:bg-primary-100 selection:text-primary-900">
      <Header />
      <AuthModal />

      <main id="main-content" className="flex-1 w-full">
        <Outlet />
      </main>

      {/* Render rich footer only on standard pages (not on full-screen map) */}
      {!isMapPage && (
        <footer className="bg-slate-950 text-slate-400 text-sm mt-auto border-t border-slate-900">

          {/* Top Pre-footer Trust Banner */}
          <div className="border-b border-slate-900/80 bg-slate-900/40 py-8">
            <div className="w-full px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">100% Annonces vérifiées</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Visites de contrôle et vérification des propriétaires au Bénin.</p>
                </div>
              </div>

              <div className="flex items-center justify-center md:justify-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">Pass Vérifié en 1 clic</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Un dossier complet et certifié pour candidater partout.</p>
                </div>
              </div>

              <div className="flex items-center justify-center md:justify-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">Zéro frais d'agence cachés</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Transparence totale sur les loyers en FCFA et les charges.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Footer Links */}
          <div className="w-full px-4 sm:px-6 py-14">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">

              {/* Col 1: Brand & Presentation */}
              <div className="lg:col-span-2 space-y-4">
                <Link to="/" className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1">
                    <img src="/img/logo-myhome.jpg" alt="MyHome" className="h-full w-full object-contain" />
                  </div>
                  <span className="font-extrabold text-white text-xl tracking-tight">
                    MyHome<span className="text-primary-500">.</span>
                  </span>
                </Link>
                <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                  La plateforme immobilière de référence au Bénin. Chambres, studios, appartements et villas de standing à Cotonou, Abomey-Calavi, Porto-Novo et Parakou.
                </p>

                {/* Newsletter Box */}
                <div className="pt-2">
                  <p className="text-xs font-semibold text-white mb-2">
                    Recevez les nouvelles annonces de votre ville
                  </p>
                  <form onSubmit={handleNewsletter} className="flex gap-2 max-w-md">
                    <input
                      type="email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="Votre adresse email"
                      className="h-10 px-3.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 flex-1"
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      className="rounded-xl px-4 h-10 text-xs font-medium"
                    >
                      S'inscrire
                    </Button>
                  </form>
                </div>
              </div>

              {/* Col 2: Villes & Quartiers au Bénin */}
              <div>
                <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-4">
                  Villes & Quartiers
                </h4>
                <ul className="space-y-2.5 text-xs">
                  <li><Link to="/annonces?q=Haie Vive" className="hover:text-white transition-colors">Cotonou — Haie Vive</Link></li>
                  <li><Link to="/annonces?q=Cadjehoun" className="hover:text-white transition-colors">Cotonou — Cadjehoun</Link></li>
                  <li><Link to="/annonces?q=Akpakpa" className="hover:text-white transition-colors">Cotonou — Akpakpa</Link></li>
                  <li><Link to="/annonces?q=Fidjrossè" className="hover:text-white transition-colors">Cotonou — Fidjrossè</Link></li>
                  <li><Link to="/annonces?q=Abomey-Calavi" className="hover:text-white transition-colors">Abomey-Calavi</Link></li>
                  <li><Link to="/annonces?q=Porto-Novo" className="hover:text-white transition-colors">Porto-Novo</Link></li>
                  <li><Link to="/annonces?q=Parakou" className="hover:text-white transition-colors">Parakou</Link></li>
                </ul>
              </div>

              {/* Col 3: Locataires */}
              <div>
                <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-4">
                  Pour les locataires
                </h4>
                <ul className="space-y-2.5 text-xs">
                  <li><Link to="/annonces" className="hover:text-white transition-colors">Toutes les annonces</Link></li>
                  <li><Link to="/carte" className="hover:text-white transition-colors">Carte interactive</Link></li>
                  <li><Link to="/annonces?type=studio" className="hover:text-white transition-colors">Studios & Meublés</Link></li>
                  <li><Link to="/annonces?type=room" className="hover:text-white transition-colors">Chambres privées</Link></li>
                  <li><span className="text-slate-500 cursor-default">Dossier Pass Vérifié (inclus)</span></li>
                  <li><span className="text-slate-500 cursor-default">Visites planifiées en direct</span></li>
                </ul>
              </div>

              {/* Col 4: Propriétaires & Légal */}
              <div>
                <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-4">
                  Propriétaires & Légal
                </h4>
                <ul className="space-y-2.5 text-xs">
                  <li><Link to="/proprietaire/publier" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">Déposer une annonce</Link></li>
                  <li><Link to="/proprietaire/dashboard" className="hover:text-white transition-colors">Tableau de bord bailleur</Link></li>
                  <li><Link to="/confidentialite" className="hover:text-white transition-colors">Politique de confidentialité</Link></li>
                  <li><Link to="/cgu" className="hover:text-white transition-colors">Conditions Générales (CGU)</Link></li>
                  <li><span className="text-slate-500 cursor-default">Garantie anti-vacance locative</span></li>
                  <li><span className="text-slate-500 cursor-default">Support client Bénin 7j/7</span></li>
                </ul>
              </div>

            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-slate-900 py-6 text-xs">
            <div className="w-full px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-slate-500">
                © {new Date().getFullYear()} MyHome Bénin. Tous droits réservés. Plateforme certifiée et hébergée au Bénin.
              </span>
              <div className="flex items-center gap-6 text-slate-500">
                <Link to="/confidentialite" className="hover:text-slate-300 transition-colors">Données personnelles</Link>
                <Link to="/cgu" className="hover:text-slate-300 transition-colors">Mentions légales</Link>
                <span className="flex items-center gap-1 text-slate-400">
                  Fait avec <Heart size={12} className="text-rose-500 fill-rose-500" /> au Bénin
                </span>
              </div>
            </div>
          </div>

        </footer>
      )}
    </div>
  )
}

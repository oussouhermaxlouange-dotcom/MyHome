import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  Menu,
  X,
  Building2,
  User,
  PlusCircle,
  Heart,
  LogOut,
  Map,
  Compass,
  FileCheck2,
  ChevronDown,
  Sparkles,
  Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { useFavorites } from '@/context/FavoritesContext'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'

const NAV_LINKS = [
  { label: 'Explorer', to: '/annonces', icon: Compass },
  { label: 'Carte', to: '/carte', icon: Map },
  { label: 'Bailleur', to: '/proprietaire/dashboard', icon: Building2 },
]

export function Header() {
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { favoritesCount } = useFavorites()
  const { user, logout } = useAuth()
  const { showToast } = useToast()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    setUserDropdownOpen(false)
    showToast('Vous avez été déconnecté.', 'info')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-[rgba(255,255,255,0.78)] backdrop-blur-xl">
      <div className="container-app flex h-20 items-center justify-between gap-4">
        <div className="flex items-center gap-5 lg:gap-8">
          <Link to="/" className="group flex items-center gap-3 rounded-2xl p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500" aria-label="MyHome accueil">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-500 to-indigo-600 text-white shadow-[0_16px_30px_-12px_rgba(14,165,233,0.7)] transition-transform group-hover:scale-105">
              <Building2 size={22} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-[-0.06em] text-slate-900">
                MyHome<span className="text-sky-600">.</span>
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-slate-400">
                location premium
              </span>
            </div>
          </Link>

          <nav aria-label="Navigation principale" className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all',
                    isActive
                      ? 'bg-sky-50 text-sky-700 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  )
                }
              >
                <Icon size={15} className="text-current" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-2 py-1.5 text-slate-500 shadow-sm sm:flex">
            <Sparkles size={14} className="text-sky-600" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">Bénin</span>
          </div>

          {user && (
            <button type="button" className="relative hidden rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition hover:text-slate-900 sm:inline-flex">
              <Bell size={17} />
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">3</span>
            </button>
          )}

          {user && (
            <Link to="/annonces?favoris=true" aria-label="Voir mes favoris" className="relative inline-flex rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition hover:text-slate-900">
              <Heart size={17} className={favoritesCount > 0 ? 'fill-rose-500 text-rose-500' : ''} />
              {favoritesCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                  {favoritesCount}
                </span>
              )}
            </Link>
          )}

          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button type="button" onClick={() => setUserDropdownOpen((value) => !value)} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1.5 shadow-sm transition hover:border-sky-200 hover:bg-sky-50/50">
                <img src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80'} alt="avatar" className="h-8 w-8 rounded-full object-cover ring-2 ring-sky-100" />
                <span className="hidden text-sm font-semibold text-slate-800 sm:inline-block">{user.firstName}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_24px_60px_-18px_rgba(15,23,42,0.35)]">
                  <div className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-slate-900">{user.firstName} {user.lastName}</span>
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-sky-700">
                        {user.role === 'tenant' ? 'locataire' : user.role === 'landlord' ? 'bailleur' : 'admin'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{user.email}</p>
                  </div>

                  <div className="space-y-1 py-1">
                    {user.role === 'tenant' ? (
                      <>
                        <Link to="/annonces" onClick={() => setUserDropdownOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                          <Compass size={14} className="text-slate-500" />
                          Trouver un logement
                        </Link>
                        <div className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                          <span className="flex items-center gap-2.5"><FileCheck2 size={14} className="text-emerald-500" /> Pass Vérifié</span>
                          <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">100%</span>
                        </div>
                      </>
                    ) : (
                      <Link to="/proprietaire/dashboard" onClick={() => setUserDropdownOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                        <Building2 size={14} className="text-slate-500" />
                        Tableau de bord
                      </Link>
                    )}

                    <Link to="/annonces?favoris=true" onClick={() => setUserDropdownOpen(false)} className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                      <span className="flex items-center gap-2.5"><Heart size={14} className="text-rose-500" /> Mes favoris</span>
                      {favoritesCount > 0 && <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">{favoritesCount}</span>}
                    </Link>
                  </div>

                  <button type="button" onClick={handleLogout} className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50">
                    <LogOut size={14} />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button variant="ghost" size="sm" leftIcon={<User size={15} />} onClick={() => navigate('/auth')} className="hidden text-slate-700 sm:inline-flex">
              Connexion
            </Button>
          )}

          <Button variant="primary" size="sm" leftIcon={<PlusCircle size={15} />} className="hidden rounded-xl shadow-[0_14px_28px_-16px_rgba(14,165,233,0.7)] sm:inline-flex" onClick={() => navigate('/proprietaire/publier')}>
            Déposer une annonce
          </Button>

          <button type="button" onClick={() => setMobileOpen((value) => !value)} aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'} className="inline-flex rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition hover:text-slate-900 lg:hidden">
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 shadow-lg lg:hidden">
          <nav className="flex flex-col gap-2">
            {NAV_LINKS.map(({ label, to, icon: Icon }) => (
              <NavLink key={to} to={to} onClick={() => setMobileOpen(false)} className={({ isActive }) => cn('flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold', isActive ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:bg-slate-100')}>
                <Icon size={15} />
                {label}
              </NavLink>
            ))}
          </nav>

          {!user && (
            <Button variant="primary" size="md" className="mt-4 w-full" onClick={() => { setMobileOpen(false); navigate('/auth') }}>
              Se connecter
            </Button>
          )}
        </div>
      )}
    </header>
  )
}

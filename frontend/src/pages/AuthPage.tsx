import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Building2, Check, Eye, EyeOff, LockKeyhole, UserRound } from 'lucide-react'
import { useAuth, type RegisterInput } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { cn } from '@/lib/utils'

type AccountRole = 'tenant' | 'landlord'
type FormMode = 'login' | 'register'
type FieldName = 'firstName' | 'lastName' | 'email' | 'phone' | 'password' | 'confirmPassword' | 'terms'

export default function AuthPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { login, loginWithPassword, registerAccount } = useAuth()
  const { showToast } = useToast()
  const [mode, setMode] = useState<FormMode>(location.pathname === '/inscription' ? 'register' : 'login')
  const [role, setRole] = useState<AccountRole>('tenant')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('+229')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setMode(location.pathname === '/inscription' ? 'register' : 'login')
  }, [location.pathname])

  const passwordScore = useMemo(() => [
    password.length >= 8,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length, [password])

  const phoneIsValid = /^\+229[0-9]{10}$/.test(phone)
  const errors: Partial<Record<FieldName, string>> = {
    firstName: mode === 'register' && (submitted || touched.firstName) && !firstName.trim() ? 'Le prénom est obligatoire.' : undefined,
    lastName: mode === 'register' && (submitted || touched.lastName) && !lastName.trim() ? 'Le nom est obligatoire.' : undefined,
    email: (submitted || touched.email)
      ? !email.trim() ? 'E-mail obligatoire.' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'Adresse e-mail invalide.' : undefined
      : undefined,
    phone: mode === 'register' && (submitted || touched.phone) && !phoneIsValid ? 'Numéro de téléphone béninois invalide (+229 suivi de 10 chiffres).' : undefined,
    password: (submitted || touched.password)
      ? !password ? 'Le mot de passe est obligatoire.' : password.length < 8 ? 'Utilisez au moins 8 caractères.' : undefined
      : undefined,
    confirmPassword: mode === 'register' && (submitted || touched.confirmPassword) && confirmPassword !== password
      ? 'Les mots de passe ne correspondent pas.' : undefined,
    terms: mode === 'register' && submitted && !acceptedTerms ? 'Vous devez accepter les conditions pour continuer.' : undefined,
  }

  const markTouched = (field: FieldName) => setTouched((current) => ({ ...current, [field]: true }))
  const inputClass = (invalid: boolean) => cn(
    'w-full rounded-xl border bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4',
    invalid ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'border-slate-200 focus:border-sky-500 focus:ring-sky-100',
  )

  const redirectAfterAuth = (accountRole: string) => {
    const from = (location.state as { from?: string | { pathname?: string; search?: string } } | null)?.from
    let requestedPath = typeof from === 'string' ? from : from?.pathname ? from.pathname + (from.search ?? '') : null
    if (accountRole === 'tenant' && requestedPath?.startsWith('/proprietaire/')) requestedPath = null
    if (requestedPath?.startsWith('//')) requestedPath = null
    navigate(requestedPath ?? (accountRole === 'landlord' || accountRole === 'admin' ? '/proprietaire/dashboard' : '/annonces'), { replace: true })
  }

  const changeMode = (nextMode: FormMode) => {
    setMode(nextMode)
    setSubmitted(false)
    setTouched({})
    navigate(nextMode === 'register' ? '/inscription' : '/auth', { replace: true, state: location.state })
  }

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '')
    const localDigits = digits.startsWith('229') ? digits.slice(3) : digits
    setPhone('+229' + localDigits.slice(0, 10))
    markTouched('phone')
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    const emailInvalid = !email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    const passwordInvalid = password.length < 8
    const invalid = emailInvalid || passwordInvalid || (mode === 'register' && (
      !firstName.trim() || !lastName.trim() || !phoneIsValid || password !== confirmPassword || !acceptedTerms
    ))
    if (invalid) return

    setIsSubmitting(true)
    try {
      if (mode === 'register') {
        const input: RegisterInput = { firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), phone, password, role }
        const account = await registerAccount(input)
        showToast('Compte créé avec succès ! Bienvenue sur MyHome', 'success')
        redirectAfterAuth(account.role)
      } else {
        const account = await loginWithPassword(email.trim(), password)
        showToast('Connexion réussie. Bienvenue sur MyHome.', 'success')
        redirectAfterAuth(account.role)
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Une erreur est survenue. Réessayez.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDemo = (demoRole: AccountRole) => {
    login(demoRole)
    showToast(
      demoRole === 'tenant' ? 'Bienvenue Marc Durand !' : 'Bienvenue Sophie Martin !',
      'success',
    )
    redirectAfterAuth(demoRole)
  }

  const fieldMessage = (field: FieldName) => errors[field] && (
    <p className="mt-1.5 text-xs text-rose-600" role="alert">{errors[field]}</p>
  )

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="hidden flex-col justify-between bg-gradient-to-br from-sky-700 via-primary-700 to-indigo-800 p-10 text-white lg:flex">
          <Link to="/" className="inline-flex items-center gap-2 text-lg font-extrabold" aria-label="MyHome accueil">
            <Building2 size={24} /> MyHome
          </Link>
          <div className="py-12">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-sky-200">La location au Bénin, simplement</p>
            <h1 className="text-4xl font-black leading-tight">Trouvez votre prochain chez-vous.</h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-sky-100">Des annonces et des candidatures gérées dans un espace clair, pensé pour locataires et bailleurs.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-sky-100"><LockKeyhole size={15} /> Vos identifiants sont transmis de façon sécurisée.</div>
        </aside>

        <section className="p-5 sm:p-8 lg:p-10">
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2 font-extrabold text-slate-900"><Building2 className="text-sky-600" size={22} />MyHome</Link>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500"><LockKeyhole size={13} />Espace sécurisé</span>
          </div>
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">{mode === 'register' ? 'Créer un compte' : 'Heureux de vous revoir'}</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{mode === 'register' ? 'Rejoignez MyHome' : 'Connectez-vous'}</h2>
            <p className="mt-2 text-sm text-slate-500">{mode === 'register' ? 'Créez votre espace en quelques instants.' : 'Accédez à vos annonces, favoris et candidatures.'}</p>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1" role="group" aria-label="Type de compte">
            {(['tenant', 'landlord'] as const).map((accountRole) => (
              <button key={accountRole} type="button" onClick={() => setRole(accountRole)} aria-pressed={role === accountRole}
                className={cn('flex min-h-11 items-center justify-center gap-2 rounded-lg px-2 text-xs font-semibold transition-all sm:text-sm', role === accountRole ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800')}>
                {accountRole === 'tenant' ? <UserRound size={15} /> : <Building2 size={15} />}
                {accountRole === 'tenant' ? 'Locataire' : 'Bailleur / Agence'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {mode === 'register' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="mb-1.5 block text-xs font-semibold text-slate-700">Prénom</label>
                  <input id="firstName" autoComplete="given-name" value={firstName} onBlur={() => markTouched('firstName')} onChange={(event) => { setFirstName(event.target.value); markTouched('firstName') }} className={inputClass(Boolean(errors.firstName))} placeholder="Votre prénom" aria-invalid={Boolean(errors.firstName)} />
                  {fieldMessage('firstName')}
                </div>
                <div>
                  <label htmlFor="lastName" className="mb-1.5 block text-xs font-semibold text-slate-700">Nom</label>
                  <input id="lastName" autoComplete="family-name" value={lastName} onBlur={() => markTouched('lastName')} onChange={(event) => { setLastName(event.target.value); markTouched('lastName') }} className={inputClass(Boolean(errors.lastName))} placeholder="Votre nom" aria-invalid={Boolean(errors.lastName)} />
                  {fieldMessage('lastName')}
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-slate-700">Adresse e-mail</label>
              <input id="email" type="email" autoComplete="email" value={email} onBlur={() => markTouched('email')} onChange={(event) => { setEmail(event.target.value); markTouched('email') }} className={inputClass(Boolean(errors.email))} placeholder="vous@exemple.com" aria-invalid={Boolean(errors.email)} />
              {fieldMessage('email')}
            </div>

            {mode === 'register' && (
              <div>
                <label htmlFor="phone" className="mb-1.5 block text-xs font-semibold text-slate-700">Téléphone</label>
                <input id="phone" type="tel" inputMode="numeric" autoComplete="tel" value={phone} onBlur={() => markTouched('phone')} onChange={(event) => handlePhoneChange(event.target.value)} className={inputClass(Boolean(errors.phone))} placeholder="+229 01 23 45 67 89" aria-invalid={Boolean(errors.phone)} />
                <p className="mt-1 text-[11px] text-slate-400">Indicatif béninois +229, suivi de 10 chiffres.</p>
                {fieldMessage('phone')}
              </div>
            )}

            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-slate-700">Mot de passe</label>
              <div className="relative">
                <input id="password" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} value={password} onBlur={() => markTouched('password')} onChange={(event) => { setPassword(event.target.value); markTouched('password') }} className={cn(inputClass(Boolean(errors.password)), 'pr-12')} placeholder="8 caractères minimum" aria-invalid={Boolean(errors.password)} />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-r-xl text-slate-500 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500" aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {mode === 'register' && (
                <div className="mt-2" aria-live="polite">
                  <div className="flex gap-1" aria-label={'Force du mot de passe : ' + passwordScore + ' sur 4'}>
                    {[0, 1, 2, 3].map((step) => <span key={step} className={cn('h-1 flex-1 rounded-full', step < passwordScore ? passwordScore < 2 ? 'bg-rose-500' : passwordScore < 4 ? 'bg-amber-500' : 'bg-emerald-500' : 'bg-slate-200')} />)}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">{passwordScore < 2 ? 'Faible' : passwordScore < 4 ? 'Moyen' : 'Fort'} · 8 caractères, majuscule, chiffre et symbole conseillés</p>
                </div>
              )}
              {fieldMessage('password')}
            </div>

            {mode === 'register' && (
              <>
                <div>
                  <label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-semibold text-slate-700">Confirmer le mot de passe</label>
                  <div className="relative">
                    <input id="confirmPassword" type={showConfirmation ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onBlur={() => markTouched('confirmPassword')} onChange={(event) => { setConfirmPassword(event.target.value); markTouched('confirmPassword') }} className={cn(inputClass(Boolean(errors.confirmPassword)), 'pr-12')} placeholder="Retapez le mot de passe" aria-invalid={Boolean(errors.confirmPassword)} />
                    <button type="button" onClick={() => setShowConfirmation((value) => !value)} className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-r-xl text-slate-500 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500" aria-label={showConfirmation ? 'Masquer la confirmation' : 'Afficher la confirmation'}>
                      {showConfirmation ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {fieldMessage('confirmPassword')}
                </div>
                <div>
                  <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-5 text-slate-600">
                    <input type="checkbox" checked={acceptedTerms} onChange={(event) => { setAcceptedTerms(event.target.checked); markTouched('terms') }} className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500" />
                    <span>J’accepte les <Link className="font-semibold text-sky-700 hover:underline" to="/cgu" target="_blank">Conditions Générales d’Utilisation</Link> et la <Link className="font-semibold text-sky-700 hover:underline" to="/confidentialite" target="_blank">Politique de confidentialité</Link>.</span>
                  </label>
                  {fieldMessage('terms')}
                </div>
              </>
            )}

            <button type="submit" disabled={isSubmitting} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 text-sm font-bold text-white shadow-md shadow-sky-600/20 transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 disabled:cursor-wait disabled:opacity-60">
              {isSubmitting ? 'Patientez…' : mode === 'register' ? 'Créer mon compte' : 'Se connecter'}
              {!isSubmitting && <ArrowRight size={16} />}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-600">
            {mode === 'register' ? 'Vous avez déjà un compte ?' : 'Pas encore de compte ?'}{' '}
            <button type="button" onClick={() => changeMode(mode === 'register' ? 'login' : 'register')} className="font-bold text-sky-700 hover:text-sky-800 hover:underline">
              {mode === 'register' ? 'Connexion' : 'Inscription'}
            </button>
          </p>

          <div className="my-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400"><span className="h-px flex-1 bg-slate-200" />Mode démo<span className="h-px flex-1 bg-slate-200" /></div>
          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => handleDemo('tenant')} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100">
              <UserRound size={15} className="text-sky-600" />Tester comme Marc Durand — Locataire
            </button>
            <button type="button" onClick={() => handleDemo('landlord')} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100">
              <Building2 size={15} className="text-sky-600" />Tester comme Sophie Martin — Bailleur
            </button>
          </div>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400"><Check size={13} className="text-emerald-500" />Ne saisissez jamais vos identifiants sur un appareil partagé.</p>
        </section>
      </div>
    </main>
  )
}

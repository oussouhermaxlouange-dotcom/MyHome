import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Upload,
  X,
  Plus,
  Trash2,
  Info,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { mockMarketPrice } from '@/data/mockApplications'
import { apiRequest } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import type { PublishFormData, AvailabilitySlotInput } from '@/types'

// ─── Constantes ───────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Le bien' },
  { id: 2, label: 'Photos' },
  { id: 3, label: 'Loyer' },
  { id: 4, label: 'Disponibilités' },
]

const AMENITY_OPTIONS = [
  { value: 'wifi',             label: 'Wi-Fi' },
  { value: 'parking',          label: 'Parking' },
  { value: 'parking_bike',     label: 'Parking vélo' },
  { value: 'elevator',         label: 'Ascenseur' },
  { value: 'balcony',          label: 'Balcon / Terrasse' },
  { value: 'garden',           label: 'Jardin' },
  { value: 'washing_machine',  label: 'Lave-linge' },
  { value: 'dishwasher',       label: 'Lave-vaisselle' },
  { value: 'air_conditioning', label: 'Climatisation' },
  { value: 'cellar',           label: 'Cave' },
  { value: 'intercom',         label: 'Interphone' },
  { value: 'pets',             label: 'Animaux acceptés' },
]

const APARTMENT_TYPES = [
  { value: 'room',      label: 'Chambre' },
  { value: 'studio',    label: 'Studio' },
  { value: 'apartment', label: 'Appartement' },
  { value: 'house',     label: 'Maison' },
  { value: 'loft',      label: 'Loft' },
]

const POPULAR_CITIES = ['Cotonou', 'Haie Vive', 'Cadjehoun', 'Akpakpa', 'Fidjrossè', 'Abomey-Calavi', 'Porto-Novo', 'Parakou']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId() {
  return Math.random().toString(36).slice(2, 9)
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function formatPrice(amount: number) {
  return new Intl.NumberFormat('fr-BJ', { maximumFractionDigits: 0 }).format(amount) + ' FCFA'
}

const EMPTY_FORM: PublishFormData = {
  title: '', description: '', type: 'room',
  surface: '', rooms: '1', floor: '', totalFloors: '',
  street: '', city: '', zipCode: '',
  price: '', charges: '',
  amenities: [],
  photoFiles: [],
  availableSlots: [],
}

// ─── Sous-composant : Indicateur d'étapes ─────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <nav aria-label="Étapes de publication" className="mb-8">
      <ol className="flex items-center gap-0">
        {STEPS.map((step, i) => {
          const done    = step.id < current
          const active  = step.id === current
          return (
            <li key={step.id} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-colors',
                  done   ? 'bg-emerald-500 border-emerald-500 text-white'
                         : active ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white bg-white dark:bg-dark-bg'
                                  : 'border-slate-200 dark:border-dark-border text-slate-400',
                )}>
                  {done ? <CheckCircle size={13} aria-hidden="true" /> : step.id}
                </div>
                <span className={cn(
                  'text-[10px] hidden sm:block',
                  active ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-400',
                )}>
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn(
                  'h-px w-10 sm:w-16 mx-1 mt-[-10px]',
                  done ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-dark-border',
                )} aria-hidden="true" />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// ─── Sous-composant : Upload de photos ───────────────────────────────────────

interface PhotoUploaderProps {
  files: File[]
  onChange: (files: File[]) => void
}

function PhotoUploader({ files, onChange }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const addFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return
    const valid = Array.from(newFiles).filter((f) => f.type.startsWith('image/'))
    onChange([...files, ...valid].slice(0, 10))
  }, [files, onChange])

  const remove = (index: number) => {
    onChange(files.filter((_, i) => i !== index))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    addFiles(e.dataTransfer.files)
  }

  const previews = files.map((f) => URL.createObjectURL(f))

  return (
    <div className="space-y-3">
      {/* Zone de dépôt */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Déposer ou sélectionner des photos"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-150',
          isDragging
            ? 'border-primary bg-primary-50 dark:bg-primary-900/10'
            : 'border-slate-200 dark:border-dark-border hover:border-slate-400 dark:hover:border-slate-500',
        )}
      >
        <Upload size={20} className="mx-auto text-slate-400 mb-2" aria-hidden="true" />
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Glissez vos photos ici ou{' '}
          <span className="text-primary font-medium">cliquez pour sélectionner</span>
        </p>
        <p className="text-xs text-slate-400 mt-1">
          JPG, PNG, WEBP — jusqu'à 10 photos
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {/* Aperçu des photos sélectionnées */}
      {files.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {files.map((file, i) => (
            <div key={i} className="relative aspect-square rounded overflow-hidden group">
              <img
                src={previews[i]}
                alt={`Photo ${i + 1} : ${file.name}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={(e) => { e.stopPropagation(); remove(i) }}
                aria-label={`Supprimer la photo ${i + 1}`}
                className="absolute top-1 right-1 w-5 h-5 rounded bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={11} />
              </button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white px-1 py-0.5 rounded">
                  Principale
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-400">{files.length} / 10 photo{files.length > 1 ? 's' : ''}</p>
    </div>
  )
}

// ─── Sous-composant : Calendrier de disponibilités ───────────────────────────

interface AvailabilityEditorProps {
  slots: AvailabilitySlotInput[]
  onChange: (slots: AvailabilitySlotInput[]) => void
}

function AvailabilityEditor({ slots, onChange }: AvailabilityEditorProps) {
  const addSlot = () => {
    onChange([
      ...slots,
      { id: generateId(), date: todayStr(), startTime: '09:00', endTime: '09:15' },
    ])
  }

  const update = (id: string, key: keyof AvailabilitySlotInput, value: string) => {
    onChange(slots.map((s) => s.id === id ? { ...s, [key]: value } : s))
  }

  const remove = (id: string) => {
    onChange(slots.filter((s) => s.id !== id))
  }

  return (
    <div className="space-y-3">
      {slots.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center border border-dashed border-slate-200 dark:border-dark-border rounded-lg">
          Aucun créneau défini. Ajoutez vos disponibilités.
        </p>
      ) : (
        <ul className="space-y-2" aria-label="Créneaux de visite">
          {slots.map((slot) => (
            <li
              key={slot.id}
              className="flex items-center gap-2 p-2 border border-slate-200 dark:border-dark-border rounded-lg"
            >
              <input
                type="date"
                value={slot.date}
                min={todayStr()}
                onChange={(e) => update(slot.id, 'date', e.target.value)}
                aria-label="Date du créneau"
                className="flex-1 h-8 px-2 text-sm rounded border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
              <input
                type="time"
                value={slot.startTime}
                onChange={(e) => update(slot.id, 'startTime', e.target.value)}
                aria-label="Heure de début"
                className="w-24 h-8 px-2 text-sm rounded border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
              <span className="text-slate-400 text-xs" aria-hidden="true">–</span>
              <input
                type="time"
                value={slot.endTime}
                onChange={(e) => update(slot.id, 'endTime', e.target.value)}
                aria-label="Heure de fin"
                className="w-24 h-8 px-2 text-sm rounded border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
              <button
                onClick={() => remove(slot.id)}
                aria-label="Supprimer ce créneau"
                className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        leftIcon={<Plus size={13} />}
        onClick={addSlot}
      >
        Ajouter un créneau
      </Button>
    </div>
  )
}

// ─── Composant d'input réutilisable ──────────────────────────────────────────

interface FieldProps {
  label: string
  htmlFor: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}

function Field({ label, htmlFor, required, hint, children }: FieldProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      {children}
      {hint && (
        <p className="text-xs text-slate-400 flex items-start gap-1">
          <Info size={11} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
          {hint}
        </p>
      )}
    </div>
  )
}

const inputCls = cn(
  'w-full h-9 px-3 text-sm rounded-md border',
  'border-slate-200 dark:border-dark-border',
  'bg-white dark:bg-dark-surface',
  'text-slate-800 dark:text-slate-200 placeholder:text-slate-400',
  'focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50',
  'transition-colors duration-150',
)

// ─── Page principale ──────────────────────────────────────────────────────────

/**
 * Page de publication d'une annonce — Scénario 2 (Sophie).
 *
 * Formulaire en 4 étapes :
 * 1. Informations du bien
 * 2. Upload de photos
 * 3. Loyer avec suggestion marché
 * 4. Créneaux de visite
 */
export default function PublishPage() {
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const { showToast } = useToast()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<PublishFormData>(EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const set = (key: keyof PublishFormData, value: PublishFormData[typeof key]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const toggleAmenity = (value: string) => {
    set('amenities', form.amenities.includes(value)
      ? form.amenities.filter((a) => a !== value)
      : [...form.amenities, value],
    )
  }

  // Loyer suggéré selon la ville
  const suggestedPrice = mockMarketPrice[form.city] ?? null

  const canNext = (): boolean => {
    if (step === 1) return !!(form.type && form.surface && form.rooms && form.street && form.city && form.zipCode)
    if (step === 2) return form.photoFiles.length >= 1
    if (step === 3) return !!form.price
    return true
  }

  const handleSubmit = async () => {
    if (!user || !token) {
      showToast('Connectez-vous avec un compte bailleur pour publier une annonce.', 'error')
      navigate('/auth', { state: { from: '/proprietaire/publier' } })
      return
    }
    if (user.role !== 'landlord' && user.role !== 'admin') {
      showToast('La publication est réservée aux comptes bailleurs.', 'error')
      return
    }
    setIsSubmitting(true)
    try {
      const photosForm = new FormData()
      form.photoFiles.forEach((photo) => photosForm.append('photos', photo))
      const uploaded = await apiRequest<{ urls: string[] }>('/api/apartments/photos', { method: 'POST', body: photosForm, token })
      const apartment = await apiRequest<{ id: string }>('/api/apartments', {
        method: 'POST', token,
        body: {
          title: form.title,
          description: form.description,
          type: form.type,
          price: Number(form.price),
          charges: Number(form.charges || 0),
          surface: Number(form.surface),
          rooms: Number(form.rooms),
          bedrooms: form.type === 'room' ? 1 : Number(form.rooms),
          floor: form.floor ? Number(form.floor) : null,
          totalFloors: form.totalFloors ? Number(form.totalFloors) : null,
          street: form.street,
          city: form.city,
          zipCode: form.zipCode,
          photos: uploaded.urls,
          amenities: form.amenities,
          availableSlots: form.availableSlots.map(({ id, date, startTime, endTime }) => ({ id, date, startTime, endTime })),
        },
      })
      setSubmitted(true)
      showToast('Votre annonce a été transmise à l’équipe pour modération.', 'success')
      navigate('/proprietaire/dashboard', { state: { publishedApartmentId: apartment.id } })
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Impossible de publier cette annonce.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Succès ──
  if (submitted) {
    return (
      <div className="container-app max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle size={24} className="text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        </div>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
          Annonce publiée
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Votre annonce est en ligne. Vous recevrez une notification dès qu'un candidat postule.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
          <Button variant="primary" size="sm" onClick={() => navigate('/proprietaire/dashboard')}>
            Voir mes annonces
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setForm(EMPTY_FORM); setStep(1); setSubmitted(false) }}>
            Publier une autre annonce
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container-app py-8 sm:py-12 max-w-2xl mx-auto">
      {/* En-tête */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
          Déposer une annonce
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Renseignez les informations de votre bien en quelques étapes.
        </p>
      </div>

      <StepIndicator current={step} />

      <form
        onSubmit={(e) => { e.preventDefault(); if (step < 4) setStep(step + 1); else handleSubmit() }}
        noValidate
        className="space-y-5"
      >

        {/* ── Étape 1 : Informations du bien ── */}
        {step === 1 && (
          <fieldset className="space-y-4">
            <legend className="text-sm font-medium text-slate-900 dark:text-white mb-4">
              Informations du bien
            </legend>

            {/* Type */}
            <Field label="Type de bien" htmlFor="type" required>
              <div
                role="radiogroup"
                aria-label="Type de bien"
                className="flex flex-wrap gap-2"
              >
                {APARTMENT_TYPES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={form.type === value}
                    onClick={() => set('type', value)}
                    className={cn(
                      'px-3 py-1.5 text-sm border rounded transition-colors duration-150',
                      form.type === value
                        ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                        : 'border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-400 hover:border-slate-400',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>

            {/* Surface + pièces */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Surface (m²)" htmlFor="surface" required>
                <input
                  id="surface"
                  type="number"
                  min="5"
                  value={form.surface}
                  onChange={(e) => set('surface', e.target.value)}
                  placeholder="Ex. : 18"
                  required
                  className={inputCls}
                />
              </Field>
              <Field label="Nombre de pièces" htmlFor="rooms" required>
                <input
                  id="rooms"
                  type="number"
                  min="1"
                  max="20"
                  value={form.rooms}
                  onChange={(e) => set('rooms', e.target.value)}
                  placeholder="1"
                  required
                  className={inputCls}
                />
              </Field>
            </div>

            {/* Étage */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Étage" htmlFor="floor">
                <input
                  id="floor"
                  type="number"
                  min="0"
                  value={form.floor}
                  onChange={(e) => set('floor', e.target.value)}
                  placeholder="0 = RDC"
                  className={inputCls}
                />
              </Field>
              <Field label="Nb. étages immeuble" htmlFor="totalFloors">
                <input
                  id="totalFloors"
                  type="number"
                  min="1"
                  value={form.totalFloors}
                  onChange={(e) => set('totalFloors', e.target.value)}
                  placeholder="Ex. : 5"
                  className={inputCls}
                />
              </Field>
            </div>

            {/* Adresse */}
            <Field label="Adresse" htmlFor="street" required>
              <input
                id="street"
                type="text"
                value={form.street}
                onChange={(e) => set('street', e.target.value)}
                placeholder="12 rue de la Paix"
                required
                autoComplete="street-address"
                className={inputCls}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Ville" htmlFor="city" required>
                <input
                  id="city"
                  type="text"
                  value={form.city}
                  onChange={(e) => set('city', e.target.value)}
                  placeholder="Paris"
                  required
                  list="cities-list"
                  autoComplete="address-level2"
                  className={inputCls}
                />
                <datalist id="cities-list">
                  {POPULAR_CITIES.map((c) => <option key={c} value={c} />)}
                </datalist>
              </Field>
              <Field label="Code postal" htmlFor="zipCode" required>
                <input
                  id="zipCode"
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  value={form.zipCode}
                  onChange={(e) => set('zipCode', e.target.value)}
                  placeholder="75001"
                  required
                  autoComplete="postal-code"
                  className={inputCls}
                />
              </Field>
            </div>

            {/* Équipements */}
            <Field label="Équipements" htmlFor="amenities">
              <div
                role="group"
                aria-label="Équipements disponibles"
                className="flex flex-wrap gap-2 mt-1"
              >
                {AMENITY_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    role="checkbox"
                    aria-checked={form.amenities.includes(value)}
                    onClick={() => toggleAmenity(value)}
                    className={cn(
                      'px-2.5 py-1 text-xs border rounded transition-colors duration-150',
                      form.amenities.includes(value)
                        ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                        : 'border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-400 hover:border-slate-400',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>
          </fieldset>
        )}

        {/* ── Étape 2 : Photos ── */}
        {step === 2 && (
          <fieldset className="space-y-4">
            <legend className="text-sm font-medium text-slate-900 dark:text-white mb-4">
              Photos du bien
            </legend>
            <PhotoUploader
              files={form.photoFiles}
              onChange={(files) => set('photoFiles', files)}
            />
          </fieldset>
        )}

        {/* ── Étape 3 : Loyer ── */}
        {step === 3 && (
          <fieldset className="space-y-4">
            <legend className="text-sm font-medium text-slate-900 dark:text-white mb-4">
              Loyer et charges
            </legend>

            {/* Suggestion marché */}
            {suggestedPrice && (
              <div className="flex items-start gap-2 p-3 bg-primary-50 dark:bg-primary-900/15 border border-primary/20 rounded-lg">
                <Info size={14} className="text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-primary-700 dark:text-primary-300">
                    Prix de marché estimé à {form.city}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Pour ce type de bien dans votre ville, le loyer médian est autour de{' '}
                    <strong>{formatPrice(suggestedPrice)}/mois</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={() => set('price', String(suggestedPrice))}
                    className="mt-1.5 text-xs text-primary hover:underline underline-offset-2"
                  >
                    Utiliser ce tarif
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Loyer mensuel (FCFA)" htmlFor="price" required>
                <div className="relative">
                  <input
                    id="price"
                    type="number"
                    min="1"
                    value={form.price}
                    onChange={(e) => set('price', e.target.value)}
                    placeholder="150000"
                    required
                    className={cn(inputCls, 'pr-12')}
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400" aria-hidden="true">FCFA</span>
                </div>
              </Field>
              <Field label="Charges mensuelles (FCFA)" htmlFor="charges">
                <div className="relative">
                  <input
                    id="charges"
                    type="number"
                    min="0"
                    value={form.charges}
                    onChange={(e) => set('charges', e.target.value)}
                    placeholder="10000"
                    className={cn(inputCls, 'pr-12')}
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400" aria-hidden="true">FCFA</span>
                </div>
              </Field>
            </div>

            {/* Aperçu loyer total */}
            {form.price && (
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Loyer total :{' '}
                <strong className="text-slate-900 dark:text-white">
                  {formatPrice(Number(form.price) + Number(form.charges || 0))} /mois
                </strong>{' '}
                charges comprises
              </div>
            )}

            {/* Description */}
            <Field
              label="Description"
              htmlFor="description"
              hint="Décrivez le bien avec vos propres mots. Évitez les formules génériques."
            >
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Chambre meublée au 3e étage, exposée sud, parquet, double vitrage..."
                rows={4}
                className={cn(inputCls, 'h-auto resize-none py-2')}
              />
            </Field>

            {/* Titre */}
            <Field label="Titre de l'annonce" htmlFor="title">
              <input
                id="title"
                type="text"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder={`${form.type === 'room' ? 'Chambre' : 'Studio'} ${form.surface ? form.surface + 'm²' : ''} ${form.city ? '- ' + form.city : ''}`}
                className={inputCls}
              />
              <p className="text-xs text-slate-400 mt-1">
                Laissez vide pour utiliser un titre généré automatiquement.
              </p>
            </Field>
          </fieldset>
        )}

        {/* ── Étape 4 : Disponibilités ── */}
        {step === 4 && (
          <fieldset className="space-y-4">
            <legend className="text-sm font-medium text-slate-900 dark:text-white mb-1">
              Créneaux de visite
            </legend>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Définissez vos disponibilités pour les visites. Les candidats pourront réserver directement.
            </p>
            <AvailabilityEditor
              slots={form.availableSlots}
              onChange={(slots) => set('availableSlots', slots)}
            />
          </fieldset>
        )}

        {/* Navigation entre étapes */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-dark-border">
          {step > 1 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              leftIcon={<ChevronLeft size={14} />}
              onClick={() => setStep(step - 1)}
            >
              Retour
            </Button>
          ) : (
            <div />
          )}

          <Button
            type="submit"
            variant="primary"
            size="sm"
            rightIcon={step < 4 ? <ChevronRight size={14} /> : undefined}
            disabled={!canNext()}
            isLoading={isSubmitting}
          >
            {step < 4 ? 'Continuer' : 'Publier l\'annonce'}
          </Button>
        </div>
      </form>
    </div>
  )
}

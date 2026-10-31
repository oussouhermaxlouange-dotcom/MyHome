import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BadgeCheck,
  Building2,
  ChevronRight,
  Clock3,
  Home,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { mockApartments } from '@/data/mockApartments'
import { apiRequest, type ApiApartment } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { cn, formatPrice } from '@/lib/utils'
import type { Apartment } from '@/types'

const BENIN_CITIES = [
  { name: 'Tous' },
  { name: 'Cotonou' },
  { name: 'Haie Vive' },
  { name: 'Cadjehoun' },
  { name: 'Fidjrossè' },
  { name: 'Akpakpa' },
  { name: 'Abomey-Calavi' },
  { name: 'Porto-Novo' },
  { name: 'Parakou' },
]

const MARKET_SUMMARY = [
  { label: 'Logements certifiés', value: '1.2k+' },
  { label: 'Prix médian', value: '200k FCFA' },
  { label: 'Visites ce mois', value: '430' },
  { label: 'Taux de réponse', value: '96%' },
]

export default function CartePage() {
  const navigate = useNavigate()
  const [selectedZone, setSelectedZone] = useState('Tous')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [selectedApt, setSelectedApt] = useState<Apartment | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [maxPrice, setMaxPrice] = useState<number | ''>('')
  const [propertyType, setPropertyType] = useState('all')
  const [apiApartments, setApiApartments] = useState<Apartment[] | null>(null)

  useEffect(() => {
    let cancelled = false
    apiRequest<ApiApartment[]>('/api/apartments?limit=100')
      .then((items) => { if (!cancelled && Array.isArray(items) && items.length > 0) setApiApartments(items as unknown as Apartment[]) })
      .catch(() => { /* repli silencieux sur les données de démonstration */ })
    return () => { cancelled = true }
  }, [])

  const allApartments = apiApartments ?? mockApartments
  const filteredApartments = useMemo(() => {
    return allApartments.filter((apt) => {
      if (selectedZone !== 'Tous') {
        const zoneLower = selectedZone.toLowerCase()
        const matchZone = apt.address.city.toLowerCase().includes(zoneLower)
          || apt.address.street.toLowerCase().includes(zoneLower)
          || apt.title.toLowerCase().includes(zoneLower)
        if (!matchZone) return false
      }

      if (propertyType !== 'all' && apt.type !== propertyType) return false
      if (maxPrice !== '' && apt.price > Number(maxPrice)) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = apt.title.toLowerCase().includes(q)
        const matchCity = apt.address.city.toLowerCase().includes(q)
        const matchStreet = apt.address.street.toLowerCase().includes(q)
        if (!matchTitle && !matchCity && !matchStreet) return false
      }

      return true
    })
  }, [allApartments, selectedZone, propertyType, maxPrice, searchQuery])

  useEffect(() => {
    if (!filteredApartments.length) {
      setSelectedApt(null)
      return
    }
    setSelectedApt((current) => {
      if (current && filteredApartments.some((apt) => apt.id === current.id)) return current
      return filteredApartments[0]
    })
  }, [filteredApartments])

  const pinPositions = useMemo(() => {
    const positions: Record<string, { top: number; left: number }> = {}

    filteredApartments.forEach((apt, index) => {
      const city = apt.address.city.toLowerCase()
      let top = 68
      let left = 50

      if (city.includes('parakou')) {
        top = 24 + (index % 2) * 8
        left = 50 + (index % 2) * 10
      } else if (city.includes('porto')) {
        top = 54 + (index % 2) * 8
        left = 72 + (index % 2) * 8
      } else if (city.includes('calavi')) {
        top = 56 + (index % 2) * 6
        left = 33 + (index % 2) * 8
      } else {
        const offsetMap: Record<string, { lat: number; lng: number }> = {
          '1': { lat: -0.0005, lng: -0.0012 },
          '2': { lat: 0.0004, lng: 0.0015 },
          '3': { lat: -0.00035, lng: 0.0005 },
          '4': { lat: 0.00025, lng: 0.0008 },
          '5': { lat: 0.00035, lng: -0.0006 },
          '6': { lat: -0.0002, lng: 0.0011 },
          '7': { lat: 0.0002, lng: -0.0003 },
          '8': { lat: -0.0001, lng: -0.0004 },
          '9': { lat: 0.0002, lng: -0.0007 },
        }
        const offset = offsetMap[apt.id] ?? { lat: 0, lng: 0 }
        const latitude = (apt.address?.lat ?? 6.35) + offset.lat
        const longitude = (apt.address?.lng ?? 2.40) + offset.lng
        top = Math.min(88, Math.max(14, 72 - (latitude - 6.36) * 500))
        left = Math.min(92, Math.max(8, 48 + (longitude - 2.4) * 500))
      }

      positions[apt.id] = { top, left }
    })

    return positions
  }, [filteredApartments])

  return (
    <div className="h-[calc(100vh-80px)] w-full overflow-hidden bg-slate-100">
      <div className="mx-auto flex h-full w-full max-w-[1800px] flex-col">
        <div className="border-b border-slate-200 bg-white/85 px-4 py-3 backdrop-blur-xl">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <div className="relative min-w-[220px] flex-1 xl:max-w-[340px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un quartier, une ville…"
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {BENIN_CITIES.map((city) => (
                  <button
                    key={city.name}
                    type="button"
                    onClick={() => setSelectedZone(city.name)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-semibold transition-all',
                      selectedZone === city.name
                        ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
                    )}
                  >
                    {city.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
              >
                <option value="all">Tous types</option>
                <option value="room">Chambres</option>
                <option value="studio">Studios</option>
                <option value="apartment">Appartements</option>
                <option value="house">Villas</option>
                <option value="loft">Lofts</option>
              </select>

              <select
                value={maxPrice === '' ? '' : String(maxPrice)}
                onChange={(e) => setMaxPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
              >
                <option value="">Budget max</option>
                <option value="75000">Jusqu’à 75k FCFA</option>
                <option value="150000">Jusqu’à 150k FCFA</option>
                <option value="300000">Jusqu’à 300k FCFA</option>
                <option value="600000">Jusqu’à 600k FCFA</option>
                <option value="1000000">Jusqu’à 1M FCFA</option>
              </select>

              <Button variant="outline" size="sm" onClick={() => navigate('/annonces')} leftIcon={<SlidersHorizontal size={14} />} className="hidden rounded-xl sm:inline-flex">
                Filtres avancés
              </Button>
            </div>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[430px_minmax(0,1fr)]">
          <aside className="flex min-h-0 flex-col border-b border-slate-200 bg-white lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Offres actives</p>
                <p className="text-sm font-semibold text-slate-800">
                  {filteredApartments.length} logements trouvés
                </p>
              </div>
              <div className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                Vérifiés
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {filteredApartments.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                  <Home className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-700">Aucune annonce sur cette zone</p>
                  <p className="mt-1 text-xs text-slate-500">Essayez une autre ville ou réinitialisez les filtres.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      setSelectedZone('Tous')
                      setMaxPrice('')
                      setPropertyType('all')
                      setSearchQuery('')
                    }}
                  >
                    Réinitialiser
                  </Button>
                </div>
              ) : (
                filteredApartments.map((apt) => {
                  const isSelected = selectedApt?.id === apt.id
                  const isHovered = hoveredId === apt.id
                  return (
                    <div
                      key={apt.id}
                      onMouseEnter={() => {
                        setHoveredId(apt.id)
                        setSelectedApt(apt)
                      }}
                      onMouseLeave={() => setHoveredId(null)}
                      className={cn(
                        'rounded-[28px] border p-2 transition-all duration-200',
                        isSelected || isHovered
                          ? 'border-sky-200 bg-sky-50/40 shadow-[0_18px_40px_-22px_rgba(14,165,233,0.6)]'
                          : 'border-slate-200 bg-white hover:border-slate-300',
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => navigate(`/annonces/${apt.id}`)}
                        className="w-full text-left"
                      >
                        <div className="flex gap-3">
                          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl">
                            <img src={apt.photos[0]} alt={apt.title} className="h-full w-full object-cover" />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/70 to-transparent px-2 py-1 text-[10px] font-semibold text-white">
                              {apt.address.city}
                            </div>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-slate-900">{apt.title}</p>
                                <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                                  <MapPin size={10} className="text-slate-400" />
                                  {apt.address.street}
                                </p>
                              </div>
                              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-sky-700">
                                {apt.type}
                              </span>
                            </div>

                            <div className="mt-3 flex items-end justify-between gap-2">
                              <div>
                                <p className="text-lg font-black tracking-[-0.05em] text-slate-900">{formatPrice(apt.price)}</p>
                                <p className="text-[11px] text-slate-500">/ mois</p>
                              </div>
                              <div className="text-right text-[11px] text-slate-500">
                                <p>{apt.surface} m²</p>
                                <p>{apt.rooms} pièce{apt.rooms > 1 ? 's' : ''}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </aside>

          <main className="relative min-h-[420px] overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),_transparent_25%),linear-gradient(180deg,#f8fbff_0%,#eef5fb_100%)]">
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:42px_42px]" />
              <div className="absolute left-1/2 top-1/2 h-[62%] w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-200/30 blur-3xl" />
            </div>

            <div className="absolute inset-x-0 top-4 z-10 flex flex-wrap items-center justify-center gap-3 px-4">
              {MARKET_SUMMARY.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-slate-200/80 bg-white/80 px-3 py-2 shadow-sm backdrop-blur-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{stat.label}</p>
                  <p className="mt-1 text-sm font-black text-slate-900">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="relative h-full w-full">
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1200 900" aria-hidden="true">
                <path d="M120 740 C 260 700, 330 640, 430 660 S 670 680, 760 620 S 960 540, 1090 560 L 1090 760 L 120 760 Z" fill="rgba(59,130,246,0.08)" />
                <path d="M250 220 C 410 180, 620 180, 770 240 S 960 360, 1030 430" fill="none" stroke="rgba(15,23,42,0.14)" strokeWidth="2" strokeDasharray="8 14" />
                <path d="M460 680 C 560 620, 650 590, 720 580" fill="none" stroke="rgba(14,165,233,0.28)" strokeWidth="4" strokeLinecap="round" />
                <path d="M430 310 C 490 350, 560 380, 620 420" fill="none" stroke="rgba(14,165,233,0.24)" strokeWidth="3" strokeLinecap="round" />
              </svg>

              <div className="absolute left-[10%] top-[18%] rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 shadow-sm backdrop-blur-sm">
                Parakou
              </div>
              <div className="absolute left-[28%] top-[48%] rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 shadow-sm backdrop-blur-sm">
                Calavi
              </div>
              <div className="absolute right-[17%] top-[53%] rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 shadow-sm backdrop-blur-sm">
                Porto-Novo
              </div>
              <div className="absolute bottom-[18%] left-[42%] rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-sky-700 shadow-sm">
                Cotonou
              </div>

              {filteredApartments.map((apt) => {
                const pos = pinPositions[apt.id]
                const isSelected = selectedApt?.id === apt.id
                const isHovered = hoveredId === apt.id

                return (
                  <button
                    key={apt.id}
                    type="button"
                    onClick={() => setSelectedApt(apt)}
                    onMouseEnter={() => {
                      setHoveredId(apt.id)
                      setSelectedApt(apt)
                    }}
                    onMouseLeave={() => setHoveredId(null)}
                    className="group absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-200"
                    style={{ top: `${pos.top}%`, left: `${pos.left}%` }}
                  >
                    <span
                      className={cn(
                        'relative flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-[11px] font-black shadow-[0_20px_32px_-20px_rgba(15,23,42,0.8)] transition-all',
                        isSelected || isHovered
                          ? 'border-slate-900 bg-slate-900 text-white ring-4 ring-sky-200'
                          : 'border-white bg-white/90 text-slate-800 hover:border-sky-300 hover:bg-white',
                      )}
                    >
                      <MapPin size={11} className={isSelected || isHovered ? 'text-sky-300' : 'text-sky-600'} />
                      {formatPrice(apt.price)}
                    </span>
                  </button>
                )
              })}

              {selectedApt && (
                <div className="absolute bottom-4 right-4 z-20 w-[min(24rem,calc(100%-2rem))] overflow-hidden rounded-[30px] border border-slate-200 bg-white/90 shadow-[0_32px_80px_-28px_rgba(15,23,42,0.45)] backdrop-blur-xl">
                  <div className="relative h-40 w-full">
                    <img src={selectedApt.photos[0]} alt={selectedApt.title} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-slate-900/10" />
                    <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full border border-white/20 bg-slate-900/70 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md">
                      <BadgeCheck className="h-3 w-3 text-emerald-400" />
                      Certifié
                    </div>
                    <div className="absolute bottom-3 right-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-black text-slate-900 shadow-sm">
                      {formatPrice(selectedApt.price)}
                    </div>
                  </div>

                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-black tracking-[-0.04em] text-slate-900">{selectedApt.title}</p>
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                          <MapPin size={11} className="text-slate-400" />
                          {selectedApt.address.street}, {selectedApt.address.city}
                        </div>
                      </div>
                      <div className="rounded-full bg-sky-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-sky-700">
                        {selectedApt.type}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                      <div className="rounded-xl bg-slate-50 px-2 py-2">
                        <div className="font-bold text-slate-900">{selectedApt.rooms}</div>
                        <div>pièces</div>
                      </div>
                      <div className="rounded-xl bg-slate-50 px-2 py-2">
                        <div className="font-bold text-slate-900">{selectedApt.surface}</div>
                        <div>m²</div>
                      </div>
                      <div className="rounded-xl bg-slate-50 px-2 py-2">
                        <div className="font-bold text-slate-900">{selectedApt.bedrooms}</div>
                        <div>chambres</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <Clock3 className="h-3.5 w-3.5 text-sky-600" />
                        Publié il y a 24h
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/annonces/${selectedApt.id}`)}
                        rightIcon={<ChevronRight size={12} />}
                        className="rounded-xl px-3"
                      >
                        Voir le bien
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="absolute left-4 top-24 rounded-2xl border border-slate-200 bg-white/85 p-3 shadow-sm backdrop-blur-md">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Building2 className="h-4 w-4 text-sky-600" />
                  Marché immobilier
                </div>
                <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  +12% vs. mois dernier
                </div>
              </div>

              <div className="absolute left-4 bottom-4 rounded-2xl border border-slate-200 bg-white/85 px-3 py-2 shadow-sm backdrop-blur-md">
                <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  <Sparkles className="h-3.5 w-3.5 text-sky-500" />
                  Légende
                </div>
                <div className="space-y-2 text-[11px] text-slate-600">
                  <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-slate-900" /> Logements certifiés</div>
                  <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> Dernières bonnes affaires</div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

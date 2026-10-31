import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { apiRequest } from '@/lib/api'

interface FavoritesContextValue {
  favoritedIds: Set<string>
  toggleFavorite: (id: string) => boolean
  isFavorited: (id: string) => boolean
  favoritesCount: number
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined)

const STORAGE_KEY = 'myhome_favorites'

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth()
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { return new Set() }
  })

  useEffect(() => {
    if (!token) { setFavoritedIds(new Set()); return }
    apiRequest<string[]>('/api/me/favorites', { token }).then((ids) => setFavoritedIds(new Set(ids))).catch(() => setFavoritedIds(new Set()))
  }, [token])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(favoritedIds)))
    } catch {
      // Ignore storage errors
    }
  }, [favoritedIds])

  const toggleFavorite = useCallback((id: string) => {
    let isNowFav = false
    setFavoritedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        isNowFav = false
      } else {
        next.add(id)
        isNowFav = true
      }
      return next
    })
    return isNowFav
  }, [])

  const isFavorited = useCallback((id: string) => {
    return favoritedIds.has(id)
  }, [favoritedIds])

  return (
    <FavoritesContext.Provider
      value={{
        favoritedIds,
        toggleFavorite,
        isFavorited,
        favoritesCount: favoritedIds.size,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}

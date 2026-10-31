import { useState, useEffect } from 'react'

type Theme = 'light' | 'dark'

/**
 * Hook de gestion du thème clair/sombre.
 * Persiste la préférence dans localStorage et applique la classe `.dark` sur <html>.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    // Priorité : préférence sauvegardée > préférence système
    const saved = localStorage.getItem('myhome-theme') as Theme | null
    if (saved) return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('myhome-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  const setLight     = () => setTheme('light')
  const setDark      = () => setTheme('dark')

  return { theme, toggleTheme, setLight, setDark, isDark: theme === 'dark' }
}

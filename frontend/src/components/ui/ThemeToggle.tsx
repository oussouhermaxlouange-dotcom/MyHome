/**
 * ThemeToggle désactivé — palette lumineuse uniquement.
 * Conservé pour compatibilité avec les imports existants.
 */
export function ThemeToggle({ className }: { className?: string }) {
  // Dark mode non activé dans cette version.
  // Le composant retourne null pour ne rien afficher.
  void className
  return null
}

import { cn } from '@/lib/utils'

type BadgeVariant = 'primary' | 'success' | 'warning' | 'info' | 'neutral'
type BadgeSize   = 'sm' | 'md'

interface BadgeProps {
  label: string
  variant?: BadgeVariant
  size?: BadgeSize
  icon?: React.ReactNode
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  primary: 'bg-sky-50 text-sky-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  info:    'bg-sky-50 text-sky-700',
  neutral: 'bg-slate-100 text-slate-600',
}

const sizes: Record<BadgeSize, string> = {
  sm: 'text-[10px] px-1.5 py-0.5 gap-1',
  md: 'text-xs px-2 py-1 gap-1.5',
}

export function Badge({ label, variant = 'neutral', size = 'md', icon, className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center font-medium rounded whitespace-nowrap',
      variants[variant],
      sizes[size],
      className,
    )}>
      {icon && <span aria-hidden="true">{icon}</span>}
      {label}
    </span>
  )
}

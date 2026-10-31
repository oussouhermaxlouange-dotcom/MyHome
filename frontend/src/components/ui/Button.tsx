import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type ButtonSize    = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const base = [
  'inline-flex items-center justify-center gap-2 font-medium rounded-lg',
  'transition-colors duration-150',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2',
  'disabled:opacity-50 disabled:pointer-events-none',
  'select-none cursor-pointer',
].join(' ')

const variants: Record<ButtonVariant, string> = {
  primary:   'bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98] shadow-sm',
  secondary: 'bg-sky-50 text-primary-600 hover:bg-sky-100',
  ghost:     'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  outline:   'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300',
  danger:    'bg-red-50 text-red-600 hover:bg-red-100',
}

const sizes: Record<ButtonSize, string> = {
  sm:   'text-xs px-3 py-1.5 h-8',
  md:   'text-sm px-4 py-2 h-10',
  lg:   'text-base px-6 py-3 h-12',
  icon: 'p-2 h-9 w-9',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {!isLoading && leftIcon  && <span aria-hidden="true">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span aria-hidden="true">{rightIcon}</span>}
    </button>
  ),
)

Button.displayName = 'Button'

import type { HTMLAttributes, ReactNode } from 'react'

export type StatusBadgeVariant =
  | 'active'
  | 'needs-review'
  | 'at-risk'
  | 'completed'
  | 'neutral'

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
  variant?: StatusBadgeVariant
}

const variantClasses: Record<StatusBadgeVariant, string> = {
  active: 'bg-[var(--color-green-100)] text-[var(--color-green-700)]',
  'needs-review': 'bg-[var(--color-rose-100)] text-[var(--color-rose-700)]',
  'at-risk': 'bg-[var(--color-amber-100)] text-[var(--color-amber-700)]',
  completed: 'bg-[var(--color-teal-100)] text-[var(--color-teal-700)]',
  neutral: 'bg-[var(--color-violet-100)] text-[var(--color-violet-700)]',
}

export function StatusBadge({
  children,
  className = '',
  variant = 'neutral',
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold leading-none ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}

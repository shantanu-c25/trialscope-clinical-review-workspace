import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border-transparent bg-[var(--color-teal-700)] text-white shadow-sm hover:bg-[var(--color-teal-600)]',
  secondary:
    'border-[var(--color-border-strong)] bg-white text-[var(--color-text)] shadow-sm hover:border-[var(--color-teal-600)] hover:bg-[var(--color-surface-subtle)]',
  ghost:
    'border-transparent bg-transparent text-[var(--color-text-muted)] hover:bg-black/5 hover:text-[var(--color-text)]',
}

export function Button({
  className = '',
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] border px-4 py-2 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  )
}

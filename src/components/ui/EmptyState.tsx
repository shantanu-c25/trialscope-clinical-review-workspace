import type { ReactNode } from 'react'

export interface EmptyStateProps {
  title: string
  description: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center px-6 py-12 text-center ${className}`}>
      {icon ? (
        <div className="grid size-12 place-items-center rounded-xl bg-[var(--color-violet-100)] text-[var(--color-violet-700)]">
          {icon}
        </div>
      ) : null}
      <h3 className="mt-4 text-base font-bold text-[var(--color-text)]">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-[var(--color-text-muted)]">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

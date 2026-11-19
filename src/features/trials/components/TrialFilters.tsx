import { useState } from 'react'
import { ChevronDown, SlidersHorizontal, Search, X } from 'lucide-react'
import type {
  ReviewStatus,
  StudyStatus,
  TrialFilters as TrialFilterValues,
  TrialPhase,
} from '../types'

export interface TrialFiltersProps {
  query: string
  filters: TrialFilterValues
  onQueryChange: (query: string) => void
  onFiltersChange: (filters: TrialFilterValues) => void
  onClear: () => void
}

const controlClasses =
  'h-10 w-full min-w-0 rounded-[10px] border border-[var(--color-control-border)] bg-white px-3 text-[0.8125rem] font-medium text-[var(--color-control-text)] shadow-[var(--shadow-control)] transition-colors hover:border-[var(--color-control-border-hover)]'

const selectClasses = `${controlClasses} appearance-none pr-9`

const secondaryActionClasses =
  'inline-flex h-10 min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border border-[var(--color-control-border)] bg-white px-3 text-[0.8125rem] font-medium text-[var(--color-control-text)] shadow-[var(--shadow-control)] transition-colors hover:border-[var(--color-control-border-hover)] hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 disabled:shadow-none'

export function TrialFilters({
  query,
  filters,
  onQueryChange,
  onFiltersChange,
  onClear,
}: TrialFiltersProps) {
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false)
  const hasFilters =
    Boolean(query.trim()) ||
    Boolean(filters.studyStatuses?.length) ||
    Boolean(filters.reviewStatuses?.length) ||
    Boolean(filters.phases?.length)
  const hasAdditionalFilters = Boolean(filters.studyStatuses?.length)

  return (
    <div
      className="border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3 py-2.5 sm:px-4"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && isMoreFiltersOpen) {
          event.preventDefault()
          setIsMoreFiltersOpen(false)
        }
      }}
    >
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 sm:grid-cols-[minmax(12rem,1fr)_8.5rem_7.5rem_auto]">
        <div className="relative col-span-3 min-w-0 sm:col-span-1">
          <label className="sr-only" htmlFor="trial-search">
            Search by trial ID, title, indication, or sponsor
          </label>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-control-placeholder)]"
            size={16}
          />
          <input
            className={`${controlClasses} pl-[2.375rem] font-normal placeholder:text-[var(--color-control-placeholder)] placeholder:opacity-100`}
            id="trial-search"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search ID, title, indication, or sponsor"
            type="search"
            value={query}
          />
        </div>

        <div className="relative min-w-0">
          <label className="sr-only" htmlFor="review-status-filter">
            Filter by review status
          </label>
          <select
            className={selectClasses}
            id="review-status-filter"
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                reviewStatuses: event.target.value
                  ? [event.target.value as ReviewStatus]
                  : undefined,
              })
            }
            value={filters.reviewStatuses?.[0] ?? ''}
          >
            <option value="">Status</option>
            <option value="needs-review">Needs review</option>
            <option value="in-progress">In progress</option>
            <option value="completed">Completed</option>
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-control-placeholder)]"
            size={15}
          />
        </div>

        <div className="relative min-w-0">
          <label className="sr-only" htmlFor="phase-filter">
            Filter by trial phase
          </label>
          <select
            className={selectClasses}
            id="phase-filter"
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                phases: event.target.value
                  ? [event.target.value as TrialPhase]
                  : undefined,
              })
            }
            value={filters.phases?.[0] ?? ''}
          >
            <option value="">Phase</option>
            <option value="Phase I">Phase I</option>
            <option value="Phase II">Phase II</option>
            <option value="Phase III">Phase III</option>
            <option value="Phase IV">Phase IV</option>
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-control-placeholder)]"
            size={15}
          />
        </div>

        <button
          aria-controls="additional-trial-filters"
          aria-expanded={isMoreFiltersOpen}
          className={`relative inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border px-3 text-[0.8125rem] font-medium shadow-[var(--shadow-control)] transition-colors ${
            isMoreFiltersOpen || hasAdditionalFilters
              ? 'border-[var(--color-control-focus)] bg-[var(--color-control-active)] text-[var(--color-control-focus)] hover:border-[var(--color-control-focus)]'
              : 'border-[var(--color-control-border)] bg-white text-[var(--color-control-text)] hover:border-[var(--color-control-border-hover)]'
          }`}
          onClick={() => setIsMoreFiltersOpen((isOpen) => !isOpen)}
          type="button"
        >
          <SlidersHorizontal aria-hidden="true" size={16} />
          <span className="hidden min-[360px]:inline">More Filters</span>
          <span className="min-[360px]:hidden">More</span>
          <ChevronDown
            aria-hidden="true"
            className={isMoreFiltersOpen ? 'rotate-180' : undefined}
            size={15}
          />
          {hasAdditionalFilters ? (
            <span
              aria-label="Additional filters applied"
              className="absolute -right-1 -top-1 size-2.5 rounded-full border-2 border-white bg-[var(--color-violet-600)]"
              role="img"
            />
          ) : null}
        </button>
      </div>

      {isMoreFiltersOpen ? (
        <div
          aria-label="Additional trial filters"
          className="mt-2 flex flex-col gap-2 rounded-[10px] border border-[var(--color-control-panel-border)] bg-white p-3 shadow-[var(--shadow-control)] sm:flex-row sm:items-end sm:p-4"
          id="additional-trial-filters"
          role="region"
        >
          <div className="min-w-0 flex-1 sm:max-w-56">
            <label
              className="mb-1.5 block text-xs font-medium text-[var(--color-control-placeholder)]"
              htmlFor="study-status-filter"
            >
              Study status
            </label>
            <div className="relative">
              <select
                className={selectClasses}
                id="study-status-filter"
                onChange={(event) =>
                  onFiltersChange({
                    ...filters,
                    studyStatuses: event.target.value
                      ? [event.target.value as StudyStatus]
                      : undefined,
                  })
                }
                value={filters.studyStatuses?.[0] ?? ''}
              >
                <option value="">All study statuses</option>
                <option value="active">Active</option>
                <option value="recruiting">Recruiting</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
              <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-control-placeholder)]"
                size={15}
              />
            </div>
          </div>
          <button
            className={`${secondaryActionClasses} self-start sm:self-auto`}
            disabled={!hasFilters}
            onClick={onClear}
            type="button"
          >
            <X aria-hidden="true" size={16} />
            Clear Filters
          </button>
        </div>
      ) : null}
    </div>
  )
}

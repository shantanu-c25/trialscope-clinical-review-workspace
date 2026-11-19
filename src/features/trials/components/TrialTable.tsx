import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  SearchX,
} from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/ui/EmptyState'
import {
  StatusBadge,
  type StatusBadgeVariant,
} from '../../../components/ui/StatusBadge'
import type {
  ClinicalTrial,
  ReviewStatus,
  TrialSort,
  TrialSortField,
} from '../types'

export interface TrialTableProps {
  trials: readonly ClinicalTrial[]
  totalCount: number
  currentPage: number
  pageSize: number
  selectedTrialId?: string
  sort: TrialSort
  onPageChange: (page: number) => void
  onSortChange: (sort: TrialSort) => void
  onSelectTrial: (trialId: string) => void
}

const reviewStatusLabels: Record<ReviewStatus, string> = {
  'needs-review': 'Needs review',
  'in-progress': 'In progress',
  completed: 'Completed',
}

const reviewStatusVariants: Record<ReviewStatus, StatusBadgeVariant> = {
  'needs-review': 'needs-review',
  'in-progress': 'at-risk',
  completed: 'completed',
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

function formatDate(value: string) {
  return dateFormatter.format(new Date(value))
}

interface SortButtonProps {
  field: TrialSortField
  label: string
  sort: TrialSort
  onSortChange: (sort: TrialSort) => void
}

function SortButton({ field, label, sort, onSortChange }: SortButtonProps) {
  const isActive = sort.field === field
  const Icon = isActive
    ? sort.direction === 'asc'
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown

  return (
    <button
      className="inline-flex items-center gap-1.5 rounded-md py-1 text-left font-semibold text-slate-700 hover:text-[var(--color-violet-700)]"
      onClick={() =>
        onSortChange({
          field,
          direction: isActive && sort.direction === 'asc' ? 'desc' : 'asc',
        })
      }
      type="button"
    >
      {label}
      <Icon aria-hidden="true" size={14} />
    </button>
  )
}

function ariaSort(sort: TrialSort, field: TrialSortField) {
  if (sort.field !== field) return 'none' as const
  return sort.direction === 'asc' ? ('ascending' as const) : ('descending' as const)
}

export function TrialTable({
  trials,
  totalCount,
  currentPage,
  pageSize,
  selectedTrialId,
  sort,
  onPageChange,
  onSortChange,
  onSelectTrial,
}: TrialTableProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const rangeEnd = Math.min(currentPage * pageSize, totalCount)

  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] px-4 py-3 sm:px-5">
        <div>
          <h2 className="text-sm font-bold text-[var(--color-text)]">Trial records</h2>
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]" aria-live="polite">
            {totalCount} {totalCount === 1 ? 'record' : 'records'} found
          </p>
        </div>
        <p className="hidden text-xs text-[var(--color-text-muted)] sm:block">
          Select a trial to review details
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[42rem] border-collapse text-left text-[0.8125rem]">
          <caption className="sr-only">
            Clinical trials available for review
          </caption>
          <thead className="bg-slate-50/80 text-xs text-slate-700">
            <tr>
              <th aria-sort={ariaSort(sort, 'id')} className="px-3 py-2.5" scope="col">
                <SortButton field="id" label="Trial ID" onSortChange={onSortChange} sort={sort} />
              </th>
              <th aria-sort={ariaSort(sort, 'title')} className="px-2.5 py-2.5" scope="col">
                <SortButton field="title" label="Study title" onSortChange={onSortChange} sort={sort} />
              </th>
              <th aria-sort={ariaSort(sort, 'indication')} className="px-2.5 py-2.5" scope="col">
                <SortButton field="indication" label="Indication" onSortChange={onSortChange} sort={sort} />
              </th>
              <th aria-sort={ariaSort(sort, 'phase')} className="px-2.5 py-2.5" scope="col">
                <SortButton field="phase" label="Phase" onSortChange={onSortChange} sort={sort} />
              </th>
              <th aria-sort={ariaSort(sort, 'siteCount')} className="px-2.5 py-2.5" scope="col">
                <SortButton field="siteCount" label="Sites" onSortChange={onSortChange} sort={sort} />
              </th>
              <th aria-sort={ariaSort(sort, 'reviewStatus')} className="px-2.5 py-2.5" scope="col">
                <SortButton field="reviewStatus" label="Review status" onSortChange={onSortChange} sort={sort} />
              </th>
              <th aria-sort={ariaSort(sort, 'lastUpdated')} className="px-2.5 py-2.5" scope="col">
                <SortButton field="lastUpdated" label="Last update" onSortChange={onSortChange} sort={sort} />
              </th>
            </tr>
          </thead>
          <tbody>
            {trials.length ? (
              trials.map((trial) => {
                const isSelected = trial.id === selectedTrialId

                return (
                  <tr
                    className={`group border-t border-[var(--color-border)] transition-colors focus-within:bg-[var(--color-violet-100)] focus-within:ring-2 focus-within:ring-inset focus-within:ring-[var(--color-violet-600)] ${isSelected
                        ? 'bg-violet-50'
                        : 'bg-white hover:bg-slate-50'
                      }`}
                    key={trial.id}
                    onClick={() => onSelectTrial(trial.id)}
                  >
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <button
                        aria-label={`View ${trial.id}: ${trial.title}`}
                        aria-pressed={isSelected}
                        className="rounded-md font-bold text-[var(--color-violet-700)] outline-none"
                        onClick={(event) => {
                          event.stopPropagation()
                          onSelectTrial(trial.id)
                        }}
                        type="button"
                      >
                        {trial.id}
                      </button>
                    </td>
                    <td className="max-w-48 px-2.5 py-2.5 font-medium text-[var(--color-text)]">
                      <span className="line-clamp-2" title={trial.title}>{trial.title}</span>
                    </td>
                    <td className="max-w-40 px-2.5 py-2.5 text-[var(--color-text-muted)]">
                      <span className="line-clamp-2" title={trial.indication}>{trial.indication}</span>
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2.5 text-[var(--color-text-muted)]">
                      {trial.phase}
                    </td>
                    <td className="px-2.5 py-2.5 text-[var(--color-text-muted)]">
                      {trial.siteCount}
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2.5">
                      <StatusBadge variant={reviewStatusVariants[trial.reviewStatus]}>
                        {reviewStatusLabels[trial.reviewStatus]}
                      </StatusBadge>
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2.5 text-[var(--color-text-muted)]">
                      {formatDate(trial.lastUpdated)}
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    description="Try a broader search or clear one or more filters."
                    icon={<SearchX aria-hidden="true" size={23} />}
                    title="No trials match your criteria"
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalCount > 0 ? (
        <nav
          aria-label="Trial table pagination"
          className="flex flex-col gap-3 border-t border-[var(--color-border)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
        >
          <p className="text-sm text-[var(--color-text-muted)]">
            {rangeStart}–{rangeEnd} of {totalCount}
          </p>
          <div className="flex items-center gap-1">
            <Button
              aria-label="Go to previous page"
              className="size-9 min-h-9 p-0"
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
              variant="ghost"
            >
              <ChevronLeft aria-hidden="true" size={18} />
            </Button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (page) => (
                <Button
                  aria-current={page === currentPage ? 'page' : undefined}
                  aria-label={`Go to page ${page}`}
                  className={`!size-9 !min-h-9 !rounded-lg !p-0 !font-semibold transition-colors ${page === currentPage
                      ? '!bg-violet-600 !text-white hover:!bg-violet-700'
                      : '!bg-transparent !text-slate-600 hover:!bg-violet-100 hover:!text-violet-700'
                    }`}
                  key={page}
                  onClick={() => onPageChange(page)}
                  variant="ghost"
                >
                  {page}
                </Button>
              ),
            )}
            <Button
              aria-label="Go to next page"
              className="size-9 min-h-9 p-0"
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              variant="ghost"
            >
              <ChevronRight aria-hidden="true" size={18} />
            </Button>
          </div>
        </nav>
      ) : null}
    </div>
  )
}

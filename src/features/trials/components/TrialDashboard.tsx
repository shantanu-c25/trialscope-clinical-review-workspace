import { useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode, RefObject } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ClipboardClock,
  FlaskConical,
  TriangleAlert,
} from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/ui/EmptyState'
import type {
  ClinicalTrial,
  TrialFilters as TrialFilterValues,
  TrialMetrics,
  TrialSort,
} from '../types'
import {
  filterTrials,
  getTrialById,
  searchTrials,
  sortTrials,
} from '../utils/trialSelectors'
import { TrialDetailPanel } from './TrialDetailPanel'
import { TrialFilters } from './TrialFilters'
import { TrialTable } from './TrialTable'

export type DashboardView = 'overview' | 'trials' | 'reviews'

export interface TrialDashboardProps {
  trials: ClinicalTrial[]
  status: 'loading' | 'success' | 'error'
  error: string | null
  metrics: TrialMetrics
  view: DashboardView
  retry: () => void
  onViewChange: (view: DashboardView) => void
  addReviewNote: (trialId: string, noteText: string) => Promise<ClinicalTrial>
  completeReview: (trialId: string) => Promise<ClinicalTrial>
}

interface MetricCardProps {
  label: string
  value: number
  icon: ReactNode
  iconClassName: string
  cardClassName: string
}

type DataTab = 'trials' | 'reviews'

function MetricCard({ label, value, icon, iconClassName, cardClassName }: MetricCardProps) {
  return (
    <div className={`relative isolate flex min-h-[166px] flex-col overflow-hidden rounded-2xl border px-5 py-4 shadow-[0_5px_18px_rgba(25,35,80,0.08)] transition-shadow hover:shadow-[0_8px_24px_rgba(25,35,80,0.13)] ${cardClassName}`}>
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-14 size-40 rounded-full bg-current opacity-[0.055]" />
      <svg aria-hidden="true" viewBox="0 0 128 64" className="pointer-events-none absolute bottom-0 right-0 h-16 w-32 opacity-25" fill="none" preserveAspectRatio="none">
        <path d="M0 58 C18 52 24 29 44 35 S69 52 85 27 S109 27 128 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M0 58 C18 52 24 29 44 35 S69 52 85 27 S109 27 128 6 V64 H0 Z" fill="currentColor" opacity=".14" />
      </svg>
      <div className={`relative grid size-12 shrink-0 place-items-center rounded-[14px] shadow-sm ${iconClassName}`}>{icon}</div>
      <p className="relative mt-3 text-[14px] font-semibold leading-5 text-slate-800">{label}</p>
      <div className="relative mt-auto flex items-end justify-between gap-2 pt-1">
        <p className="text-[36px] font-bold leading-none tracking-[-0.04em] text-slate-950 tabular-nums">{value}</p>
        <span className="rounded-full border border-current/10 bg-white/65 px-2 py-1 text-[10px] font-semibold leading-4 opacity-80">Current total</span>
      </div>
    </div>
  )
}

function DashboardLoadingState({ showMetrics }: { showMetrics: boolean }) {
  return (
    <div aria-busy="true" aria-live="polite" role="status">
      <span className="sr-only">Loading clinical trials</span>
      {showMetrics ? (
        <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 min-[1280px]:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div
              className="h-30 animate-pulse rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white"
              key={item}
            />
          ))}
        </div>
      ) : null}
      <div className={`${showMetrics ? 'mt-4' : ''} h-[34rem] animate-pulse rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white`} />
    </div>
  )
}

export function TrialDashboard({
  trials,
  status,
  error,
  metrics,
  view,
  retry,
  onViewChange,
  addReviewNote,
  completeReview,
}: TrialDashboardProps) {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<TrialFilterValues>({})
  const [sort, setSort] = useState<TrialSort>({
    field: 'lastUpdated',
    direction: 'desc',
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedTrialId, setSelectedTrialId] = useState<string | null>(null)
  const [detailDismissed, setDetailDismissed] = useState(false)
  const detailDialog = useRef<HTMLDialogElement>(null)
  const trialsTab = useRef<HTMLButtonElement>(null)
  const reviewsTab = useRef<HTMLButtonElement>(null)
  const pageSize = 6
  const activeTab: DataTab = view === 'reviews' ? 'reviews' : 'trials'
  const showMetrics = view === 'overview'

  const viewTrials = useMemo(
    () =>
      view === 'reviews'
        ? filterTrials(trials, { reviewStatuses: ['needs-review'] })
        : trials,
    [trials, view],
  )

  const visibleTrials = useMemo(() => {
    const matchingSearch = searchTrials(viewTrials, query)
    const matchingFilters = filterTrials(matchingSearch, filters)
    return sortTrials(matchingFilters, sort)
  }, [filters, query, sort, viewTrials])

  const totalPages = Math.max(1, Math.ceil(visibleTrials.length / pageSize))
  const activePage = Math.min(currentPage, totalPages)
  const paginatedTrials = visibleTrials.slice(
    (activePage - 1) * pageSize,
    activePage * pageSize,
  )

  const effectiveTrialId =
    selectedTrialId ?? (!detailDismissed ? visibleTrials[0]?.id : undefined)
  const selectedTrial = effectiveTrialId
    ? getTrialById(trials, effectiveTrialId)
    : undefined

  function activateTab(tab: DataTab, focusRef?: RefObject<HTMLButtonElement | null>) {
    onViewChange(tab === 'reviews' ? 'reviews' : 'trials')
    setCurrentPage(1)
    focusRef?.current?.focus()
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowLeft' || event.key === 'Home') {
      event.preventDefault()
      activateTab('trials', trialsTab)
    }
    if (event.key === 'ArrowRight' || event.key === 'End') {
      event.preventDefault()
      activateTab('reviews', reviewsTab)
    }
  }

  function selectTrial(trialId: string) {
    setSelectedTrialId(trialId)
    setDetailDismissed(false)

    if (window.matchMedia('(max-width: 1279px)').matches) {
      window.requestAnimationFrame(() => detailDialog.current?.showModal())
    }
  }

  function closeDetails() {
    if (detailDialog.current?.open) detailDialog.current.close()
    setSelectedTrialId(null)
    setDetailDismissed(true)
  }

  function clearFilters() {
    setQuery('')
    setFilters({})
    setCurrentPage(1)
  }

  return (
    <section aria-label="Clinical trial dashboard">
      {status === 'loading' ? <DashboardLoadingState showMetrics={showMetrics} /> : null}

      {status === 'error' ? (
        <div className="rounded-[var(--radius-xl)] border border-rose-200 bg-white shadow-[var(--shadow-panel)]">
          <EmptyState
            action={<Button onClick={retry}>Retry loading trials</Button>}
            description={error ?? 'The trial workspace could not be loaded.'}
            icon={<AlertCircle aria-hidden="true" size={24} />}
            title="Unable to load trial data"
          />
        </div>
      ) : null}

      {status === 'success' && trials.length === 0 ? (
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-panel)]">
          <EmptyState
            description="No trial records are currently available in the workspace."
            icon={<FlaskConical aria-hidden="true" size={24} />}
            title="No trials available"
          />
        </div>
      ) : null}

      {status === 'success' && trials.length > 0 ? (
        <div
          className={`grid gap-4 ${
            selectedTrial ? 'min-[1280px]:grid-cols-[minmax(0,1fr)_23rem] min-[1480px]:grid-cols-[minmax(0,1fr)_26rem]' : ''
          }`}
        >
          <div className="min-w-0">
            {showMetrics ? (
              <section aria-label="Trial review metrics" className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 min-[1280px]:grid-cols-4">
                <MetricCard
                  cardClassName="border-[#b8dcff] bg-gradient-to-br from-[#e3f2ff] via-[#f2f8ff] to-[#ffffff] text-[#2977dc]"
                  icon={<FlaskConical aria-hidden="true" size={27} />}
                  iconClassName="bg-[#cce8ff] text-[#1469d1]"
                  label="Active trials"
                  value={metrics.activeTrials}
                />
                <MetricCard
                  cardClassName="border-[#f7c3df] bg-gradient-to-br from-[#ffe7f1] via-[#fff4fa] to-[#ffffff] text-[#d14a92]"
                  icon={<ClipboardClock aria-hidden="true" size={27} />}
                  iconClassName="bg-[#ffd4e5] text-[#d32769]"
                  label="Needs review"
                  value={metrics.needsReview}
                />
                <MetricCard
                  cardClassName="border-[#f9d89b] bg-gradient-to-br from-[#fff0cd] via-[#fff9eb] to-[#ffffff] text-[#dc8a12]"
                  icon={<TriangleAlert aria-hidden="true" size={27} />}
                  iconClassName="bg-[#ffe5a8] text-[#b66a00]"
                  label="At risk"
                  value={metrics.atRiskReviews}
                />
                <MetricCard
                  cardClassName="border-[#b4edc9] bg-gradient-to-br from-[#dcfae7] via-[#f0fff6] to-[#ffffff] text-[#15976c]"
                  icon={<CheckCircle2 aria-hidden="true" size={27} />}
                  iconClassName="bg-[#c7f5d7] text-[#087c52]"
                  label="Completed reviews"
                  value={metrics.completedReviews}
                />
              </section>
            ) : null}

            <div className={`${showMetrics ? 'mt-4' : ''} overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-panel)]`}>
              <div
                aria-label="Trial data views"
                className="flex border-b border-[var(--color-border)] px-2"
                role="tablist"
              >
                <button
                  aria-controls="trial-table-panel"
                  aria-selected={activeTab === 'trials'}
                  className={`relative min-h-10 px-3 py-2 text-sm font-semibold sm:px-4 ${
                    activeTab === 'trials'
                      ? 'text-[var(--color-violet-700)] after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-[var(--color-violet-600)]'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                  }`}
                  id="trials-tab"
                  onClick={() => activateTab('trials')}
                  onKeyDown={handleTabKeyDown}
                  ref={trialsTab}
                  role="tab"
                  tabIndex={activeTab === 'trials' ? 0 : -1}
                  type="button"
                >
                  Trials ({trials.length})
                </button>
                <button
                  aria-controls="trial-table-panel"
                  aria-selected={activeTab === 'reviews'}
                  className={`relative min-h-10 px-3 py-2 text-sm font-semibold sm:px-4 ${
                    activeTab === 'reviews'
                      ? 'text-[var(--color-violet-700)] after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-[var(--color-violet-600)]'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                  }`}
                  id="reviews-tab"
                  onClick={() => activateTab('reviews')}
                  onKeyDown={handleTabKeyDown}
                  ref={reviewsTab}
                  role="tab"
                  tabIndex={activeTab === 'reviews' ? 0 : -1}
                  type="button"
                >
                  Needs Review ({metrics.needsReview})
                </button>
              </div>
              <div
                aria-labelledby={activeTab === 'trials' ? 'trials-tab' : 'reviews-tab'}
                id="trial-table-panel"
                role="tabpanel"
                tabIndex={0}
              >
                <TrialFilters
                  filters={filters}
                  onClear={clearFilters}
                  onFiltersChange={(nextFilters) => {
                    setFilters(nextFilters)
                    setCurrentPage(1)
                  }}
                  onQueryChange={(nextQuery) => {
                    setQuery(nextQuery)
                    setCurrentPage(1)
                  }}
                  query={query}
                />
                <TrialTable
                  currentPage={activePage}
                  onPageChange={setCurrentPage}
                  onSelectTrial={selectTrial}
                  onSortChange={(nextSort) => {
                    setSort(nextSort)
                    setCurrentPage(1)
                  }}
                  pageSize={pageSize}
                  selectedTrialId={selectedTrial?.id}
                  sort={sort}
                  totalCount={visibleTrials.length}
                  trials={paginatedTrials}
                />
              </div>
            </div>
          </div>

          {selectedTrial ? (
            <div className="sticky top-28 hidden h-[calc(100dvh-8rem)] self-start min-[1280px]:block">
              <TrialDetailPanel
                className="h-full"
                key={`desktop-${selectedTrial.id}`}
                onAddReviewNote={addReviewNote}
                onClose={closeDetails}
                onCompleteReview={completeReview}
                trial={selectedTrial}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <dialog
        aria-label="Selected trial details"
        className="m-auto max-h-[calc(100dvh-2rem)] w-[min(31rem,calc(100%-2rem))] max-w-none overflow-hidden border-0 bg-transparent p-0 shadow-none backdrop:bg-slate-950/60 min-[1280px]:hidden"
        onClick={(event) => {
          if (event.target === event.currentTarget) closeDetails()
        }}
        onClose={() => {
          setSelectedTrialId(null)
          setDetailDismissed(true)
        }}
        ref={detailDialog}
      >
        {selectedTrial ? (
          <TrialDetailPanel
            className="max-h-[calc(100dvh-2rem)]"
            key={`mobile-${selectedTrial.id}`}
            onAddReviewNote={addReviewNote}
            onClose={closeDetails}
            onCompleteReview={completeReview}
            trial={selectedTrial}
          />
        ) : null}
      </dialog>
    </section>
  )
}

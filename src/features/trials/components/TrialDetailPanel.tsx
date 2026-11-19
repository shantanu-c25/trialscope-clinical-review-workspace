import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent, ReactNode } from 'react'
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  MapPin,
  MessageSquarePlus,
  X,
} from 'lucide-react'
import { EmptyState } from '../../../components/ui/EmptyState'
import {
  StatusBadge,
  type StatusBadgeVariant,
} from '../../../components/ui/StatusBadge'
import type { ClinicalTrial, ReviewStatus, StudyStatus } from '../types'

export interface TrialDetailPanelProps {
  trial: ClinicalTrial
  onClose: () => void
  onAddReviewNote: (
    trialId: string,
    noteText: string,
  ) => Promise<ClinicalTrial>
  onCompleteReview: (trialId: string) => Promise<ClinicalTrial>
  className?: string
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'UTC',
  timeZoneName: 'short',
})

const studyStatusLabels: Record<StudyStatus, string> = {
  active: 'Active',
  recruiting: 'Recruiting',
  completed: 'Completed',
  paused: 'Paused',
}

const reviewStatusLabels: Record<ReviewStatus, string> = {
  'needs-review': 'Needs review',
  'in-progress': 'In progress',
  completed: 'Completed',
}

const studyStatusVariants: Record<StudyStatus, StatusBadgeVariant> = {
  active: 'active',
  recruiting: 'active',
  completed: 'completed',
  paused: 'at-risk',
}

const reviewStatusVariants: Record<ReviewStatus, StatusBadgeVariant> = {
  'needs-review': 'needs-review',
  'in-progress': 'at-risk',
  completed: 'completed',
}

const detailTabs = ['overview', 'sites', 'documents', 'activity'] as const
type DetailTab = (typeof detailTabs)[number]

const detailTabLabels: Record<DetailTab, string> = {
  overview: 'Overview',
  sites: 'Sites',
  documents: 'Documents',
  activity: 'Activity',
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(value))
}

function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value))
}

export function TrialDetailPanel({
  trial,
  onClose,
  onAddReviewNote,
  onCompleteReview,
  className = '',
}: TrialDetailPanelProps) {
  const instanceId = useId()
  const [activeTab, setActiveTab] = useState<DetailTab>('overview')
  const [noteText, setNoteText] = useState('')
  const [noteError, setNoteError] = useState<string | null>(null)
  const [isSavingNote, setIsSavingNote] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [actionMessage, setActionMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const noteDialog = useRef<HTMLDialogElement>(null)
  const noteTextarea = useRef<HTMLTextAreaElement>(null)
  const addNoteButton = useRef<HTMLButtonElement>(null)
  const closeDetailsButton = useRef<HTMLButtonElement>(null)
  const detailPanel = useRef<HTMLElement>(null)
  const returnFocusTo = useRef<HTMLElement | null>(null)
  const isReviewComplete = trial.reviewStatus === 'completed'

  // Move keyboard focus directly into the newly opened/selected study panel.
  useLayoutEffect(() => {
    const previouslyFocused = document.activeElement
    if (
      previouslyFocused instanceof HTMLElement &&
      !detailPanel.current?.contains(previouslyFocused)
    ) {
      returnFocusTo.current = previouslyFocused
    }
    closeDetailsButton.current?.focus()
  }, [trial.id])

  // On close, restore focus to the trial that opened the panel when it still exists.
  useEffect(() => {
    return () => {
      const previous = returnFocusTo.current
      if (previous?.isConnected) {
        previous.focus()
      }
    }
  }, [])

  // Escape dismisses the non-modal detail panel, but not the Add Note dialog.
  useEffect(() => {
    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key !== 'Escape' || noteDialog.current?.open) return
      event.preventDefault()
      onClose()
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  function activateTab(tab: DetailTab, focus = false) {
    setActiveTab(tab)
    if (focus) {
      tabRefs.current[detailTabs.indexOf(tab)]?.focus()
    }
  }

  function handleTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) {
    let nextIndex: number | undefined

    if (event.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + detailTabs.length) % detailTabs.length
    } else if (event.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % detailTabs.length
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = detailTabs.length - 1
    }

    if (nextIndex !== undefined) {
      event.preventDefault()
      activateTab(detailTabs[nextIndex], true)
    }
  }

  function openNoteDialog() {
    setNoteText('')
    setNoteError(null)
    noteDialog.current?.showModal()
    window.requestAnimationFrame(() => noteTextarea.current?.focus())
  }

  function closeNoteDialog() {
    if (!isSavingNote) noteDialog.current?.close()
  }

  function handleNoteDialogClosed() {
    setNoteText('')
    setNoteError(null)
    window.requestAnimationFrame(() => addNoteButton.current?.focus())
  }

  async function saveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSavingNote) return

    const normalizedText = noteText.trim()
    if (!normalizedText) {
      setNoteError('Enter a note before saving.')
      noteTextarea.current?.focus()
      return
    }

    setIsSavingNote(true)
    setNoteError(null)
    setActionMessage(null)

    try {
      await onAddReviewNote(trial.id, normalizedText)
      setActionMessage({ type: 'success', text: 'Review note added.' })
      setActiveTab('activity')
      noteDialog.current?.close()
    } catch (error: unknown) {
      setNoteError(
        error instanceof Error
          ? error.message
          : 'The review note could not be saved.',
      )
    } finally {
      setIsSavingNote(false)
    }
  }

  async function completeReview() {
    if (isReviewComplete || isCompleting || isSavingNote) return

    setIsCompleting(true)
    setActionMessage(null)

    try {
      await onCompleteReview(trial.id)
      setActionMessage({ type: 'success', text: 'Review marked complete.' })
    } catch (error: unknown) {
      setActionMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'The review could not be completed.',
      })
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <>
      <aside
        ref={detailPanel}
        aria-labelledby={`${instanceId}-trial-detail-title`}
        className={`flex min-h-0 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-panel)] ${className}`}
      >
        <div className="flex min-h-0 w-full flex-col">
          <header className="relative shrink-0 overflow-hidden border-b border-violet-100 bg-gradient-to-br from-violet-50 via-white to-indigo-50 px-6 py-6">
            <div
              aria-hidden="true"
              className="absolute -right-8 -top-10 size-28 rounded-full bg-violet-200/35 blur-2xl"
            />
            <div className="relative flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[var(--color-violet-100)] px-2.5 py-1 text-xs font-bold text-[var(--color-violet-700)]">
                    {trial.id}
                  </span>
                  <StatusBadge variant={studyStatusVariants[trial.studyStatus]}>
                    {studyStatusLabels[trial.studyStatus]}
                  </StatusBadge>
                </div>
                <h2
                  className="mt-4 text-[1.375rem] font-bold leading-snug tracking-tight text-[var(--color-text)]"
                  id={`${instanceId}-trial-detail-title`}
                >
                  {trial.title}
                </h2>
              </div>
              <button
                aria-label="Close trial details"
                className="grid size-10 shrink-0 place-items-center rounded-xl border border-violet-100 bg-white/90 text-[var(--color-text-muted)] shadow-sm hover:border-violet-200 hover:bg-white hover:text-[var(--color-text)]"
                onClick={onClose}
                ref={closeDetailsButton}
                type="button"
              >
                <X aria-hidden="true" size={20} />
              </button>
            </div>

            <div className="relative mt-5 grid grid-cols-2 gap-x-3 gap-y-3 text-sm text-[var(--color-text-muted)]">
              <span className="flex items-center gap-2">
                <Building2 aria-hidden="true" size={18} />
                {trial.phase}
              </span>
              <span className="flex items-center gap-2">
                <MapPin aria-hidden="true" size={18} />
                {trial.siteCount} sites
              </span>
              <span className="col-span-2 flex items-center gap-2">
                <CalendarDays aria-hidden="true" size={18} />
                Est. completion {formatDate(trial.estimatedCompletionDate)}
              </span>
            </div>
          </header>

          <div
            aria-label="Trial detail sections"
            className="flex shrink-0 border-b border-[var(--color-border)] px-3"
            role="tablist"
          >
            {detailTabs.map((tab, index) => {
              const isActive = activeTab === tab
              return (
                <button
                  aria-controls={`${instanceId}-${tab}-panel`}
                  aria-selected={isActive}
                  className={`relative min-w-0 flex-1 px-1 py-3.5 text-[13px] font-semibold ${
                    isActive
                      ? 'text-[var(--color-violet-700)] after:absolute after:inset-x-1 after:bottom-0 after:h-0.5 after:rounded-full after:bg-[var(--color-violet-600)]'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                  }`}
                  id={`${instanceId}-${tab}-tab`}
                  key={tab}
                  onClick={() => activateTab(tab)}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                  ref={(element) => {
                    tabRefs.current[index] = element
                  }}
                  role="tab"
                  tabIndex={isActive ? 0 : -1}
                  type="button"
                >
                  {detailTabLabels[tab]}
                </button>
              )
            })}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            <div
              aria-labelledby={`${instanceId}-overview-tab`}
              hidden={activeTab !== 'overview'}
              id={`${instanceId}-overview-panel`}
              role="tabpanel"
              tabIndex={0}
            >
              <OverviewTab instanceId={instanceId} trial={trial} />
            </div>

            <div
              aria-labelledby={`${instanceId}-sites-tab`}
              hidden={activeTab !== 'sites'}
              id={`${instanceId}-sites-panel`}
              role="tabpanel"
              tabIndex={0}
            >
              <EmptyState
                className="px-2 py-8"
                description={`${trial.siteCount} ${trial.siteCount === 1 ? 'site is' : 'sites are'} associated with this study. Site-level records are not included in the demonstration dataset.`}
                icon={<MapPin aria-hidden="true" size={22} />}
                title="Site details unavailable"
              />
            </div>

            <div
              aria-labelledby={`${instanceId}-documents-tab`}
              hidden={activeTab !== 'documents'}
              id={`${instanceId}-documents-panel`}
              role="tabpanel"
              tabIndex={0}
            >
              <EmptyState
                className="px-2 py-8"
                description="No documents available for this study."
                icon={<FileText aria-hidden="true" size={22} />}
                title="No documents"
              />
            </div>

            <div
              aria-labelledby={`${instanceId}-activity-tab`}
              hidden={activeTab !== 'activity'}
              id={`${instanceId}-activity-panel`}
              role="tabpanel"
              tabIndex={0}
            >
              <ActivityTab instanceId={instanceId} trial={trial} />
            </div>
          </div>

          <footer className="shrink-0 border-t border-[var(--color-border)] bg-white px-5 py-4">
            {actionMessage ? (
              <p
                className={`mb-3 rounded-lg px-3 py-2 text-xs font-medium ${
                  actionMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'bg-rose-50 text-rose-800'
                }`}
                role={actionMessage.type === 'error' ? 'alert' : 'status'}
              >
                {actionMessage.text}
              </p>
            ) : null}
            <div className="grid grid-cols-1 gap-2.5 min-[390px]:grid-cols-[minmax(0,0.75fr)_minmax(0,1.35fr)]">
              <button
                className="inline-flex h-12 min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border border-[#7045F5] bg-white px-3 py-2 text-sm font-semibold text-[#5B2DDA] shadow-[0_1px_3px_rgb(75_22_204_/_0.08)] transition-colors hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSavingNote || isCompleting}
                onClick={openNoteDialog}
                ref={addNoteButton}
                type="button"
              >
                <MessageSquarePlus aria-hidden="true" className="shrink-0" size={18} strokeWidth={2} />
                Add Note
              </button>
              <button
                className="inline-flex h-12 min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border border-transparent bg-[linear-gradient(135deg,#7045F5_0%,#4B16CC_100%)] px-3 py-2 text-sm font-semibold text-white shadow-[0_4px_10px_rgb(75_22_204_/_0.2)] transition-[filter,box-shadow] hover:brightness-105 hover:shadow-[0_5px_12px_rgb(75_22_204_/_0.24)] disabled:cursor-not-allowed disabled:bg-none disabled:bg-slate-300 disabled:text-slate-600 disabled:shadow-none"
                disabled={isReviewComplete || isCompleting || isSavingNote}
                onClick={() => void completeReview()}
                type="button"
              >
                <CheckCircle2 aria-hidden="true" className="shrink-0" size={18} strokeWidth={2} />
                {isCompleting
                  ? 'Completing…'
                  : isReviewComplete
                    ? 'Completed'
                    : 'Mark Review Complete'}
              </button>
            </div>
          </footer>
        </div>
      </aside>

      <dialog
        aria-describedby={`${instanceId}-note-dialog-description`}
        aria-labelledby={`${instanceId}-note-dialog-title`}
        className="m-auto w-[min(30rem,calc(100%-2rem))] max-w-none rounded-2xl border border-[var(--color-border)] bg-white p-0 shadow-[var(--shadow-panel)] backdrop:bg-slate-950/55"
        onCancel={(event) => {
          if (isSavingNote) event.preventDefault()
        }}
        onClose={handleNoteDialogClosed}
        ref={noteDialog}
      >
        <form onSubmit={(event) => void saveNote(event)}>
          <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] p-5">
            <div>
              <h2 className="font-bold text-[var(--color-text)]" id={`${instanceId}-note-dialog-title`}>
                Add review note
              </h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]" id={`${instanceId}-note-dialog-description`}>
                Add an activity note for {trial.id}.
              </p>
            </div>
            <button
              aria-label="Close add note dialog"
              className="grid size-10 shrink-0 place-items-center rounded-xl text-[var(--color-text-muted)] hover:bg-slate-100 hover:text-[var(--color-text)]"
              disabled={isSavingNote}
              onClick={closeNoteDialog}
              type="button"
            >
              <X aria-hidden="true" size={18} />
            </button>
          </div>

          <div className="p-5">
            <label className="text-sm font-semibold text-[var(--color-text)]" htmlFor={`${instanceId}-note-text`}>
              Note
            </label>
            <textarea
              aria-describedby={noteError ? `${instanceId}-note-error` : undefined}
              aria-invalid={noteError ? 'true' : undefined}
              className="mt-2 min-h-32 w-full resize-y rounded-xl border border-[var(--color-border-strong)] bg-white px-3 py-2.5 text-sm leading-6 text-[var(--color-text)] shadow-sm placeholder:text-slate-500"
              disabled={isSavingNote}
              id={`${instanceId}-note-text`}
              maxLength={1000}
              onChange={(event) => {
                setNoteText(event.target.value)
                if (noteError) setNoteError(null)
              }}
              placeholder="Enter a concise review note"
              ref={noteTextarea}
              value={noteText}
            />
            <div className="mt-1 flex min-h-5 items-start justify-between gap-3">
              {noteError ? (
                <p className="text-xs font-medium text-rose-700" id={`${instanceId}-note-error`} role="alert">
                  {noteError}
                </p>
              ) : (
                <span />
              )}
              <span className="shrink-0 text-xs text-[var(--color-text-muted)]">
                {noteText.length}/1000
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-5 py-4">
            <button
              className="min-h-10 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-text)] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSavingNote}
              onClick={closeNoteDialog}
              type="button"
            >
              Cancel
            </button>
            <button
              aria-busy={isSavingNote}
              className="min-h-10 rounded-[var(--radius-md)] border border-transparent bg-[var(--color-violet-700)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-violet-600)] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSavingNote}
              type="submit"
            >
              {isSavingNote ? 'Saving…' : 'Save Note'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}

function OverviewTab({
  instanceId,
  trial,
}: {
  instanceId: string
  trial: ClinicalTrial
}) {
  return (
    <div>
      <section aria-labelledby={`${instanceId}-summary-heading`}>
        <h3 className="text-sm font-bold text-[var(--color-text)]" id={`${instanceId}-summary-heading`}>
          Study summary
        </h3>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{trial.summary}</p>
      </section>

      <section aria-labelledby={`${instanceId}-key-details-heading`} className="mt-5">
        <h3 className="text-sm font-bold text-[var(--color-text)]" id={`${instanceId}-key-details-heading`}>
          Key details
        </h3>
        <dl className="mt-2 divide-y divide-[var(--color-border)] overflow-hidden rounded-xl border border-[var(--color-border)]">
          <DetailRow label="Indication" value={trial.indication} />
          <DetailRow label="Sponsor" value={trial.sponsor} />
          <DetailRow label="Population" value={`${trial.participantCount.toLocaleString()} participants`} />
          <DetailRow
            label="Study status"
            value={
              <StatusBadge variant={studyStatusVariants[trial.studyStatus]}>
                {studyStatusLabels[trial.studyStatus]}
              </StatusBadge>
            }
          />
          <DetailRow
            label="Review status"
            value={
              <StatusBadge variant={reviewStatusVariants[trial.reviewStatus]}>
                {reviewStatusLabels[trial.reviewStatus]}
              </StatusBadge>
            }
          />
          <DetailRow label="Priority" value={<span className="capitalize">{trial.reviewPriority}</span>} />
          <DetailRow label="Review due" value={formatDate(trial.reviewDueDate)} />
        </dl>
      </section>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[6.25rem_1fr] items-center gap-2 px-3 py-2.5 text-sm">
      <dt className="text-[var(--color-text-muted)]">{label}</dt>
      <dd className="font-medium text-[var(--color-text)]">{value}</dd>
    </div>
  )
}

function ActivityTab({
  instanceId,
  trial,
}: {
  instanceId: string
  trial: ClinicalTrial
}) {
  if (trial.reviewNotes.length === 0) {
    return (
      <EmptyState
        className="px-2 py-8"
        description="Add a review note to start the activity history for this study."
        icon={<ClipboardList aria-hidden="true" size={22} />}
        title="No review activity"
      />
    )
  }

  return (
    <section aria-labelledby={`${instanceId}-activity-heading`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-[var(--color-text)]" id={`${instanceId}-activity-heading`}>
          Review activity
        </h3>
        <span className="text-xs text-[var(--color-text-muted)]">
          {trial.reviewNotes.length} {trial.reviewNotes.length === 1 ? 'note' : 'notes'}
        </span>
      </div>
      <ol className="mt-3 space-y-3">
        {[...trial.reviewNotes].reverse().map((note) => (
          <li className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-3" key={note.id}>
            <p className="text-sm leading-6 text-[var(--color-text)]">{note.text}</p>
            <time className="mt-2 block text-xs text-[var(--color-text-muted)]" dateTime={note.createdAt}>
              {formatDateTime(note.createdAt)}
            </time>
          </li>
        ))}
      </ol>
    </section>
  )
}

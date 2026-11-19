import type {
  ClinicalTrial,
  TrialFilters,
  TrialMetrics,
  TrialPhase,
  TrialSort,
} from '../types'

const phaseOrder: Record<TrialPhase, number> = {
  'Phase I': 1,
  'Phase II': 2,
  'Phase III': 3,
  'Phase IV': 4,
}

const priorityOrder: Record<ClinicalTrial['reviewPriority'], number> = {
  high: 1,
  medium: 2,
  low: 3,
}

function normalizeText(value: string) {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, ' ')
}

function includesSelected<T>(value: T, selected?: readonly T[]) {
  return !selected?.length || selected.includes(value)
}

/**
 * Metric rules:
 * - Active trials: study status is active or recruiting.
 * - Needs review: review status is needs-review.
 * - At risk: review is incomplete and either overdue or high priority.
 * - Completed reviews: review status is completed, regardless of study status.
 *
 * The caller supplies the ISO reference date so this selector stays deterministic.
 */
export function getTrialMetrics(
  trials: readonly ClinicalTrial[],
  referenceDate: string,
): TrialMetrics {
  const referenceDay = referenceDate.slice(0, 10)

  return trials.reduce<TrialMetrics>(
    (metrics, trial) => {
      const reviewIsIncomplete = trial.reviewStatus !== 'completed'
      const reviewIsOverdue = trial.reviewDueDate.slice(0, 10) < referenceDay

      if (trial.studyStatus === 'active' || trial.studyStatus === 'recruiting') {
        metrics.activeTrials += 1
      }
      if (trial.reviewStatus === 'needs-review') {
        metrics.needsReview += 1
      }
      if (
        reviewIsIncomplete &&
        (reviewIsOverdue || trial.reviewPriority === 'high')
      ) {
        metrics.atRiskReviews += 1
      }
      if (trial.reviewStatus === 'completed') {
        metrics.completedReviews += 1
      }

      return metrics
    },
    {
      activeTrials: 0,
      needsReview: 0,
      atRiskReviews: 0,
      completedReviews: 0,
    },
  )
}

export function filterTrials(
  trials: readonly ClinicalTrial[],
  filters: TrialFilters,
): ClinicalTrial[] {
  return trials.filter(
    (trial) =>
      includesSelected(trial.phase, filters.phases) &&
      includesSelected(trial.studyStatus, filters.studyStatuses) &&
      includesSelected(trial.reviewStatus, filters.reviewStatuses) &&
      includesSelected(trial.reviewPriority, filters.reviewPriorities),
  )
}

export function searchTrials(
  trials: readonly ClinicalTrial[],
  query: string,
): ClinicalTrial[] {
  const normalizedQuery = normalizeText(query)

  if (!normalizedQuery) {
    return [...trials]
  }

  return trials.filter((trial) =>
    [trial.id, trial.title, trial.indication, trial.sponsor]
      .map(normalizeText)
      .some((value) => value.includes(normalizedQuery)),
  )
}

function compareTrials(
  first: ClinicalTrial,
  second: ClinicalTrial,
  field: TrialSort['field'],
) {
  if (field === 'siteCount') {
    return first.siteCount - second.siteCount
  }
  if (field === 'phase') {
    return phaseOrder[first.phase] - phaseOrder[second.phase]
  }
  if (field === 'reviewPriority') {
    return priorityOrder[first.reviewPriority] - priorityOrder[second.reviewPriority]
  }

  return first[field].localeCompare(second[field], undefined, {
    numeric: true,
    sensitivity: 'base',
  })
}

export function sortTrials(
  trials: readonly ClinicalTrial[],
  sort: TrialSort,
): ClinicalTrial[] {
  const direction = sort.direction === 'asc' ? 1 : -1

  return trials
    .map((trial, originalIndex) => ({ originalIndex, trial }))
    .sort((first, second) => {
      const comparison = compareTrials(first.trial, second.trial, sort.field)
      return comparison === 0
        ? first.originalIndex - second.originalIndex
        : comparison * direction
    })
    .map(({ trial }) => trial)
}

export function getTrialById(
  trials: readonly ClinicalTrial[],
  trialId: string,
): ClinicalTrial | undefined {
  const normalizedId = normalizeText(trialId)
  return trials.find((trial) => normalizeText(trial.id) === normalizedId)
}

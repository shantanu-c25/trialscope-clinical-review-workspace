
import { describe, expect, it } from 'vitest'
import type {
  ClinicalTrial,
  TrialFilters,
  TrialSort,
} from '../types'
import {
  filterTrials,
  getTrialById,
  getTrialMetrics,
  searchTrials,
  sortTrials,
} from './trialSelectors'

// Test fixtures: only selector-relevant fields are varied.
// The remaining fields are populated by the shared fixture.
const makeTrial = (
  overrides: Partial<ClinicalTrial> = {},
): ClinicalTrial =>
  ({
    id: 'TS-1001',
    title: 'Cardiac Outcomes Study',
    indication: 'Heart Failure',
    sponsor: 'Northstar Research',
    phase: 'Phase II',
    siteCount: 10,
    studyStatus: 'active',
    reviewStatus: 'needs-review',
    reviewPriority: 'medium',
    reviewDueDate: '2026-11-18',
    lastUpdated: '2026-11-17',
    ...overrides,
  }) as ClinicalTrial

const trials: ClinicalTrial[] = [
  makeTrial(),
  makeTrial({
    id: 'TS-1002',
    title: 'Migraine Prevention Trial',
    indication: 'Chronic Migraine',
    sponsor: 'Summit Therapeutics',
    phase: 'Phase III',
    siteCount: 25,
    studyStatus: 'recruiting',
    reviewStatus: 'in-progress',
    reviewPriority: 'high',
    reviewDueDate: '2026-11-25',
  }),
  makeTrial({
    id: 'TS-1003',
    title: 'Diabetes Safety Study',
    indication: 'Type 2 Diabetes',
    sponsor: 'Cedar Labs',
    phase: 'Phase I',
    siteCount: 5,
    studyStatus: 'completed',
    reviewStatus: 'completed',
    reviewPriority: 'low',
    reviewDueDate: '2026-11-10',
  }),
]

describe('searchTrials', () => {
  it('matches trial IDs regardless of case', () => {
    expect(searchTrials(trials, 'ts-1002')).toHaveLength(1)
  })

  it('searches title, indication, and sponsor', () => {
    expect(searchTrials(trials, 'migraine')[0].id).toBe('TS-1002')
    expect(searchTrials(trials, 'heart failure')[0].id).toBe('TS-1001')
    expect(searchTrials(trials, 'cedar labs')[0].id).toBe('TS-1003')
  })

  it('normalizes surrounding whitespace and case', () => {
    expect(searchTrials(trials, '  HEART   FAILURE  ')).toHaveLength(1)
  })

  it('returns all trials for an empty query', () => {
    expect(searchTrials(trials, '  ')).toHaveLength(3)
  })

  it('returns an empty array when nothing matches', () => {
    expect(searchTrials(trials, 'unknown condition')).toEqual([])
  })
})

describe('filterTrials', () => {
  it('filters by phase', () => {
    const filters: TrialFilters = { phases: ['Phase III'] }
    expect(filterTrials(trials, filters).map((t) => t.id)).toEqual([
      'TS-1002',
    ])
  })

  it('filters by study status', () => {
    const filters: TrialFilters = {
      studyStatuses: ['completed'],
    }
    expect(filterTrials(trials, filters)[0].id).toBe('TS-1003')
  })

  it('filters by review status', () => {
    const filters: TrialFilters = {
      reviewStatuses: ['needs-review'],
    }
    expect(filterTrials(trials, filters)[0].id).toBe('TS-1001')
  })

  it('combines multiple filters', () => {
    const filters: TrialFilters = {
      phases: ['Phase III'],
      reviewPriorities: ['high'],
      reviewStatuses: ['in-progress'],
    }
    expect(filterTrials(trials, filters).map((t) => t.id)).toEqual([
      'TS-1002',
    ])
  })

  it('returns all trials with no selected filters', () => {
    expect(filterTrials(trials, {})).toHaveLength(3)
  })
})

describe('sortTrials', () => {
  it('sorts site count ascending', () => {
    const sort: TrialSort = {
      field: 'siteCount',
      direction: 'asc',
    }
    expect(sortTrials(trials, sort).map((t) => t.id)).toEqual([
      'TS-1003',
      'TS-1001',
      'TS-1002',
    ])
  })

  it('sorts phase by clinical order', () => {
    const sort: TrialSort = {
      field: 'phase',
      direction: 'asc',
    }
    expect(sortTrials(trials, sort).map((t) => t.id)).toEqual([
      'TS-1003',
      'TS-1001',
      'TS-1002',
    ])
  })

  it('sorts review priority with high first', () => {
    const sort: TrialSort = {
      field: 'reviewPriority',
      direction: 'asc',
    }
    expect(sortTrials(trials, sort)[0].id).toBe('TS-1002')
  })

  it('does not mutate the original trial array', () => {
    const originalOrder = trials.map((t) => t.id)
    sortTrials(trials, {
      field: 'siteCount',
      direction: 'desc',
    })
    expect(trials.map((t) => t.id)).toEqual(originalOrder)
  })
})

describe('getTrialMetrics', () => {
  it('calculates metrics from study and review states', () => {
    expect(getTrialMetrics(trials, '2026-11-19')).toEqual({
      activeTrials: 2,
      needsReview: 1,
      atRiskReviews: 2,
      completedReviews: 1,
    })
  })

  it('excludes completed reviews from at-risk counts', () => {
    const completed = makeTrial({
      reviewStatus: 'completed',
      reviewPriority: 'high',
      reviewDueDate: '2026-01-01',
    })

    expect(
      getTrialMetrics([completed], '2026-11-19').atRiskReviews,
    ).toBe(0)
  })

  it('does not count a review due today as overdue', () => {
    const dueToday = makeTrial({
      reviewPriority: 'low',
      reviewDueDate: '2026-11-19',
    })

    expect(
      getTrialMetrics([dueToday], '2026-11-19').atRiskReviews,
    ).toBe(0)
  })
})

describe('getTrialById', () => {
  it('finds a trial using a case-insensitive ID', () => {
    expect(getTrialById(trials, ' ts-1002 ')?.id).toBe('TS-1002')
  })

  it('returns undefined for a missing trial', () => {
    expect(getTrialById(trials, 'TS-9999')).toBeUndefined()
  })
})

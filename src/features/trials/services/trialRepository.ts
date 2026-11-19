import { mockTrials } from '../../../data/mockTrials'
import type {
  ClinicalTrial,
  ReviewNote,
  ReviewPriority,
  ReviewStatus,
  StudyStatus,
  TrialPhase,
} from '../types'

const STORAGE_KEY = 'trialscope.trials.v1'
const LOAD_DELAY_MS = 450
const UPDATE_DELAY_MS = 250

const studyStatuses = new Set<StudyStatus>([
  'active',
  'recruiting',
  'completed',
  'paused',
])
const reviewStatuses = new Set<ReviewStatus>([
  'needs-review',
  'in-progress',
  'completed',
])
const reviewPriorities = new Set<ReviewPriority>(['high', 'medium', 'low'])
const trialPhases = new Set<TrialPhase>([
  'Phase I',
  'Phase II',
  'Phase III',
  'Phase IV',
])

let memoryTrials = cloneTrials(mockTrials)

export interface GetTrialsOptions {
  /** Throws once for this call only, allowing the UI to demonstrate a retry. */
  simulateFailure?: boolean
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => globalThis.setTimeout(resolve, milliseconds))
}

function cloneTrial(trial: ClinicalTrial): ClinicalTrial {
  return {
    ...trial,
    reviewNotes: trial.reviewNotes.map((note) => ({ ...note })),
  }
}

function cloneTrials(trials: readonly ClinicalTrial[]) {
  return trials.map(cloneTrial)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value))
}

function isReviewNote(value: unknown): value is ReviewNote {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.text === 'string' &&
    isIsoDate(value.createdAt)
  )
}

function isClinicalTrial(value: unknown): value is ClinicalTrial {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.indication === 'string' &&
    trialPhases.has(value.phase as TrialPhase) &&
    typeof value.siteCount === 'number' &&
    Number.isInteger(value.siteCount) &&
    value.siteCount >= 0 &&
    studyStatuses.has(value.studyStatus as StudyStatus) &&
    reviewStatuses.has(value.reviewStatus as ReviewStatus) &&
    reviewPriorities.has(value.reviewPriority as ReviewPriority) &&
    isIsoDate(value.reviewDueDate) &&
    isIsoDate(value.lastUpdated) &&
    isIsoDate(value.estimatedCompletionDate) &&
    typeof value.sponsor === 'string' &&
    typeof value.participantCount === 'number' &&
    Number.isInteger(value.participantCount) &&
    value.participantCount >= 0 &&
    typeof value.summary === 'string' &&
    Array.isArray(value.reviewNotes) &&
    value.reviewNotes.every(isReviewNote)
  )
}

function getStorage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage
  } catch {
    return undefined
  }
}

function readTrials(): ClinicalTrial[] {
  const storage = getStorage()

  if (!storage) {
    return cloneTrials(memoryTrials)
  }

  try {
    const storedValue = storage.getItem(STORAGE_KEY)
    if (!storedValue) {
      return cloneTrials(mockTrials)
    }

    const parsedValue: unknown = JSON.parse(storedValue)
    if (Array.isArray(parsedValue) && parsedValue.every(isClinicalTrial)) {
      return cloneTrials(parsedValue)
    }

    storage.removeItem(STORAGE_KEY)
  } catch {
    try {
      storage.removeItem(STORAGE_KEY)
    } catch {
      // Storage may be readable but not writable in restricted browser modes.
    }
  }

  return cloneTrials(mockTrials)
}

function persistTrials(trials: readonly ClinicalTrial[]) {
  memoryTrials = cloneTrials(trials)

  try {
    getStorage()?.setItem(STORAGE_KEY, JSON.stringify(trials))
  } catch {
    // The in-memory copy keeps the mock repository usable when storage is blocked.
  }
}

function createNoteId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

async function updateTrial(
  trialId: string,
  update: (trial: ClinicalTrial) => ClinicalTrial,
): Promise<ClinicalTrial> {
  await wait(UPDATE_DELAY_MS)

  const trials = readTrials()
  const trialIndex = trials.findIndex((trial) => trial.id === trialId)

  if (trialIndex === -1) {
    throw new Error(`Trial "${trialId}" was not found.`)
  }

  const updatedTrial = update(trials[trialIndex])
  const updatedTrials = trials.map((trial, index) =>
    index === trialIndex ? updatedTrial : trial,
  )
  persistTrials(updatedTrials)

  return cloneTrial(updatedTrial)
}

async function getTrials(
  options: GetTrialsOptions = {},
): Promise<ClinicalTrial[]> {
  await wait(LOAD_DELAY_MS)

  if (options.simulateFailure) {
    throw new Error('Trial data could not be loaded. Please retry.')
  }

  return readTrials()
}

async function completeReview(trialId: string): Promise<ClinicalTrial> {
  return updateTrial(trialId, (trial) => ({
    ...trial,
    reviewStatus: 'completed',
    lastUpdated: new Date().toISOString(),
  }))
}

async function addReviewNote(
  trialId: string,
  noteText: string,
): Promise<ClinicalTrial> {
  const normalizedText = noteText.trim()

  if (!normalizedText) {
    throw new Error('Review note text is required.')
  }

  return updateTrial(trialId, (trial) => ({
    ...trial,
    lastUpdated: new Date().toISOString(),
    reviewNotes: [
      ...trial.reviewNotes,
      {
        id: createNoteId(),
        text: normalizedText,
        createdAt: new Date().toISOString(),
      },
    ],
  }))
}

export const trialRepository = {
  getTrials,
  completeReview,
  addReviewNote,
}

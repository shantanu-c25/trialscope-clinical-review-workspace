
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockTrials } from '../../../data/mockTrials'
import { trialRepository } from './trialRepository'

const STORAGE_KEY = 'trialscope.trials.v1'

const storage = new Map<string, string>()

const localStorageMock = {
  getItem: vi.fn((key: string) => storage.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => {
    storage.set(key, value)
  }),
  removeItem: vi.fn((key: string) => {
    storage.delete(key)
  }),
  clear: vi.fn(() => {
    storage.clear()
  }),
  key: vi.fn((index: number) => [...storage.keys()][index] ?? null),
  get length() {
    return storage.size
  },
}

beforeEach(() => {
  vi.useRealTimers()
  storage.clear()

  vi.stubGlobal('window', {
    localStorage: localStorageMock,
  })

  vi.clearAllMocks()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('trialRepository', () => {
  it('loads the initial trial dataset', async () => {
    const trials = await trialRepository.getTrials()

    expect(trials).toHaveLength(mockTrials.length)
    expect(trials[0].id).toBe(mockTrials[0].id)
  })

  it('supports a simulated loading failure and retry', async () => {
    await expect(
      trialRepository.getTrials({ simulateFailure: true }),
    ).rejects.toThrow('Trial data could not be loaded')

    const trials = await trialRepository.getTrials()

    expect(trials).toHaveLength(mockTrials.length)
  })

  it('marks a review completed and persists the update', async () => {
    const trialId = mockTrials[0].id

    const updated = await trialRepository.completeReview(trialId)

    expect(updated.reviewStatus).toBe('completed')

    const persisted = JSON.parse(storage.get(STORAGE_KEY) ?? '[]')

    expect(
      persisted.find((trial: { id: string }) => trial.id === trialId)
        .reviewStatus,
    ).toBe('completed')

    const reloaded = await trialRepository.getTrials()

    expect(
      reloaded.find((trial) => trial.id === trialId)?.reviewStatus,
    ).toBe('completed')
  })

  it('adds a trimmed note and persists it', async () => {
    const trialId = mockTrials[0].id

    const updated = await trialRepository.addReviewNote(
      trialId,
      '  Follow up with the study coordinator.  ',
    )

    expect(updated.reviewNotes.at(-1)?.text).toBe(
      'Follow up with the study coordinator.',
    )

    const reloaded = await trialRepository.getTrials()
    const trial = reloaded.find((item) => item.id === trialId)

    expect(trial?.reviewNotes.at(-1)?.text).toBe(
      'Follow up with the study coordinator.',
    )
  })

  it('rejects an empty review note', async () => {
    await expect(
      trialRepository.addReviewNote(mockTrials[0].id, '   '),
    ).rejects.toThrow('Review note text is required')
  })

  it('rejects updates to an unknown trial', async () => {
    await expect(
      trialRepository.completeReview('TS-UNKNOWN'),
    ).rejects.toThrow('was not found')
  })

  it('recovers from invalid stored data', async () => {
    storage.set(STORAGE_KEY, '{invalid-json')

    const trials = await trialRepository.getTrials()

    expect(trials).toHaveLength(mockTrials.length)
    expect(storage.has(STORAGE_KEY)).toBe(false)
  })

  it('returns independent copies of the trial data', async () => {
    const first = await trialRepository.getTrials()
    const second = await trialRepository.getTrials()

    expect(first).not.toBe(second)
    expect(first[0]).not.toBe(second[0])
    expect(first[0].reviewNotes).not.toBe(second[0].reviewNotes)
  })
})

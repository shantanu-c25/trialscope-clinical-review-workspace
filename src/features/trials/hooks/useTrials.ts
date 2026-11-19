import { useCallback, useEffect, useRef, useState } from 'react'
import { trialRepository } from '../services/trialRepository'
import type { ClinicalTrial } from '../types'

type TrialsLoadStatus = 'loading' | 'success' | 'error'

interface TrialsState {
  trials: ClinicalTrial[]
  status: TrialsLoadStatus
  error: string | null
}

let pendingTrialsRequest: Promise<ClinicalTrial[]> | null = null

function requestTrials() {
  if (!pendingTrialsRequest) {
    const request = trialRepository.getTrials()
    pendingTrialsRequest = request
    void request.then(
      () => {
        if (pendingTrialsRequest === request) pendingTrialsRequest = null
      },
      () => {
        if (pendingTrialsRequest === request) pendingTrialsRequest = null
      },
    )
  }

  return pendingTrialsRequest
}

export function useTrials() {
  const [reloadKey, setReloadKey] = useState(0)
  const requestSequence = useRef(0)
  const [state, setState] = useState<TrialsState>({
    trials: [],
    status: 'loading',
    error: null,
  })

  useEffect(() => {
    const requestId = ++requestSequence.current
    let isCurrent = true

    void requestTrials().then(
      (trials) => {
        if (isCurrent && requestId === requestSequence.current) {
          setState({ trials, status: 'success', error: null })
        }
      },
      (error: unknown) => {
        if (isCurrent && requestId === requestSequence.current) {
          setState({
            trials: [],
            status: 'error',
            error:
              error instanceof Error
                ? error.message
                : 'Trial data could not be loaded.',
          })
        }
      },
    )

    return () => {
      isCurrent = false
    }
  }, [reloadKey])

  const retry = useCallback(() => {
    setState((current) => ({ ...current, status: 'loading', error: null }))
    setReloadKey((key) => key + 1)
  }, [])

  const replaceTrial = useCallback((updatedTrial: ClinicalTrial) => {
    setState((current) => ({
      ...current,
      trials: current.trials.map((trial) =>
        trial.id === updatedTrial.id ? updatedTrial : trial,
      ),
    }))
  }, [])

  const completeReview = useCallback(
    async (trialId: string) => {
      const updatedTrial = await trialRepository.completeReview(trialId)
      replaceTrial(updatedTrial)
      return updatedTrial
    },
    [replaceTrial],
  )

  const addReviewNote = useCallback(
    async (trialId: string, noteText: string) => {
      const updatedTrial = await trialRepository.addReviewNote(trialId, noteText)
      replaceTrial(updatedTrial)
      return updatedTrial
    },
    [replaceTrial],
  )

  return { ...state, retry, completeReview, addReviewNote }
}

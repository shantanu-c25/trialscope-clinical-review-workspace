import { useMemo, useState } from 'react'
import { TrialDashboard } from '../features/trials/components/TrialDashboard'
import { useTrials } from '../features/trials/hooks/useTrials'
import { getTrialMetrics } from '../features/trials/utils/trialSelectors'
import { AppLayout, type WorkspaceView } from './AppLayout'

function App() {
  const {
    trials,
    status,
    error,
    retry,
    completeReview,
    addReviewNote,
  } = useTrials()
  const [activeView, setActiveView] = useState<WorkspaceView>('overview')
  const [referenceDate] = useState(() => new Date().toISOString())
  const metrics = useMemo(
    () => getTrialMetrics(trials, referenceDate),
    [referenceDate, trials],
  )

  return (
    <AppLayout
      activeView={activeView}
      attentionCount={metrics.atRiskReviews}
      needsReviewCount={metrics.needsReview}
      onViewChange={setActiveView}
      searchAvailable={status === 'success' && trials.length > 0}
    >
      <TrialDashboard
        addReviewNote={addReviewNote}
        completeReview={completeReview}
        error={error}
        metrics={metrics}
        onViewChange={setActiveView}
        retry={retry}
        status={status}
        trials={trials}
        view={activeView}
      />
    </AppLayout>
  )
}

export default App

export type StudyStatus = 'active' | 'recruiting' | 'completed' | 'paused'

export type ReviewStatus = 'needs-review' | 'in-progress' | 'completed'

export type ReviewPriority = 'high' | 'medium' | 'low'

export type TrialPhase = 'Phase I' | 'Phase II' | 'Phase III' | 'Phase IV'

export interface ReviewNote {
  id: string
  text: string
  createdAt: string
}

export interface ClinicalTrial {
  id: string
  title: string
  indication: string
  phase: TrialPhase
  siteCount: number
  studyStatus: StudyStatus
  reviewStatus: ReviewStatus
  reviewPriority: ReviewPriority
  reviewDueDate: string
  lastUpdated: string
  estimatedCompletionDate: string
  sponsor: string
  participantCount: number
  summary: string
  reviewNotes: ReviewNote[]
}

export interface TrialFilters {
  phases?: readonly TrialPhase[]
  studyStatuses?: readonly StudyStatus[]
  reviewStatuses?: readonly ReviewStatus[]
  reviewPriorities?: readonly ReviewPriority[]
}

export type TrialSortField =
  | 'id'
  | 'title'
  | 'indication'
  | 'phase'
  | 'siteCount'
  | 'studyStatus'
  | 'reviewStatus'
  | 'reviewPriority'
  | 'reviewDueDate'
  | 'lastUpdated'
  | 'estimatedCompletionDate'

export interface TrialSort {
  field: TrialSortField
  direction: 'asc' | 'desc'
}

export interface TrialMetrics {
  activeTrials: number
  needsReview: number
  atRiskReviews: number
  completedReviews: number
}

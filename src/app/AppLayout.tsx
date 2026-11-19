import { useEffect, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import {
  BarChart3,
  Bell,
  CircleHelp,
  ClipboardCheck,
  FlaskConical,
  LayoutDashboard,
  Leaf,
  Menu,
  Search,
  Settings,
  X,
} from 'lucide-react'
import { Button } from '../components/ui/Button'

export type WorkspaceView = 'overview' | 'trials' | 'reviews'

export interface AppLayoutProps {
  children: ReactNode
  activeView: WorkspaceView
  attentionCount: number
  needsReviewCount: number
  searchAvailable: boolean
  onViewChange: (view: WorkspaceView) => void
}

interface SidebarContentProps {
  activeView: WorkspaceView
  isCollapsed?: boolean
  needsReviewCount: number
  onViewChange: (view: WorkspaceView) => void
  onClose?: () => void
  onToggleCollapse?: () => void
}

interface NavigationItem {
  label: string
  icon: LucideIcon
  view?: WorkspaceView
}

const navigationItems: NavigationItem[] = [
  { label: 'Overview', icon: LayoutDashboard, view: 'overview' },
  { label: 'Trials', icon: FlaskConical, view: 'trials' },
  { label: 'My Reviews', icon: ClipboardCheck, view: 'reviews' },
  { label: 'Reports', icon: BarChart3 },
  { label: 'Settings', icon: Settings },
]

const SIDEBAR_STORAGE_KEY = 'trialscope.sidebar.collapsed'

function getStoredSidebarPreference() {
  try {
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function SidebarContent({
  activeView,
  isCollapsed = false,
  needsReviewCount,
  onViewChange,
  onClose,
  onToggleCollapse,
}: SidebarContentProps) {
  function selectView(view: WorkspaceView) {
    onViewChange(view)
    onClose?.()
  }

  return (
    <div
      className="flex h-full flex-col overflow-hidden bg-[var(--color-sidebar)] text-[var(--color-sidebar-text)]"
    >
      <div
        className={`flex min-h-28 shrink-0 items-center border-b border-white/10 ${isCollapsed ? 'flex-col justify-center gap-3 px-2' : 'justify-between px-5'
          }`}
      >
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <Leaf
            aria-hidden="true"
            className="shrink-0 rotate-[-18deg] text-teal-300"
            fill="currentColor"
            size={32}
            strokeWidth={1.8}
          />
          <div className={isCollapsed ? 'sr-only' : undefined}>
            <p className="text-xl font-bold tracking-tight">TrialScope</p>
            <p className="mt-1 text-xs text-[var(--color-sidebar-text-muted)]">Clinical Research</p>
          </div>
        </div>
        {onClose ? (
          <Button
            aria-label="Close navigation"
            className="size-11 shrink-0 rounded-xl border border-white/25 bg-white/15 p-0 text-white hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white [&_svg]:size-6 [&_svg]:stroke-[2.5]"
            onClick={onClose}
            variant="ghost"
          >
            <X
              aria-hidden="true"
              className="!size-6 !stroke-[2.5]"
            />
          </Button>
        ) : (
          <button
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="grid size-10 shrink-0 place-items-center rounded-lg text-[var(--color-sidebar-text-muted)] hover:bg-[var(--color-sidebar-hover)] hover:text-white focus-visible:outline-offset-[-2px]"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            type="button"
          >
            <Menu aria-hidden="true" size={20} />
          </button>
        )}
      </div>

      <nav aria-label="Primary navigation" className={`flex-1 py-6 ${isCollapsed ? 'px-2' : 'px-3'}`}>
        <p className={isCollapsed ? 'sr-only' : 'px-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-sidebar-text-disabled)]'}>
          Workspace
        </p>
        <ul className="mt-3 space-y-1.5">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = item.view === activeView
            const isDisabled = !item.view

            return (
              <li key={item.label}>
                <button
                  aria-label={isCollapsed ? item.label : undefined}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex min-h-11 w-full items-center rounded-xl border text-sm font-medium transition-colors ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-3 text-left'
                    } ${isActive
                      ? 'border-white/15 bg-[linear-gradient(110deg,var(--color-sidebar-active-start),var(--color-sidebar-active-end))] text-white shadow-sm'
                      : isDisabled
                        ? 'cursor-not-allowed border-transparent text-[var(--color-sidebar-text-disabled)]'
                        : 'border-transparent text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-hover)] hover:text-white'
                    }`}
                  disabled={isDisabled}
                  onClick={() => item.view && selectView(item.view)}
                  title={isCollapsed ? (isDisabled ? `${item.label} (coming soon)` : item.label) : isDisabled ? `${item.label} is an upcoming feature` : undefined}
                  type="button"
                >
                  <Icon aria-hidden="true" className="shrink-0" size={19} />
                  <span className={isCollapsed ? 'sr-only' : undefined}>{item.label}</span>
                  {item.view === 'reviews' && needsReviewCount > 0 ? (
                    <span
                      aria-label={`${needsReviewCount} reviews need attention`}
                      className={`${isCollapsed ? 'absolute -right-0.5 -top-1 min-w-5 px-1' : 'ml-auto px-2'} grid h-5 place-items-center rounded-full bg-[var(--color-sidebar-badge)] text-xs font-bold text-white`}
                    >
                      {needsReviewCount}
                    </span>
                  ) : null}
                  {isDisabled ? (
                    <span className={isCollapsed ? 'sr-only' : 'ml-auto text-[0.65rem] font-semibold uppercase tracking-wide'}>
                      Soon
                    </span>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className={`mt-auto border-t border-white/10 py-5 ${isCollapsed ? 'px-2' : 'px-5'}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <span
            aria-label={isCollapsed ? 'Sarah G., Research Coordinator' : undefined}
            aria-hidden={isCollapsed ? undefined : 'true'}
            className="grid size-11 place-items-center rounded-full bg-violet-200 font-bold text-violet-950 shadow-sm"
            title={isCollapsed ? 'Sarah G. — Research Coordinator' : undefined}
          >
            SG
          </span>
          <div className={isCollapsed ? 'sr-only' : 'min-w-0'}>
            <p className="truncate text-sm font-semibold text-white">Sarah G.</p>
            <p className="truncate text-xs text-slate-400">Research Coordinator</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AppLayout({
  children,
  activeView,
  attentionCount,
  needsReviewCount,
  searchAvailable,
  onViewChange,
}: AppLayoutProps) {
  const navigationDialog = useRef<HTMLDialogElement>(null)
  const notificationDialog = useRef<HTMLDialogElement>(null)
  const helpDialog = useRef<HTMLDialogElement>(null)
  const [isNavigationOpen, setIsNavigationOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(getStoredSidebarPreference)

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isSidebarCollapsed))
    } catch {
      // The sidebar remains functional when storage is unavailable.
    }
  }, [isSidebarCollapsed])

  function openNavigation() {
    setIsNavigationOpen(true)
    navigationDialog.current?.showModal()
  }

  function closeNavigation() {
    navigationDialog.current?.close()
    setIsNavigationOpen(false)
  }

  function focusTrialSearch() {
    const searchInput = document.getElementById('trial-search')
    searchInput?.focus()
    searchInput?.scrollIntoView({ block: 'center', behavior: 'auto' })
  }

  return (
    <div
      className="app-shell min-h-screen overflow-x-clip bg-[var(--color-canvas)]"
      style={{
        '--sidebar-width': isSidebarCollapsed
          ? 'var(--sidebar-width-collapsed)'
          : 'var(--sidebar-width-expanded)',
      } as React.CSSProperties}
    >
      <aside className="desktop-sidebar fixed inset-y-0 left-0 z-30 hidden shadow-[var(--shadow-nav)] min-[1100px]:block">
        <SidebarContent
          activeView={activeView}
          isCollapsed={isSidebarCollapsed}
          needsReviewCount={needsReviewCount}
          onToggleCollapse={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
          onViewChange={onViewChange}
        />
      </aside>

      <dialog
        aria-label="Primary navigation"
        className="m-0 h-dvh max-h-none w-[min(20rem,calc(100%-3rem))] max-w-none border-0 bg-transparent p-0 shadow-[var(--shadow-nav)] backdrop:bg-slate-950/60 min-[1100px]:hidden"
        id="mobile-navigation"
        onClose={() => setIsNavigationOpen(false)}
        ref={navigationDialog}
      >
        <SidebarContent
          activeView={activeView}
          needsReviewCount={needsReviewCount}
          onClose={closeNavigation}
          onViewChange={onViewChange}
        />
      </dialog>

      <div className="app-content min-w-0">
        <header className="sticky top-0 z-20 overflow-hidden border-b border-violet-100 bg-[linear-gradient(110deg,#ffffff_0%,#faf9ff_58%,#eeeafe_100%)] shadow-sm">
          <div aria-hidden="true" className="absolute -right-16 -top-24 size-52 rounded-full bg-violet-300/25 blur-2xl" />
          <div className="relative flex min-h-24 items-center gap-4 px-4 sm:px-6 lg:px-8 xl:px-9">
            <Button
              aria-controls="mobile-navigation"
              aria-expanded={isNavigationOpen}
              aria-label="Open navigation"
              className="size-11 shrink-0 p-0 min-[1100px]:hidden [&_svg]:size-5 [&_svg]:stroke-[2.25]"
              onClick={openNavigation}
              variant="secondary"
            >
              <Menu aria-hidden="true" size={20} />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-bold tracking-tight text-[var(--color-text)] sm:text-2xl">
                <span className="sm:hidden">TrialScope</span>
                <span className="hidden sm:inline">Clinical Trial Review Workspace</span>
              </h1>
              <p className="mt-1 hidden truncate text-sm text-[var(--color-text-muted)] sm:block">
                Monitor trials, review updates, and keep studies on track.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                aria-label="Focus trial search"
                className="size-11 shrink-0 rounded-xl border-[#D8DFF0] bg-white p-0 text-[#17213C] shadow-[0_2px_8px_rgb(23_33_60_/_0.08)] hover:border-violet-300 hover:bg-violet-50"
                disabled={!searchAvailable}
                onClick={focusTrialSearch}
                variant="secondary"
              >
                <Search aria-hidden="true" className="!size-6 shrink-0" size={24} strokeWidth={2.1} />
              </Button>
              <Button
                aria-label={`${attentionCount} at-risk reviews`}
                className="relative size-11 shrink-0 rounded-xl border-[#D8DFF0] bg-white p-0 text-[#17213C] shadow-[0_2px_8px_rgb(23_33_60_/_0.08)] hover:border-violet-300 hover:bg-violet-50"
                onClick={() => notificationDialog.current?.showModal()}
                variant="secondary"
              >
                <Bell aria-hidden="true" className="!size-6 shrink-0" size={24} strokeWidth={2.1} />
                {attentionCount > 0 ? (
                  <span className="absolute right-0 top-0 grid min-h-[18px] min-w-[18px] translate-x-[35%] -translate-y-[35%] place-items-center rounded-full border-2 border-white bg-rose-600 px-1 text-[0.625rem] font-bold leading-[14px] text-white shadow-sm">
                    {attentionCount}
                  </span>
                ) : null}
              </Button>
              <Button
                aria-label="Open workspace help"
                className="size-11 shrink-0 rounded-xl border-[#D8DFF0] bg-white p-0 text-[#17213C] shadow-[0_2px_8px_rgb(23_33_60_/_0.08)] hover:border-violet-300 hover:bg-violet-50"
                onClick={() => helpDialog.current?.showModal()}
                variant="secondary"
              >
                <CircleHelp aria-hidden="true" className="!size-6 shrink-0" size={24} strokeWidth={2.1} />
              </Button>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 sm:py-7 lg:px-7 xl:px-9" id="main-content">
          <div className="mx-auto w-full max-w-[92rem]">{children}</div>
        </main>
      </div>

      <dialog
        aria-labelledby="attention-dialog-title"
        className="m-auto w-[min(28rem,calc(100%-2rem))] max-w-none rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white p-0 shadow-[var(--shadow-panel)] backdrop:bg-slate-950/50"
        ref={notificationDialog}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] p-5">
          <div>
            <h2 className="font-bold text-[var(--color-text)]" id="attention-dialog-title">
              Review attention
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Derived from the current trial workspace.
            </p>
          </div>
          <Button
            aria-label="Close review attention dialog"
            className="size-9 min-h-9 p-0"
            onClick={() => notificationDialog.current?.close()}
            variant="ghost"
          >
            <span
              aria-hidden="true"
              className="text-2xl font-bold leading-none text-slate-800"
            >
              ×
            </span>
          </Button>
        </div>
        <p className="p-5 text-sm leading-6 text-[var(--color-text-muted)]">
          <strong className="text-[var(--color-text)]">{attentionCount}</strong>{' '}
          {attentionCount === 1 ? 'review requires' : 'reviews require'} attention because the review is overdue or high priority.
        </p>
      </dialog>

      <dialog
        aria-labelledby="help-dialog-title"
        className="m-auto w-[min(31rem,calc(100%-2rem))] max-w-none rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white p-0 shadow-[var(--shadow-panel)] backdrop:bg-slate-950/50"
        ref={helpDialog}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] p-5">
          <div>
            <h2 className="font-bold text-[var(--color-text)]" id="help-dialog-title">
              Using TrialScope
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              A quick guide to this review workspace.
            </p>
          </div>
          <Button
            aria-label="Close workspace help"
            className="size-11 min-h-11 shrink-0 p-0"
            onClick={() => helpDialog.current?.close()}
            variant="ghost"
          >
            <span
              aria-hidden="true"
              className="text-2xl font-bold leading-none text-slate-800"
            >
              ×
            </span>
          </Button>
        </div>
        <ul className="space-y-3 p-5 text-sm leading-6 text-[var(--color-text-muted)]">
          <li>Use search and filters to narrow the trial list.</li>
          <li>Select a trial ID to inspect study and review details.</li>
          <li>Use column headings to change the table sort order.</li>
          <li>Open My Reviews to focus on trials that need review.</li>
        </ul>
      </dialog>
    </div>
  )
}

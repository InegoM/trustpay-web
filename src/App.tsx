import { useEffect, useState } from "react"
import type { View } from "@/types"

import Layout from "@/components/Layout"

import Overview from "@/pages/Overview"

import Projects from "@/pages/Projects"

import ProjectDetails from "@/pages/ProjectDetails"

import MilestoneReview from "@/pages/MilestoneReview"

import ConfirmApproval from "@/pages/ConfirmApproval"

import MilestoneApproved from "@/pages/MilestoneApproved"

import RequestChanges from "@/pages/RequestChanges"

import RaiseDispute from "@/pages/RaiseDispute"

import Activity from "@/pages/Activity"
import NewProject from "@/pages/NewProject"
import InviteCustomer from "@/pages/InviteCustomer"
import TrustPayProvider, { useTrustPay } from "@/state/TrustPayContext"
import { hashForView, projectIdFromHash, viewFromHash } from "@/routes"
import AuthProvider, { useAuth } from "@/state/AuthContext"
import Login from "@/pages/Login"

function AppContent() {
  const { project, syncStatus, syncError, refresh, selectProject } = useTrustPay()
  const { canDecide } = useAuth()
  const [view, setView] = useState<View>(() =>
    viewFromHash(window.location.hash),
  )

  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState(null, "", hashForView("overview"))
    }

    const handleHashChange = () => {
      setView(viewFromHash(window.location.hash))
      const projectId = projectIdFromHash(window.location.hash)
      if (projectId && projectId !== project.id) void selectProject(projectId)
      document.getElementById("main-content")?.scrollTo({ top: 0 })
    }

    window.addEventListener("hashchange", handleHashChange)
    handleHashChange()
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [project.id, selectProject])

  const navigate = (next: View) => {
    const nextHash = hashForView(next, project.id)
    if (window.location.hash === nextHash) {
      setView(next)
      document.getElementById("main-content")?.scrollTo({ top: 0 })
      return
    }
    window.location.hash = nextHash.slice(1)
  }

  const protectedDecisionViews: View[] = [
    "confirm-approval",
    "request-changes",
    "raise-dispute",
  ]
  const visibleView =
    !canDecide && protectedDecisionViews.includes(view)
      ? "milestone-review"
      : view

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-3 focus:text-white"
      >
        Skip to main content
      </a>
      <Layout currentView={visibleView} navigate={navigate}>
        {syncStatus === "loading" && (
          <div className="mb-5 rounded-xl border border-brand-mid bg-brand-light px-4 py-3 text-sm text-ink-dim" role="status">
            Synchronizing project data with TrustPay API…
          </div>
        )}
        {syncStatus === "error" && (
          <div className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-danger/25 bg-danger-light px-4 py-3" role="alert">
            <div>
              <p className="text-sm font-semibold text-danger">API connection unavailable</p>
              <p className="mt-0.5 text-xs text-ink-dim">
                {syncError ?? "The latest project data could not be loaded."}
              </p>
            </div>
            <button
              onClick={() => void refresh()}
              className="flex-shrink-0 rounded-lg border border-danger/30 px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger/10"
            >
              Retry
            </button>
          </div>
        )}
        {visibleView === "overview" && <Overview navigate={navigate} />}
        {visibleView === "projects" && <Projects navigate={navigate} />}
        {visibleView === "new-project" && <NewProject navigate={navigate} />}
        {visibleView === "project-details" && <ProjectDetails navigate={navigate} />}
        {visibleView === "invite-customer" && <InviteCustomer navigate={navigate} />}
        {visibleView === "milestone-review" && <MilestoneReview navigate={navigate} />}
        {visibleView === "confirm-approval" && <ConfirmApproval navigate={navigate} />}
        {visibleView === "milestone-approved" && (
          <MilestoneApproved navigate={navigate} />
        )}
        {visibleView === "request-changes" && <RequestChanges navigate={navigate} />}
        {visibleView === "request-changes-result" && (
          <RequestChanges navigate={navigate} />
        )}
        {visibleView === "raise-dispute" && <RaiseDispute navigate={navigate} />}
        {visibleView === "raise-dispute-result" && <RaiseDispute navigate={navigate} />}
        {visibleView === "activity" && <Activity navigate={navigate} />}
      </Layout>
    </>
  )
}

function AuthenticatedApp() {
  const { status } = useAuth()

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center" role="status">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 rounded-xl bg-brand animate-pulse" />
          <p className="mt-4 text-sm font-medium text-muted">Checking your TrustPay session…</p>
        </div>
      </div>
    )
  }

  if (status === "anonymous") return <Login />

  return (
    <TrustPayProvider>
      <AppContent />
    </TrustPayProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  )
}

import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import Activity from "@/pages/Activity";
import ConfirmApproval from "@/pages/ConfirmApproval";
import InviteCustomer from "@/pages/InviteCustomer";
import Login from "@/pages/Login";
import MilestoneApproved from "@/pages/MilestoneApproved";
import MilestoneReview from "@/pages/MilestoneReview";
import NewProject from "@/pages/NewProject";
import Overview from "@/pages/Overview";
import ProjectDetails from "@/pages/ProjectDetails";
import Projects from "@/pages/Projects";
import RaiseDispute from "@/pages/RaiseDispute";
import RequestChanges from "@/pages/RequestChanges";
import { hashForView, routeFromHash } from "@/routes";
import AuthProvider, { useAuth } from "@/state/AuthContext";
import TrustPayProvider, { useTrustPay } from "@/state/TrustPayContext";
import type { Navigate, RouteLocation, View } from "@/types";

function StatePage({
  title,
  message,
  retry,
}: {
  title: string;
  message: string;
  retry?: () => void;
}) {
  return (
    <div
      className="mx-auto max-w-lg rounded-2xl border border-edge bg-card p-8 text-center"
      role="status"
    >
      <h1 className="text-xl font-bold text-ink">{title}</h1>
      <p className="mt-2 text-sm text-muted">{message}</p>
      {retry && (
        <button
          onClick={retry}
          className="mt-5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white"
        >
          Retry
        </button>
      )}
    </div>
  );
}

function AppContent() {
  const { project, syncStatus, syncError, refresh, selectProject } = useTrustPay();
  const { canDecide } = useAuth();
  const [route, setRoute] = useState<RouteLocation>(() => routeFromHash(window.location.hash));

  useEffect(() => {
    if (!window.location.hash) window.history.replaceState(null, "", hashForView("overview"));
    const handleHashChange = () => {
      const next = routeFromHash(window.location.hash);
      setRoute(next);
      if (next.projectId && next.projectId !== project.id) void selectProject(next.projectId);
      document.getElementById("main-content")?.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [project.id, selectProject]);

  const navigate: Navigate = (view, params = {}) => {
    const nextHash = hashForView(view, {
      projectId: params.projectId ?? route.projectId ?? project.id,
      milestoneId: params.milestoneId ?? route.milestoneId,
    });
    window.location.hash = nextHash.slice(1);
  };

  const view: View = route.view === "not-found" ? "projects" : route.view;
  const projectRoutePending = Boolean(route.projectId && route.projectId !== project.id);
  const milestone = route.milestoneId
    ? project.milestones.find((item) => item.id === route.milestoneId)
    : undefined;
  const decisionViews: View[] = ["confirm-approval", "request-changes", "raise-dispute"];

  let content;
  if (route.view === "not-found") {
    content = (
      <StatePage title="Page not found" message="This address is invalid or no longer available." />
    );
  } else if (!route.projectId && !project.id && syncStatus === "loading") {
    content = <StatePage title="Loading workspace" message="Retrieving your projects…" />;
  } else if (!route.projectId && !project.id && syncStatus === "error") {
    content = (
      <StatePage
        title="Projects unavailable"
        message="We could not load project data. No cached customer data is being shown."
        retry={() => void refresh()}
      />
    );
  } else if (
    !route.projectId &&
    !project.id &&
    syncStatus === "connected" &&
    view !== "projects" &&
    view !== "new-project"
  ) {
    content = (
      <StatePage
        title="No projects yet"
        message="Create a project to add an agreement and milestone schedule."
      />
    );
  } else if (projectRoutePending && syncStatus === "loading") {
    content = (
      <StatePage title="Loading project" message="Retrieving the project and its milestones…" />
    );
  } else if (projectRoutePending && syncStatus === "error") {
    content = (
      <StatePage
        title="Project not found"
        message="The project is unavailable or you do not have access to it."
        retry={() => void selectProject(route.projectId!)}
      />
    );
  } else if (route.milestoneId && !milestone) {
    content = (
      <StatePage
        title="Milestone not found"
        message="The milestone is unavailable or you do not have access to it."
      />
    );
  } else if (decisionViews.includes(view) && !canDecide) {
    content = (
      <StatePage
        title="Read-only access"
        message="Only the assigned customer approver can record a milestone decision."
      />
    );
  } else if (view === "overview") content = <Overview navigate={navigate} />;
  else if (view === "projects") content = <Projects navigate={navigate} />;
  else if (view === "new-project") content = <NewProject navigate={navigate} />;
  else if (view === "project-details") content = <ProjectDetails navigate={navigate} />;
  else if (view === "invite-customer") content = <InviteCustomer navigate={navigate} />;
  else if (view === "milestone-review")
    content = <MilestoneReview navigate={navigate} milestoneId={route.milestoneId!} />;
  else if (view === "confirm-approval")
    content = <ConfirmApproval navigate={navigate} milestoneId={route.milestoneId!} />;
  else if (view === "milestone-approved")
    content = <MilestoneApproved navigate={navigate} milestoneId={route.milestoneId!} />;
  else if (view === "request-changes" || view === "request-changes-result")
    content = (
      <RequestChanges
        navigate={navigate}
        milestoneId={route.milestoneId!}
        showResult={view === "request-changes-result"}
      />
    );
  else if (view === "raise-dispute" || view === "raise-dispute-result")
    content = (
      <RaiseDispute
        navigate={navigate}
        milestoneId={route.milestoneId!}
        showResult={view === "raise-dispute-result"}
      />
    );
  else content = <Activity navigate={navigate} />;

  return (
    <Layout currentView={view} navigate={navigate}>
      {syncStatus === "error" && !projectRoutePending && (
        <div
          className="mb-5 rounded-xl border border-danger/25 bg-danger-light px-4 py-3"
          role="alert"
        >
          <p className="text-sm font-semibold text-danger">Could not refresh project data</p>
          <p className="mt-1 text-xs text-ink-dim">{syncError}</p>
          <button onClick={() => void refresh()} className="mt-2 text-xs font-semibold text-danger">
            Retry
          </button>
        </div>
      )}
      {content}
    </Layout>
  );
}

function AuthenticatedApp() {
  const { status } = useAuth();
  if (status === "loading")
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas" role="status">
        Checking your TrustPay session…
      </div>
    );
  if (status === "anonymous") return <Login />;
  return (
    <TrustPayProvider>
      <AppContent />
    </TrustPayProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

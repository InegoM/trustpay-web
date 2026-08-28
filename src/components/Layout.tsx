import { type ReactNode } from "react";
import type { Navigate, View } from "@/types";
import { useAuth } from "@/state/AuthContext";
import { useTrustPay } from "@/state/TrustPayContext";

interface LayoutProps {
  children: ReactNode;
  currentView: View;
  navigate: Navigate;
}

function navSection(view: View): "overview" | "projects" | "activity" | "other" {
  if (view === "overview") return "overview";
  if (view === "activity") return "activity";
  const projectViews: View[] = [
    "projects",
    "new-project",
    "project-details",
    "invite-customer",
    "agreement-review",
    "agreement-confirm",
    "agreement-receipt",
    "agreement-amendment",
    "agreement-amend",
    "milestone-review",
    "confirm-approval",
    "milestone-approved",
    "request-changes",
    "request-changes-result",
    "raise-dispute",
    "raise-dispute-result",
  ];
  if (projectViews.includes(view)) return "projects";
  return "other";
}

function breadcrumb(view: View, projectName: string): string[] {
  switch (view) {
    case "overview":
      return ["Overview"];
    case "projects":
      return ["Projects"];
    case "new-project":
      return ["Projects", "New project"];
    case "project-details":
      return ["Projects", projectName];
    case "invite-customer":
      return ["Projects", projectName, "Invite customer"];
    case "agreement-review":
      return ["Projects", projectName, "Agreement"];
    case "agreement-confirm":
      return ["Projects", projectName, "Confirm acceptance"];
    case "agreement-receipt":
      return ["Projects", projectName, "Acceptance recorded"];
    case "agreement-amendment":
      return ["Projects", projectName, "Request amendment"];
    case "agreement-amend":
      return ["Projects", projectName, "Create amendment"];
    case "milestone-review":
      return ["Projects", projectName, "Review Milestone"];
    case "confirm-approval":
      return ["Projects", projectName, "Confirm Approval"];
    case "milestone-approved":
      return ["Projects", projectName, "Milestone Approved"];
    case "request-changes":
      return ["Projects", projectName, "Request Changes"];
    case "request-changes-result":
      return ["Projects", projectName, "Changes Requested"];
    case "raise-dispute":
      return ["Projects", projectName, "Raise Dispute"];
    case "raise-dispute-result":
      return ["Projects", projectName, "Dispute Recorded"];
    case "activity":
      return ["Activity"];
    default:
      return [];
  }
}

const GridIcon = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <rect x="1.5" y="1.5" width="6" height="6" rx="1.5" fill={active ? "#2B9B8E" : "#7A7870"} />
    <rect x="10.5" y="1.5" width="6" height="6" rx="1.5" fill={active ? "#2B9B8E" : "#7A7870"} />
    <rect x="1.5" y="10.5" width="6" height="6" rx="1.5" fill={active ? "#2B9B8E" : "#7A7870"} />
    <rect x="10.5" y="10.5" width="6" height="6" rx="1.5" fill={active ? "#2B9B8E" : "#7A7870"} />
  </svg>
);

const FolderIcon = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path
      d="M2.5 5.5C2.5 4.67 3.17 4 4 4H7L8.5 5.5H14C14.83 5.5 15.5 6.17 15.5 7V13.5C15.5 14.33 14.83 15 14 15H4C3.17 15 2.5 14.33 2.5 13.5V5.5Z"
      fill={active ? "#2B9B8E" : "#7A7870"}
    />
  </svg>
);

const ClockIcon = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <circle cx="9" cy="9" r="6.5" stroke={active ? "#2B9B8E" : "#7A7870"} strokeWidth="1.5" />
    <path
      d="M9 5.5V9L11.5 11"
      stroke={active ? "#2B9B8E" : "#7A7870"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const HelpIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <circle cx="9" cy="9" r="6.5" stroke="#7A7870" strokeWidth="1.5" />
    <path
      d="M7 7.2C7 6.09 7.9 5.2 9 5.2C10.1 5.2 11 6.09 11 7.2C11 8.1 10.4 8.87 9.5 9.15V10"
      stroke="#7A7870"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <circle cx="9" cy="12" r="0.75" fill="#7A7870" />
  </svg>
);

const GearIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <circle cx="9" cy="9" r="2.5" stroke="#7A7870" strokeWidth="1.5" />
    <path
      d="M9 2.5v1.5M9 14v1.5M2.5 9H4M14 9h1.5M4.22 4.22l1.06 1.06M12.72 12.72l1.06 1.06M4.22 13.78l1.06-1.06M12.72 5.28l1.06-1.06"
      stroke="#7A7870"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M10 2.5C7.24 2.5 5 4.74 5 7.5V11L3.5 13.5h13L15 11V7.5C15 4.74 12.76 2.5 10 2.5z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path d="M8 14.5a2 2 0 004 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export default function Layout({ children, currentView, navigate }: LayoutProps) {
  const { user, logout } = useAuth();
  const { project } = useTrustPay();
  const section = navSection(currentView);
  const crumbs = breadcrumb(currentView, project.name);
  const organization = user?.organizations[0];
  const initials =
    user?.displayName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "TP";

  const navBtn = (label: string, target: "overview" | "projects" | "activity", icon: ReactNode) => {
    const isActive = section === target;
    return (
      <button
        onClick={() => navigate(target)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-brand ${
          isActive ? "bg-brand-light text-brand" : "text-muted hover:text-ink hover:bg-edge/60"
        }`}
        aria-current={isActive ? "page" : undefined}
      >
        {icon}
        {label}
      </button>
    );
  };

  return (
    <div
      className="flex h-screen bg-canvas overflow-hidden"
      style={{ fontFamily: "var(--font-body)" }}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-3 focus:text-white"
      >
        Skip to main content
      </a>
      {/* Sidebar */}
      <aside className="hidden w-64 flex-shrink-0 bg-card border-r border-edge lg:flex flex-col z-10">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-edge flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path
                  d="M2 4.5L7 2L12 4.5V7C12 10 7 12.5 7 12.5C7 12.5 2 10 2 7V4.5Z"
                  fill="white"
                />
                <path
                  d="M4.5 7L6.5 9L9.5 5.5"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span style={{ fontFamily: "var(--font-display)" }} className="text-xl font-bold">
              <span className="text-ink">Trust</span>
              <span className="text-brand">Pay</span>
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5" aria-label="Main navigation">
          {navBtn("Overview", "overview", <GridIcon active={section === "overview"} />)}
          {navBtn("Projects", "projects", <FolderIcon active={section === "projects"} />)}
          {navBtn("Activity", "activity", <ClockIcon active={section === "activity"} />)}
        </nav>

        {/* Bottom actions */}
        <div className="p-3 border-t border-edge space-y-0.5">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-ink hover:bg-edge/60 transition-all">
            <HelpIcon />
            Help
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-ink hover:bg-edge/60 transition-all">
            <GearIcon />
            Settings
          </button>

          {/* User profile */}
          <div className="pt-2 mt-1 border-t border-edge">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-edge/40 transition-all cursor-pointer text-left">
              <div
                className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink truncate">{user?.displayName}</p>
                <p className="text-xs text-muted truncate">
                  {organization?.name ?? "No organization"}
                </p>
              </div>
            </button>
            <button
              onClick={() => void logout()}
              className="mt-1 w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-muted hover:bg-edge/50 hover:text-ink"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-card border-b border-edge flex items-center justify-between px-4 sm:px-8 flex-shrink-0">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
            {crumbs.map((part, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path
                      d="M5 3L9 7L5 11"
                      stroke="#7A7870"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                {i === crumbs.length - 1 ? (
                  <span className="text-ink font-medium" aria-current="page">
                    {part}
                  </span>
                ) : (
                  <button
                    className="text-muted hover:text-brand hover:underline"
                    onClick={() =>
                      navigate(i === 0 ? "projects" : "project-details", {
                        projectId: project.id,
                      })
                    }
                  >
                    {part}
                  </button>
                )}
              </span>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              className="relative p-2 rounded-xl hover:bg-edge/60 transition-all text-muted hover:text-ink"
              aria-label="Notifications"
            >
              <BellIcon />
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 bg-warn rounded-full border-2 border-white"
                aria-hidden="true"
              ></span>
            </button>
            <div
              className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold"
              style={{ fontFamily: "var(--font-display)" }}
              aria-hidden="true"
            >
              {initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto" id="main-content" tabIndex={-1}>
          <div className="max-w-[1440px] mx-auto p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8 lg:pb-8">
            {children}
          </div>
        </main>
      </div>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-edge bg-card p-2 lg:hidden"
        aria-label="Mobile navigation"
      >
        {navBtn("Overview", "overview", <GridIcon active={section === "overview"} />)}
        {navBtn("Projects", "projects", <FolderIcon active={section === "projects"} />)}
        {navBtn("Activity", "activity", <ClockIcon active={section === "activity"} />)}
      </nav>
    </div>
  );
}

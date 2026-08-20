import { useState } from "react";
import { PROJECT, fmt } from "@/data/mock";
import type { PageProps } from "@/types";

const CARD = "bg-card rounded-2xl border border-edge shadow-[0_2px_12px_rgba(13,31,64,0.06),0_1px_3px_rgba(13,31,64,0.04)]";

const statusColors: Record<string, string> = {
  "In progress": "bg-warn-light text-warn",
  "Completed": "bg-brand-light text-brand",
  "On hold": "bg-edge text-muted",
};

const filters = ["All", "In progress", "Completed", "On hold"];

export default function Projects({ navigate }: PageProps) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const approved = PROJECT.approvedValue;
  const total = PROJECT.agreedValue;
  const pct = Math.round((approved / total) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)" }} className="text-2xl font-bold text-ink">
            Projects
          </h1>
          <p className="text-muted text-sm mt-1">Manage your milestone agreements and project records.</p>
        </div>
        <button className="px-4 py-2.5 bg-brand text-white text-sm font-medium rounded-xl hover:bg-brand/90 transition-all flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 3v10M3 8h10" stroke="white" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
          New project
        </button>
      </div>

      {/* Search + filters */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"
          >
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            aria-label="Search projects"
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-edge rounded-xl text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-all"
          />
        </div>

        <div className="flex gap-2" role="group" aria-label="Filter by status">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                activeFilter === f
                  ? "bg-ink text-white"
                  : "bg-card border border-edge text-muted hover:text-ink hover:border-ink/30"
              }`}
              aria-pressed={activeFilter === f}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Project card */}
      <div className={CARD}>
        <button
          className="w-full text-left p-6 rounded-2xl hover:bg-edge/20 transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset"
          onClick={() => navigate("project-details")}
          aria-label="Open Café Renovation project"
        >
          <div className="flex items-start justify-between gap-6">
            {/* Left: project info */}
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-brand-light flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M3 8.5C3 7.4 3.9 6.5 5 6.5H9L11 8.5H19C20.1 8.5 21 9.4 21 10.5V18.5C21 19.6 20.1 20.5 19 20.5H5C3.9 20.5 3 19.6 3 18.5V8.5Z" fill="#2B9B8E" />
                </svg>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <span style={{ fontFamily: "var(--font-display)" }} className="font-semibold text-ink text-lg">
                    {PROJECT.name}
                  </span>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[PROJECT.status] ?? "bg-edge text-muted"}`}>
                    {PROJECT.status}
                  </span>
                  <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-brand-light text-brand">
                    Agreement accepted
                  </span>
                </div>

                <p className="text-muted text-sm mt-1.5">
                  {PROJECT.customer} &middot; Agreement {PROJECT.agreementVersion} accepted {PROJECT.agreementAccepted}
                </p>

                <div className="flex items-center gap-6 mt-4">
                  <div>
                    <p className="text-xs text-muted">Agreed project value</p>
                    <p style={{ fontFamily: "var(--font-display)" }} className="font-semibold text-ink text-sm mt-0.5">
                      {fmt(PROJECT.agreedValue)}
                    </p>
                  </div>
                  <div className="w-px h-8 bg-edge" aria-hidden="true" />
                  <div>
                    <p className="text-xs text-muted">Approved milestone value</p>
                    <p style={{ fontFamily: "var(--font-display)" }} className="font-semibold text-ink text-sm mt-0.5">
                      {fmt(PROJECT.approvedValue)}
                    </p>
                  </div>
                  <div className="w-px h-8 bg-edge" aria-hidden="true" />
                  <div>
                    <p className="text-xs text-muted">Authorized approver</p>
                    <p className="font-medium text-ink text-sm mt-0.5">{PROJECT.authorizedApprover}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: milestone progress */}
            <div className="flex-shrink-0 text-right">
              <p className="text-xs text-muted mb-2">Milestone progress</p>
              <div className="flex flex-col gap-1.5">
                {PROJECT.milestones.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 justify-end">
                    <span className="text-xs text-muted">{m.name}</span>
                    <div
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        m.status === "approved"
                          ? "bg-brand"
                          : m.status === "awaiting-decision"
                          ? "bg-warn"
                          : "bg-edge border border-edge"
                      }`}
                      aria-label={
                        m.status === "approved"
                          ? "Approved"
                          : m.status === "awaiting-decision"
                          ? "Awaiting decision"
                          : "Not started"
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-5">
            <div className="flex justify-between mb-1.5">
              <span className="text-xs text-muted">{fmt(PROJECT.approvedValue)} approved</span>
              <span className="text-xs text-muted">{pct}% of {fmt(PROJECT.agreedValue)}</span>
            </div>
            <div className="h-1.5 bg-edge rounded-full overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div
                className="h-full bg-brand rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </button>
      </div>

      {/* Empty state note when search/filter has no results (placeholder) */}
      {search && (
        <div className="text-center py-12 text-muted text-sm">
          No projects match &ldquo;{search}&rdquo;
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-muted text-center pt-2">
        TrustPay records agreements, evidence, and decisions. It does not hold or transfer money.
      </p>
    </div>
  );
}

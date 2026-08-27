import { useMemo, useState } from "react";

import { fmt } from "@/data/mock";
import { useAuth } from "@/state/AuthContext";
import { useTrustPay } from "@/state/TrustPayContext";
import type { PageProps } from "@/types";

const CARD =
  "bg-card rounded-2xl border border-edge shadow-[0_2px_12px_rgba(13,31,64,0.06),0_1px_3px_rgba(13,31,64,0.04)]";

const statusColors: Record<string, string> = {
  "In progress": "bg-warn-light text-warn",
  Completed: "bg-brand-light text-brand",
  "On hold": "bg-edge text-muted",
};

const filters = ["All", "In progress", "Completed", "On hold"];

export default function Projects({ navigate }: PageProps) {
  const { canCreateProject } = useAuth();
  const { projects, selectProject } = useTrustPay();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const visibleProjects = useMemo(
    () =>
      projects.filter((project) => {
        const matchesSearch = `${project.name} ${project.customer}`
          .toLowerCase()
          .includes(search.trim().toLowerCase());
        return matchesSearch && (activeFilter === "All" || project.status === activeFilter);
      }),
    [activeFilter, projects, search],
  );

  const openProject = async (projectId: string) => {
    if (await selectProject(projectId)) navigate("project-details");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)" }} className="text-2xl font-bold text-ink">
            Projects
          </h1>
          <p className="mt-1 text-sm text-muted">
            Manage your milestone agreements and project records.
          </p>
        </div>
        {canCreateProject && (
          <button
            onClick={() => navigate("new-project")}
            className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand/90"
          >
            <span className="text-lg leading-none" aria-hidden="true">
              +
            </span>
            New project
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="m10.5 10.5 2.5 2.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search projects..."
            className="w-full rounded-xl border border-edge bg-card py-2.5 pl-9 pr-4 text-sm text-ink placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <div className="flex gap-2" role="group" aria-label="Filter projects">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`rounded-xl px-3.5 py-2 text-sm font-medium ${activeFilter === filter ? "bg-ink text-white" : "border border-edge bg-card text-muted hover:text-ink"}`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {visibleProjects.map((project) => {
          const percentage =
            project.agreedValue > 0
              ? Math.round((project.approvedValue / project.agreedValue) * 100)
              : 0;
          return (
            <div key={project.id} className={CARD}>
              <button
                onClick={() => void openProject(project.id)}
                className="w-full rounded-2xl p-6 text-left hover:bg-edge/20"
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <div
                      className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-light"
                      aria-hidden="true"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M3 8.5A2 2 0 0 1 5 6.5h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-10Z"
                          fill="#2B9B8E"
                        />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className="text-lg font-semibold text-ink"
                          style={{ fontFamily: "var(--font-display)" }}
                        >
                          {project.name}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[project.status] ?? "bg-edge text-muted"}`}
                        >
                          {project.status}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${project.agreementStatus === "active" ? "bg-brand-light text-brand" : "bg-warn-light text-warn"}`}
                        >
                          {project.agreementStatus === "active"
                            ? "Agreement accepted"
                            : "Draft agreement"}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm text-muted">
                        {project.customer} · {project.agreementVersion} ·{" "}
                        {project.agreementStatus === "active"
                          ? `accepted ${project.agreementAccepted}`
                          : "customer not yet invited"}
                      </p>
                      <div className="mt-4 flex items-center gap-6">
                        <div>
                          <p className="text-xs text-muted">Agreed project value</p>
                          <p className="mt-0.5 text-sm font-semibold text-ink">
                            {fmt(project.agreedValue)}
                          </p>
                        </div>
                        <div className="h-8 w-px bg-edge" />
                        <div>
                          <p className="text-xs text-muted">Milestones</p>
                          <p className="mt-0.5 text-sm font-semibold text-ink">
                            {project.milestones.length}
                          </p>
                        </div>
                        <div className="h-8 w-px bg-edge" />
                        <div>
                          <p className="text-xs text-muted">Authorized approver</p>
                          <p className="mt-0.5 text-sm font-medium text-ink">
                            {project.authorizedApprover}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs text-muted">Approved</p>
                    <p className="mt-1 text-lg font-semibold text-ink">{percentage}%</p>
                  </div>
                </div>
                <div
                  className="mt-5 h-1.5 overflow-hidden rounded-full bg-edge"
                  role="progressbar"
                  aria-valuenow={percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {visibleProjects.length === 0 && (
        <div className={`${CARD} py-14 text-center`}>
          <p className="text-sm font-semibold text-ink">No matching projects</p>
          <p className="mt-1 text-sm text-muted">
            Change the search or filter to see more results.
          </p>
        </div>
      )}

      <p className="pt-2 text-center text-xs text-muted">
        TrustPay records agreements, evidence, and decisions. It does not hold or transfer money.
      </p>
    </div>
  );
}

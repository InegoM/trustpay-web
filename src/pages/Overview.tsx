import { fmt } from "@/data/mock"
import { useTrustPay } from "@/state/TrustPayContext"
import type { PageProps } from "@/types"
import { useAuth } from "@/state/AuthContext"

const CARD =
  "bg-card rounded-2xl border border-edge shadow-[0_2px_12px_rgba(13,31,64,0.06),0_1px_3px_rgba(13,31,64,0.04)]"

const actorDot: Record<string, string> = {
  sme: "bg-ink",

  customer: "bg-brand",

  system: "bg-muted",
}

export default function Overview({ navigate }: PageProps) {
  const { project: PROJECT, activity: ACTIVITY_LOG } = useTrustPay()
  const { canCreateProject } = useAuth()
  const attentionMilestone =
    PROJECT.milestones.find((milestone) => milestone.status === "awaiting-decision") ??
    PROJECT.milestones[1] ??
    PROJECT.milestones[0]
  const approvedCount = PROJECT.milestones.filter(
    (milestone) => milestone.status === "approved",
  ).length
  const awaitingCount = PROJECT.milestones.filter(
    (milestone) => milestone.status === "awaiting-decision",
  ).length

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1
          style={{ fontFamily: "var(--font-display)" }}
          className="text-2xl font-bold text-ink"
        >
          Good morning, Nadia
        </h1>
        <p className="text-muted text-sm mt-1">
          Here's what needs your attention today.
        </p>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "Agreed project value",
            value: fmt(PROJECT.agreedValue),
            sub: PROJECT.name,
            accent: false,
          },

          {
            label: "Approved milestone value",
            value: fmt(PROJECT.approvedValue),
            sub: `${approvedCount} of ${PROJECT.milestones.length} milestones complete`,
            accent: false,
          },
          {
            label: "Active projects",
            value: "1",
            sub: PROJECT.name,
            accent: false,
          },

          {
            label: "Awaiting customer decision",
            value: String(awaitingCount),
            sub: awaitingCount
              ? "Response due 27 Aug 2026"
              : "No decision currently due",
            accent: awaitingCount > 0,
          },
        ].map((s) => (
          <div key={s.label} className={`${CARD} p-5`}>
            <p className="text-muted text-xs font-medium uppercase tracking-wider leading-tight">
              {s.label}
            </p>
            <p
              style={{ fontFamily: "var(--font-display)" }}
              className={`text-2xl font-bold mt-3 ${
                s.accent ? "text-warn" : "text-ink"
              }`}
            >
              {s.value}
            </p>
            <p
              className={`text-xs mt-1.5 ${
                s.accent ? "text-warn" : "text-muted"
              }`}
            >
              {s.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Main row */}
      <div className="grid grid-cols-3 gap-6">
        {/* Next action — spans 2 cols */}
        <div className="col-span-2 bg-card rounded-2xl border border-brand-mid shadow-[0_2px_16px_rgba(43,155,142,0.1),0_1px_4px_rgba(43,155,142,0.06)] p-6">
          <div className="flex items-center gap-2 mb-4">
            <span
              className="inline-block w-2 h-2 rounded-full bg-warn"
              aria-hidden="true"
            />
            <span className="text-xs font-semibold text-warn uppercase tracking-wider">
              Next action
            </span>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2
                style={{ fontFamily: "var(--font-display)" }}
                className="text-lg font-semibold text-ink leading-tight"
              >
                {PROJECT.agreementStatus === "draft"
                  ? "Customer invitation needed"
                  : attentionMilestone?.status === "awaiting-decision"
                    ? `Customer decision awaited — Milestone ${attentionMilestone.id}`
                    : attentionMilestone?.status === "approved"
                      ? `Milestone ${attentionMilestone.id} decision recorded`
                      : attentionMilestone?.status === "disputed"
                        ? `Milestone ${attentionMilestone.id} decision paused`
                        : "Project setup is ready"}
              </h2>
              <p className="text-ink-dim text-sm mt-1">
                {PROJECT.name} &middot; {attentionMilestone?.name ?? "Draft agreement"} &middot; {fmt(attentionMilestone?.value ?? PROJECT.agreedValue)}
              </p>
              <p className="text-sm text-ink mt-3 leading-relaxed">
                {PROJECT.agreementStatus === "draft" ? (
                  <>
                    The project, draft agreement, and milestone schedule are saved. The next MVP step is to invite an authorized approver from {PROJECT.customer}.
                  </>
                ) : attentionMilestone?.status === "awaiting-decision" ? (
                  <>
                    {PROJECT.sme} submitted evidence on{" "}
                    <strong>{attentionMilestone.submittedDate ?? "the recorded submission date"}</strong>. {PROJECT.customer} has until{" "}
                    <strong>{attentionMilestone.deadline ?? "the response deadline"}</strong> to approve,
                    request changes, or raise a dispute. Keeping this decision
                    on schedule protects the project timeline.
                  </>
                ) : attentionMilestone?.status === "approved" ? (
                  <>
                    The customer approved this milestone. The decision and its
                    audit reference are available in Activity.
                  </>
                ) : attentionMilestone?.status === "disputed" ? (
                  <>
                    The customer raised a dispute. Further milestone decisions
                    are paused while the next step is arranged.
                  </>
                ) : (
                  <>
                    The customer requested updates. {PROJECT.sme} should address
                    the comments and submit new evidence.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="mt-5 pt-5 border-t border-edge flex items-center gap-3">
            <button
              onClick={() =>
                navigate(
                  PROJECT.agreementStatus === "draft" && canCreateProject
                    ? "invite-customer"
                    : PROJECT.agreementStatus === "draft"
                      ? "project-details"
                      : "milestone-review",
                )
              }
              className="px-4 py-2.5 bg-brand text-white text-sm font-medium rounded-xl hover:bg-brand/90 transition-all focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              {PROJECT.agreementStatus === "draft"
                ? canCreateProject
                  ? "Invite customer"
                  : "View draft agreement"
                : "View milestone"}
            </button>
            <button
              onClick={() => navigate("project-details")}
              className="px-4 py-2.5 text-ink-dim text-sm font-medium rounded-xl hover:bg-edge/60 transition-all"
            >
              View project
            </button>
          </div>
        </div>

        {/* Recent activity */}
        <div className={`${CARD} p-5 flex flex-col`}>
          <div className="flex items-center justify-between mb-4">
            <h2
              style={{ fontFamily: "var(--font-display)" }}
              className="text-sm font-semibold text-ink"
            >
              Recent activity
            </h2>
            <button
              onClick={() => navigate("activity")}
              className="text-xs text-brand font-medium hover:underline"
            >
              View all
            </button>
          </div>
          <div className="space-y-4 flex-1">
            {ACTIVITY_LOG.slice(0, 5).map((e) => (
              <div key={e.id} className="flex gap-3 items-start">
                <div
                  className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${actorDot[e.actorType] ?? "bg-muted"}`}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-xs text-ink leading-snug">
                    {e.description}
                  </p>
                  <p className="text-xs text-muted mt-0.5">{e.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active project card */}
      <div className={`${CARD} p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h2
            style={{ fontFamily: "var(--font-display)" }}
            className="text-sm font-semibold text-ink"
          >
            Active project
          </h2>
          <button
            onClick={() => navigate("projects")}
            className="text-xs text-brand font-medium hover:underline"
          >
            All projects
          </button>
        </div>

        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div
              className="w-11 h-11 rounded-xl bg-brand-light flex items-center justify-center flex-shrink-0"
              aria-hidden="true"
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path
                  d="M3 7.5C3 6.4 3.9 5.5 5 5.5H8.5L10.5 7.5H17C18.1 7.5 19 8.4 19 9.5V16.5C19 17.6 18.1 18.5 17 18.5H5C3.9 18.5 3 17.6 3 16.5V7.5Z"
                  fill="#2B9B8E"
                />
              </svg>
            </div>
            <div>
              <button
                onClick={() => navigate("project-details")}
                style={{ fontFamily: "var(--font-display)" }}
                className="font-semibold text-ink text-base hover:text-brand transition-colors"
              >
                {PROJECT.name}
              </button>
              <p className="text-muted text-sm mt-0.5">
                {PROJECT.customer} &middot; Agreement {PROJECT.agreementVersion}{" "}
                {PROJECT.agreementStatus === "active"
                  ? `accepted ${PROJECT.agreementAccepted}`
                  : "saved as draft"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-8 flex-shrink-0">
            <div className="text-right">
              <p className="text-xs text-muted">Agreed value</p>
              <p
                style={{ fontFamily: "var(--font-display)" }}
                className="font-semibold text-ink text-sm mt-0.5"
              >
                {fmt(PROJECT.agreedValue)}
              </p>
            </div>

            {/* Milestone progress dots */}
            <div className="flex items-center gap-2">
              {PROJECT.milestones.map((m) => (
                <div key={m.id} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-10 h-2.5 rounded-full ${
                      m.status === "approved"
                        ? "bg-brand"
                        : m.status === "awaiting-decision" ||
                            m.status === "changes-requested"
                          ? "bg-warn"
                          : m.status === "disputed"
                            ? "bg-danger"
                            : "bg-edge"
                    }`}
                    title={m.name}
                  />
                  <span className="text-[10px] text-muted w-10 text-center leading-tight truncate">
                    {m.id}
                  </span>
                </div>
              ))}
            </div>

            <span className="px-2.5 py-1 bg-warn-light text-warn text-xs font-medium rounded-full">
              {PROJECT.status}
            </span>

            <button
              onClick={() => navigate("project-details")}
              className="text-sm text-brand font-medium hover:underline flex items-center gap-1"
            >
              View
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 7h8M8 4l3 3-3 3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-muted text-center pb-2">
        TrustPay records agreements, evidence, and decisions. It does not hold
        or transfer money.
      </p>
    </div>
  )
}

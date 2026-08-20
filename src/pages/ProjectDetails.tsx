import { fmt } from "@/data/mock"
import { useTrustPay } from "@/state/TrustPayContext"
import { useAuth } from "@/state/AuthContext"
import type { PageProps } from "@/types"

const CARD =
  "bg-card rounded-2xl border border-edge shadow-[0_2px_12px_rgba(13,31,64,0.06),0_1px_3px_rgba(13,31,64,0.04)]"

const milestoneStatusLabel: Record<string, string> = {
  approved: "Approved",
  "awaiting-decision": "Awaiting decision",
  "changes-requested": "Changes requested",
  disputed: "Disputed",
  "not-started": "Not started",
}

const milestoneStatusStyle: Record<string, string> = {
  approved: "bg-brand-light text-brand",
  "awaiting-decision": "bg-warn-light text-warn",
  "changes-requested": "bg-warn-light text-warn",
  disputed: "bg-danger-light text-danger",
  "not-started": "bg-edge text-muted",
}

export default function ProjectDetails({ navigate }: PageProps) {
  const { project: PROJECT, activity: ACTIVITY_LOG } = useTrustPay()
  const { canCreateProject } = useAuth()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate("projects")}
            className="mt-1 p-2 rounded-xl hover:bg-edge/60 transition-all text-muted hover:text-ink flex-shrink-0"
            aria-label="Back to projects"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M11 4L6 9L11 14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1
                style={{ fontFamily: "var(--font-display)" }}
                className="text-2xl font-bold text-ink"
              >
                {PROJECT.name}
              </h1>
              <span className="px-2.5 py-1 bg-warn-light text-warn text-xs font-medium rounded-full">
                {PROJECT.status}
              </span>
            </div>
            <p className="text-muted text-sm mt-1">
              {PROJECT.customer} &middot; Authorized approver:{" "}
              {PROJECT.authorizedApprover} &middot; Agreement{" "}
              {PROJECT.agreementVersion}{" "}
              {PROJECT.agreementStatus === "active"
                ? `accepted ${PROJECT.agreementAccepted}`
                : "saved as draft"}
            </p>
          </div>
        </div>
        {canCreateProject && PROJECT.authorizedApprover === "Not yet assigned" && (
          <button
            onClick={() => navigate("invite-customer")}
            className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand/90"
          >
            Invite customer approver
          </button>
        )}
      </div>

      {/* Value tiles */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Agreed project value",
            value: fmt(PROJECT.agreedValue),
            note: "Total agreed between parties",
            color: "text-ink",
          },

          {
            label: "Approved milestone value",
            value: fmt(PROJECT.approvedValue),
            note: "Decisions recorded by customer",
            color: "text-brand",
          },

          {
            label: "Outstanding milestone value",
            value: fmt(PROJECT.outstandingValue),
            note: "Milestones not yet approved",
            color: "text-warn",
          },
        ].map((t) => (
          <div key={t.label} className={`${CARD} p-5`}>
            <p className="text-muted text-xs font-medium uppercase tracking-wider">
              {t.label}
            </p>
            <p
              style={{ fontFamily: "var(--font-display)" }}
              className={`text-2xl font-bold mt-3 ${t.color}`}
            >
              {t.value}
            </p>
            <p className="text-muted text-xs mt-1.5">{t.note}</p>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Milestone timeline — 2 cols */}
        <div className={`${CARD} col-span-2 p-6`}>
          <h2
            style={{ fontFamily: "var(--font-display)" }}
            className="text-base font-semibold text-ink mb-6"
          >
            Milestones
          </h2>

          <div className="relative">
            {/* Vertical connector line */}
            <div
              className="absolute left-4 top-8 bottom-8 w-0.5 bg-edge"
              aria-hidden="true"
            />

            <div className="space-y-6">
              {PROJECT.milestones.map((m, i) => (
                <div key={m.id} className="relative flex gap-5">
                  {/* Status icon */}
                  <div
                    className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                      m.status === "approved"
                        ? "bg-brand"
                        : m.status === "awaiting-decision" ||
                            m.status === "changes-requested"
                          ? "bg-warn"
                          : m.status === "disputed"
                            ? "bg-danger"
                            : "bg-edge"
                    }`}
                    aria-hidden="true"
                  >
                    {m.status === "approved" ? (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                      >
                        <path
                          d="M2.5 7L5.5 10L11.5 4"
                          stroke="white"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : m.status !== "not-started" ? (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                      >
                        <circle
                          cx="7"
                          cy="7"
                          r="5.5"
                          stroke="white"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M7 4.5V7L9 8.5"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    ) : (
                      <div className="w-3 h-3 rounded-full bg-muted/40" />
                    )}
                  </div>

                  {/* Milestone content */}
                  <div
                    className={`flex-1 pb-6 ${
                      i === PROJECT.milestones.length - 1 ? "pb-0" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span
                            style={{ fontFamily: "var(--font-display)" }}
                            className="font-semibold text-ink text-sm"
                          >
                            Milestone {m.id}: {m.name}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded-full ${milestoneStatusStyle[m.status]}`}
                          >
                            {milestoneStatusLabel[m.status]}
                          </span>
                        </div>
                        <p
                          style={{ fontFamily: "var(--font-display)" }}
                          className="text-sm font-semibold text-ink-dim mt-1"
                        >
                          {fmt(m.value)}
                        </p>
                        {m.status === "approved" && m.completedDate && (
                          <p className="text-xs text-muted mt-1">
                            Approved {m.completedDate}
                          </p>
                        )}
                        {m.status === "awaiting-decision" && (
                          <p className="text-xs text-warn mt-1">
                            Evidence submitted {m.submittedDate} &middot;
                            Response due {m.deadline}
                          </p>
                        )}
                        {m.status === "not-started" && (
                          <p className="text-xs text-muted mt-1">
                            Pending previous milestone
                          </p>
                        )}
                        {m.status === "changes-requested" && (
                          <p className="text-xs text-warn mt-1">
                            Customer requested updates before another review.
                          </p>
                        )}
                        {m.status === "disputed" && (
                          <p className="text-xs text-danger mt-1">
                            Decision paused while the dispute is reviewed.
                          </p>
                        )}
                      </div>

                      {(m.status === "awaiting-decision" ||
                        m.status === "changes-requested") && (
                        <button
                          onClick={() => navigate("milestone-review")}
                          className="flex-shrink-0 px-3.5 py-2 bg-brand text-white text-xs font-medium rounded-xl hover:bg-brand/90 transition-all"
                        >
                          {m.status === "changes-requested"
                            ? "View request"
                            : "Open customer review"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Agreement details */}
          <div className={`${CARD} p-5`}>
            <h3
              style={{ fontFamily: "var(--font-display)" }}
              className="text-sm font-semibold text-ink mb-3"
            >
              Agreement details
            </h3>
            <div className="space-y-2.5">
              {[
                { label: "Version", value: PROJECT.agreementVersion },

                {
                  label: PROJECT.agreementStatus === "active" ? "Accepted" : "Status",
                  value:
                    PROJECT.agreementStatus === "active"
                      ? PROJECT.agreementAccepted
                      : "Draft — not yet sent",
                },

                { label: "SME", value: PROJECT.sme },

                { label: "Customer", value: PROJECT.customer },

                { label: "Approver", value: PROJECT.authorizedApprover },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between gap-2 text-sm"
                >
                  <span className="text-muted">{row.label}</span>
                  <span className="text-ink font-medium text-right">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
            {(PROJECT.agreementTitle || PROJECT.agreementScope) && (
              <div className="mt-4 border-t border-edge pt-4">
                {PROJECT.agreementTitle && (
                  <p className="text-sm font-semibold text-ink">{PROJECT.agreementTitle}</p>
                )}
                {PROJECT.agreementScope && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-muted">Scope</p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-dim">{PROJECT.agreementScope}</p>
                  </div>
                )}
                {PROJECT.agreementTerms && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-muted">Decision terms</p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-dim">{PROJECT.agreementTerms}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Variations */}
          <div className={`${CARD} p-5`}>
            <h3
              style={{ fontFamily: "var(--font-display)" }}
              className="text-sm font-semibold text-ink mb-3"
            >
              Variations
            </h3>
            {PROJECT.variations.map((v) => (
              <div
                key={v.id}
                className="rounded-xl bg-brand-light border border-brand-mid p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-brand">
                    Variation {v.id}
                  </p>
                  <span className="text-xs text-brand-mid font-medium bg-brand text-white rounded-full px-2 py-0.5">
                    Approved
                  </span>
                </div>
                <p className="text-xs text-ink-dim mt-1.5 leading-snug">
                  {v.description}
                </p>
                <p className="text-xs text-muted mt-1">
                  {v.approvedDate} &middot;{" "}
                  {v.valueChange ?? "No change to project value"}
                </p>
              </div>
            ))}
            {PROJECT.variations.length === 0 && (
              <p className="text-xs leading-relaxed text-muted">No variations have been recorded.</p>
            )}
          </div>

          {/* Recent activity preview */}
          <div className={`${CARD} p-5`}>
            <h3
              style={{ fontFamily: "var(--font-display)" }}
              className="text-sm font-semibold text-ink mb-3"
            >
              Recent activity
            </h3>
            <div className="space-y-3">
              {ACTIVITY_LOG.slice(0, 4).map((e) => (
                <div key={e.id} className="flex gap-2.5 items-start">
                  <div
                    className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                      e.actorType === "customer"
                        ? "bg-brand"
                        : e.actorType === "system"
                          ? "bg-muted"
                          : "bg-ink"
                    }`}
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-xs text-ink leading-snug">
                      {e.description}
                    </p>
                    <p className="text-xs text-muted mt-0.5">{e.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate("activity")}
              className="mt-3 text-xs text-brand font-medium hover:underline"
            >
              View all activity
            </button>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-muted text-center pt-2">
        TrustPay records agreements, evidence, and decisions. It does not hold
        or transfer money.
      </p>
    </div>
  )
}

import { fmt } from "@/data/mock"
import { useTrustPay } from "@/state/TrustPayContext"
import type { PageProps } from "@/types"
import { useAuth } from "@/state/AuthContext"

const CARD =
  "bg-card rounded-2xl border border-edge shadow-[0_2px_12px_rgba(13,31,64,0.06),0_1px_3px_rgba(13,31,64,0.04)]"

const EvidenceIcon = ({ type }: { type: string }) => {
  if (type === "image") {
    return (
      <div
        className="w-12 h-12 rounded-xl bg-brand-light flex items-center justify-center flex-shrink-0"
        aria-hidden="true"
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect
            x="2"
            y="4"
            width="18"
            height="14"
            rx="2"
            stroke="#2B9B8E"
            strokeWidth="1.5"
          />
          <circle cx="7.5" cy="9" r="2" stroke="#2B9B8E" strokeWidth="1.5" />
          <path
            d="M2 15l5-4 4 3.5 3-2.5 6 5"
            stroke="#2B9B8E"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    )
  }

  return (
    <div
      className="w-12 h-12 rounded-xl bg-danger-light flex items-center justify-center flex-shrink-0"
      aria-hidden="true"
    >
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M6 2h7l5 5v13a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z"
          stroke="#DC2626"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M13 2v5h5"
          stroke="#DC2626"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 13h4M9 10h4"
          stroke="#DC2626"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

export default function MilestoneReview({ navigate }: PageProps) {
  const { project: PROJECT } = useTrustPay()
  const { canDecide: canUserDecide } = useAuth()
  const m = PROJECT.milestones[1]
  const canDecide = canUserDecide && m.status === "awaiting-decision"

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate("project-details")}
            className="mt-1 p-2 rounded-xl hover:bg-edge/60 transition-all text-muted hover:text-ink flex-shrink-0"
            aria-label="Back to project"
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
            <h1
              style={{ fontFamily: "var(--font-display)" }}
              className="text-2xl font-bold text-ink"
            >
              Review Milestone
            </h1>
            <p className="text-muted text-sm mt-1">
              {PROJECT.name} &middot; Milestone {m.id} of{" "}
              {PROJECT.milestones.length} &middot; {m.name}
            </p>
          </div>
        </div>
      </div>

      {/* Response deadline banner */}
      <div className="rounded-2xl bg-warn-light border border-warn/30 px-5 py-4 flex items-center gap-4">
        <div
          className="w-9 h-9 rounded-xl bg-warn/15 flex items-center justify-center flex-shrink-0"
          aria-hidden="true"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="7" stroke="#C97B06" strokeWidth="1.5" />
            <path
              d="M9 5.5V9L11.5 11"
              stroke="#C97B06"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-warn">
            Response required by {m.deadline}
          </p>
          <p className="text-xs text-warn/80 mt-0.5">
            A decision must be recorded before this deadline to maintain the
            project timeline.
          </p>
        </div>
        <span className="px-3 py-1.5 bg-warn text-white text-xs font-semibold rounded-xl flex-shrink-0">
          Awaiting decision
        </span>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-3 gap-6 items-start">
        {/* Left: review content */}
        <div className="col-span-2 space-y-5">
          {/* Submission info */}
          <div className={`${CARD} p-6`}>
            <h2
              style={{ fontFamily: "var(--font-display)" }}
              className="text-base font-semibold text-ink mb-4"
            >
              Submission details
            </h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {[
                { label: "Project", value: PROJECT.name },

                { label: "Milestone", value: `Milestone ${m.id}: ${m.name}` },

                { label: "Milestone value", value: fmt(m.value) },

                { label: "Submitted by", value: m.submittedBy ?? "" },

                { label: "Submitted on", value: m.submittedDate ?? "" },

                {
                  label: "Agreement",
                  value: `${PROJECT.agreementVersion}, accepted ${PROJECT.agreementAccepted}`,
                },

                {
                  label: "Authorized approver",
                  value: PROJECT.authorizedApprover,
                },
              ].map((row) => (
                <div key={row.label} className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted">{row.label}</span>
                  <span className="text-sm font-medium text-ink">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Acceptance criteria */}
          <div className={`${CARD} p-6`}>
            <h2
              style={{ fontFamily: "var(--font-display)" }}
              className="text-base font-semibold text-ink mb-4"
            >
              Acceptance criteria
            </h2>
            <p className="text-xs text-muted mb-3">
              The following criteria were agreed at the time the agreement was
              accepted ({PROJECT.agreementVersion}).
            </p>
            <ul className="space-y-2.5" aria-label="Acceptance criteria">
              {m.criteria?.map((c, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div
                    className="w-5 h-5 rounded-full bg-edge flex items-center justify-center flex-shrink-0 mt-0.5"
                    aria-hidden="true"
                  >
                    <span className="text-[10px] font-bold text-muted">
                      {i + 1}
                    </span>
                  </div>
                  <span className="text-sm text-ink leading-snug">{c}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Required evidence */}
          <div className={`${CARD} p-6`}>
            <h2
              style={{ fontFamily: "var(--font-display)" }}
              className="text-base font-semibold text-ink mb-4"
            >
              Required evidence
            </h2>
            <ul className="space-y-2" aria-label="Required evidence items">
              {m.requiredEvidence?.map((r, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 py-1.5 px-3 rounded-xl bg-edge/40"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    aria-hidden="true"
                  >
                    <rect
                      x="1"
                      y="1"
                      width="12"
                      height="12"
                      rx="2"
                      stroke="#7A7870"
                      strokeWidth="1.2"
                    />
                    <path
                      d="M4 7h6M4 9.5h3"
                      stroke="#7A7870"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="text-sm text-ink-dim">{r}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Submitted evidence */}
          <div className={`${CARD} p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h2
                style={{ fontFamily: "var(--font-display)" }}
                className="text-base font-semibold text-ink"
              >
                Evidence submitted
              </h2>
              <span className="px-2.5 py-1 bg-brand-light text-brand text-xs font-medium rounded-full">
                {m.submittedEvidence?.length} items
              </span>
            </div>

            <div className="space-y-3">
              {m.submittedEvidence?.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-edge hover:border-brand/40 hover:bg-edge/20 transition-all group"
                  tabIndex={0}
                  role="article"
                  aria-label={ev.name}
                >
                  <EvidenceIcon type={ev.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">
                      {ev.name}
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      Uploaded {ev.uploadedAt} &middot; {ev.uploadedBy}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                    <button
                      className="px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand-light rounded-lg transition-all"
                      aria-label={`View ${ev.name}`}
                    >
                      View
                    </button>
                    <button
                      className="px-3 py-1.5 text-xs font-medium text-muted hover:bg-edge rounded-lg transition-all"
                      aria-label={`Download ${ev.name}`}
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Variation history */}
          <div className={`${CARD} p-6`}>
            <h2
              style={{ fontFamily: "var(--font-display)" }}
              className="text-base font-semibold text-ink mb-4"
            >
              Variation history
            </h2>
            {PROJECT.variations.map((v) => (
              <div
                key={v.id}
                className="rounded-xl border border-brand-mid bg-brand-light p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      Variation {v.id}
                    </p>
                    <p className="text-sm text-ink-dim mt-1 leading-snug">
                      {v.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-muted">
                        Approved {v.approvedDate}
                      </span>
                      <span className="text-xs text-brand font-medium">
                        {v.valueChange ?? "No change to project value"}
                      </span>
                    </div>
                  </div>
                  <span className="flex-shrink-0 px-2 py-0.5 bg-brand text-white text-xs font-medium rounded-full">
                    Approved
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: sticky decision panel */}
        <div className="sticky top-0 space-y-4">
          {/* Milestone summary card */}
          <div className={`${CARD} p-5`}>
            <p className="text-xs text-muted uppercase tracking-wider font-medium mb-3">
              Milestone summary
            </p>
            <div className="space-y-2.5">
              {[
                { label: "Milestone value", value: fmt(m.value), bold: true },

                { label: "Project", value: PROJECT.name },

                { label: "Customer", value: PROJECT.customer },

                { label: "Approver", value: PROJECT.authorizedApprover },

                { label: "Submitted", value: m.submittedDate ?? "" },

                {
                  label: "Agreement",
                  value: `${PROJECT.agreementVersion} &middot; ${PROJECT.agreementAccepted}`,
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between gap-2 text-sm"
                >
                  <span className="text-muted">{row.label}</span>
                  <span
                    style={
                      row.bold ? { fontFamily: "var(--font-display)" } : {}
                    }
                    className={`text-right ${
                      row.bold
                        ? "font-semibold text-ink text-base"
                        : "font-medium text-ink"
                    }`}
                  >
                    {row.label === "Agreement"
                      ? `${PROJECT.agreementVersion} · ${PROJECT.agreementAccepted}`
                      : row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Decision explanations */}
          <div className={`${CARD} p-5`}>
            <p className="text-xs text-muted uppercase tracking-wider font-medium mb-3">
              About your decision
            </p>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div
                  className="w-2 h-2 rounded-full bg-brand flex-shrink-0 mt-1.5"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-xs font-semibold text-ink">Approve</p>
                  <p className="text-xs text-muted mt-0.5 leading-snug">
                    Records that this milestone meets the agreed acceptance
                    criteria. Any payment is handled externally.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div
                  className="w-2 h-2 rounded-full bg-warn flex-shrink-0 mt-1.5"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-xs font-semibold text-ink">
                    Request changes
                  </p>
                  <p className="text-xs text-muted mt-0.5 leading-snug">
                    Returns the milestone to the SME with specific comments and
                    a response date.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div
                  className="w-2 h-2 rounded-full bg-danger flex-shrink-0 mt-1.5"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-xs font-semibold text-ink">
                    Raise dispute
                  </p>
                  <p className="text-xs text-muted mt-0.5 leading-snug">
                    Records a formal disagreement, preserves all submitted
                    evidence, and pauses the decision.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {canDecide ? (
            <div className="space-y-2.5">
              <button
                onClick={() => navigate("confirm-approval")}
                className="w-full px-4 py-3 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand/90 active:scale-[0.99] transition-all focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 flex items-center justify-center gap-2"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2.5 8L6 11.5L13.5 4"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Approve milestone
              </button>
              <button
                onClick={() => navigate("request-changes")}
                className="w-full px-4 py-3 border border-edge text-ink text-sm font-semibold rounded-xl hover:bg-edge/50 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 10V14h4L13 7a1.41 1.41 0 10-2-2L4 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Request changes
              </button>
              <button
                onClick={() => navigate("raise-dispute")}
                className="w-full px-4 py-3 border border-danger/30 text-danger text-sm font-semibold rounded-xl hover:bg-danger-light active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M8 2L1.5 13.5h13L8 2z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 6.5V9.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
                </svg>
                Raise dispute
              </button>
            </div>
          ) : (
            <div
              className={`rounded-2xl border p-5 ${
                m.status === "approved"
                  ? "border-brand/25 bg-brand-light"
                  : m.status === "disputed"
                    ? "border-danger/25 bg-danger-light"
                    : "border-warn/30 bg-warn-light"
              }`}
            >
              <p className="text-sm font-semibold text-ink">
                {!canUserDecide && m.status === "awaiting-decision"
                  ? "Read-only milestone access"
                  : m.status === "approved"
                  ? "This milestone has been approved"
                  : m.status === "disputed"
                    ? "This milestone is under dispute"
                    : "Changes have been requested"}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-dim">
                {!canUserDecide && m.status === "awaiting-decision"
                  ? `Only ${PROJECT.authorizedApprover}, the assigned customer approver, can record this decision.`
                  : m.status === "approved"
                  ? "The decision is recorded in the activity log."
                  : m.status === "disputed"
                    ? "Further decisions are paused until the dispute is resolved."
                    : "A new decision can be made after the SME submits updated evidence."}
              </p>
              <button
                onClick={() => navigate("project-details")}
                className="mt-4 w-full rounded-xl border border-edge bg-card px-4 py-2.5 text-sm font-semibold text-ink hover:bg-edge/40"
              >
                Return to project
              </button>
            </div>
          )}

          <p className="text-xs text-muted text-center leading-snug">
            TrustPay records agreements, evidence, and decisions. It does not
            hold or transfer money.
          </p>
        </div>
      </div>
    </div>
  )
}

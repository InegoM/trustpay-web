import { fmt } from "@/data/mock"
import { useTrustPay } from "@/state/TrustPayContext"
import type { PageProps } from "@/types"

const CARD =
  "bg-card rounded-2xl border border-edge shadow-[0_2px_12px_rgba(13,31,64,0.06),0_1px_3px_rgba(13,31,64,0.04)]"

export default function MilestoneApproved({ navigate }: PageProps) {
  const { project: PROJECT, lastDecision } = useTrustPay()
  const m = PROJECT.milestones[1]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Success icon + heading */}
      <div className="flex flex-col items-center text-center pt-4 pb-2">
        <div
          className="w-16 h-16 rounded-2xl bg-brand-light flex items-center justify-center shadow-[0_4px_20px_rgba(43,155,142,0.2)] mb-5"
          aria-hidden="true"
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="13" fill="#2B9B8E" />
            <path
              d="M9 16.5L13.5 21L23 11"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1
          style={{ fontFamily: "var(--font-display)" }}
          className="text-3xl font-bold text-ink"
        >
          Milestone approved
        </h1>
        <p className="text-muted text-base mt-2">
          Your decision has been recorded.
        </p>
      </div>

      {/* Decision record */}
      <div className={`${CARD} p-6`}>
        <h2
          style={{ fontFamily: "var(--font-display)" }}
          className="text-base font-semibold text-ink mb-5"
        >
          Decision record
        </h2>
        <div className="space-y-3">
          {[
            { label: "Project", value: PROJECT.name },

            { label: "Customer", value: PROJECT.customer },

            { label: "Milestone", value: `Milestone ${m.id}: ${m.name}` },

            { label: "Milestone value", value: fmt(m.value) },

            { label: "Approver", value: PROJECT.authorizedApprover },

            { label: "Recorded", value: lastDecision?.recordedAt ?? "Recorded" },

            { label: "Reference", value: lastDecision?.reference ?? "Reference unavailable" },
          ].map((row) => (
            <div
              key={row.label}
              className="flex justify-between gap-4 py-2 border-b border-edge last:border-0"
            >
              <span className="text-muted text-sm">{row.label}</span>
              <span
                className={`text-sm font-medium text-ink text-right ${
                  row.label === "Reference"
                    ? "font-mono text-xs bg-edge px-2 py-1 rounded-lg"
                    : row.label === "Milestone value"
                      ? "font-semibold"
                      : ""
                }`}
                style={
                  row.label === "Milestone value"
                    ? { fontFamily: "var(--font-display)" }
                    : {}
                }
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* What this means */}
      <div className="rounded-2xl bg-brand-light border border-brand-mid p-5">
        <p className="text-sm text-ink leading-relaxed">
          TrustPay recorded your acceptance of{" "}
          <strong>
            Milestone {m.id}: {m.name}
          </strong>
          . The submitted evidence, acceptance criteria, and this decision are
          now permanently on record. Any payment associated with this milestone
          is handled externally.
        </p>
      </div>

      {/* Next steps */}
      <div className={`${CARD} p-5`}>
        <h3
          style={{ fontFamily: "var(--font-display)" }}
          className="text-sm font-semibold text-ink mb-3"
        >
          What happens next
        </h3>
        <ul className="space-y-2.5">
          {[
            "Both parties have received confirmation of this recorded decision.",

            "Milestone 3 (Finishing and handover — AED 27,000) can now proceed.",

            "Your decision record is available to download below.",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-ink-dim">
              <div
                className="w-5 h-5 rounded-full bg-brand-light flex items-center justify-center flex-shrink-0 mt-0.5"
                aria-hidden="true"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M2 5L4 7L8 3"
                    stroke="#2B9B8E"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="leading-snug">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          className="px-5 py-3 border border-edge text-ink text-sm font-medium rounded-xl hover:bg-edge/50 transition-all flex items-center gap-2"
          aria-label="Download decision record"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M8 2v8M5 7l3 3 3-3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 12h12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          Download decision record
        </button>
        <button
          onClick={() => navigate("project-details")}
          className="flex-1 px-5 py-3 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand/90 active:scale-[0.99] transition-all"
        >
          Return to project
        </button>
      </div>

      <p className="text-xs text-muted text-center">
        Reference: {lastDecision?.reference ?? "unavailable"} &middot; TrustPay records agreements,
        evidence, and decisions. It does not hold or transfer money.
      </p>
    </div>
  )
}

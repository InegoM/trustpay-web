import { useState } from "react"

import { useTrustPay } from "@/state/TrustPayContext"
import type { PageProps } from "@/types"

const CARD =
  "bg-card rounded-2xl border border-edge shadow-[0_2px_12px_rgba(13,31,64,0.06),0_1px_3px_rgba(13,31,64,0.04)]"

const REASONS = [
  "Work does not meet acceptance criteria",

  "Evidence is incomplete or unclear",

  "Incorrect scope or specification",

  "Quality does not match agreement",

  "Other",
]

export default function RequestChanges({ navigate }: PageProps) {
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [reason, setReason] = useState("Evidence is incomplete or unclear")

  const [comment, setComment] = useState(
    "Please relocate the two outlet boxes beside the service counter and upload close-up evidence after correction.",
  )

  const [responseDate, setResponseDate] = useState("2026-08-30")
  const { project: PROJECT, requestChanges, lastDecision } = useTrustPay()
  const m = PROJECT.milestones[1]

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Result */}
        <div className="flex flex-col items-center text-center pt-4 pb-2">
          <div
            className="w-16 h-16 rounded-2xl bg-warn-light flex items-center justify-center shadow-[0_4px_20px_rgba(201,123,6,0.15)] mb-5"
            aria-hidden="true"
          >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="13" fill="#C97B06" />
              <path
                d="M10 14l4 4 8-8"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M22 10l-6 6"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h1
            style={{ fontFamily: "var(--font-display)" }}
            className="text-3xl font-bold text-ink"
          >
            Changes requested
          </h1>
          <p className="text-muted text-base mt-2">
            Your change request has been recorded.
          </p>
        </div>

        <div className={`${CARD} p-6`}>
          <div className="space-y-3">
            {[
              { label: "Project", value: PROJECT.name },

              { label: "Milestone", value: `Milestone ${m.id}: ${m.name}` },

              { label: "Requested by", value: PROJECT.authorizedApprover },

              { label: "Response due", value: "30 August 2026" },

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
                      : ""
                  }`}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-warn-light border border-warn/30 p-5">
          <p className="text-sm font-semibold text-warn mb-2">
            What happens next
          </p>
          <ul className="space-y-1.5 text-sm text-ink-dim">
            <li className="flex items-start gap-2">
              <span className="text-warn mt-0.5">&#8250;</span>
              Alba Fit-Out has been notified of the required changes.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-warn mt-0.5">&#8250;</span>
              They must resubmit evidence by{" "}
              <strong className="text-ink">30 August 2026</strong>.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-warn mt-0.5">&#8250;</span>
              You will receive a notification when updated evidence is available
              for review.
            </li>
          </ul>
        </div>

        <button
          onClick={() => navigate("project-details")}
          className="w-full px-5 py-3 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand/90 transition-all"
        >
          Return to project
        </button>

        <p className="text-xs text-muted text-center">
          TrustPay records agreements, evidence, and decisions. It does not hold
          or transfer money.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate("milestone-review")}
          className="mt-1 p-2 rounded-xl hover:bg-edge/60 transition-all text-muted hover:text-ink flex-shrink-0"
          aria-label="Go back to milestone review"
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
            Request Changes
          </h1>
          <p className="text-muted text-sm mt-1">
            {PROJECT.name} &middot; Milestone {m.id}: {m.name}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className={`${CARD} p-6 space-y-5`}>
        {/* Reason category */}
        <div>
          <label
            className="block text-sm font-medium text-ink mb-2"
            htmlFor="reason"
          >
            Reason for change request <span className="text-danger">*</span>
          </label>
          <select
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-canvas border border-edge rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-all"
          >
            {REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Required changes */}
        <div>
          <label
            className="block text-sm font-medium text-ink mb-2"
            htmlFor="comment"
          >
            Required changes <span className="text-danger">*</span>
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={5}
            className="w-full px-3.5 py-2.5 bg-canvas border border-edge rounded-xl text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-all resize-none leading-relaxed"
            placeholder="Describe the specific changes required..."
          />
          <p className="text-xs text-muted mt-1.5">
            Be specific. Alba Fit-Out will use this to address the issues and
            resubmit.
          </p>
        </div>

        {/* Supporting attachment */}
        <div>
          <label className="block text-sm font-medium text-ink mb-2">
            Supporting attachment{" "}
            <span className="text-muted font-normal">(optional)</span>
          </label>
          <div className="border-2 border-dashed border-edge rounded-xl p-6 flex flex-col items-center justify-center gap-2 hover:border-brand/40 hover:bg-edge/20 transition-all cursor-pointer">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M12 16V8M8 12l4-4 4 4"
                stroke="#7A7870"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
                stroke="#7A7870"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <p className="text-sm text-muted">
              Drop a file here or{" "}
              <span className="text-brand font-medium">browse</span>
            </p>
            <p className="text-xs text-muted">PDF, images, or documents</p>
          </div>
        </div>

        {/* Requested response date */}
        <div>
          <label
            className="block text-sm font-medium text-ink mb-2"
            htmlFor="response-date"
          >
            Requested response date <span className="text-danger">*</span>
          </label>
          <input
            id="response-date"
            type="date"
            value={responseDate}
            onChange={(e) => setResponseDate(e.target.value)}
            min="2026-08-20"
            className="px-3.5 py-2.5 bg-canvas border border-edge rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-all"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("milestone-review")}
          className="px-5 py-3 border border-edge text-ink text-sm font-medium rounded-xl hover:bg-edge/50 transition-all"
        >
          Cancel
        </button>
        <button
          onClick={async () => {
            if (
              reason.trim() &&
              comment.trim() &&
              responseDate
            ) {
              setIsSubmitting(true)
              if (await requestChanges(m.id, { reason, comment, responseDate })) {
                setSubmitted(true)
              } else {
                setIsSubmitting(false)
              }
            }
          }}
          disabled={
            isSubmitting || !reason.trim() || !comment.trim() || !responseDate
          }
          className="flex-1 px-5 py-3 bg-warn text-white text-sm font-semibold rounded-xl hover:bg-warn/90 active:scale-[0.99] transition-all focus-visible:ring-2 focus-visible:ring-warn focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Recording request…" : "Submit change request"}
        </button>
      </div>

      <p className="text-xs text-muted text-center">
        TrustPay records agreements, evidence, and decisions. It does not hold
        or transfer money.
      </p>
    </div>
  )
}

import { useState } from "react";

import { useTrustPay } from "@/state/TrustPayContext";
import type { MilestonePageProps } from "@/types";

const CARD =
  "bg-card rounded-2xl border border-edge shadow-[0_2px_12px_rgba(13,31,64,0.06),0_1px_3px_rgba(13,31,64,0.04)]";

export default function RaiseDispute({ navigate, milestoneId, showResult }: MilestonePageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [disputeReason, setDisputeReason] = useState(
    "Work does not match the approved electrical layout.",
  );

  const [explanation, setExplanation] = useState("");

  const { project: PROJECT, raiseDispute, lastDecision } = useTrustPay();
  const m = PROJECT.milestones.find((item) => item.id === milestoneId)!;

  if (showResult) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex flex-col items-center text-center pt-4 pb-2">
          <div
            className="w-16 h-16 rounded-2xl bg-danger-light flex items-center justify-center shadow-[0_4px_20px_rgba(220,38,38,0.12)] mb-5"
            aria-hidden="true"
          >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="13" fill="#DC2626" />
              <path d="M16 10v7" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="16" cy="21.5" r="1.5" fill="white" />
            </svg>
          </div>
          <h1 style={{ fontFamily: "var(--font-display)" }} className="text-3xl font-bold text-ink">
            Dispute recorded
          </h1>
          <p className="text-muted text-base mt-2">
            The dispute has been formally recorded. The milestone decision is paused.
          </p>
        </div>

        <div className={`${CARD} p-6`}>
          <div className="space-y-3">
            {[
              { label: "Project", value: PROJECT.name },

              { label: "Milestone", value: `Milestone ${m.sequenceNumber}: ${m.name}` },

              { label: "Raised by", value: PROJECT.authorizedApprover },

              { label: "Recorded", value: lastDecision?.recordedAt ?? "Recorded" },

              { label: "Next step", value: "Mediator site inspection" },

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

        <div className="rounded-2xl bg-danger-light border border-danger/20 p-5">
          <p className="text-sm font-semibold text-danger mb-2">Dispute status</p>
          <ul className="space-y-2 text-sm text-ink-dim">
            {[
              "The milestone decision is paused. No approval or rejection has been recorded.",

              "All submitted evidence and agreement details are preserved on record.",

              "Both parties will be contacted regarding the next steps.",

              "The next step is a mediator site inspection.",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 leading-snug">
                <span className="text-danger mt-0.5 flex-shrink-0">&#8250;</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={() => navigate("project-details")}
          className="w-full px-5 py-3 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand/90 transition-all"
        >
          Return to project
        </button>

        <p className="text-xs text-muted text-center">
          TrustPay records agreements, evidence, and decisions. It does not hold or transfer money.
        </p>
      </div>
    );
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
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
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
          <h1 style={{ fontFamily: "var(--font-display)" }} className="text-2xl font-bold text-ink">
            Raise Dispute
          </h1>
          <p className="text-muted text-sm mt-1">
            {PROJECT.name} &middot; Milestone {m.sequenceNumber}: {m.name}
          </p>
        </div>
      </div>

      {/* Warning banner */}
      <div className="rounded-2xl bg-danger-light border border-danger/25 p-5 flex gap-4">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          className="flex-shrink-0 mt-0.5"
          aria-hidden="true"
        >
          <path
            d="M10 2L1.5 17.5h17L10 2z"
            stroke="#DC2626"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M10 8v5" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="10" cy="15" r="0.75" fill="#DC2626" />
        </svg>
        <div>
          <p className="text-sm font-semibold text-danger">Before you proceed</p>
          <p className="text-sm text-ink-dim mt-1 leading-relaxed">
            Raising a dispute formally pauses the milestone decision. The agreement, submitted
            evidence, and all records are preserved. The next step may involve a mediator or site
            inspection. This action cannot be undone.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className={`${CARD} p-6 space-y-5`}>
        {/* Dispute reason */}
        <div>
          <label className="block text-sm font-medium text-ink mb-2" htmlFor="dispute-reason">
            Dispute reason <span className="text-danger">*</span>
          </label>
          <input
            id="dispute-reason"
            type="text"
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-canvas border border-edge rounded-xl text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-danger/30 focus:border-danger transition-all"
            placeholder="Brief description of the dispute reason..."
          />
        </div>

        {/* Detailed explanation */}
        <div>
          <label className="block text-sm font-medium text-ink mb-2" htmlFor="explanation">
            Detailed explanation <span className="text-danger">*</span>
          </label>
          <textarea
            id="explanation"
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={5}
            placeholder="Provide a detailed explanation of the dispute, referencing specific acceptance criteria or submitted evidence where possible..."
            className="w-full px-3.5 py-2.5 bg-canvas border border-edge rounded-xl text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-danger/30 focus:border-danger transition-all resize-none leading-relaxed"
          />
        </div>

        {/* Supporting attachment */}
        <div>
          <label className="block text-sm font-medium text-ink mb-2">
            Supporting documentation <span className="text-muted font-normal">(optional)</span>
          </label>
          <div className="border-2 border-dashed border-edge rounded-xl p-6 flex flex-col items-center justify-center gap-2 hover:border-danger/30 hover:bg-edge/20 transition-all cursor-pointer">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
              Drop a file here or <span className="text-brand font-medium">browse</span>
            </p>
          </div>
        </div>

        {/* Consequences explanation */}
        <div className="rounded-xl bg-edge/40 p-4 space-y-2">
          <p className="text-xs font-semibold text-ink uppercase tracking-wide">
            Consequences of raising a dispute
          </p>
          <ul className="space-y-1.5 text-xs text-ink-dim">
            <li className="flex items-start gap-2">
              <span className="text-muted mt-0.5">&#8250;</span>
              The milestone decision is paused — no approval or rejection is recorded.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-muted mt-0.5">&#8250;</span>
              All submitted evidence and agreement details are preserved.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-muted mt-0.5">&#8250;</span>A mediator or site inspection may be
              required to resolve the dispute.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-muted mt-0.5">&#8250;</span>
              TrustPay does not hold or release any funds — payment is handled externally.
            </li>
          </ul>
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
            if (disputeReason.trim() && explanation.trim()) {
              setIsSubmitting(true);
              if (
                await raiseDispute(m.id, {
                  reason: disputeReason,
                  explanation,
                })
              ) {
                navigate("raise-dispute-result");
              } else {
                setIsSubmitting(false);
              }
            }
          }}
          disabled={isSubmitting || !disputeReason.trim() || !explanation.trim()}
          className="flex-1 px-5 py-3 bg-danger text-white text-sm font-semibold rounded-xl hover:bg-danger/90 active:scale-[0.99] transition-all focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Recording dispute…" : "Record dispute"}
        </button>
      </div>

      <p className="text-xs text-muted text-center">
        TrustPay records agreements, evidence, and decisions. It does not hold or transfer money.
      </p>
    </div>
  );
}

import { useEffect, useState } from "react";

import { listSubmissions, type ApiMilestoneSubmission } from "@/api/trustpay";
import { fmt } from "@/data/mock";
import { useTrustPay } from "@/state/TrustPayContext";
import type { MilestonePageProps } from "@/types";

const CARD =
  "bg-card rounded-2xl border border-edge shadow-[0_2px_12px_rgba(13,31,64,0.06),0_1px_3px_rgba(13,31,64,0.04)]";

export default function ConfirmApproval({ navigate, milestoneId }: MilestonePageProps) {
  const [checked, setChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { project: PROJECT, approveMilestone } = useTrustPay();
  const m = PROJECT.milestones.find((item) => item.id === milestoneId)!;
  const [submission, setSubmission] = useState<ApiMilestoneSubmission | null>(null);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
  const [evidenceLoading, setEvidenceLoading] = useState(true);

  useEffect(() => {
    setEvidenceLoading(true);
    setEvidenceError(null);
    void listSubmissions(PROJECT.id, milestoneId)
      .then((items) => {
        const submitted = items.find((item) => item.status === "submitted") ?? null;
        setSubmission(submitted);
        if (!submitted) setEvidenceError("The submitted evidence package is unavailable.");
      })
      .catch((cause) => {
        setSubmission(null);
        setEvidenceError(
          cause instanceof Error ? cause.message : "The evidence package could not be loaded.",
        );
      })
      .finally(() => setEvidenceLoading(false));
  }, [PROJECT.id, milestoneId]);

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
            Confirm Milestone Approval
          </h1>
          <p className="text-muted text-sm mt-1">
            Please review the details below before recording your decision.
          </p>
        </div>
      </div>

      {/* Summary card */}
      <div className={`${CARD} p-6`}>
        <h2
          style={{ fontFamily: "var(--font-display)" }}
          className="text-base font-semibold text-ink mb-5"
        >
          Approval summary
        </h2>

        <div className="space-y-3">
          {[
            { label: "Project", value: PROJECT.name },

            { label: "Customer", value: PROJECT.customer },

            {
              label: "Milestone",
              value: `Milestone ${m.sequenceNumber} of ${PROJECT.milestones.length}: ${m.name}`,
            },

            { label: "Milestone value", value: fmt(m.value) },

            {
              label: "Agreement",
              value: `${PROJECT.agreementVersion}, accepted ${PROJECT.agreementAccepted}`,
            },

            { label: "Submitted by", value: m.submittedBy ?? "" },

            { label: "Authorized approver", value: PROJECT.authorizedApprover },
          ].map((row) => (
            <div
              key={row.label}
              className="flex justify-between gap-4 py-2 border-b border-edge last:border-0"
            >
              <span className="text-muted text-sm">{row.label}</span>
              <span
                className={`text-sm font-medium text-ink text-right ${
                  row.label === "Milestone value" ? "font-semibold text-base" : ""
                }`}
                style={row.label === "Milestone value" ? { fontFamily: "var(--font-display)" } : {}}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Evidence reviewed */}
      <div className={`${CARD} p-6`}>
        <h2
          style={{ fontFamily: "var(--font-display)" }}
          className="text-base font-semibold text-ink mb-4"
        >
          Evidence reviewed
        </h2>
        <ul className="space-y-2">
          {evidenceLoading && <li className="text-sm text-muted">Loading submitted evidence…</li>}
          {evidenceError && (
            <li
              className="rounded-xl border border-danger/30 bg-danger-light p-3 text-sm text-danger"
              role="alert"
            >
              {evidenceError} Return to the review screen and retry before approving.
            </li>
          )}
          {submission?.evidence.map((ev) => (
            <li
              key={ev.id}
              className="flex items-center gap-3 text-sm py-1.5 px-3 rounded-xl bg-edge/40"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path
                  d="M2 7L5 10L12 4"
                  stroke="#2B9B8E"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-ink">{ev.originalName}</span>
              <span className="text-muted text-xs ml-auto">
                {new Intl.DateTimeFormat("en-AE", {
                  dateStyle: "medium",
                  timeZone: "Asia/Dubai",
                }).format(new Date(ev.uploadedAt))}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Decision consequence */}
      <div className="rounded-2xl bg-brand-light border border-brand-mid p-5">
        <div className="flex gap-3">
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            className="flex-shrink-0 mt-0.5"
            aria-hidden="true"
          >
            <circle cx="9" cy="9" r="7" stroke="#2B9B8E" strokeWidth="1.5" />
            <path d="M9 6v4M9 12.5v.5" stroke="#2B9B8E" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-brand">What this records</p>
            <p className="text-sm text-ink-dim mt-1 leading-relaxed">
              Selecting <strong className="text-ink">Confirm approval</strong> records your decision
              that{" "}
              <strong className="text-ink">
                Milestone {m.sequenceNumber}: {m.name}
              </strong>{" "}
              meets the agreed acceptance criteria. This decision is logged with your identity, the
              timestamp, and a reference number. Any payment associated with this milestone is
              handled externally.
            </p>
          </div>
        </div>
      </div>

      {/* Checkbox */}
      <div className={`${CARD} p-5 ${checked ? "border-brand" : ""} transition-all`}>
        <label className="flex items-start gap-4 cursor-pointer select-none">
          <div
            className={`w-5 h-5 rounded-md border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
              checked ? "bg-brand border-brand" : "border-edge hover:border-brand/50"
            }`}
            aria-hidden="true"
          >
            {checked && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M1.5 6L4.5 9L10.5 3"
                  stroke="white"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
          <input
            type="checkbox"
            className="sr-only"
            checked={checked}
            onChange={(event) => setChecked(event.target.checked)}
            aria-required="true"
          />
          <p className="text-sm text-ink leading-relaxed">
            I confirm that I am authorized to approve this milestone and that the submitted work
            meets the agreed acceptance criteria as defined in Agreement {PROJECT.agreementVersion}.
          </p>
        </label>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={() => navigate("milestone-review")}
          className="px-5 py-3 border border-edge text-ink text-sm font-medium rounded-xl hover:bg-edge/50 transition-all"
        >
          Go back
        </button>
        <button
          onClick={async () => {
            if (!checked || !submission || evidenceLoading || evidenceError || isSubmitting) return;
            setIsSubmitting(true);
            if (await approveMilestone(m.id)) {
              navigate("milestone-approved");
            } else {
              setIsSubmitting(false);
            }
          }}
          disabled={
            !checked || !submission || evidenceLoading || Boolean(evidenceError) || isSubmitting
          }
          className={`flex-1 px-5 py-3 text-sm font-semibold rounded-xl transition-all ${
            checked && submission && !evidenceLoading && !evidenceError && !isSubmitting
              ? "bg-brand text-white hover:bg-brand/90 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              : "bg-edge text-muted cursor-not-allowed"
          }`}
          aria-disabled={
            !checked || !submission || evidenceLoading || Boolean(evidenceError) || isSubmitting
          }
        >
          {isSubmitting ? "Recording approval…" : "Confirm approval"}
        </button>
      </div>

      <p className="text-xs text-muted text-center">
        TrustPay records agreements, evidence, and decisions. It does not hold or transfer money.
      </p>
    </div>
  );
}

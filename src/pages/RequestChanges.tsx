import { type KeyboardEvent, useEffect, useRef, useState } from "react";

import { listSubmissions, type ApiMilestoneSubmission } from "@/api/trustpay";
import { useTrustPay } from "@/state/TrustPayContext";
import type { MilestonePageProps } from "@/types";

const CARD =
  "rounded-2xl border border-edge bg-card shadow-[0_2px_12px_rgba(13,31,64,0.06),0_1px_3px_rgba(13,31,64,0.04)]";
const REASONS = [
  "Work does not meet acceptance criteria",
  "Evidence is incomplete or unclear",
  "Incorrect scope or specification",
  "Quality does not match agreement",
  "Other",
];

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-AE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Dubai",
  }).format(new Date(`${value}T00:00:00Z`));

export default function RequestChanges({ navigate, milestoneId, showResult }: MilestonePageProps) {
  const { project, requestChanges, lastDecision } = useTrustPay();
  const milestone = project.milestones.find((item) => item.id === milestoneId)!;
  const [submission, setSubmission] = useState<ApiMilestoneSubmission | null>(null);
  const [loading, setLoading] = useState(!showResult);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState(REASONS[0]);
  const [comment, setComment] = useState("");
  const [responseDate, setResponseDate] = useState("");
  const [criteria, setCriteria] = useState<string[]>([]);
  const [evidence, setEvidence] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);
  const openButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (showResult) return;
    void listSubmissions(project.id, milestoneId)
      .then((items) => {
        setSubmission(items.find((item) => item.status === "submitted") ?? null);
      })
      .catch((cause) =>
        setError(
          cause instanceof Error ? cause.message : "The evidence package could not be loaded.",
        ),
      )
      .finally(() => setLoading(false));
  }, [milestoneId, project.id, showResult]);

  useEffect(() => {
    if (confirming) cancelButton.current?.focus();
  }, [confirming]);

  const toggle = (value: string, current: string[], setCurrent: (next: string[]) => void) => {
    setCurrent(
      current.includes(value) ? current.filter((id) => id !== value) : [...current, value],
    );
  };
  const close = () => {
    if (submitting) return;
    setConfirming(false);
    window.requestAnimationFrame(() => openButton.current?.focus());
  };
  const trapFocus = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = dialog.current?.querySelectorAll<HTMLElement>(
      "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])",
    );
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  const record = async () => {
    setSubmitting(true);
    if (
      await requestChanges(milestoneId, {
        reason,
        comment: comment.trim(),
        responseDate,
        ...(criteria.length ? { acceptanceCriterionIds: criteria } : {}),
        ...(evidence.length ? { evidenceItemIds: evidence } : {}),
      })
    ) {
      navigate("request-changes-result");
    } else {
      setSubmitting(false);
      setConfirming(false);
    }
  };

  if (showResult) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="pt-4 text-center">
          <p className="text-sm font-semibold text-warn">Change request recorded</p>
          <h1 className="mt-2 text-3xl font-bold text-ink">The SME can now respond and resubmit</h1>
          <p className="mt-3 text-sm text-muted">
            The original evidence package remains available in the project record.
          </p>
        </header>
        <section className={`${CARD} p-6`}>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-edge pb-3">
              <dt className="text-muted">Milestone</dt>
              <dd className="text-right font-medium text-ink">{milestone.name}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-edge pb-3">
              <dt className="text-muted">Response requested by</dt>
              <dd className="text-right font-medium text-ink">
                {lastDecision?.responseDate
                  ? formatDate(lastDecision.responseDate)
                  : "Recorded in the request"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Decision reference</dt>
              <dd className="font-mono text-xs text-ink">
                {lastDecision?.reference ?? "Reference unavailable"}
              </dd>
            </div>
          </dl>
        </section>
        <button
          onClick={() => navigate("project-details")}
          className="w-full rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white"
        >
          Return to project
        </button>
      </div>
    );
  }

  const invalid = !comment.trim() || !responseDate || !submission;
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-start gap-3">
        <button
          onClick={() => navigate("milestone-review")}
          className="rounded-xl p-2 text-muted hover:bg-edge/60"
          aria-label="Back to milestone review"
        >
          ←
        </button>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-warn">
            Customer decision
          </p>
          <h1 className="mt-1 text-2xl font-bold text-ink">Request changes</h1>
          <p className="mt-1 text-sm text-muted">
            {project.name} · Milestone {milestone.sequenceNumber}: {milestone.name}
          </p>
        </div>
      </header>
      {error && (
        <div
          className="rounded-xl border border-danger/30 bg-danger-light p-4 text-sm text-danger"
          role="alert"
        >
          {error}
        </div>
      )}
      {loading ? (
        <div className={`${CARD} p-8 text-center text-sm text-muted`} role="status">
          Loading the submitted evidence package…
        </div>
      ) : !submission ? (
        <div className={`${CARD} p-8 text-center text-sm text-muted`}>
          There is no submitted evidence package available to decide.
        </div>
      ) : (
        <>
          <section className={`${CARD} space-y-5 p-5 sm:p-6`}>
            <div>
              <label className="text-sm font-medium text-ink" htmlFor="reason">
                Reason category
              </label>
              <select
                id="reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="mt-2 w-full rounded-xl border border-edge bg-card p-3 text-sm text-ink"
              >
                {REASONS.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-ink" htmlFor="required-changes">
                Required changes <span className="text-danger">*</span>
              </label>
              <textarea
                id="required-changes"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                maxLength={2000}
                rows={5}
                className="mt-2 w-full rounded-xl border border-edge bg-card p-3 text-sm text-ink"
                placeholder="Describe the specific work or evidence that must be corrected."
              />
              <p className="mt-1 text-xs text-muted">
                This becomes a permanent, visible part of the milestone record.
              </p>
            </div>
            <label className="block text-sm font-medium text-ink" htmlFor="response-date">
              Requested response date <span className="text-danger">*</span>
              <input
                id="response-date"
                type="date"
                value={responseDate}
                onChange={(event) => setResponseDate(event.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                className="mt-2 block rounded-xl border border-edge bg-card p-3 text-sm text-ink"
              />
            </label>
          </section>
          <section className={`${CARD} p-5 sm:p-6`} aria-labelledby="references-title">
            <h2 id="references-title" className="text-base font-semibold text-ink">
              Reference the affected record
            </h2>
            <p className="mt-1 text-sm text-muted">
              Optional references help the SME identify what needs to change.
            </p>
            <fieldset className="mt-4">
              <legend className="text-sm font-medium text-ink">Acceptance criteria</legend>
              <div className="mt-2 space-y-2">
                {(milestone.criteriaDetailed ?? []).map((criterion) => (
                  <label
                    key={criterion.id}
                    className="flex cursor-pointer gap-3 rounded-xl border border-edge p-3 text-sm text-ink"
                  >
                    <input
                      type="checkbox"
                      checked={criteria.includes(criterion.id)}
                      onChange={() => toggle(criterion.id, criteria, setCriteria)}
                    />
                    <span>
                      {criterion.position}. {criterion.description}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="mt-5">
              <legend className="text-sm font-medium text-ink">
                Evidence items in Submission #{submission.submissionNumber}
              </legend>
              <div className="mt-2 space-y-2">
                {submission.evidence.length ? (
                  submission.evidence.map((item) => (
                    <label
                      key={item.id}
                      className="flex cursor-pointer gap-3 rounded-xl border border-edge p-3 text-sm text-ink"
                    >
                      <input
                        type="checkbox"
                        checked={evidence.includes(item.id)}
                        onChange={() => toggle(item.id, evidence, setEvidence)}
                      />
                      <span>{item.originalName}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-muted">
                    No individual evidence items are available to reference.
                  </p>
                )}
              </div>
            </fieldset>
          </section>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button
              onClick={() => navigate("milestone-review")}
              className="rounded-xl border border-edge px-5 py-3 text-sm font-semibold text-ink"
            >
              Cancel
            </button>
            <button
              ref={openButton}
              disabled={invalid}
              onClick={() => setConfirming(true)}
              className="rounded-xl bg-warn px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Review change request
            </button>
          </div>
        </>
      )}
      {confirming && submission && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-change-title"
          ref={dialog}
          onKeyDown={trapFocus}
        >
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
            <h2 id="confirm-change-title" className="text-lg font-bold text-ink">
              Record this change request?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-dim">
              This records a decision against Submission #{submission.submissionNumber} for{" "}
              {milestone.name}. The SME will see your exact comments and can create a new evidence
              version. This action cannot be edited or withdrawn here.
            </p>
            <dl className="mt-4 space-y-2 rounded-xl bg-edge/35 p-4 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Response date</dt>
                <dd className="font-medium text-ink">{formatDate(responseDate)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Referenced criteria</dt>
                <dd className="font-medium text-ink">{criteria.length}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Referenced evidence</dt>
                <dd className="font-medium text-ink">{evidence.length}</dd>
              </div>
            </dl>
            <div className="mt-6 flex gap-3">
              <button
                ref={cancelButton}
                disabled={submitting}
                onClick={close}
                className="flex-1 rounded-xl border border-edge px-4 py-3 text-sm font-semibold text-ink"
              >
                Go back
              </button>
              <button
                disabled={submitting}
                onClick={() => void record()}
                className="flex-1 rounded-xl bg-warn px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {submitting ? "Recording…" : "Record request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

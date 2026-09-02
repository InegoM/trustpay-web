import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  createSubmission,
  downloadEvidence,
  listSubmissions,
  removeEvidence,
  respondToChangeRequest,
  submitEvidencePackage,
  updateSubmissionNotes,
  uploadEvidence,
  type ApiEvidenceItem,
  type ApiMilestoneSubmission,
} from "@/api/trustpay";
import { fmt } from "@/data/mock";
import { useAuth } from "@/state/AuthContext";
import { useTrustPay } from "@/state/TrustPayContext";
import type { MilestonePageProps } from "@/types";

const CARD = "rounded-2xl border border-edge bg-card shadow-[0_2px_12px_rgba(13,31,64,0.06)]";
const ALLOWED = "image/jpeg,image/png,application/pdf";
const ALLOWED_MIME_TYPES = new Set(ALLOWED.split(","));
const MAX_FILE_SIZE_BYTES = 10 * 1_000_000;
const MAX_FILES_PER_SUBMISSION = 10;
const date = (value?: string) =>
  value
    ? new Intl.DateTimeFormat("en-AE", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Dubai",
      }).format(new Date(value))
    : "Not submitted";
const size = (bytes: number) =>
  bytes < 1_000_000 ? `${Math.ceil(bytes / 1_000)} KB` : `${(bytes / 1_000_000).toFixed(1)} MB`;

export default function MilestoneReview({ navigate, milestoneId }: MilestonePageProps) {
  const { project, refresh } = useTrustPay();
  const { canCreateProject, canDecide } = useAuth();
  const milestone = project.milestones.find((item) => item.id === milestoneId)!;
  const [submission, setSubmission] = useState<ApiMilestoneSubmission | null>(null);
  const [submissions, setSubmissions] = useState<ApiMilestoneSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [description, setDescription] = useState("");
  const [criterionId, setCriterionId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [response, setResponse] = useState("");
  const [confirming, setConfirming] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const cancelSubmitButton = useRef<HTMLButtonElement>(null);
  const submitTriggerButton = useRef<HTMLButtonElement>(null);
  const confirmationDialog = useRef<HTMLDivElement>(null);
  const submissionIdempotencyKey = useRef<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await listSubmissions(project.id, milestoneId);
      // Do not render a draft to a customer even if a future API regression returns one.
      const current = canCreateProject
        ? (items.find((item) => item.status === "draft") ?? items[0] ?? null)
        : (items.find((item) => item.status === "submitted") ?? null);
      setSubmission(current);
      setSubmissions(items);
      setNotes(current?.notes ?? "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Evidence could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [canCreateProject, milestoneId, project.id]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (confirming) cancelSubmitButton.current?.focus();
  }, [confirming]);

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      const draft = await createSubmission(project.id, milestoneId);
      setSubmission(draft);
      setNotes(draft.notes ?? "");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "A draft could not be created.");
    } finally {
      setBusy(false);
    }
  };
  const upload = async () => {
    if (!submission || !file) return;
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      setError("Choose a JPEG, PNG, or PDF file. Other file types are not accepted.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError("Choose a file smaller than 10 MB.");
      return;
    }
    if (submission.evidence.length >= MAX_FILES_PER_SUBMISSION) {
      setError("This evidence package already has the maximum of 10 files.");
      return;
    }
    setBusy(true);
    setError(null);
    setProgress(0);
    try {
      const item = await uploadEvidence(
        project.id,
        milestoneId,
        submission.id,
        {
          file,
          ...(description.trim() ? { description: description.trim() } : {}),
          ...(criterionId ? { acceptanceCriterionId: criterionId } : {}),
        },
        setProgress,
      );
      setSubmission({ ...submission, evidence: [...submission.evidence, item] });
      setFile(null);
      setDescription("");
      setCriterionId("");
      if (fileInput.current) fileInput.current.value = "";
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The upload failed. Try again.");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };
  const saveNotes = async () => {
    if (!submission) return;
    setBusy(true);
    setError(null);
    try {
      setSubmission(await updateSubmissionNotes(project.id, milestoneId, submission.id, notes));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Notes could not be saved.");
    } finally {
      setBusy(false);
    }
  };
  const remove = async (item: ApiEvidenceItem) => {
    if (!submission) return;
    setBusy(true);
    setError(null);
    try {
      await removeEvidence(project.id, milestoneId, submission.id, item.id);
      setSubmission({
        ...submission,
        evidence: submission.evidence.filter((entry) => entry.id !== item.id),
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The file could not be removed.");
    } finally {
      setBusy(false);
    }
  };
  const download = async (item: ApiEvidenceItem) => {
    if (!submission) return;
    setError(null);
    try {
      const blob = await downloadEvidence(project.id, milestoneId, submission.id, item.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = item.originalName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The download failed.");
    }
  };
  const view = async (item: ApiEvidenceItem) => {
    if (!submission) return;
    setError(null);
    try {
      const blob = await downloadEvidence(project.id, milestoneId, submission.id, item.id);
      const url = URL.createObjectURL(blob);
      const viewer = window.open(url, "_blank", "noopener,noreferrer");
      if (!viewer) {
        URL.revokeObjectURL(url);
        setError("Your browser blocked the preview. Use Download to open the file.");
        return;
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The preview could not be opened.");
    }
  };
  const submit = async () => {
    if (!submission) return;
    setBusy(true);
    setError(null);
    try {
      const result = await submitEvidencePackage(
        project.id,
        milestoneId,
        submission.id,
        submissionIdempotencyKey.current ?? crypto.randomUUID().replace(/-/g, ""),
      );
      setSubmission(result);
      submissionIdempotencyKey.current = null;
      setConfirming(false);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The package could not be submitted.");
    } finally {
      setBusy(false);
    }
  };
  const respond = async (changeRequestId: string) => {
    if (!response.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const next = await respondToChangeRequest(
        project.id,
        milestoneId,
        changeRequestId,
        { response: response.trim() },
        crypto.randomUUID().replace(/-/g, ""),
      );
      setSubmission(next);
      setResponse("");
      await Promise.all([load(), refresh()]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your response could not be recorded.");
    } finally {
      setBusy(false);
    }
  };
  const closeConfirmation = () => {
    if (busy) return;
    setConfirming(false);
    window.requestAnimationFrame(() => submitTriggerButton.current?.focus());
  };
  const handleConfirmationKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeConfirmation();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = confirmationDialog.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
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

  const editable = Boolean(
    canCreateProject && submission?.canEdit && submission.status === "draft",
  );
  const missing = (milestone.criteriaDetailed ?? []).filter(
    (criterion) =>
      !submission?.evidence.some((item) => item.acceptanceCriterionId === criterion.id),
  );
  const previousSubmissions = submissions
    .filter((item) => item.id !== submission?.id)
    .sort((left, right) => right.submissionNumber - left.submissionNumber);
  const changeRequest = submissions.find((item) => item.changeRequest)?.changeRequest;
  const changeRequestSubmission = submissions.find((item) => item.changeRequest);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate("project-details")}
            className="rounded-xl p-2 text-muted hover:bg-edge/60"
            aria-label="Back to project"
          >
            ←
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand">
              Milestone {milestone.sequenceNumber} of {project.milestones.length}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-ink">{milestone.name}</h1>
            <p className="mt-1 text-sm text-muted">
              {project.name} · {fmt(milestone.value)}
            </p>
            {submission && (
              <p className="mt-1 text-xs font-medium text-muted">
                Submission #{submission.submissionNumber}
              </p>
            )}
          </div>
        </div>
        <span className="w-fit rounded-full bg-brand-light px-3 py-1.5 text-xs font-semibold text-brand">
          {submission?.status === "submitted"
            ? "Submitted — read only"
            : submission
              ? "Draft evidence package"
              : "No package yet"}
        </span>
      </header>
      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger-light p-4" role="alert">
          <p className="text-sm font-semibold text-danger">Something needs attention</p>
          <p className="mt-1 text-sm text-ink-dim">{error}</p>
          <button onClick={() => void load()} className="mt-2 text-sm font-semibold text-danger">
            Retry
          </button>
        </div>
      )}
      {loading ? (
        <div className={`${CARD} p-8 text-center text-sm text-muted`} role="status">
          Loading evidence package…
        </div>
      ) : changeRequest &&
        changeRequestSubmission &&
        canCreateProject &&
        !submission?.responseToChangeRequest ? (
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
          <main className="space-y-5 xl:col-span-2">
            <section className={`${CARD} p-5 sm:p-6`} aria-labelledby="change-request-title">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-warn">
                    Customer feedback
                  </p>
                  <h2 id="change-request-title" className="mt-1 text-lg font-semibold text-ink">
                    Changes requested for Submission #{changeRequestSubmission.submissionNumber}
                  </h2>
                </div>
                <span className="w-fit rounded-full bg-warn-light px-3 py-1 text-xs font-semibold text-warn">
                  Response requested by {date(changeRequest.responseDueAt)}
                </span>
              </div>
              <dl className="mt-5 grid gap-4 border-y border-edge py-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                    Reason category
                  </dt>
                  <dd className="mt-1 font-medium text-ink">{changeRequest.reasonCategory}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                    Decision reference
                  </dt>
                  <dd className="mt-1 font-mono text-xs text-ink">
                    {changeRequest.decisionReference ??
                      changeRequestSubmission.decision?.reference ??
                      "Reference unavailable"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                    Requested by
                  </dt>
                  <dd className="mt-1 font-medium text-ink">{changeRequest.requestedBy}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                    Recorded
                  </dt>
                  <dd className="mt-1 font-medium text-ink">{date(changeRequest.requestedAt)}</dd>
                </div>
              </dl>
              <div className="mt-5">
                <h3 className="text-sm font-semibold text-ink">Required changes</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-dim">
                  {changeRequest.requiredChanges}
                </p>
              </div>
              {(changeRequest.acceptanceCriterionIds.length ||
                changeRequest.evidenceItemIds.length) && (
                <div className="mt-5 rounded-xl bg-edge/35 p-4 text-sm">
                  <p className="font-semibold text-ink">Referenced record</p>
                  {changeRequest.acceptanceCriterionIds.length ? (
                    <p className="mt-1 text-ink-dim">
                      {changeRequest.acceptanceCriterionIds.length} acceptance criterion
                      {changeRequest.acceptanceCriterionIds.length === 1 ? "" : " criteria"}{" "}
                      referenced.
                    </p>
                  ) : null}
                  {changeRequest.evidenceItemIds.length ? (
                    <p className="mt-1 text-ink-dim">
                      {changeRequest.evidenceItemIds.length} evidence item
                      {changeRequest.evidenceItemIds.length === 1 ? "" : "s"} referenced.
                    </p>
                  ) : null}
                </div>
              )}
            </section>
            {submission?.responseToChangeRequest ? (
              <section className={`${CARD} p-5 sm:p-6`} aria-labelledby="response-record-title">
                <h2 id="response-record-title" className="text-base font-semibold text-ink">
                  Your recorded response
                </h2>
                <p className="mt-2 whitespace-pre-wrap text-sm text-ink-dim">
                  {submission.responseToChangeRequest.response}
                </p>
                <p className="mt-3 text-xs text-muted">
                  Recorded by {submission.responseToChangeRequest.respondedBy} on{" "}
                  {date(submission.responseToChangeRequest.respondedAt)}
                </p>
              </section>
            ) : (
              <section className={`${CARD} p-5 sm:p-6`} aria-labelledby="response-title">
                <h2 id="response-title" className="text-base font-semibold text-ink">
                  Respond before preparing corrected evidence
                </h2>
                <p className="mt-1 text-sm text-muted">
                  This response becomes part of the permanent project record. TrustPay will create a
                  new private evidence package; Submission #
                  {changeRequestSubmission.submissionNumber} remains unchanged.
                </p>
                <label className="mt-4 block" htmlFor="change-response">
                  <span className="text-sm font-medium text-ink">Your response</span>
                  <textarea
                    id="change-response"
                    value={response}
                    onChange={(event) => setResponse(event.target.value)}
                    maxLength={4000}
                    rows={5}
                    className="mt-2 w-full rounded-xl border border-edge bg-card p-3 text-sm text-ink"
                    placeholder="Explain the corrective work you will provide."
                  />
                </label>
                <button
                  disabled={busy || response.trim().length < 5}
                  onClick={() => void respond(changeRequest.id)}
                  className="mt-4 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? "Recording response…" : "Record response and start corrected package"}
                </button>
              </section>
            )}
          </main>
          <aside className="space-y-4 xl:sticky xl:top-4">
            <div className={`${CARD} p-5`}>
              <h2 className="text-sm font-semibold text-ink">Submission history</h2>
              <ol className="mt-4 space-y-3">
                {[submission, ...previousSubmissions].filter(Boolean).map((item) => (
                  <li key={item!.id} className="rounded-xl border border-edge p-3">
                    <p className="text-sm font-semibold text-ink">
                      Submission #{item!.submissionNumber}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {item!.status === "draft"
                        ? "New private draft"
                        : `Submitted ${date(item!.submittedAt)}`}
                    </p>
                    {item!.changeRequest && (
                      <p className="mt-1 text-xs font-medium text-warn">Changes requested</p>
                    )}
                  </li>
                ))}
              </ol>
            </div>
            <p className="text-center text-xs leading-relaxed text-muted">
              TrustPay records agreements, evidence and decisions. It does not hold or transfer
              money.
            </p>
          </aside>
        </div>
      ) : !submission ? (
        <div className={`${CARD} p-8 text-center`}>
          <h2 className="text-lg font-semibold text-ink">No evidence package is available</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted">
            {canCreateProject
              ? "Start a private draft, add evidence against the agreed criteria, then submit it for customer review."
              : "The customer can view this milestone only after the SME submits its evidence package."}
          </p>
          {canCreateProject && (
            <button
              disabled={busy}
              onClick={() => void start()}
              className="mt-5 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Starting…" : "Start evidence package"}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
          <main className="space-y-5 xl:col-span-2">
            <section className={`${CARD} p-5 sm:p-6`} aria-labelledby="criteria-title">
              <h2 id="criteria-title" className="text-base font-semibold text-ink">
                Agreed acceptance criteria
              </h2>
              <p className="mt-1 text-xs text-muted">
                Agreement {submission.agreementVersion} · Evidence links remain part of the
                submitted record.
              </p>
              <ol className="mt-4 space-y-3">
                {(milestone.criteriaDetailed ?? []).map((criterion) => {
                  const count = submission.evidence.filter(
                    (item) => item.acceptanceCriterionId === criterion.id,
                  ).length;
                  return (
                    <li key={criterion.id} className="flex gap-3 rounded-xl bg-edge/35 p-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-card text-xs font-bold text-muted">
                        {criterion.position}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm text-ink">{criterion.description}</p>
                        <p className={`mt-1 text-xs ${count ? "text-brand" : "text-warn"}`}>
                          {count
                            ? `${count} linked file${count === 1 ? "" : "s"}`
                            : "No linked evidence yet"}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
            {editable && (
              <section className={`${CARD} p-5 sm:p-6`} aria-labelledby="upload-title">
                <h2 id="upload-title" className="text-base font-semibold text-ink">
                  Add evidence
                </h2>
                <p className="mt-1 text-xs text-muted">
                  JPEG, PNG or PDF · maximum 10 MB each · maximum 10 files
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="sm:col-span-2">
                    <span className="text-sm font-medium text-ink">File</span>
                    <input
                      ref={fileInput}
                      type="file"
                      accept={ALLOWED}
                      onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                      className="mt-1 block w-full rounded-xl border border-edge p-3 text-sm"
                    />
                  </label>
                  <label>
                    <span className="text-sm font-medium text-ink">Acceptance criterion</span>
                    <select
                      value={criterionId}
                      onChange={(event) => setCriterionId(event.target.value)}
                      className="mt-1 w-full rounded-xl border border-edge bg-card p-3 text-sm"
                    >
                      <option value="">General evidence</option>
                      {milestone.criteriaDetailed?.map((criterion) => (
                        <option key={criterion.id} value={criterion.id}>
                          {criterion.position}. {criterion.description}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="text-sm font-medium text-ink">Description</span>
                    <input
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      maxLength={2000}
                      className="mt-1 w-full rounded-xl border border-edge p-3 text-sm"
                      placeholder="What does this file show?"
                    />
                  </label>
                </div>
                {progress !== null && (
                  <div className="mt-4" aria-live="polite">
                    <div
                      className="h-2 overflow-hidden rounded-full bg-edge"
                      role="progressbar"
                      aria-label="Evidence upload progress"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={progress}
                      aria-valuetext={`Uploading and validating: ${progress}%`}
                    >
                      <div className="h-full bg-brand" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-muted">Uploading and validating… {progress}%</p>
                  </div>
                )}
                <button
                  disabled={!file || busy}
                  onClick={() => void upload()}
                  className="mt-4 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {busy && progress !== null ? "Uploading…" : "Upload evidence"}
                </button>
              </section>
            )}
            <section className={`${CARD} p-5 sm:p-6`} aria-labelledby="files-title">
              <div className="flex items-center justify-between gap-3">
                <h2 id="files-title" className="text-base font-semibold text-ink">
                  Evidence files
                </h2>
                <span className="rounded-full bg-edge px-2.5 py-1 text-xs text-muted">
                  {submission.evidence.length} / {MAX_FILES_PER_SUBMISSION}
                </span>
              </div>
              {submission.evidence.length === 0 ? (
                <p className="mt-4 rounded-xl bg-edge/30 p-4 text-sm text-muted">
                  No files have been uploaded.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {submission.evidence.map((item) => (
                    <li key={item.id} className="rounded-xl border border-edge p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink">
                            {item.originalName}
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            {item.mimeType === "application/pdf" ? "PDF" : "Image"} ·{" "}
                            {size(item.sizeBytes)} · Uploaded {date(item.uploadedAt)} by{" "}
                            {item.uploadedBy}
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            Security check:{" "}
                            {item.scanStatus === "clean" ? "complete" : item.scanStatus}
                          </p>
                          {item.acceptanceCriterion && (
                            <p className="mt-1 text-xs text-brand">
                              Linked to: {item.acceptanceCriterion}
                            </p>
                          )}
                          {item.description && (
                            <p className="mt-2 text-sm text-ink-dim">{item.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => void view(item)}
                            className="rounded-lg border border-edge px-3 py-2 text-xs font-semibold text-ink"
                          >
                            View
                          </button>
                          <button
                            onClick={() => void download(item)}
                            className="rounded-lg border border-edge px-3 py-2 text-xs font-semibold text-ink"
                          >
                            Download
                          </button>
                          {editable && (
                            <button
                              disabled={busy}
                              onClick={() => void remove(item)}
                              className="rounded-lg border border-danger/30 px-3 py-2 text-xs font-semibold text-danger"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className={`${CARD} p-5 sm:p-6`}>
              <label htmlFor="submission-notes" className="text-base font-semibold text-ink">
                Submission notes
              </label>
              {editable ? (
                <>
                  <textarea
                    id="submission-notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    maxLength={5000}
                    rows={4}
                    className="mt-3 w-full rounded-xl border border-edge p-3 text-sm"
                    placeholder="Add context for the customer approver."
                  />
                  <button
                    disabled={busy || notes === (submission.notes ?? "")}
                    onClick={() => void saveNotes()}
                    className="mt-3 rounded-xl border border-edge px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50"
                  >
                    Save notes
                  </button>
                </>
              ) : (
                <p className="mt-3 whitespace-pre-wrap text-sm text-ink-dim">
                  {submission.notes || "No submission notes were added."}
                </p>
              )}
            </section>
          </main>
          <aside className="space-y-4 xl:sticky xl:top-4">
            <div className={`${CARD} p-5`}>
              <h2 className="text-sm font-semibold text-ink">Package summary</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Submission</dt>
                  <dd className="font-medium text-ink">#{submission.submissionNumber}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Agreement</dt>
                  <dd className="text-right font-medium text-ink">{submission.agreementVersion}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Files</dt>
                  <dd className="font-medium text-ink">{submission.evidence.length}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Submitted</dt>
                  <dd className="text-right font-medium text-ink">
                    {date(submission.submittedAt)}
                  </dd>
                </div>
              </dl>
            </div>
            {editable && (
              <div className="rounded-2xl border border-warn/30 bg-warn-light p-5">
                <h2 className="text-sm font-semibold text-warn">Before submitting</h2>
                {missing.length > 0 && (
                  <p className="mt-2 text-xs text-ink-dim">
                    {missing.length} acceptance{" "}
                    {missing.length === 1 ? "criterion has" : "criteria have"} no linked file. You
                    may still submit if the notes explain why.
                  </p>
                )}
                <p className="mt-2 text-xs text-ink-dim">
                  Submitting locks this package permanently and makes it available to the customer
                  approver.
                </p>
                <button
                  ref={submitTriggerButton}
                  disabled={busy || submission.evidence.length === 0}
                  onClick={() => {
                    submissionIdempotencyKey.current = crypto.randomUUID().replace(/-/g, "");
                    setConfirming(true);
                  }}
                  className="mt-4 w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Review and submit
                </button>
              </div>
            )}
            {submission.status === "submitted" &&
              canDecide &&
              milestone.status === "awaiting-decision" && (
                <div className={`${CARD} space-y-2 p-5`}>
                  <h2 className="text-sm font-semibold text-ink">Record your decision</h2>
                  <p className="text-xs text-muted">
                    Review every file and the accepted criteria before continuing.
                  </p>
                  <button
                    onClick={() => navigate("confirm-approval")}
                    className="mt-2 w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white"
                  >
                    Approve milestone
                  </button>
                  <button
                    onClick={() => navigate("request-changes")}
                    className="w-full rounded-xl border border-edge px-4 py-3 text-sm font-semibold text-ink"
                  >
                    Request changes
                  </button>
                  <button
                    onClick={() => navigate("raise-dispute")}
                    className="w-full rounded-xl border border-danger/30 px-4 py-3 text-sm font-semibold text-danger"
                  >
                    Raise dispute
                  </button>
                </div>
              )}
            <p className="text-center text-xs leading-relaxed text-muted">
              TrustPay records agreements, evidence and decisions. It does not hold or transfer
              money.
            </p>
          </aside>
        </div>
      )}
      {confirming && submission && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="submit-title"
          ref={confirmationDialog}
          onKeyDown={handleConfirmationKeyDown}
        >
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
            <h2 id="submit-title" className="text-lg font-bold text-ink">
              Submit evidence package?
            </h2>
            <p className="mt-2 text-sm text-ink-dim">
              This locks {submission.evidence.length} file
              {submission.evidence.length === 1 ? "" : "s"}, your notes, criterion links and
              Agreement {submission.agreementVersion}. They cannot be edited or deleted after
              submission.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                ref={cancelSubmitButton}
                disabled={busy}
                onClick={closeConfirmation}
                className="flex-1 rounded-xl border border-edge px-4 py-3 text-sm font-semibold text-ink"
              >
                Go back
              </button>
              <button
                disabled={busy}
                onClick={() => void submit()}
                className="flex-1 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy ? "Submitting…" : "Submit package"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

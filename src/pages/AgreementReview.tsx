import { type FormEvent, useEffect, useMemo, useState } from "react";

import {
  createAgreementVersion,
  getAgreement,
  listAgreements,
  recordAgreementDecision,
  type ApiAgreementVersion,
} from "@/api/trustpay";
import { fmt } from "@/data/mock";
import { useAuth } from "@/state/AuthContext";
import { useTrustPay } from "@/state/TrustPayContext";
import type { AgreementPageProps } from "@/types";

type Mode = "review" | "confirm" | "receipt" | "request-amendment" | "amend";

const CARD = "rounded-2xl border border-edge bg-card shadow-[0_2px_12px_rgba(13,31,64,0.05)]";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Dubai",
  }).format(new Date(value));
}

function statusLabel(status: ApiAgreementVersion["status"]): string {
  return {
    draft: "Awaiting customer review",
    active: "Acceptance recorded",
    superseded: "Superseded",
    "amendment-requested": "Amendment requested",
  }[status];
}

export default function AgreementReview({
  navigate,
  agreementId,
  mode = "review",
}: AgreementPageProps & { mode?: Mode }) {
  const { project, refresh } = useTrustPay();
  const { canCreateProject, canDecide, user } = useAuth();
  const [agreement, setAgreement] = useState<ApiAgreementVersion | null>(null);
  const [history, setHistory] = useState<ApiAgreementVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<ApiAgreementVersion | null>(null);
  const [draft, setDraft] = useState({ title: "", scope: "", terms: "" });

  useEffect(() => {
    setLoading(true);
    setError(null);
    void Promise.all([getAgreement(project.id, agreementId), listAgreements(project.id)])
      .then(([loaded, versions]) => {
        setAgreement(loaded);
        setHistory(versions);
        setDraft({
          title: loaded.content.title,
          scope: loaded.content.scope,
          terms: loaded.content.terms,
        });
      })
      .catch((requestError) =>
        setError(
          requestError instanceof Error
            ? requestError.message
            : "The agreement could not be loaded.",
        ),
      )
      .finally(() => setLoading(false));
  }, [agreementId, project.id]);

  const prior = useMemo(
    () =>
      history
        .filter((version) => version.versionNumber < (agreement?.versionNumber ?? 0))
        .sort((a, b) => b.versionNumber - a.versionNumber)[0],
    [agreement?.versionNumber, history],
  );

  const accept = async () => {
    if (!agreement || !confirmed) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await recordAgreementDecision(
        project.id,
        agreement.id,
        { action: "accept", authorityConfirmed: true, expectedVersionId: agreement.id },
        window.crypto.randomUUID(),
      );
      setReceipt(result.agreement);
      await refresh();
      navigate("agreement-receipt", { projectId: project.id, agreementId: agreement.id });
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Acceptance could not be recorded.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const requestAmendment = async (event: FormEvent) => {
    event.preventDefault();
    if (!agreement) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await recordAgreementDecision(
        project.id,
        agreement.id,
        { action: "request-amendment", reason, expectedVersionId: agreement.id },
        window.crypto.randomUUID(),
      );
      setReceipt(result.agreement);
      await refresh();
      navigate("agreement-amendment", { projectId: project.id, agreementId: agreement.id });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The amendment request could not be recorded.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const createAmendment = async (event: FormEvent) => {
    event.preventDefault();
    if (!agreement) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await createAgreementVersion(project.id, {
        baseVersionId: agreement.id,
        ...draft,
      });
      await refresh();
      navigate("agreement-review", { projectId: project.id, agreementId: created.id });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The new agreement version could not be created.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className={`${CARD} mx-auto max-w-3xl p-8 text-center`} role="status">
        Loading the exact agreement version…
      </div>
    );
  if (error || !agreement)
    return (
      <div className={`${CARD} mx-auto max-w-3xl p-8 text-center`} role="alert">
        <h1 className="text-xl font-bold text-ink">Agreement unavailable</h1>
        <p className="mt-2 text-sm text-muted">
          {error ?? "This agreement is unavailable or you do not have access."}
        </p>
        <button
          onClick={() => navigate("project-details")}
          className="mt-5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white"
        >
          Return to project
        </button>
      </div>
    );

  const displayedAgreement = receipt ?? agreement;
  if (mode === "receipt") {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <div className={`${CARD} p-8 text-center`}>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-light text-2xl text-brand">
            ✓
          </div>
          <h1 className="mt-4 text-2xl font-bold text-ink">Acceptance recorded</h1>
          <p className="mt-2 text-sm text-muted">
            {displayedAgreement.label} for {project.name} is now the active agreement record.
          </p>
          <div className="mt-6 rounded-xl bg-canvas p-4 text-left text-sm">
            <p>
              <strong>Approver:</strong> {displayedAgreement.acceptance?.acceptedBy}
            </p>
            <p className="mt-1">
              <strong>Recorded:</strong>{" "}
              {displayedAgreement.acceptance
                ? formatDate(displayedAgreement.acceptance.acceptedAt)
                : "—"}{" "}
              GST
            </p>
            <p className="mt-1">
              <strong>Reference:</strong> {displayedAgreement.acceptance?.reference}
            </p>
          </div>
          <p className="mt-5 text-xs text-muted">
            This records acceptance in TrustPay. It is not presented as a qualified electronic
            signature.
          </p>
          <button
            onClick={() => navigate("project-details")}
            className="mt-6 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"
          >
            Return to project
          </button>
        </div>
      </div>
    );
  }

  if (mode === "request-amendment") {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <button
          onClick={() => navigate("agreement-review", { projectId: project.id, agreementId })}
          className="text-sm font-medium text-muted hover:text-brand"
        >
          ← Back to agreement
        </button>
        <form onSubmit={requestAmendment} className={`${CARD} p-7`}>
          <h1 className="text-2xl font-bold text-ink">Request an amendment</h1>
          <p className="mt-2 text-sm text-muted">
            Your request is recorded against {agreement.label}. The SME must create a new version;
            this version is not edited.
          </p>
          <label className="mt-6 block">
            <span className="text-xs font-semibold text-ink-dim">What needs to change?</span>
            <textarea
              required
              minLength={5}
              maxLength={2000}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="mt-1.5 min-h-32 w-full rounded-xl border border-edge bg-white p-3 text-sm text-ink focus:border-brand focus:ring-2 focus:ring-brand/20"
              placeholder="Describe the scope, terms, or milestone criteria that need clarification."
            />
          </label>
          {error && (
            <p className="mt-4 text-sm text-danger" role="alert">
              {error}
            </p>
          )}
          <button
            disabled={submitting || !canDecide}
            className="mt-5 rounded-xl border border-warn px-4 py-2.5 text-sm font-semibold text-warn disabled:opacity-60"
          >
            {submitting ? "Recording…" : "Record amendment request"}
          </button>
          {!canDecide && (
            <p className="mt-3 text-xs text-muted">
              Only the assigned customer approver can submit this request.
            </p>
          )}
        </form>
      </div>
    );
  }

  if (mode === "amend") {
    if (!canCreateProject)
      return (
        <div className={`${CARD} mx-auto max-w-2xl p-8 text-center`}>
          <h1 className="text-xl font-bold text-ink">Amendment access is restricted</h1>
          <p className="mt-2 text-sm text-muted">
            Only an SME owner or administrator can create a revised agreement version.
          </p>
        </div>
      );
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <button
          onClick={() => navigate("agreement-review", { projectId: project.id, agreementId })}
          className="text-sm font-medium text-muted hover:text-brand"
        >
          ← Back to agreement
        </button>
        <form onSubmit={createAmendment} className={`${CARD} p-7`}>
          <h1 className="text-2xl font-bold text-ink">Create amended agreement version</h1>
          <p className="mt-2 text-sm text-muted">
            This creates a new draft from {agreement.label}. The requested version remains in the
            history unchanged.
          </p>
          <label className="mt-5 block">
            <span className="text-xs font-semibold text-ink-dim">Title</span>
            <input
              required
              minLength={3}
              maxLength={200}
              value={draft.title}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              className="mt-1.5 w-full rounded-xl border border-edge px-3 py-2.5 text-sm"
            />
          </label>
          <label className="mt-4 block">
            <span className="text-xs font-semibold text-ink-dim">Scope</span>
            <textarea
              required
              minLength={20}
              maxLength={5000}
              value={draft.scope}
              onChange={(event) => setDraft({ ...draft, scope: event.target.value })}
              className="mt-1.5 min-h-28 w-full rounded-xl border border-edge p-3 text-sm"
            />
          </label>
          <label className="mt-4 block">
            <span className="text-xs font-semibold text-ink-dim">Terms</span>
            <textarea
              required
              minLength={20}
              maxLength={10000}
              value={draft.terms}
              onChange={(event) => setDraft({ ...draft, terms: event.target.value })}
              className="mt-1.5 min-h-32 w-full rounded-xl border border-edge p-3 text-sm"
            />
          </label>
          {error && (
            <p className="mt-4 text-sm text-danger" role="alert">
              {error}
            </p>
          )}
          <button
            disabled={submitting}
            className="mt-5 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Creating version…" : "Create revised draft"}
          </button>
        </form>
      </div>
    );
  }

  if (mode === "confirm")
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <button
          onClick={() => navigate("agreement-review", { projectId: project.id, agreementId })}
          className="text-sm font-medium text-muted hover:text-brand"
        >
          ← Back to agreement
        </button>
        <div className={`${CARD} p-7`}>
          <h1 className="text-2xl font-bold text-ink">Confirm recorded acceptance</h1>
          <p className="mt-2 text-sm text-muted">
            You are about to record acceptance of{" "}
            <strong className="text-ink">{agreement.label}</strong> for {project.name}. The exact
            content hash is {agreement.contentHash.slice(0, 16)}…
          </p>
          <div className="mt-5 rounded-xl bg-canvas p-4 text-sm text-ink">
            <dl className="space-y-2">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Signed-in account</dt>
                <dd className="text-right font-semibold">
                  {user?.displayName ?? "Current account"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Customer organization</dt>
                <dd className="text-right font-semibold">{project.customer}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Agreement version</dt>
                <dd className="text-right font-semibold">{agreement.label}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Action</dt>
                <dd className="max-w-64 text-right font-semibold">
                  Record this customer acceptance in TrustPay
                </dd>
              </div>
            </dl>
            <p className="mt-4 border-t border-edge pt-3 text-xs text-muted">
              The server assigns the authoritative UTC timestamp when this acceptance is recorded.
            </p>
          </div>
          <label className="mt-6 flex items-start gap-3 rounded-xl bg-canvas p-4 text-sm text-ink">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-brand"
            />
            <span>
              I confirm that I am authorized to accept this exact agreement version for{" "}
              {project.customer}.
            </span>
          </label>
          {error && (
            <p className="mt-4 text-sm text-danger" role="alert">
              {error}
            </p>
          )}
          <button
            disabled={!confirmed || submitting || !canDecide}
            onClick={() => void accept()}
            className="mt-5 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Recording acceptance…" : "Record acceptance"}
          </button>
          {!canDecide && (
            <p className="mt-3 text-xs text-muted">
              Only the assigned customer approver can record acceptance.
            </p>
          )}
        </div>
      </div>
    );

  const canAct = agreement.status === "draft" && canDecide;
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button
            onClick={() => navigate("project-details")}
            className="text-sm font-medium text-muted hover:text-brand"
          >
            ← Back to project
          </button>
          <h1 className="mt-3 text-2xl font-bold text-ink">Review agreement</h1>
          <p className="mt-1 text-sm text-muted">
            Exact version {agreement.label} · Created {formatDate(agreement.createdAt)} GST
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl border border-edge px-3 py-2 text-sm font-semibold text-ink hover:bg-canvas"
            aria-label={`Print agreement ${agreement.label}`}
          >
            Print agreement
          </button>
          <span className="rounded-full bg-brand-light px-3 py-1 text-xs font-semibold text-brand">
            {statusLabel(agreement.status)}
          </span>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <article className={`${CARD} p-6`}>
          <h2 className="text-xl font-bold text-ink">{agreement.content.title}</h2>
          <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <p>
              <span className="block text-xs font-semibold uppercase tracking-wide text-muted">
                Project value
              </span>
              {agreement.content.currency} {fmt(agreement.content.projectValue).replace("AED ", "")}
            </p>
            <p>
              <span className="block text-xs font-semibold uppercase tracking-wide text-muted">
                Parties
              </span>
              {project.sme} and {project.customer}
            </p>
            <p>
              <span className="block text-xs font-semibold uppercase tracking-wide text-muted">
                Authorized approver
              </span>
              {project.authorizedApprover}
            </p>
            <p>
              <span className="block text-xs font-semibold uppercase tracking-wide text-muted">
                Created by
              </span>
              {agreement.createdBy}
            </p>
          </div>
          <section className="mt-7 border-t border-edge pt-6">
            <h3 className="font-semibold text-ink">Scope</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-dim">
              {agreement.content.scope}
            </p>
          </section>
          <section className="mt-6">
            <h3 className="font-semibold text-ink">Terms</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-dim">
              {agreement.content.terms}
            </p>
          </section>
          <section className="mt-6">
            <h3 className="font-semibold text-ink">Milestone schedule and acceptance criteria</h3>
            <div className="mt-3 space-y-3">
              {agreement.content.milestones.map((milestone) => (
                <div key={milestone.sequenceNumber} className="rounded-xl border border-edge p-4">
                  <div className="flex flex-wrap justify-between gap-2">
                    <p className="text-sm font-semibold text-ink">
                      Milestone {milestone.sequenceNumber}: {milestone.name}
                    </p>
                    <p className="text-sm font-semibold text-ink">
                      {agreement.content.currency} {fmt(milestone.value).replace("AED ", "")}
                    </p>
                  </div>
                  {milestone.description && (
                    <p className="mt-2 text-xs text-muted">{milestone.description}</p>
                  )}
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-ink-dim">
                    {milestone.acceptanceCriteria.map((criterion) => (
                      <li key={criterion}>{criterion}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </article>
        <aside className="space-y-4">
          <div className={`${CARD} p-5`}>
            <h2 className="font-semibold text-ink">Decision</h2>
            {agreement.acceptance ? (
              <p className="mt-3 text-sm text-brand">
                Acceptance recorded by {agreement.acceptance.acceptedBy} on{" "}
                {formatDate(agreement.acceptance.acceptedAt)} GST.
              </p>
            ) : agreement.amendmentRequest ? (
              <>
                <p className="mt-3 text-sm text-warn">
                  Amendment requested by {agreement.amendmentRequest.requestedBy}.
                </p>
                <p className="mt-2 text-xs text-muted">{agreement.amendmentRequest.reason}</p>
                {canCreateProject && (
                  <button
                    onClick={() =>
                      navigate("agreement-amend", { projectId: project.id, agreementId })
                    }
                    className="mt-4 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white"
                  >
                    Create revised version
                  </button>
                )}
              </>
            ) : canAct ? (
              <div className="mt-4 space-y-3">
                <button
                  onClick={() =>
                    navigate("agreement-confirm", { projectId: project.id, agreementId })
                  }
                  className="w-full rounded-xl bg-brand px-3 py-2.5 text-sm font-semibold text-white"
                >
                  Accept agreement
                </button>
                <button
                  onClick={() =>
                    navigate("agreement-amendment", { projectId: project.id, agreementId })
                  }
                  className="w-full rounded-xl border border-warn px-3 py-2.5 text-sm font-semibold text-warn"
                >
                  Request amendment
                </button>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">
                This agreement is available to review. Only the assigned customer approver can
                record a decision.
              </p>
            )}
          </div>
          <div className={`${CARD} p-5`}>
            <h2 className="font-semibold text-ink">Version comparison</h2>
            {prior ? (
              <>
                <p className="mt-3 text-xs text-muted">Compared with {prior.label}</p>
                <p className="mt-2 text-sm text-ink">
                  {prior.content.title === agreement.content.title &&
                  prior.content.scope === agreement.content.scope &&
                  prior.content.terms === agreement.content.terms
                    ? "No text changes recorded."
                    : "Title, scope, or terms changed in this version."}
                </p>
                <button
                  onClick={() =>
                    navigate("agreement-review", { projectId: project.id, agreementId: prior.id })
                  }
                  className="mt-3 text-sm font-semibold text-brand hover:underline"
                >
                  View {prior.label}
                </button>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted">This is the first recorded version.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

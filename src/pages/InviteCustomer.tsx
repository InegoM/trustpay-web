import { type FormEvent, useEffect, useMemo, useState } from "react";

import {
  createCustomerInvitation,
  listProjectInvitations,
  type ApiProjectInvitation,
} from "@/api/trustpay";
import { useAuth } from "@/state/AuthContext";
import { useTrustPay } from "@/state/TrustPayContext";
import type { PageProps } from "@/types";

const CARD = "rounded-2xl border border-edge bg-card shadow-[0_2px_12px_rgba(13,31,64,0.05)]";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Dubai",
  }).format(new Date(value));
}

const STATUS_STYLE: Record<ApiProjectInvitation["status"], string> = {
  pending: "bg-warn-light text-warn",
  accepted: "bg-brand-light text-brand",
  expired: "bg-edge text-muted",
  revoked: "bg-edge text-muted",
};

export default function InviteCustomer({ navigate }: PageProps) {
  const { canCreateProject } = useAuth();
  const { project, refresh } = useTrustPay();
  const [email, setEmail] = useState("");
  const [invitations, setInvitations] = useState<ApiProjectInvitation[]>([]);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canCreateProject) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void listProjectInvitations(project.id)
      .then(setInvitations)
      .catch((requestError) =>
        setError(
          requestError instanceof Error ? requestError.message : "Unable to load invitations.",
        ),
      )
      .finally(() => setLoading(false));
  }, [canCreateProject, project.id]);

  const currentInvitation = useMemo(
    () => invitations.find((invitation) => invitation.status === "pending"),
    [invitations],
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setCopied(false);
    try {
      const created = await createCustomerInvitation(project.id, email);
      setInvitations((items) => [
        created.invitation,
        ...items.map((item) =>
          item.status === "pending" ? { ...item, status: "revoked" as const } : item,
        ),
      ]);
      setInviteLink(`${window.location.origin}/#/invite/${encodeURIComponent(created.token)}`);
      await refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The invitation could not be created.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
    } catch {
      setError("Copying was blocked by the browser. Select and copy the link manually.");
    }
  };

  if (!canCreateProject) {
    return (
      <div className={`${CARD} mx-auto max-w-2xl p-8 text-center`}>
        <h1 className="text-xl font-bold text-ink" style={{ fontFamily: "var(--font-display)" }}>
          Invitation access is restricted
        </h1>
        <p className="mt-2 text-sm text-muted">
          Only the SME owner or administrator can invite a customer approver.
        </p>
        <button
          onClick={() => navigate("project-details")}
          className="mt-6 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"
        >
          Return to project
        </button>
      </div>
    );
  }

  if (project.authorizedApprover !== "Not yet assigned") {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <button
          onClick={() => navigate("project-details")}
          className="text-sm font-medium text-muted hover:text-brand"
        >
          ← Back to project
        </button>
        <div className={`${CARD} p-8 text-center`}>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-light text-xl text-brand">
            ✓
          </div>
          <h1
            className="mt-4 text-xl font-bold text-ink"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Customer approver assigned
          </h1>
          <p className="mt-2 text-sm text-muted">
            <strong className="text-ink">{project.authorizedApprover}</strong> can access{" "}
            {project.name} on behalf of {project.customer}.
          </p>
          <button
            onClick={() => navigate("project-details")}
            className="mt-6 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"
          >
            View project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <button
          onClick={() => navigate("project-details")}
          className="mb-3 text-sm font-medium text-muted hover:text-brand"
        >
          ← Back to project
        </button>
        <h1 className="text-2xl font-bold text-ink" style={{ fontFamily: "var(--font-display)" }}>
          Invite the customer approver
        </h1>
        <p className="mt-1 text-sm text-muted">
          Give one authorized person from {project.customer} access to review and accept the
          agreement.
        </p>
      </div>

      <div className="grid grid-cols-[1.15fr_0.85fr] gap-6 items-start">
        <form onSubmit={submit} className={`${CARD} p-6`}>
          <div className="flex items-start gap-3 rounded-xl border border-brand-mid bg-brand-light p-4">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
              2
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">MVP Step 2</p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-dim">
                This invitation grants customer-project access and assigns the recipient as the
                authorized approver. It does not accept the agreement for them.
              </p>
            </div>
          </div>

          <label className="mt-6 block">
            <span className="text-xs font-semibold text-ink-dim">Customer approver email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="approver@customer.com"
              className="mt-1.5 w-full rounded-xl border border-edge bg-white px-3.5 py-3 text-sm text-ink placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </label>
          <div className="mt-4 rounded-xl bg-canvas p-4 text-xs leading-relaxed text-muted">
            <p>
              <strong className="text-ink">Organization:</strong> {project.customer}
            </p>
            <p className="mt-1">
              <strong className="text-ink">Role:</strong> Authorized customer approver
            </p>
            <p className="mt-1">
              <strong className="text-ink">Expiry:</strong> Seven days after creation
            </p>
          </div>

          {currentInvitation && !inviteLink && (
            <div className="mt-4 rounded-xl border border-warn/25 bg-warn-light p-3.5 text-xs text-warn">
              A pending invitation already exists for {currentInvitation.email}. Creating another
              will revoke the previous link.
            </div>
          )}
          {error && (
            <div
              className="mt-4 rounded-xl border border-danger/25 bg-danger-light px-4 py-3 text-sm text-danger"
              role="alert"
            >
              {error}
            </div>
          )}

          <button
            disabled={submitting}
            className="mt-5 w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand/90 disabled:opacity-60"
          >
            {submitting
              ? "Creating secure invitation…"
              : currentInvitation
                ? "Create replacement invitation"
                : "Create invitation link"}
          </button>
          <p className="mt-3 text-center text-[11px] text-muted">
            Email delivery is not connected yet. Copy and send the secure link using your normal
            communication channel.
          </p>
        </form>

        <div className="space-y-4">
          {inviteLink && (
            <div className={`${CARD} border-brand-mid p-5`}>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                  ✓
                </span>
                <h2 className="text-sm font-semibold text-ink">Invitation ready</h2>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                This is the only time the complete invitation link is shown. Copy it before leaving
                this page.
              </p>
              <input
                readOnly
                value={inviteLink}
                onFocus={(event) => event.currentTarget.select()}
                className="mt-3 w-full rounded-lg border border-edge bg-canvas px-3 py-2.5 text-xs text-ink"
                aria-label="Invitation link"
              />
              <button
                type="button"
                onClick={() => void copyLink()}
                className="mt-3 w-full rounded-xl border border-brand/30 px-4 py-2.5 text-sm font-semibold text-brand hover:bg-brand-light"
              >
                {copied ? "Copied" : "Copy invitation link"}
              </button>
            </div>
          )}

          <div className={`${CARD} p-5`}>
            <h2 className="text-sm font-semibold text-ink">Invitation history</h2>
            {loading ? (
              <p className="mt-3 text-xs text-muted">Loading invitations…</p>
            ) : invitations.length === 0 ? (
              <p className="mt-3 text-xs leading-relaxed text-muted">
                No customer invitations have been created for this project.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="rounded-xl border border-edge p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 truncate text-xs font-semibold text-ink">
                        {invitation.email}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_STYLE[invitation.status]}`}
                      >
                        {invitation.status}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted">
                      Created {formatDate(invitation.createdAt)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      Expires {formatDate(invitation.expiresAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

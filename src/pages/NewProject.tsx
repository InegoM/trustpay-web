import { type FormEvent, useMemo, useState } from "react";

import { fmt } from "@/data/mock";
import { useAuth } from "@/state/AuthContext";
import { useTrustPay } from "@/state/TrustPayContext";
import type { PageProps } from "@/types";
import { hashForView } from "@/routes";

interface MilestoneDraft {
  key: number;
  name: string;
  description: string;
  value: string;
  criteria: string;
}

const INPUT =
  "mt-1.5 w-full rounded-xl border border-edge bg-white px-3.5 py-3 text-sm text-ink placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/20";
const CARD = "rounded-2xl border border-edge bg-card shadow-[0_2px_12px_rgba(13,31,64,0.05)]";

const blankMilestone = (key: number): MilestoneDraft => ({
  key,
  name: "",
  description: "",
  value: "",
  criteria: "",
});

export default function NewProject({ navigate }: PageProps) {
  const { canCreateProject } = useAuth();
  const { createProject, syncError } = useTrustPay();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [agreementTitle, setAgreementTitle] = useState("");
  const [scope, setScope] = useState("");
  const [terms, setTerms] = useState(
    "Each milestone must be reviewed against its recorded acceptance criteria before a decision is recorded.",
  );
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([
    blankMilestone(1),
    blankMilestone(2),
  ]);
  const [nextKey, setNextKey] = useState(3);

  const total = useMemo(
    () =>
      milestones.reduce((sum, milestone) => {
        const value = Number(milestone.value);
        return sum + (Number.isFinite(value) ? value : 0);
      }, 0),
    [milestones],
  );

  if (!canCreateProject) {
    return (
      <div className={`${CARD} mx-auto max-w-2xl p-8 text-center`}>
        <h1 className="text-xl font-bold text-ink" style={{ fontFamily: "var(--font-display)" }}>
          Project creation is restricted
        </h1>
        <p className="mt-2 text-sm text-muted">
          Only an SME owner or administrator can create a project.
        </p>
        <button
          onClick={() => navigate("projects")}
          className="mt-6 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"
        >
          Return to projects
        </button>
      </div>
    );
  }

  const validateStep = (): boolean => {
    setFormError(null);
    if (step === 1) {
      if (name.trim().length < 3 || code.trim().length < 3 || customerName.trim().length < 2) {
        setFormError("Enter the project name, project code, and customer business.");
        return false;
      }
      if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(code.trim())) {
        setFormError("Project code can contain letters, numbers, hyphens, and underscores.");
        return false;
      }
    }
    if (step === 2) {
      if (
        agreementTitle.trim().length < 3 ||
        scope.trim().length < 20 ||
        terms.trim().length < 20
      ) {
        setFormError("Add an agreement title and provide enough detail for the scope and terms.");
        return false;
      }
    }
    if (step === 3) {
      const incomplete = milestones.some(
        (milestone) =>
          milestone.name.trim().length < 3 ||
          Number(milestone.value) <= 0 ||
          !Number.isFinite(Number(milestone.value)) ||
          Math.round(Number(milestone.value) * 100) !== Number(milestone.value) * 100 ||
          milestone.criteria
            .split("\n")
            .map((criterion) => criterion.trim())
            .filter(Boolean).length === 0,
      );
      if (incomplete) {
        setFormError(
          "Every milestone needs a name, valid value, and at least one acceptance criterion.",
        );
        return false;
      }
    }
    return true;
  };

  const continueStep = () => {
    if (validateStep()) setStep((current) => Math.min(4, current + 1));
  };

  const updateMilestone = (
    key: number,
    field: keyof Omit<MilestoneDraft, "key">,
    value: string,
  ) => {
    setMilestones((items) =>
      items.map((milestone) =>
        milestone.key === key ? { ...milestone, [field]: value } : milestone,
      ),
    );
  };

  const addMilestone = () => {
    setMilestones((items) => [...items, blankMilestone(nextKey)]);
    setNextKey((key) => key + 1);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const createdId = await createProject({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        customerName: customerName.trim(),
        currencyCode: "AED",
        agreement: {
          title: agreementTitle.trim(),
          scope: scope.trim(),
          terms: terms.trim(),
        },
        milestones: milestones.map((milestone) => ({
          name: milestone.name.trim(),
          ...(milestone.description.trim() ? { description: milestone.description.trim() } : {}),
          value: Number(milestone.value),
          acceptanceCriteria: milestone.criteria
            .split("\n")
            .map((criterion) => criterion.trim())
            .filter(Boolean),
        })),
      });
      if (createdId) window.location.hash = hashForView("project-details", createdId).slice(1);
    } finally {
      setSubmitting(false);
    }
  };

  const labels = ["Project", "Agreement", "Milestones", "Review"];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <button
            onClick={() => navigate("projects")}
            className="mb-3 text-sm font-medium text-muted hover:text-brand"
          >
            ← Back to projects
          </button>
          <h1 className="text-2xl font-bold text-ink" style={{ fontFamily: "var(--font-display)" }}>
            Create a new project
          </h1>
          <p className="mt-1 text-sm text-muted">
            Prepare the project record, draft agreement, and milestone schedule. The customer is
            invited separately next.
          </p>
        </div>
        <span className="rounded-full bg-brand-light px-3 py-1.5 text-xs font-semibold text-brand">
          Draft setup
        </span>
      </div>

      <ol className={`${CARD} grid grid-cols-4 gap-2 p-3`} aria-label="Project creation progress">
        {labels.map((label, index) => {
          const number = index + 1;
          const active = number === step;
          const complete = number < step;
          return (
            <li
              key={label}
              className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm ${active ? "bg-brand-light text-brand" : complete ? "text-ink" : "text-muted"}`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${active || complete ? "bg-brand text-white" : "bg-edge text-muted"}`}
              >
                {complete ? "✓" : number}
              </span>
              <span className="font-semibold">{label}</span>
            </li>
          );
        })}
      </ol>

      <form onSubmit={submit} className={`${CARD} p-7`}>
        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-ink">Project and customer</h2>
            <p className="mt-1 text-sm text-muted">
              This information identifies the work and the two participating businesses.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-5">
              <label className="block">
                <span className="text-xs font-semibold text-ink-dim">Project name</span>
                <input
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    if (!agreementTitle) setAgreementTitle(`${event.target.value} Agreement`);
                  }}
                  placeholder="e.g. Marina Office Refresh"
                  className={INPUT}
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-ink-dim">Internal project code</span>
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value.toUpperCase())}
                  placeholder="e.g. MAR-2026-001"
                  className={INPUT}
                />
              </label>
              <label className="col-span-2 block">
                <span className="text-xs font-semibold text-ink-dim">Customer business name</span>
                <input
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="The customer organization that will review the work"
                  className={INPUT}
                />
                <span className="mt-1.5 block text-[11px] text-muted">
                  The authorized customer approver will be invited in Step 2 of the MVP.
                </span>
              </label>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold text-ink">Draft agreement</h2>
            <p className="mt-1 text-sm text-muted">
              Record what is being delivered and how milestone decisions will work.
            </p>
            <div className="mt-6 space-y-5">
              <label className="block">
                <span className="text-xs font-semibold text-ink-dim">Agreement title</span>
                <input
                  value={agreementTitle}
                  onChange={(event) => setAgreementTitle(event.target.value)}
                  className={INPUT}
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-ink-dim">Scope of work</span>
                <textarea
                  rows={5}
                  value={scope}
                  onChange={(event) => setScope(event.target.value)}
                  placeholder="Describe the work, deliverables, exclusions, and expected outcome."
                  className={INPUT}
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-ink-dim">Decision terms</span>
                <textarea
                  rows={4}
                  value={terms}
                  onChange={(event) => setTerms(event.target.value)}
                  className={INPUT}
                />
              </label>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-ink">Milestone schedule</h2>
                <p className="mt-1 text-sm text-muted">
                  Break the work into independently reviewable stages.
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted">Agreed project value</p>
                <p
                  className="text-lg font-bold text-ink"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {fmt(total)}
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {milestones.map((milestone, index) => (
                <div
                  key={milestone.key}
                  className="rounded-2xl border border-edge bg-canvas/60 p-5"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-ink">Milestone {index + 1}</h3>
                    {milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setMilestones((items) =>
                            items.filter((item) => item.key !== milestone.key),
                          )
                        }
                        className="text-xs font-medium text-danger hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="mt-4 grid grid-cols-[1fr_180px] gap-4">
                    <label className="block">
                      <span className="text-xs font-semibold text-ink-dim">Milestone name</span>
                      <input
                        value={milestone.name}
                        onChange={(event) =>
                          updateMilestone(milestone.key, "name", event.target.value)
                        }
                        placeholder="e.g. Design and planning"
                        className={INPUT}
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold text-ink-dim">Value (AED)</span>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={milestone.value}
                        onChange={(event) =>
                          updateMilestone(milestone.key, "value", event.target.value)
                        }
                        placeholder="0.00"
                        className={INPUT}
                      />
                    </label>
                    <label className="col-span-2 block">
                      <span className="text-xs font-semibold text-ink-dim">
                        Description (optional)
                      </span>
                      <textarea
                        rows={2}
                        value={milestone.description}
                        onChange={(event) =>
                          updateMilestone(milestone.key, "description", event.target.value)
                        }
                        className={INPUT}
                      />
                    </label>
                    <label className="col-span-2 block">
                      <span className="text-xs font-semibold text-ink-dim">
                        Acceptance criteria — one per line
                      </span>
                      <textarea
                        rows={3}
                        value={milestone.criteria}
                        onChange={(event) =>
                          updateMilestone(milestone.key, "criteria", event.target.value)
                        }
                        placeholder={
                          "Approved design files are delivered\nCustomer comments are incorporated"
                        }
                        className={INPUT}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
            {milestones.length < 20 && (
              <button
                type="button"
                onClick={addMilestone}
                className="mt-4 rounded-xl border border-brand/30 px-4 py-2.5 text-sm font-semibold text-brand hover:bg-brand-light"
              >
                + Add milestone
              </button>
            )}
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="text-lg font-semibold text-ink">Review project setup</h2>
            <p className="mt-1 text-sm text-muted">
              Creating this record does not send it to the customer or initiate a payment.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-edge p-4">
                <p className="text-xs text-muted">Project</p>
                <p className="mt-1 font-semibold text-ink">{name}</p>
                <p className="mt-1 text-sm text-muted">
                  {code} · {customerName}
                </p>
              </div>
              <div className="rounded-xl border border-edge p-4">
                <p className="text-xs text-muted">Draft agreement</p>
                <p className="mt-1 font-semibold text-ink">{agreementTitle}</p>
                <p className="mt-1 text-sm text-muted">
                  Awaiting customer invitation and acceptance
                </p>
              </div>
              <div className="col-span-2 rounded-xl border border-edge p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted">Milestones</p>
                  <p className="font-semibold text-ink">{fmt(total)}</p>
                </div>
                <div className="mt-3 space-y-2">
                  {milestones.map((milestone, index) => (
                    <div key={milestone.key} className="flex justify-between text-sm">
                      <span className="text-ink">
                        {index + 1}. {milestone.name}
                      </span>
                      <span className="font-medium text-ink">{fmt(Number(milestone.value))}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {(formError || syncError) && (
          <div
            className="mt-5 rounded-xl border border-danger/25 bg-danger-light px-4 py-3 text-sm text-danger"
            role="alert"
          >
            {formError ?? syncError}
          </div>
        )}

        <div className="mt-7 flex items-center justify-between border-t border-edge pt-5">
          <button
            type="button"
            onClick={() => (step === 1 ? navigate("projects") : setStep((current) => current - 1))}
            className="rounded-xl border border-edge px-4 py-2.5 text-sm font-semibold text-ink hover:bg-edge/40"
          >
            {step === 1 ? "Cancel" : "Back"}
          </button>
          {step < 4 ? (
            <button
              type="button"
              onClick={continueStep}
              className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand/90"
            >
              Continue
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand/90 disabled:opacity-60"
            >
              {submitting ? "Creating project…" : "Create project"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

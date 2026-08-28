import type { NavigationParams, RouteLocation, View } from "@/types";

const STATIC_HASHES: Partial<Record<View, string>> = {
  overview: "#/overview",
  projects: "#/projects",
  "new-project": "#/projects/new",
  activity: "#/activity",
};

const MILESTONE_SUFFIXES: Record<string, View> = {
  review: "milestone-review",
  confirm: "confirm-approval",
  approved: "milestone-approved",
  "request-changes": "request-changes",
  "changes-requested": "request-changes-result",
  "raise-dispute": "raise-dispute",
  disputed: "raise-dispute-result",
};

const AGREEMENT_SUFFIXES: Record<string, View> = {
  confirm: "agreement-confirm",
  receipt: "agreement-receipt",
  "request-amendment": "agreement-amendment",
  amend: "agreement-amend",
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function hashForView(view: View, params: NavigationParams = {}): string {
  const staticHash = STATIC_HASHES[view];
  if (staticHash) return staticHash;
  if (!params.projectId) return "#/not-found";
  const base = `#/projects/${encodeURIComponent(params.projectId)}`;
  if (view === "project-details") return base;
  if (view === "invite-customer") return `${base}/invite`;
  if (view === "agreement-review") {
    return params.agreementId
      ? `${base}/agreements/${encodeURIComponent(params.agreementId)}`
      : "#/not-found";
  }
  if (
    ["agreement-confirm", "agreement-receipt", "agreement-amendment", "agreement-amend"].includes(
      view,
    )
  ) {
    if (!params.agreementId) return "#/not-found";
    const suffix = Object.entries(AGREEMENT_SUFFIXES).find(([, item]) => item === view)?.[0];
    return suffix
      ? `${base}/agreements/${encodeURIComponent(params.agreementId)}/${suffix}`
      : "#/not-found";
  }
  if (!params.milestoneId) return "#/not-found";
  const milestoneBase = `${base}/milestones/${encodeURIComponent(params.milestoneId)}`;
  const suffix = Object.entries(MILESTONE_SUFFIXES).find(([, item]) => item === view)?.[0];
  return suffix ? `${milestoneBase}/${suffix}` : "#/not-found";
}

function decode(segment: string): string | null {
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
}

export function routeFromHash(hash: string): RouteLocation {
  if (!hash || hash === "#" || hash === "#/" || hash === "#/overview") {
    return { view: "overview" };
  }
  if (hash === "#/projects") return { view: "projects" };
  if (hash === "#/projects/new") return { view: "new-project" };
  if (hash === "#/activity") return { view: "activity" };

  const parts = hash.replace(/^#\/?/, "").split("/");
  if (parts[0] !== "projects" || !parts[1]) return { view: "not-found" };
  const projectId = decode(parts[1]);
  if (!projectId || projectId === "new") return { view: "not-found" };
  if (parts.length === 2) return { view: "project-details", projectId };
  if (parts.length === 3 && parts[2] === "invite") {
    return { view: "invite-customer", projectId };
  }
  if (parts[2] === "agreements" && parts[3]) {
    const agreementId = decode(parts[3]);
    if (!agreementId || !UUID_PATTERN.test(agreementId)) return { view: "not-found" };
    if (parts.length === 4) return { view: "agreement-review", projectId, agreementId };
    const agreementView = parts.length === 5 ? AGREEMENT_SUFFIXES[parts[4]] : undefined;
    return agreementView ? { view: agreementView, projectId, agreementId } : { view: "not-found" };
  }
  if (parts.length !== 5 || parts[2] !== "milestones") return { view: "not-found" };
  const milestoneId = decode(parts[3]);
  const view = MILESTONE_SUFFIXES[parts[4]];
  return milestoneId && UUID_PATTERN.test(milestoneId) && view
    ? { view, projectId, milestoneId }
    : { view: "not-found" };
}

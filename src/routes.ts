import type { View } from "@/types"

const STATIC_HASHES: Partial<Record<View, string>> = {
  overview: "#/overview",
  projects: "#/projects",
  "new-project": "#/projects/new",
  activity: "#/activity",
}

export function hashForView(
  view: View,
  projectId = "cafe-renovation",
): string {
  const staticHash = STATIC_HASHES[view]
  if (staticHash) return staticHash
  const base = `#/projects/${encodeURIComponent(projectId)}`
  const projectHashes: Partial<Record<View, string>> = {
    "project-details": base,
    "invite-customer": `${base}/invite`,
    "milestone-review": `${base}/milestones/2/review`,
    "confirm-approval": `${base}/milestones/2/confirm`,
    "milestone-approved": `${base}/milestones/2/approved`,
    "request-changes": `${base}/milestones/2/request-changes`,
    "request-changes-result": `${base}/milestones/2/changes-requested`,
    "raise-dispute": `${base}/milestones/2/raise-dispute`,
    "raise-dispute-result": `${base}/milestones/2/disputed`,
  }
  return projectHashes[view] ?? "#/overview"
}

export function viewFromHash(hash: string): View {
  if (!hash || hash === "#" || hash === "#/") return "overview"
  if (hash === "#/overview") return "overview"
  if (hash === "#/projects") return "projects"
  if (hash === "#/projects/new") return "new-project"
  if (hash === "#/activity") return "activity"
  if (/^#\/projects\/[^/]+$/.test(hash)) return "project-details"
  if (/^#\/projects\/[^/]+\/invite$/.test(hash)) return "invite-customer"
  if (hash.endsWith("/milestones/2/review")) return "milestone-review"
  if (hash.endsWith("/milestones/2/confirm")) return "confirm-approval"
  if (hash.endsWith("/milestones/2/approved")) return "milestone-approved"
  if (hash.endsWith("/milestones/2/request-changes")) return "request-changes"
  if (hash.endsWith("/milestones/2/changes-requested")) return "request-changes-result"
  if (hash.endsWith("/milestones/2/raise-dispute")) return "raise-dispute"
  if (hash.endsWith("/milestones/2/disputed")) return "raise-dispute-result"
  return "overview"
}

export function projectIdFromHash(hash: string): string | null {
  const match = hash.match(/^#\/projects\/([^/]+)/)
  if (!match || match[1] === "new") return null
  return decodeURIComponent(match[1])
}

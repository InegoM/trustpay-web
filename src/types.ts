export type View =
  | "overview"
  | "projects"
  | "new-project"
  | "invite-customer"
  | "project-details"
  | "milestone-review"
  | "confirm-approval"
  | "milestone-approved"
  | "request-changes"
  | "request-changes-result"
  | "raise-dispute"
  | "raise-dispute-result"
  | "activity";

export interface PageProps {
  navigate: (view: View) => void;
}

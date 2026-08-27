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

export interface RouteLocation {
  view: View | "not-found";
  projectId?: string;
  milestoneId?: string;
}

export interface NavigationParams {
  projectId?: string;
  milestoneId?: string;
}

export type Navigate = (view: View, params?: NavigationParams) => void;

export interface PageProps {
  navigate: Navigate;
}

export interface MilestonePageProps extends PageProps {
  milestoneId: string;
  showResult?: boolean;
}

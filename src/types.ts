export type View =
  | "overview"
  | "projects"
  | "new-project"
  | "invite-customer"
  | "agreement-review"
  | "agreement-confirm"
  | "agreement-receipt"
  | "agreement-amendment"
  | "agreement-amend"
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
  agreementId?: string;
}

export interface NavigationParams {
  projectId?: string;
  milestoneId?: string;
  agreementId?: string;
}

export type Navigate = (view: View, params?: NavigationParams) => void;

export interface PageProps {
  navigate: Navigate;
}

export interface MilestonePageProps extends PageProps {
  milestoneId: string;
  showResult?: boolean;
}

export interface AgreementPageProps extends PageProps {
  agreementId: string;
}

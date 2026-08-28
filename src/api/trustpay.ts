import {
  type ActivityEvent,
  type EventType,
  type Milestone,
  type MilestoneStatus,
  type ProjectRecord,
} from "@/data/mock";

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3001").replace(/\/$/, "");

interface ApiEnvelope<T> {
  data: T;
}

interface ApiErrorEnvelope {
  error?: { code?: string; message?: string };
}

export interface ApiMilestone {
  id: string;
  sequenceNumber: number;
  name: string;
  value: number;
  status: MilestoneStatus;
  description?: string;
  acceptanceCriteria?: string[];
  submittedBy?: string;
  submittedAt?: string;
  responseDeadline?: string;
  completedAt?: string;
}

export interface ApiProject {
  id: string;
  name: string;
  customer: string;
  sme: string;
  agreedValue: number;
  approvedValue: number;
  outstandingValue: number;
  status: "in-progress" | "completed" | "on-hold";
  agreementVersion: string;
  agreementId?: string;
  agreementStatus: "draft" | "active";
  agreementTitle?: string;
  agreementScope?: string;
  agreementTerms?: string;
  agreementAcceptedAt?: string;
  authorizedApprover: string;
  milestones: ApiMilestone[];
}

export interface CreateProjectInput {
  name: string;
  code: string;
  customerName: string;
  currencyCode: string;
  agreement: {
    title: string;
    scope: string;
    terms: string;
  };
  milestones: Array<{
    name: string;
    description?: string;
    value: number;
    acceptanceCriteria: string[];
  }>;
}

export interface ApiProjectInvitation {
  id: string;
  projectId: string;
  email: string;
  role: "APPROVER";
  status: "pending" | "accepted" | "expired" | "revoked";
  invitedBy: string;
  expiresAt: string;
  createdAt: string;
}

export interface CreatedProjectInvitation {
  invitation: ApiProjectInvitation;
  token: string;
}

export interface ApiActivityEvent {
  id: string;
  projectId: string;
  milestoneId?: string;
  milestoneSequenceNumber?: number;
  actor: string;
  actorType: "sme" | "customer" | "system";
  occurredAt: string;
  description: string;
  type:
    | "project-created"
    | "customer-invited"
    | "customer-approver-joined"
    | "agreement-accepted"
    | "agreement-amendment-requested"
    | "agreement-version-created"
    | "milestone-approved"
    | "evidence-submitted"
    | "changes-requested"
    | "dispute-recorded"
    | "decision-recorded";
  reference?: string;
}

export interface ApiAgreementMilestone {
  sequenceNumber: number;
  name: string;
  description?: string;
  value: number;
  acceptanceCriteria: string[];
}

export interface ApiAgreementVersion {
  id: string;
  versionNumber: number;
  label: string;
  status: "draft" | "active" | "superseded" | "amendment-requested";
  content: {
    title: string;
    scope: string;
    terms: string;
    currency: string;
    projectValue: number;
    milestones: ApiAgreementMilestone[];
  };
  contentHash: string;
  createdAt: string;
  createdBy: string;
  acceptance?: {
    id: string;
    organization: string;
    acceptedBy: string;
    acceptedAt: string;
    reference: string;
  };
  amendmentRequest?: {
    id: string;
    reason: string;
    requestedBy: string;
    requestedAt: string;
    reference: string;
  };
}

export type AgreementDecisionInput =
  | { action: "accept"; authorityConfirmed: true; expectedVersionId: string }
  | { action: "request-amendment"; reason: string; expectedVersionId: string };

export interface AgreementDecisionResult {
  agreement: ApiAgreementVersion;
  event: ApiActivityEvent;
}

export type DecisionInput =
  | { action: "approve" }
  | {
      action: "request-changes";
      reason: string;
      comment: string;
      responseDate: string;
    }
  | {
      action: "raise-dispute";
      reason: string;
      explanation: string;
    };

interface DecisionResult {
  project: ApiProject;
  milestone: ApiMilestone;
  events: ApiActivityEvent[];
}

export class TrustPayApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "TrustPayApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  } catch {
    throw new TrustPayApiError(
      "Cannot reach the TrustPay API. Start trustpay-api on port 3001.",
      0,
      "API_UNAVAILABLE",
    );
  }

  const body = (await response.json().catch(() => ({}))) as ApiEnvelope<T> | ApiErrorEnvelope;
  if (!response.ok) {
    const error = "error" in body ? body.error : undefined;
    throw new TrustPayApiError(
      error?.message ?? `The API returned status ${response.status}`,
      response.status,
      error?.code ?? "API_ERROR",
    );
  }

  return (body as ApiEnvelope<T>).data;
}

export interface AuthOrganization {
  id: string;
  name: string;
  type: "SME" | "CUSTOMER" | "SUPPLIER" | "BANK_PARTNER";
  role: "OWNER" | "ADMIN" | "APPROVER" | "MEMBER";
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  organizations: AuthOrganization[];
}

export function login(email: string, password: string): Promise<AuthUser> {
  return request("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function logout(): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
  } catch {
    throw new TrustPayApiError("Cannot reach the TrustPay API.", 0, "API_UNAVAILABLE");
  }
  if (!response.ok && response.status !== 204) {
    throw new TrustPayApiError("Could not sign out.", response.status, "LOGOUT_FAILED");
  }
}

export function getCurrentUser(): Promise<AuthUser> {
  return request("/api/v1/me");
}

export function acceptInvitation(input: {
  token: string;
  displayName: string;
  password: string;
}): Promise<AuthUser> {
  return request("/api/v1/invitations/accept", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getProject(projectId: string): Promise<ApiProject> {
  return request(`/api/v1/projects/${encodeURIComponent(projectId)}`);
}

export function listAgreements(projectId: string): Promise<ApiAgreementVersion[]> {
  return request(`/api/v1/projects/${encodeURIComponent(projectId)}/agreements`);
}

export function getAgreement(projectId: string, agreementId: string): Promise<ApiAgreementVersion> {
  return request(
    `/api/v1/projects/${encodeURIComponent(projectId)}/agreements/${encodeURIComponent(agreementId)}`,
  );
}

export function createAgreementVersion(
  projectId: string,
  input: { baseVersionId: string; title: string; scope: string; terms: string },
): Promise<ApiAgreementVersion> {
  return request(`/api/v1/projects/${encodeURIComponent(projectId)}/agreements`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function recordAgreementDecision(
  projectId: string,
  agreementId: string,
  decision: AgreementDecisionInput,
  idempotencyKey: string,
): Promise<AgreementDecisionResult> {
  return request(
    `/api/v1/projects/${encodeURIComponent(projectId)}/agreements/${encodeURIComponent(agreementId)}/decisions`,
    {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify(decision),
    },
  );
}

export function listProjects(): Promise<ApiProject[]> {
  return request("/api/v1/projects");
}

export function createProject(input: CreateProjectInput): Promise<ApiProject> {
  return request("/api/v1/projects", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listProjectInvitations(projectId: string): Promise<ApiProjectInvitation[]> {
  return request(`/api/v1/projects/${encodeURIComponent(projectId)}/invitations`);
}

export function createCustomerInvitation(
  projectId: string,
  email: string,
): Promise<CreatedProjectInvitation> {
  return request(`/api/v1/projects/${encodeURIComponent(projectId)}/invitations`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function getProjectActivity(projectId: string): Promise<ApiActivityEvent[]> {
  return request(`/api/v1/projects/${encodeURIComponent(projectId)}/activity`);
}

export function recordDecision(
  projectId: string,
  milestoneId: string,
  decision: DecisionInput,
): Promise<DecisionResult> {
  return request(
    `/api/v1/projects/${encodeURIComponent(projectId)}/milestones/${encodeURIComponent(milestoneId)}/decisions`,
    { method: "POST", body: JSON.stringify(decision) },
  );
}

function formatDate(value?: string, includeTime = false): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const formatted = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(includeTime ? { hour: "numeric", minute: "2-digit", hour12: true } : {}),
    timeZone: "Asia/Dubai",
  }).format(date);
  return includeTime ? `${formatted} GST` : formatted;
}

function mergeMilestone(api: ApiMilestone, current?: Milestone): Milestone {
  return {
    id: api.id,
    sequenceNumber: api.sequenceNumber,
    name: api.name,
    value: api.value,
    status: api.status,
    ...(api.completedAt ? { completedDate: formatDate(api.completedAt) } : {}),
    ...(api.submittedAt ? { submittedDate: formatDate(api.submittedAt) } : {}),
    ...(api.submittedBy ? { submittedBy: api.submittedBy } : {}),
    ...(api.responseDeadline ? { deadline: formatDate(api.responseDeadline, true) } : {}),
    criteria: api.acceptanceCriteria ?? current?.criteria ?? [],
    requiredEvidence: current?.requiredEvidence ?? [],
    submittedEvidence: current?.submittedEvidence ?? [],
  };
}

export function projectFromApi(api: ApiProject, current?: ProjectRecord): ProjectRecord {
  return {
    id: api.id,
    name: api.name,
    customer: api.customer,
    sme: api.sme,
    agreedValue: api.agreedValue,
    approvedValue: api.approvedValue,
    outstandingValue: api.outstandingValue,
    status:
      api.status === "in-progress"
        ? "In progress"
        : api.status === "on-hold"
          ? "On hold"
          : "Completed",
    agreementVersion: api.agreementVersion,
    ...(api.agreementId ? { agreementId: api.agreementId } : {}),
    agreementStatus: api.agreementStatus,
    ...(api.agreementTitle ? { agreementTitle: api.agreementTitle } : {}),
    ...(api.agreementScope ? { agreementScope: api.agreementScope } : {}),
    ...(api.agreementTerms ? { agreementTerms: api.agreementTerms } : {}),
    agreementAccepted: formatDate(api.agreementAcceptedAt) ?? "Not accepted",
    authorizedApprover: api.authorizedApprover,
    milestones: api.milestones.map((milestone) =>
      mergeMilestone(
        milestone,
        current?.id === api.id
          ? current.milestones.find((item) => item.id === milestone.id)
          : undefined,
      ),
    ),
    variations: current?.id === api.id ? current.variations : [],
  };
}

export function activityFromApi(api: ApiActivityEvent, projectName: string): ActivityEvent {
  return {
    id: api.id,
    actor: api.actor,
    actorType: api.actorType,
    timestamp: formatDate(api.occurredAt, true) ?? api.occurredAt,
    project: projectName,
    ...(api.milestoneSequenceNumber
      ? { milestone: `Milestone ${api.milestoneSequenceNumber}` }
      : {}),
    description: api.description,
    event: api.type as EventType,
  };
}

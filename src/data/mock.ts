export const CURRENT_USER = {
  name: "Nadia Rahman",

  company: "Alba Fit-Out",

  initials: "NR",

  role: "SME Owner",
};

export type MilestoneStatus =
  | "approved"
  | "awaiting-decision"
  | "changes-requested"
  | "disputed"
  | "in-progress"
  | "not-started";
export type ActorType = "sme" | "customer" | "system";

export type EventType =
  | "project-created"
  | "customer-invited"
  | "customer-approver-joined"
  | "agreement-accepted"
  | "agreement-amendment-requested"
  | "agreement-version-created"
  | "agreement-sent"
  | "evidence-submitted"
  | "milestone-approved"
  | "variation-approved"
  | "decision-recorded"
  | "changes-requested"
  | "dispute-recorded";

export interface Milestone {
  id: string;

  sequenceNumber: number;

  name: string;

  value: number;

  status: MilestoneStatus;

  completedDate?: string;

  submittedDate?: string;

  submittedBy?: string;

  deadline?: string;

  criteria?: string[];

  criteriaDetailed?: Array<{ id: string; position: number; description: string }>;

  requiredEvidence?: string[];
}

export interface ActivityEvent {
  id: number | string;

  actor: string;

  actorType: ActorType;

  timestamp: string;

  project: string;

  milestone?: string;

  description: string;

  event: EventType;
}

export interface ProjectRecord {
  id: string;
  name: string;
  customer: string;
  sme: string;
  agreedValue: number;
  approvedValue: number;
  outstandingValue: number;
  status: string;
  agreementVersion: string;
  agreementId?: string;
  agreementStatus: "draft" | "active";
  agreementTitle?: string;
  agreementScope?: string;
  agreementTerms?: string;
  agreementAccepted: string;
  authorizedApprover: string;
  milestones: Milestone[];
  variations: Array<{
    id: string;
    description: string;
    approvedDate: string;
    valueChange: string | null;
  }>;
}

const MILESTONE_2: Milestone = {
  id: "30000000-0000-4000-8000-000000000002",

  sequenceNumber: 2,

  name: "Structural and electrical work",

  value: 45_000,

  status: "awaiting-decision",

  submittedDate: "20 August 2026",

  submittedBy: "Alba Fit-Out",

  deadline: "27 August 2026, 5:00 PM GST",

  criteria: [
    "Structural partitions match the approved layout",

    "Electrical and plumbing rough-ins are complete",

    "Electrical installation matches the approved plan",

    "Work area is ready for inspection",
  ],

  requiredEvidence: [
    "Wide-angle site photographs",

    "Close-up photographs of electrical work",

    "Updated electrical layout",

    "Inspection checklist",
  ],
};

export const PROJECT: ProjectRecord = {
  id: "cafe-renovation",

  name: "Café Renovation",

  customer: "Cedar Café",

  sme: "Alba Fit-Out",

  agreedValue: 90_000,

  approvedValue: 18_000,

  outstandingValue: 72_000,

  status: "In progress",

  agreementVersion: "v1.2",
  agreementStatus: "active",
  agreementTitle: "Café Renovation Agreement",
  agreementScope: "Design, structural work, electrical work, finishing and handover",

  agreementAccepted: "8 August 2026",

  authorizedApprover: "Omar Hassan",

  milestones: [
    {
      id: "30000000-0000-4000-8000-000000000001",

      sequenceNumber: 1,

      name: "Design and planning",

      value: 18_000,

      status: "approved",
      completedDate: "10 August 2026",
    },

    MILESTONE_2,

    {
      id: "30000000-0000-4000-8000-000000000003",

      sequenceNumber: 3,

      name: "Finishing and handover",

      value: 27_000,

      status: "not-started",
    },
  ],
  variations: [
    {
      id: "01",

      description: "Relocate two electrical outlets beside the service counter",

      approvedDate: "18 August 2026",

      valueChange: null,
    },
  ],
};

export const MILESTONE_2_DATA = MILESTONE_2;

export const ACTIVITY_LOG: ActivityEvent[] = [
  {
    id: 1,
    actor: "Nadia Rahman",
    actorType: "sme",
    timestamp: "20 Aug 2026, 9:25 AM GST",
    project: "Café Renovation",
    milestone: "Milestone 2",
    description: "Evidence submitted for Milestone 2 — 4 items uploaded for customer review",
    event: "evidence-submitted",
  },
  {
    id: 2,
    actor: "Omar Hassan",
    actorType: "customer",
    timestamp: "18 Aug 2026, 2:10 PM GST",
    project: "Café Renovation",
    milestone: "Milestone 2",
    description:
      "Variation 01 approved — Relocate electrical outlets beside service counter. No change to project value.",
    event: "variation-approved",
  },
  {
    id: 3,
    actor: "Omar Hassan",
    actorType: "customer",
    timestamp: "10 Aug 2026, 11:30 AM GST",
    project: "Café Renovation",
    milestone: "Milestone 1",
    description: "Milestone 1 approved — Design and planning",
    event: "milestone-approved",
  },
  {
    id: 4,
    actor: "Omar Hassan",
    actorType: "customer",
    timestamp: "8 Aug 2026, 4:05 PM GST",
    project: "Café Renovation",
    description: "Agreement v1.2 accepted by Omar Hassan (Cedar Café)",
    event: "agreement-accepted",
  },
  {
    id: 5,
    actor: "Nadia Rahman",
    actorType: "sme",
    timestamp: "7 Aug 2026, 10:20 AM GST",
    project: "Café Renovation",
    description: "Agreement v1.2 sent to Cedar Café for acceptance",
    event: "agreement-sent",
  },
];

export function fmt(n: number): string {
  return `AED ${n.toLocaleString()}`;
}

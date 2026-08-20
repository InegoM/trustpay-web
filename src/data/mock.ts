export const CURRENT_USER = {
  name: "Nadia Rahman",
  company: "Alba Fit-Out",
  initials: "NR",
  role: "SME Owner",
};

export type MilestoneStatus = "approved" | "awaiting-decision" | "not-started";
export type EvidenceType = "image" | "pdf" | "document";
export type ActorType = "sme" | "customer" | "system";
export type EventType =
  | "agreement-accepted"
  | "agreement-sent"
  | "evidence-submitted"
  | "milestone-approved"
  | "variation-approved"
  | "decision-recorded"
  | "changes-requested"
  | "dispute-recorded";

export interface EvidenceItem {
  id: number;
  name: string;
  type: EvidenceType;
  uploadedAt: string;
  uploadedBy: string;
}

export interface Milestone {
  id: number;
  name: string;
  value: number;
  status: MilestoneStatus;
  completedDate?: string;
  submittedDate?: string;
  submittedBy?: string;
  deadline?: string;
  criteria?: string[];
  requiredEvidence?: string[];
  submittedEvidence?: EvidenceItem[];
}

export interface ActivityEvent {
  id: number;
  actor: string;
  actorType: ActorType;
  timestamp: string;
  project: string;
  milestone?: string;
  description: string;
  event: EventType;
}

const MILESTONE_2: Milestone = {
  id: 2,
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
  submittedEvidence: [
    { id: 1, name: "Site progress photographs", type: "image", uploadedAt: "20 Aug 2026, 9:14 AM GST", uploadedBy: "Nadia Rahman" },
    { id: 2, name: "Electrical rough-in close-ups", type: "image", uploadedAt: "20 Aug 2026, 9:18 AM GST", uploadedBy: "Nadia Rahman" },
    { id: 3, name: "Updated layout document", type: "pdf", uploadedAt: "20 Aug 2026, 9:22 AM GST", uploadedBy: "Nadia Rahman" },
    { id: 4, name: "Inspection checklist", type: "pdf", uploadedAt: "20 Aug 2026, 9:25 AM GST", uploadedBy: "Nadia Rahman" },
  ],
};

export const PROJECT = {
  id: "cafe-renovation",
  name: "Café Renovation",
  customer: "Cedar Café",
  sme: "Alba Fit-Out",
  agreedValue: 90_000,
  approvedValue: 18_000,
  outstandingValue: 72_000,
  status: "In progress",
  agreementVersion: "v1.2",
  agreementAccepted: "8 August 2026",
  authorizedApprover: "Omar Hassan",
  milestones: [
    {
      id: 1,
      name: "Design and planning",
      value: 18_000,
      status: "approved" as MilestoneStatus,
      completedDate: "10 August 2026",
    },
    MILESTONE_2,
    {
      id: 3,
      name: "Finishing and handover",
      value: 27_000,
      status: "not-started" as MilestoneStatus,
    },
  ] as Milestone[],
  variations: [
    {
      id: "01",
      description: "Relocate two electrical outlets beside the service counter",
      approvedDate: "18 August 2026",
      valueChange: null as null,
    },
  ],
};

export const MILESTONE_2_DATA = MILESTONE_2;

export const ACTIVITY_LOG: ActivityEvent[] = [
  { id: 1, actor: "System", actorType: "system", timestamp: "27 Aug 2026, 3:42 PM GST", project: "Café Renovation", milestone: "Milestone 2", description: "Decision recorded automatically. Reference: TP-CAF-M2-2026-0827", event: "decision-recorded" },
  { id: 2, actor: "Omar Hassan", actorType: "customer", timestamp: "27 Aug 2026, 3:41 PM GST", project: "Café Renovation", milestone: "Milestone 2", description: "Milestone 2 approved — Structural and electrical work", event: "milestone-approved" },
  { id: 3, actor: "Nadia Rahman", actorType: "sme", timestamp: "20 Aug 2026, 9:25 AM GST", project: "Café Renovation", milestone: "Milestone 2", description: "Evidence submitted for Milestone 2 — 4 items uploaded for customer review", event: "evidence-submitted" },
  { id: 4, actor: "Omar Hassan", actorType: "customer", timestamp: "18 Aug 2026, 2:10 PM GST", project: "Café Renovation", milestone: "Milestone 2", description: "Variation 01 approved — Relocate electrical outlets beside service counter. No change to project value.", event: "variation-approved" },
  { id: 5, actor: "Omar Hassan", actorType: "customer", timestamp: "10 Aug 2026, 11:30 AM GST", project: "Café Renovation", milestone: "Milestone 1", description: "Milestone 1 approved — Design and planning", event: "milestone-approved" },
  { id: 6, actor: "Omar Hassan", actorType: "customer", timestamp: "8 Aug 2026, 4:05 PM GST", project: "Café Renovation", description: "Agreement v1.2 accepted by Omar Hassan (Cedar Café)", event: "agreement-accepted" },
  { id: 7, actor: "Nadia Rahman", actorType: "sme", timestamp: "7 Aug 2026, 10:20 AM GST", project: "Café Renovation", description: "Agreement v1.2 sent to Cedar Café for acceptance", event: "agreement-sent" },
];

export function fmt(n: number): string {
  return `AED ${n.toLocaleString()}`;
}

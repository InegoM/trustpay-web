import { expect, test, type Page } from "@playwright/test";

const projectId = "dynamic-project";
const milestones = [
  {
    id: "30000000-0000-4000-8000-000000000001",
    sequenceNumber: 1,
    name: "Design",
    value: 10_000,
    status: "approved",
  },
  {
    id: "30000000-0000-4000-8000-000000000002",
    sequenceNumber: 2,
    name: "Build",
    value: 20_000,
    status: "awaiting-decision",
    responseDeadline: "2026-08-30T17:00:00+04:00",
    acceptanceCriteria: ["Work matches the agreed scope"],
    acceptanceCriteriaDetailed: [
      {
        id: "31000000-0000-4000-8000-000000000001",
        position: 1,
        description: "Work matches the agreed scope",
      },
    ],
  },
  {
    id: "30000000-0000-4000-8000-000000000003",
    sequenceNumber: 3,
    name: "Handover",
    value: 10_000,
    status: "not-started",
  },
];

const project = {
  id: projectId,
  name: "Dynamic Project",
  customer: "Customer Org",
  sme: "SME Org",
  agreedValue: 40_000,
  approvedValue: 10_000,
  outstandingValue: 30_000,
  status: "in-progress",
  agreementVersion: "v1.0",
  agreementId: "50000000-0000-4000-8000-000000000002",
  agreementStatus: "active",
  agreementAcceptedAt: "2026-08-01T12:00:00+04:00",
  authorizedApprover: "Omar Hassan",
  milestones,
};

const agreement = {
  id: project.agreementId,
  versionNumber: 1,
  label: "v1.0",
  status: "draft",
  content: {
    title: "Dynamic Project Agreement",
    scope: "Complete the documented works for the customer project.",
    terms: "Each milestone is reviewed against its stated acceptance criteria before a decision.",
    currency: "AED",
    projectValue: 40_000,
    milestones: milestones.map((milestone) => ({
      sequenceNumber: milestone.sequenceNumber,
      name: milestone.name,
      value: milestone.value,
      acceptanceCriteria: milestone.acceptanceCriteria ?? [],
    })),
  },
  contentHash: "9f6f4e8e3b52c01d4ec51d766331d435",
  createdAt: "2026-08-01T12:00:00+04:00",
  createdBy: "Nadia Rahman",
};

const evidenceSubmission = {
  id: "60000000-0000-4000-8000-000000000001",
  projectId,
  milestoneId: milestones[1].id,
  milestoneSequenceNumber: 2,
  milestoneName: "Build",
  submissionNumber: 1,
  status: "submitted",
  notes: "Completed work is ready for customer review.",
  createdAt: "2026-08-29T08:00:00.000Z",
  submittedAt: "2026-08-29T09:00:00.000Z",
  submittedBy: "Nadia Rahman",
  agreementVersionId: project.agreementId,
  agreementVersion: "v1.0",
  canEdit: false,
  evidence: [
    {
      id: "61000000-0000-4000-8000-000000000001",
      originalName: "completed-work.png",
      mimeType: "image/png",
      detectedMimeType: "image/png",
      sizeBytes: 245000,
      sha256: "a".repeat(64),
      scanStatus: "clean",
      description: "Wide-angle view of the completed work.",
      acceptanceCriterionId: "31000000-0000-4000-8000-000000000001",
      acceptanceCriterion: "Work matches the agreed scope",
      uploadedBy: "Nadia Rahman",
      uploadedAt: "2026-08-29T08:45:00.000Z",
      downloadPath: "/private-download",
    },
  ],
};

const changeRequestSubmission = {
  ...evidenceSubmission,
  decision: {
    id: "70000000-0000-4000-8000-000000000001",
    action: "request-changes" as const,
    decidedBy: "Omar Hassan",
    decidedAt: "2026-08-30T10:00:00.000Z",
    reference: "TP-DEC-TEST-0001",
  },
  changeRequest: {
    id: "71000000-0000-4000-8000-000000000001",
    reasonCategory: "Work does not meet acceptance criteria",
    requiredChanges: "Relocate the outlet boxes and upload close-up evidence after correction.",
    reason: "Work does not meet acceptance criteria",
    comment: "Relocate the outlet boxes and upload close-up evidence after correction.",
    responseDueAt: "2026-09-02T12:00:00.000Z",
    requestedBy: "Omar Hassan",
    requestedAt: "2026-08-30T10:00:00.000Z",
    decisionReference: "TP-DEC-TEST-0001",
    acceptanceCriterionIds: ["31000000-0000-4000-8000-000000000001"],
    evidenceItemIds: ["61000000-0000-4000-8000-000000000001"],
  },
};

async function mockApi(
  page: Page,
  actor: "customer" | "sme" = "customer",
  scenario: "standard" | "changes-requested" = "standard",
) {
  let draft: typeof evidenceSubmission | null = null;
  let resubmission: typeof changeRequestSubmission | null = null;
  await page.route("http://localhost:3001/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/v1/me") {
      return route.fulfill({
        json: {
          data: {
            id: actor === "customer" ? "user-1" : "user-2",
            email: actor === "customer" ? "omar@example.test" : "nadia@example.test",
            displayName: actor === "customer" ? "Omar Hassan" : "Nadia Rahman",
            organizations: [
              actor === "customer"
                ? { id: "org-1", name: "Customer Org", type: "CUSTOMER", role: "APPROVER" }
                : { id: "org-2", name: "SME Org", type: "SME", role: "OWNER" },
            ],
          },
        },
      });
    }
    if (path === "/api/v1/projects") return route.fulfill({ json: { data: [project] } });
    if (path === `/api/v1/projects/${projectId}`) {
      return route.fulfill({ json: { data: project } });
    }
    if (path === `/api/v1/projects/${projectId}/activity`) {
      return route.fulfill({ json: { data: [] } });
    }
    const submissionsMatch = path.match(
      new RegExp(`^/api/v1/projects/${projectId}/milestones/([^/]+)/submissions$`),
    );
    if (submissionsMatch && route.request().method() === "GET") {
      return route.fulfill({
        json: {
          data:
            submissionsMatch[1] === milestones[1].id
              ? scenario === "changes-requested"
                ? [resubmission ?? changeRequestSubmission]
                : [evidenceSubmission]
              : draft
                ? [draft]
                : [],
        },
      });
    }
    if (
      path === `/api/v1/projects/${projectId}/milestones/${milestones[1].id}/change-requests` &&
      route.request().method() === "GET"
    ) {
      return route.fulfill({
        json: {
          data: scenario === "changes-requested" ? [changeRequestSubmission.changeRequest] : [],
        },
      });
    }
    if (
      path ===
        `/api/v1/projects/${projectId}/milestones/${milestones[1].id}/change-requests/${changeRequestSubmission.changeRequest.id}/respond` &&
      route.request().method() === "POST"
    ) {
      expect(route.request().headers()["idempotency-key"]).toBeTruthy();
      resubmission = {
        ...changeRequestSubmission,
        id: "60000000-0000-4000-8000-000000000003",
        submissionNumber: 2,
        status: "draft",
        submittedAt: undefined,
        canEdit: true,
        evidence: [],
        responseToChangeRequest: {
          id: "72000000-0000-4000-8000-000000000001",
          changeRequestId: changeRequestSubmission.changeRequest.id,
          response: "The outlet boxes will be relocated and photographed.",
          respondedBy: "Nadia Rahman",
          respondedAt: "2026-08-30T12:00:00.000Z",
        },
      };
      return route.fulfill({ status: 201, json: { data: resubmission } });
    }
    if (submissionsMatch && route.request().method() === "POST" && actor === "sme") {
      draft = {
        ...evidenceSubmission,
        id: "60000000-0000-4000-8000-000000000002",
        milestoneId: milestones[2].id,
        milestoneSequenceNumber: 3,
        milestoneName: "Handover",
        status: "draft",
        notes: undefined,
        submittedAt: undefined,
        canEdit: true,
        evidence: [],
      };
      return route.fulfill({ status: 201, json: { data: draft } });
    }
    if (draft && path.endsWith(`/${draft.id}/evidence`) && route.request().method() === "POST") {
      const uploaded = {
        ...evidenceSubmission.evidence[0],
        id: "61000000-0000-4000-8000-000000000002",
        originalName: "handover.png",
        acceptanceCriterionId: undefined,
        acceptanceCriterion: undefined,
      };
      draft = { ...draft, evidence: [uploaded] };
      return route.fulfill({ status: 201, json: { data: uploaded } });
    }
    if (draft && path.endsWith(`/${draft.id}/submit`) && route.request().method() === "POST") {
      draft = {
        ...draft,
        status: "submitted",
        submittedAt: "2026-08-30T09:00:00.000Z",
        canEdit: false,
      };
      return route.fulfill({ status: 201, json: { data: draft } });
    }
    if (path === `/api/v1/projects/${projectId}/agreements`) {
      if (route.request().method() === "GET") return route.fulfill({ json: { data: [agreement] } });
    }
    if (
      path === `/api/v1/projects/${projectId}/milestones/${milestones[1].id}/decisions` &&
      route.request().method() === "POST"
    ) {
      const body = route.request().postDataJSON();
      expect(body).toMatchObject({
        action: "request-changes",
        acceptanceCriterionIds: ["31000000-0000-4000-8000-000000000001"],
        evidenceItemIds: ["61000000-0000-4000-8000-000000000001"],
      });
      return route.fulfill({
        status: 201,
        json: {
          data: {
            project: {
              ...project,
              milestones: project.milestones.map((item) =>
                item.id === milestones[1].id ? { ...item, status: "changes-requested" } : item,
              ),
            },
            milestone: { ...milestones[1], status: "changes-requested" },
            events: [
              {
                id: "event-change-request",
                projectId,
                milestoneId: milestones[1].id,
                milestoneSequenceNumber: 2,
                actor: "Omar Hassan",
                actorType: "customer",
                occurredAt: "2026-08-30T10:00:00.000Z",
                description: "Changes requested",
                type: "changes-requested",
                reference: "TP-DEC-TEST-0001",
              },
            ],
          },
        },
      });
    }
    if (path === `/api/v1/projects/${projectId}/agreements/${project.agreementId}`) {
      if (route.request().method() === "GET") return route.fulfill({ json: { data: agreement } });
    }
    if (path === `/api/v1/projects/${projectId}/agreements/${project.agreementId}/decisions`) {
      expect(route.request().headers()["idempotency-key"]).toBeTruthy();
      return route.fulfill({
        json: {
          data: {
            agreement: {
              ...agreement,
              status: "active",
              acceptance: {
                id: "acceptance-1",
                organization: "Customer Org",
                acceptedBy: "Omar Hassan",
                acceptedAt: "2026-08-28T12:00:00.000Z",
                reference: "TP-AGR-TEST-0001",
              },
            },
            event: {
              id: "event-accept",
              projectId,
              actor: "Omar Hassan",
              actorType: "customer",
              occurredAt: "2026-08-28T12:00:00.000Z",
              description: "Agreement accepted",
              type: "agreement-accepted",
              reference: "TP-AGR-TEST-0001",
            },
          },
        },
      });
    }
    return route.fulfill({
      status: 404,
      json: { error: { code: "PROJECT_NOT_FOUND", message: "Project not found" } },
    });
  });
}

test.beforeEach(async ({ page }) => mockApi(page));

test("refreshes a nested stable-ID route and keeps every milestone addressable", async ({
  page,
}) => {
  for (const milestone of milestones) {
    await page.goto(`/#/projects/${projectId}/milestones/${milestone.id}/review`);
    await expect(page.getByRole("heading", { name: milestone.name })).toBeVisible();
    await expect(page.getByText(`Milestone ${milestone.sequenceNumber} of 3`)).toBeVisible();
  }
  await page.reload();
  await expect(page.getByText("Milestone 3 of 3")).toBeVisible();
});

test("customer sees only the submitted immutable evidence package", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`/#/projects/${projectId}/milestones/${milestones[1].id}/review`);
  await expect(page.getByText("Submitted — read only")).toBeVisible();
  await expect(page.getByText("completed-work.png")).toBeVisible();
  await expect(page.getByText("Linked to: Work matches the agreed scope")).toBeVisible();
  await expect(page.getByRole("button", { name: "Remove" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Approve milestone" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test("SME starts, uploads and immutably submits an evidence package", async ({ page }) => {
  await page.unrouteAll();
  await mockApi(page, "sme");
  await page.goto(`/#/projects/${projectId}/milestones/${milestones[2].id}/review`);
  await page.getByRole("button", { name: "Start evidence package" }).click();
  await expect(page.getByRole("heading", { name: "Add evidence" })).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles({
    name: "handover.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await page.getByRole("button", { name: "Upload evidence" }).click();
  await expect(page.getByText("handover.png")).toBeVisible();
  await page.getByRole("button", { name: "Review and submit" }).click();
  await expect(page.getByRole("heading", { name: "Submit evidence package?" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Go back" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Submit package" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Go back" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("heading", { name: "Submit evidence package?" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Review and submit" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Submit evidence package?" })).toBeVisible();
  await page.getByRole("button", { name: "Submit package" }).click();
  await expect(page.getByText("Submitted — read only")).toBeVisible();
  await expect(page.getByRole("button", { name: "Remove" })).toHaveCount(0);
});

test("SME gets clear client-side guidance for a rejected evidence type", async ({ page }) => {
  await page.unrouteAll();
  await mockApi(page, "sme");
  await page.goto(`/#/projects/${projectId}/milestones/${milestones[2].id}/review`);
  await page.getByRole("button", { name: "Start evidence package" }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "handover.exe",
    mimeType: "application/octet-stream",
    buffer: Buffer.from("not an executable"),
  });
  await page.getByRole("button", { name: "Upload evidence" }).click();
  await expect(
    page.getByText("Choose a JPEG, PNG, or PDF file. Other file types are not accepted."),
  ).toBeVisible();
});

test("customer records a structured, confirmed change request against the submitted version", async ({
  page,
}) => {
  await page.goto(`/#/projects/${projectId}/milestones/${milestones[1].id}/review`);
  await page.getByRole("button", { name: "Request changes" }).click();
  await expect(page.getByRole("heading", { name: "Request changes" })).toBeVisible();
  await page
    .getByLabel("Required changes *")
    .fill("Relocate the outlet boxes and add close-up evidence.");
  await page.getByLabel("Requested response date *").fill("2026-09-02");
  await page.getByLabel("1. Work matches the agreed scope").check();
  await page.getByLabel("completed-work.png").check();
  await page.getByRole("button", { name: "Review change request" }).click();
  await expect(page.getByRole("heading", { name: "Record this change request?" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Go back" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Record request" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Go back" })).toBeFocused();
  await page.getByRole("button", { name: "Record request" }).click();
  await expect(
    page.getByRole("heading", { name: "The SME can now respond and resubmit" }),
  ).toBeVisible();
  await expect(
    page.getByText("The original evidence package remains available in the project record."),
  ).toBeVisible();
});

test("SME records a response and gets a new corrected evidence package", async ({ page }) => {
  await page.unrouteAll();
  await mockApi(page, "sme", "changes-requested");
  await page.goto(`/#/projects/${projectId}/milestones/${milestones[1].id}/review`);
  await expect(
    page.getByRole("heading", { name: "Changes requested for Submission #1" }),
  ).toBeVisible();
  await expect(
    page.getByText("Relocate the outlet boxes and upload close-up evidence after correction."),
  ).toBeVisible();
  await page
    .getByLabel("Your response")
    .fill("The outlet boxes will be relocated and photographed.");
  await page.getByRole("button", { name: "Record response and start corrected package" }).click();
  await expect(page.getByRole("heading", { name: "Add evidence" })).toBeVisible();
  await expect(page.getByText("Submission #2")).toBeVisible();
});

test("customer can review an exact agreement version and confirm recorded acceptance", async ({
  page,
}) => {
  await page.goto(`/#/projects/${projectId}/agreements/${project.agreementId}`);
  await expect(page.getByRole("heading", { name: "Review agreement" })).toBeVisible();
  await expect(page.getByText("Dynamic Project Agreement")).toBeVisible();
  await expect(page.getByText("Milestone schedule and acceptance criteria")).toBeVisible();
  await expect(page.getByRole("button", { name: "Print agreement" })).toBeVisible();
  await page.getByRole("button", { name: "Accept agreement" }).click();
  await expect(page.getByRole("heading", { name: "Confirm recorded acceptance" })).toBeVisible();
  await expect(page.getByText("Signed-in account")).toBeVisible();
  await expect(page.locator("#main-content").getByText("Omar Hassan")).toBeVisible();
  await expect(page.getByText("Customer organization")).toBeVisible();
  await expect(
    page.locator("#main-content").getByText("Customer Org", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "The server assigns the authoritative UTC timestamp when this acceptance is recorded.",
    ),
  ).toBeVisible();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Record acceptance" }).click();
  await expect(page.getByRole("heading", { name: "Acceptance recorded" })).toBeVisible();
  await expect(page.getByText("TP-AGR-TEST-0001")).toBeVisible();
});

test("fails closed for an inaccessible project", async ({ page }) => {
  await page.goto(
    "/#/projects/private-project/milestones/30000000-0000-4000-8000-000000000002/review",
  );
  await expect(page.getByRole("heading", { name: "Project not found" })).toBeVisible();
  await expect(page.getByText("Dynamic Project")).toHaveCount(0);
});

for (const [name, width, height] of [
  ["phone", 375, 812],
  ["tablet", 768, 1024],
  ["laptop", 1366, 768],
  ["wide", 1920, 1080],
] as const) {
  test(`${name} route has no page overflow and supports keyboard navigation`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto(`/#/projects/${projectId}`);
    await expect(page.getByRole("heading", { name: "Dynamic Project" })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toBeVisible();
    if (width < 1024) {
      await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
    }
  });
}

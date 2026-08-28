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
  agreementStatus: "active",
  agreementAcceptedAt: "2026-08-01T12:00:00+04:00",
  authorizedApprover: "Omar Hassan",
  milestones,
};

async function mockApi(page: Page) {
  await page.route("http://localhost:3001/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/v1/me") {
      return route.fulfill({
        json: {
          data: {
            id: "user-1",
            email: "omar@example.test",
            displayName: "Omar Hassan",
            organizations: [
              { id: "org-1", name: "Customer Org", type: "CUSTOMER", role: "APPROVER" },
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
    await expect(page.getByRole("heading", { name: "Review Milestone" })).toBeVisible();
    await expect(page.getByText(`Milestone ${milestone.sequenceNumber} of 3`)).toBeVisible();
  }
  await page.reload();
  await expect(page.getByText("Milestone 3 of 3")).toBeVisible();
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

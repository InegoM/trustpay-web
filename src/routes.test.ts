import { describe, expect, it } from "vitest";
import { hashForView, routeFromHash } from "@/routes";

const projectId = "one-milestone-project";
const milestoneIds = [
  "30000000-0000-4000-8000-000000000001",
  "30000000-0000-4000-8000-000000000002",
  "30000000-0000-4000-8000-000000000003",
];

describe("dynamic project and milestone routes", () => {
  it("round-trips a nested route for a one-milestone project", () => {
    const hash = hashForView("milestone-review", { projectId, milestoneId: milestoneIds[0] });
    expect(routeFromHash(hash)).toEqual({
      view: "milestone-review",
      projectId,
      milestoneId: milestoneIds[0],
    });
  });

  it("addresses every milestone in a three-milestone project by stable ID", () => {
    for (const milestoneId of milestoneIds) {
      const route = routeFromHash(hashForView("confirm-approval", { projectId, milestoneId }));
      expect(route.milestoneId).toBe(milestoneId);
      expect(route.view).toBe("confirm-approval");
    }
  });

  it("does not manufacture a default project or milestone", () => {
    expect(hashForView("milestone-review")).toBe("#/not-found");
    expect(routeFromHash("#/projects/example/milestones/2/review").view).toBe("not-found");
  });

  it("fails closed for malformed and unknown addresses", () => {
    expect(routeFromHash("#/projects/%E0%A4%A").view).toBe("not-found");
    expect(routeFromHash("#/projects/example/milestones/id/unknown").view).toBe("not-found");
  });
});

it("round-trips stable agreement version routes without using project defaults", () => {
  const projectId = "agreement-review";
  const agreementId = "50000000-0000-4000-8000-000000000002";
  expect(hashForView("agreement-review", { projectId, agreementId })).toBe(
    `#/projects/${projectId}/agreements/${agreementId}`,
  );
  expect(routeFromHash(`#/projects/${projectId}/agreements/${agreementId}/confirm`)).toEqual({
    view: "agreement-confirm",
    projectId,
    agreementId,
  });
  expect(routeFromHash(`#/projects/${projectId}/agreements/not-a-uuid`)).toEqual({
    view: "not-found",
  });
});

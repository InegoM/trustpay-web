# M00 UI baseline

**Recorded:** 2026-08-26
**Scope:** inventory and verification plan only. M00 does not redesign the shell, add M01 routing, or add later workflow features.

## Screen inventory

| Screen                              | Existing role                                       | Baseline state                                                       |
| ----------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------- |
| Login / invitation acceptance       | Authenticate existing users or accept an invitation | API-connected; prototype account shortcuts are development-only.     |
| Overview                            | High-level project summary                          | API-connected project state.                                         |
| Projects                            | Project list                                        | API-connected project state.                                         |
| New project                         | SME project-creation wizard                         | Existing Step 1 capability.                                          |
| Project details                     | Agreement/milestone summary                         | API-connected project state; routes are not dynamic yet.             |
| Invite customer                     | Create/manual-share customer invitation             | API-connected; email delivery truthfully states it is not connected. |
| Milestone review                    | Prototype evidence/criteria review                  | Evidence display is mock data; M03 owns real uploads.                |
| Confirm approval / approved receipt | Existing decision flow                              | Existing behavior; stable milestone ID routing is M01.               |
| Request changes / result            | Existing decision flow                              | Formal resubmission is M04.                                          |
| Raise dispute / result              | Existing decision flow                              | No adjudication is implemented.                                      |
| Activity                            | Project activity timeline                           | API-connected activity listing.                                      |

## Existing component inventory

The current reusable shell is `components/Layout.tsx`. Page-level features currently include project cards, milestone presentation, activity items, invitation presentation, and decision forms. Required primitives still to be extracted incrementally are `AppShell`, `PageHeader`, `Breadcrumbs`, `RoleNavigation`, `MobileNavigation`, `StatusBadge`, `Field`, `Select`, `Textarea`, `EmptyState`, `ErrorState`, `Skeleton`, and a non-blocking feedback region. Their extraction is not M00 work because it would be a broad refactor.

## Token baseline

`src/index.css` now exposes semantic aliases for surfaces, text, borders, actions, statuses, and focus rings alongside existing visual tokens. New component APIs must use semantic names rather than business-significant color names. Existing pages retain visual tokens until the relevant feature milestone safely migrates them.

## Responsive test plan

Verify each launch-critical existing baseline path at:

| Viewport         | Representative size | Expected baseline observation                                           |
| ---------------- | ------------------: | ----------------------------------------------------------------------- |
| Small phone      |               320px | Login fields/actions fit one column; no horizontal page scroll.         |
| Large phone      |               390px | Login/action controls remain reachable and text wraps.                  |
| Tablet portrait  |               768px | Existing shell limitation is recorded; content must remain inspectable. |
| Tablet landscape |              1024px | Sidebar/content collision and clipping must be checked.                 |
| Laptop           |              1366px | Main project flows and fixed sidebar fit without hidden final actions.  |
| Wide desktop     |   1440px and 1920px | Content line lengths and unused card width remain readable.             |

The fixed desktop sidebar does not meet the intended mobile/tablet shell requirement. It is a known M01 limitation, not claimed as resolved by M00.

## Accessibility verification baseline

- The app now includes a visible-on-focus skip link to `#main-content`.
- Existing form controls have visible labels and use native inputs/buttons.
- Existing loading status uses `role="status"`; API errors use `role="alert"` with a retry control.
- Verify login, invitation, retry, navigation, and logout with keyboard-only input; focus must stay visible.
- Verify browser zoom at 200%, semantic headings, meaningful button labels, and that error/status meaning is not color-only.
- The M00 code inspection found no production demo-password prefill. Development-only prototype controls are compiled behind `import.meta.env.DEV` and must be absent from the production bundle.

Known accessibility work deferred to the responsible feature milestone: responsive/mobile navigation and full shell behavior (M01), evidence alternative text/upload progress (M03), dialog focus management where dialogs are introduced, and full WCAG 2.2 AA verification before launch (M10).

## Error, empty, forbidden, and retry baseline

The current app displays API load failures with a retry button and avoids replacing that failure with demo data. Individual page empty, forbidden, and not-found states are incomplete and must be added with dynamic resource routing in M01. M00 records this limitation rather than hiding it with a generic success state.

## Formatting baseline

The formatter is pinned to `oxfmt 0.65.0`. The repository has been formatted with that version; `pnpm run format:check`, type-checking, and the production build all pass. Formatting is now a blocking CI gate.

## Dependency scan result

The M00 review updated Vite from 8.0.3 to 8.0.16, within the existing Vite 8 major version, to address the reported high development-server findings. `pnpm audit --prod --audit-level high` and `pnpm audit --audit-level high` both reported no known vulnerabilities after that update. CI keeps both scans enabled.

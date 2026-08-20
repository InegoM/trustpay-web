import { useState } from "react"

import type { ActivityEvent } from "@/data/mock"
import { useTrustPay } from "@/state/TrustPayContext"
import type { PageProps } from "@/types"

const CARD =
  "bg-card rounded-2xl border border-edge shadow-[0_2px_12px_rgba(13,31,64,0.06),0_1px_3px_rgba(13,31,64,0.04)]"

const EVENT_META: Record<string, { label: string; color: string; bg: string }> = {
  "project-created": {
    label: "Project created",
    color: "text-brand",
    bg: "bg-brand-light",
  },
  "customer-invited": {
    label: "Customer invited",
    color: "text-brand",
    bg: "bg-brand-light",
  },
  "customer-approver-joined": {
    label: "Customer approver joined",
    color: "text-brand",
    bg: "bg-brand-light",
  },
  "milestone-approved": {
    label: "Milestone approved",
    color: "text-brand",
    bg: "bg-brand-light",
  },

  "decision-recorded": {
    label: "Decision recorded",
    color: "text-brand",
    bg: "bg-brand-light",
  },

  "evidence-submitted": {
    label: "Evidence submitted",
    color: "text-ink",
    bg: "bg-edge",
  },

  "variation-approved": {
    label: "Variation approved",
    color: "text-ink",
    bg: "bg-edge",
  },

  "agreement-accepted": {
    label: "Agreement accepted",
    color: "text-brand",
    bg: "bg-brand-light",
  },

  "agreement-sent": {
    label: "Agreement sent",
    color: "text-ink-dim",
    bg: "bg-edge",
  },

  "changes-requested": {
    label: "Changes requested",
    color: "text-warn",
    bg: "bg-warn-light",
  },

  "dispute-recorded": {
    label: "Dispute recorded",
    color: "text-danger",
    bg: "bg-danger-light",
  },
}

const ACTOR_LABEL: Record<string, string> = {
  sme: "SME",

  customer: "Customer",

  system: "System",
}

const FILTERS = [
  "All events",
  "Approvals",
  "Evidence",
  "Variations",
  "Agreements",
]

function filterEvents(
  events: ActivityEvent[],
  filter: string,
): ActivityEvent[] {
  if (filter === "All events") return events

  if (filter === "Approvals")
    return events.filter(
      (e) =>
        e.event === "milestone-approved" || e.event === "decision-recorded",
    )

  if (filter === "Evidence")
    return events.filter((e) => e.event === "evidence-submitted")

  if (filter === "Variations")
    return events.filter((e) => e.event === "variation-approved")

  if (filter === "Agreements")
    return events.filter(
      (e) => e.event === "agreement-accepted" || e.event === "agreement-sent",
    )

  return events
}

function EventDot({ event }: { event: string }) {
  const meta = EVENT_META[event]

  return (
    <div
      className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${meta?.bg ?? "bg-edge"}`}
      aria-hidden="true"
    >
      {event === "milestone-approved" || event === "decision-recorded" ? (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M2.5 7L5.5 10L11.5 4"
            stroke="#2B9B8E"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : event === "evidence-submitted" ? (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect
            x="2"
            y="1.5"
            width="10"
            height="11"
            rx="1.5"
            stroke="#435170"
            strokeWidth="1.3"
          />
          <path
            d="M4.5 5.5h5M4.5 8h3"
            stroke="#435170"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
      ) : event === "variation-approved" ? (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M2 10L5 4L8 8L11 5L12 7"
            stroke="#435170"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : event === "agreement-accepted" || event === "agreement-sent" ? (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M2 3.5C2 2.95 2.45 2.5 3 2.5H11C11.55 2.5 12 2.95 12 3.5V10.5C12 11.05 11.55 11.5 11 11.5H3C2.45 11.5 2 11.05 2 10.5V3.5Z"
            stroke="#2B9B8E"
            strokeWidth="1.3"
          />
          <path
            d="M4.5 6.5l1.5 1.5L9.5 5"
            stroke="#2B9B8E"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <div className="w-2 h-2 rounded-full bg-muted" />
      )}
    </div>
  )
}

export default function Activity({ navigate: _navigate }: PageProps) {
  const { activity: ACTIVITY_LOG } = useTrustPay()
  const [activeFilter, setActiveFilter] = useState("All events")

  const filtered = filterEvents(ACTIVITY_LOG, activeFilter)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1
          style={{ fontFamily: "var(--font-display)" }}
          className="text-2xl font-bold text-ink"
        >
          Activity
        </h1>
        <p className="text-muted text-sm mt-1">
          A complete, chronological record of all events across your projects.
        </p>
      </div>

      {/* Filter bar */}
      <div
        className="flex items-center gap-2"
        role="group"
        aria-label="Filter activity by event type"
      >
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
              activeFilter === f
                ? "bg-ink text-white"
                : "bg-card border border-edge text-muted hover:text-ink hover:border-ink/30"
            }`}
            aria-pressed={activeFilter === f}
          >
            {f}
          </button>
        ))}
        <div className="ml-auto text-xs text-muted">
          {filtered.length} event{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Timeline */}
      <div className={`${CARD} p-6`}>
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted text-sm">
            No events match this filter.
          </div>
        ) : (
          <div className="relative">
            {/* Vertical timeline line */}
            <div
              className="absolute left-4 top-4 bottom-4 w-0.5 bg-edge"
              aria-hidden="true"
            />

            <ol className="space-y-0">
              {filtered.map((event, i) => {
                const meta = EVENT_META[event.event]

                return (
                  <li key={event.id} className="relative flex gap-5">
                    {/* Icon */}
                    <EventDot event={event.event} />

                    {/* Content */}
                    <div
                      className={`flex-1 min-w-0 ${
                        i < filtered.length - 1
                          ? "pb-6 border-b border-edge mb-0"
                          : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          {/* Event label */}
                          <span
                            className={`inline-block text-xs font-semibold uppercase tracking-wider mb-1 ${meta?.color ?? "text-muted"}`}
                          >
                            {meta?.label ?? event.event}
                          </span>
                          {/* Description */}
                          <p className="text-sm text-ink leading-snug">
                            {event.description}
                          </p>
                          {/* Meta */}
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <span className="text-xs text-muted">
                              {event.timestamp}
                            </span>
                            {event.milestone && (
                              <>
                                <span
                                  className="text-xs text-edge"
                                  aria-hidden="true"
                                >
                                  ·
                                </span>
                                <span className="text-xs text-muted">
                                  {event.milestone}
                                </span>
                              </>
                            )}
                            <span
                              className="text-xs text-edge"
                              aria-hidden="true"
                            >
                              ·
                            </span>
                            <span className="text-xs text-muted">
                              {event.project}
                            </span>
                          </div>
                        </div>

                        {/* Actor badge */}
                        <div className="flex-shrink-0 flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                              event.actorType === "customer"
                                ? "bg-brand-light text-brand"
                                : event.actorType === "system"
                                  ? "bg-edge text-muted"
                                  : "bg-ink text-white"
                            }`}
                            style={{ fontFamily: "var(--font-display)" }}
                            aria-hidden="true"
                          >
                            {event.actor === "System"
                              ? "S"
                              : event.actor

                                  .split(" ")

                                  .map((n) => n[0])

                                  .slice(0, 2)

                                  .join("")}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-ink leading-tight">
                              {event.actor}
                            </p>
                            <p className="text-xs text-muted leading-tight">
                              {ACTOR_LABEL[event.actorType]}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-muted text-center pb-2">
        TrustPay records agreements, evidence, and decisions. It does not hold
        or transfer money.
      </p>
    </div>
  )
}

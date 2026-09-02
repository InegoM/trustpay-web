import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  activityFromApi,
  createProject as createProjectRequest,
  getProject,
  getProjectActivity,
  listProjects,
  projectFromApi,
  recordDecision,
  type CreateProjectInput,
} from "@/api/trustpay";
import type { ActivityEvent, ProjectRecord } from "@/data/mock";

const EMPTY_PROJECT: ProjectRecord = {
  id: "",
  name: "",
  customer: "",
  sme: "",
  agreedValue: 0,
  approvedValue: 0,
  outstandingValue: 0,
  status: "",
  agreementVersion: "",
  agreementStatus: "draft",
  agreementAccepted: "Not accepted",
  authorizedApprover: "Not assigned",
  milestones: [],
  variations: [],
};

type SyncStatus = "loading" | "connected" | "error";
export interface LastDecision {
  action: "approve" | "request-changes" | "raise-dispute";
  reference: string;
  recordedAt: string;
  responseDate?: string;
}

interface TrustPayState {
  project: ProjectRecord;
  projects: ProjectRecord[];
  activity: ActivityEvent[];
  syncStatus: SyncStatus;
  syncError: string | null;
  lastDecision: LastDecision | null;
  refresh: () => Promise<void>;
  selectProject: (projectId: string) => Promise<boolean>;
  createProject: (input: CreateProjectInput) => Promise<string | null>;
  approveMilestone: (milestoneId: string) => Promise<boolean>;
  requestChanges: (
    milestoneId: string,
    details: {
      reason: string;
      comment: string;
      responseDate: string;
      acceptanceCriterionIds?: string[];
      evidenceItemIds?: string[];
    },
  ) => Promise<boolean>;
  raiseDispute: (
    milestoneId: string,
    details: { reason: string; explanation: string },
  ) => Promise<boolean>;
}

const TrustPayContext = createContext<TrustPayState | null>(null);

export default function TrustPayProvider({ children }: { children: ReactNode }) {
  const [project, setProject] = useState<ProjectRecord>(EMPTY_PROJECT);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("loading");
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastDecision, setLastDecision] = useState<LastDecision | null>(null);

  const loadActivity = useCallback(async (projectId: string, projectName: string) => {
    const events = await getProjectActivity(projectId);
    setActivity(events.map((event) => activityFromApi(event, projectName)));
  }, []);

  const refresh = useCallback(async () => {
    setSyncStatus("loading");
    setSyncError(null);
    try {
      const availableProjects = await listProjects();
      const selected = availableProjects[0];
      if (!selected) {
        setProjects([]);
        setProject(EMPTY_PROJECT);
        setActivity([]);
        setSyncStatus("connected");
        return;
      }
      const selectedId = availableProjects.some((item) => item.id === project.id)
        ? project.id
        : selected.id;
      const apiProject = await getProject(selectedId);
      const mapped = projectFromApi(apiProject, project);
      setProjects(
        availableProjects.map((item) =>
          projectFromApi(item, item.id === project.id ? project : undefined),
        ),
      );
      setProject(mapped);
      await loadActivity(mapped.id, mapped.name);
      setSyncStatus("connected");
    } catch (error) {
      setSyncStatus("error");
      setSyncError(error instanceof Error ? error.message : "Unable to load TrustPay data.");
    }
  }, [loadActivity, project]);

  const selectProject = useCallback(
    async (projectId: string): Promise<boolean> => {
      setSyncStatus("loading");
      setSyncError(null);
      try {
        const apiProject = await getProject(projectId);
        const current = projects.find((item) => item.id === projectId);
        const mapped = projectFromApi(apiProject, current);
        setProject(mapped);
        setProjects((items) => items.map((item) => (item.id === mapped.id ? mapped : item)));
        await loadActivity(mapped.id, mapped.name);
        setSyncStatus("connected");
        return true;
      } catch (error) {
        setSyncStatus("error");
        setSyncError(error instanceof Error ? error.message : "Unable to open this project.");
        return false;
      }
    },
    [loadActivity, projects],
  );

  const createProject = useCallback(
    async (input: CreateProjectInput): Promise<string | null> => {
      setSyncStatus("loading");
      setSyncError(null);
      try {
        const created = await createProjectRequest(input);
        const mapped = projectFromApi(created);
        setProject(mapped);
        setProjects((items) => [mapped, ...items.filter((item) => item.id !== mapped.id)]);
        await loadActivity(mapped.id, mapped.name);
        setSyncStatus("connected");
        return mapped.id;
      } catch (error) {
        setSyncStatus("error");
        setSyncError(error instanceof Error ? error.message : "The project could not be created.");
        return null;
      }
    },
    [loadActivity],
  );

  useEffect(() => {
    void refresh();
    // Initial synchronization should run once; subsequent retries use refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitDecision = useCallback(
    async (
      milestoneId: string,
      decision:
        | { action: "approve" }
        | {
            action: "request-changes";
            reason: string;
            comment: string;
            responseDate: string;
          }
        | { action: "raise-dispute"; reason: string; explanation: string },
    ): Promise<boolean> => {
      setSyncError(null);
      try {
        const result = await recordDecision(project.id, milestoneId, decision);
        const mapped = projectFromApi(result.project, project);
        const recordedEvent = result.events[0];
        const mappedEvent = recordedEvent ? activityFromApi(recordedEvent, mapped.name) : null;
        setProject(mapped);
        setLastDecision({
          action: decision.action,
          reference: recordedEvent?.reference ?? "Reference pending",
          recordedAt: mappedEvent?.timestamp ?? "Recorded just now",
          ...(decision.action === "request-changes" ? { responseDate: decision.responseDate } : {}),
        });
        await loadActivity(mapped.id, mapped.name);
        setSyncStatus("connected");
        return true;
      } catch (error) {
        setSyncStatus("error");
        setSyncError(
          error instanceof Error ? error.message : "The decision could not be recorded.",
        );
        return false;
      }
    },
    [loadActivity, project],
  );

  const approveMilestone = useCallback(
    (milestoneId: string) => submitDecision(milestoneId, { action: "approve" }),
    [submitDecision],
  );

  const requestChanges = useCallback(
    (
      milestoneId: string,
      details: {
        reason: string;
        comment: string;
        responseDate: string;
        acceptanceCriterionIds?: string[];
        evidenceItemIds?: string[];
      },
    ) =>
      submitDecision(milestoneId, {
        action: "request-changes",
        ...details,
      }),
    [submitDecision],
  );

  const raiseDispute = useCallback(
    (milestoneId: string, details: { reason: string; explanation: string }) =>
      submitDecision(milestoneId, { action: "raise-dispute", ...details }),
    [submitDecision],
  );

  const value = useMemo(
    () => ({
      project,
      projects,
      activity,
      syncStatus,
      syncError,
      lastDecision,
      refresh,
      selectProject,
      createProject,
      approveMilestone,
      requestChanges,
      raiseDispute,
    }),
    [
      activity,
      approveMilestone,
      project,
      projects,
      raiseDispute,
      refresh,
      selectProject,
      createProject,
      requestChanges,
      syncError,
      syncStatus,
      lastDecision,
    ],
  );

  return <TrustPayContext.Provider value={value}>{children}</TrustPayContext.Provider>;
}

export function useTrustPay(): TrustPayState {
  const context = useContext(TrustPayContext);
  if (!context) {
    throw new Error("useTrustPay must be used inside TrustPayProvider");
  }
  return context;
}

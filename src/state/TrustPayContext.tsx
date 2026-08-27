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
import { ACTIVITY_LOG, PROJECT, type ActivityEvent, type ProjectRecord } from "@/data/mock";

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
  approveMilestone: (milestoneId: number) => Promise<boolean>;
  requestChanges: (
    milestoneId: number,
    details: { reason: string; comment: string; responseDate: string },
  ) => Promise<boolean>;
  raiseDispute: (
    milestoneId: number,
    details: { reason: string; explanation: string },
  ) => Promise<boolean>;
}

const TrustPayContext = createContext<TrustPayState | null>(null);

export default function TrustPayProvider({ children }: { children: ReactNode }) {
  const [project, setProject] = useState<ProjectRecord>(() => structuredClone(PROJECT));
  const [projects, setProjects] = useState<ProjectRecord[]>(() => [structuredClone(PROJECT)]);
  const [activity, setActivity] = useState<ActivityEvent[]>(() => structuredClone(ACTIVITY_LOG));
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
      if (!selected) throw new Error("No projects are available for this account.");
      const selectedId = availableProjects.some((item) => item.id === project.id)
        ? project.id
        : selected.id;
      const apiProject = await getProject(selectedId);
      const mapped = projectFromApi(apiProject, project);
      setProjects(
        availableProjects.map((item) =>
          projectFromApi(item, item.id === project.id ? project : PROJECT),
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
        const current = projects.find((item) => item.id === projectId) ?? PROJECT;
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
        const mapped = projectFromApi(created, PROJECT);
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
      milestoneId: number,
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
    (milestoneId: number) => submitDecision(milestoneId, { action: "approve" }),
    [submitDecision],
  );

  const requestChanges = useCallback(
    (milestoneId: number, details: { reason: string; comment: string; responseDate: string }) =>
      submitDecision(milestoneId, {
        action: "request-changes",
        ...details,
      }),
    [submitDecision],
  );

  const raiseDispute = useCallback(
    (milestoneId: number, details: { reason: string; explanation: string }) =>
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

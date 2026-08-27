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
  acceptInvitation as acceptInvitationRequest,
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  TrustPayApiError,
  type AuthUser,
} from "@/api/trustpay";

type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;
  canDecide: boolean;
  canCreateProject: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  acceptInvitation: (input: {
    token: string;
    displayName: string;
    password: string;
  }) => Promise<boolean>;
  clearError: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getCurrentUser()
      .then((currentUser) => {
        setUser(currentUser);
        setStatus("authenticated");
      })
      .catch((requestError) => {
        setUser(null);
        setStatus("anonymous");
        if (!(requestError instanceof TrustPayApiError && requestError.status === 401)) {
          setError(
            requestError instanceof Error ? requestError.message : "Unable to check your session.",
          );
        }
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const currentUser = await loginRequest(email, password);
      setUser(currentUser);
      setStatus("authenticated");
      window.location.hash = "/overview";
      return true;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Login failed.");
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setUser(null);
      setStatus("anonymous");
      window.location.hash = "";
    }
  }, []);

  const acceptInvitation = useCallback(
    async (input: { token: string; displayName: string; password: string }) => {
      setError(null);
      try {
        const currentUser = await acceptInvitationRequest(input);
        setUser(currentUser);
        setStatus("authenticated");
        window.location.hash = "/overview";
        return true;
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Invitation could not be accepted.",
        );
        return false;
      }
    },
    [],
  );

  const canDecide =
    user?.organizations.some(
      (organization) =>
        organization.type === "CUSTOMER" &&
        (organization.role === "APPROVER" || organization.role === "OWNER"),
    ) ?? false;
  const canCreateProject =
    user?.organizations.some(
      (organization) =>
        organization.type === "SME" &&
        (organization.role === "OWNER" || organization.role === "ADMIN"),
    ) ?? false;

  const value = useMemo(
    () => ({
      user,
      status,
      error,
      canDecide,
      canCreateProject,
      login,
      logout,
      acceptInvitation,
      clearError: () => setError(null),
    }),
    [acceptInvitation, canCreateProject, canDecide, error, login, logout, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

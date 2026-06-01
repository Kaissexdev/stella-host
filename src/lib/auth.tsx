// Client-side authentication context backed by the self-hosted backend's
// cookie session (`GET /api/auth/me`). GitHub OAuth is performed by the
// backend; the frontend only redirects to it and reads the resulting session.

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, api, apiUrl } from "./api/client";
import { disconnectRealtime } from "./api/realtime";
import type { CurrentUser } from "./api/types";

interface AuthContextValue {
  user: CurrentUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  error: Error | null;
  loginWithGitHub: () => void;
  logout: () => Promise<void>;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      try {
        return await api.get<CurrentUser>("/api/auth/me");
      } catch (err) {
        // 401 simply means "not signed in" — treat as null, not an error.
        if (err instanceof ApiError && err.status === 401) return null;
        throw err;
      }
    },
    retry: false,
    staleTime: 60_000,
  });

  const loginWithGitHub = useCallback(() => {
    window.location.href = apiUrl("/api/auth/github");
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // ignore — clear local state regardless
    }
    disconnectRealtime();
    qc.clear();
    await refetch();
  }, [qc, refetch]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: data ?? null,
      isLoading,
      isAuthenticated: !!data,
      isAdmin: data?.role === "ADMIN",
      error: (error as Error) ?? null,
      loginWithGitHub,
      logout,
      refetch,
    }),
    [data, isLoading, error, loginWithGitHub, logout, refetch],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

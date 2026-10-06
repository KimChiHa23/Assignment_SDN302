"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AuthUser, LoginPayload, RegisterPayload } from "@/types/auth";
import { TeamItem } from "@/types/team";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  teams: TeamItem[];
  currentTeamId: string | null;
  setCurrentTeamId: (id: string | null) => void;
  login: (payload: LoginPayload) => Promise<{ success: boolean; error?: string }>;
  register: (payload: RegisterPayload) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshTeams: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null);
  const router = useRouter();

  // 1. Tải danh sách Teams của user
  const refreshTeams = useCallback(async () => {
    try {
      const res = await fetch("/api/teams");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setTeams(data.data);
        if (data.data.length > 0 && !currentTeamId) {
          setCurrentTeamId(data.data[0].id);
        }
      } else {
        setTeams([]);
      }
    } catch (err) {
      console.error("Failed to fetch teams:", err);
    }
  }, [currentTeamId]);

  // 2. Tải thông tin User hiện tại
  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        await refreshTeams();
      } else {
        setUser(null);
        setTeams([]);
      }
    } catch {
      setUser(null);
      setTeams([]);
    } finally {
      setIsLoading(false);
    }
  }, [refreshTeams]);

  useEffect(() => {
    let ignore = false;

    async function initAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!ignore) {
          if (data.success && data.user) {
            setUser(data.user);
            const teamsRes = await fetch("/api/teams");
            const teamsData = await teamsRes.json();
            if (!ignore && teamsData.success && Array.isArray(teamsData.data)) {
              setTeams(teamsData.data);
              if (teamsData.data.length > 0) {
                setCurrentTeamId(teamsData.data[0].id);
              }
            }
          } else {
            setUser(null);
            setTeams([]);
          }
        }
      } catch {
        if (!ignore) {
          setUser(null);
          setTeams([]);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      ignore = true;
    };
  }, []);

  // 3. Đăng nhập
  const login = async (payload: LoginPayload) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) {
        return { success: false, error: data.error || "Login failed" };
      }

      setUser(data.user);
      await refreshTeams();
      return { success: true };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Login failed";
      return { success: false, error: errorMsg };
    }
  };

  // 4. Register
  const register = async (payload: RegisterPayload) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) {
        return { success: false, error: data.error || "Registration failed" };
      }

      setUser(data.user);
      await refreshTeams();
      return { success: true };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Registration failed";
      return { success: false, error: errorMsg };
    }
  };

  // 5. Đăng xuất
  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      setTeams([]);
      setCurrentTeamId(null);
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        teams,
        currentTeamId,
        setCurrentTeamId,
        login,
        register,
        logout,
        refreshUser,
        refreshTeams,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

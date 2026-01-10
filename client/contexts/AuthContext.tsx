import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { UserRole } from "@/types";
import { apiLogin, apiRegister, apiLogout, apiGetMe, apiUpdateUser, getStoredUser, AuthUser } from "@/lib/api";

export type { UserRole };

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  onboardingCompleted: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (loginOrEmail: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  isAuthenticated: boolean;
  needsOnboarding: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function authUserToUser(authUser: AuthUser): User {
  return {
    id: authUser.id,
    email: authUser.email,
    name: authUser.name,
    role: authUser.role,
    onboardingCompleted: authUser.onboardingCompleted,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    console.log("[Auth] Starting loadStoredAuth...");
    try {
      const storedUser = await getStoredUser();
      console.log("[Auth] Stored user:", storedUser ? "found" : "none");
      if (storedUser) {
        console.log("[Auth] Fetching fresh user from API...");
        const freshUser = await apiGetMe();
        console.log("[Auth] Fresh user:", freshUser ? "received" : "null");
        if (freshUser) {
          setUser(authUserToUser(freshUser));
        } else {
          console.log("[Auth] No fresh user, logging out");
          await apiLogout();
        }
      }
    } catch (error) {
      console.error("[Auth] Failed to load auth:", error);
      await apiLogout();
    } finally {
      console.log("[Auth] Setting isLoading to false");
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const result = await apiLogin(email, password);
    setUser(authUserToUser(result.user));
  };

  const register = async (email: string, password: string, name: string) => {
    const result = await apiRegister(email, password, name);
    setUser(authUserToUser(result.user));
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  const completeOnboarding = async () => {
    if (!user) return;
    await apiUpdateUser(user.id, { onboardingCompleted: true });
    setUser({ ...user, onboardingCompleted: true });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        completeOnboarding,
        isAuthenticated: !!user,
        needsOnboarding: !!user && !user.onboardingCompleted,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

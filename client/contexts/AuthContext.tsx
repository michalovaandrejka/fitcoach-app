import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StoredUser, UserRole } from "@/types";
import { authenticateUser, createUser, updateUser, getUserById } from "@/lib/storage";

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

const AUTH_STORAGE_KEY = "@fitcoach_auth_v2";

function storedUserToUser(stored: StoredUser): User {
  return {
    id: stored.id,
    email: stored.email,
    name: stored.name,
    role: stored.role,
    onboardingCompleted: stored.onboardingCompleted,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsedUser = JSON.parse(stored) as User;
        const freshUser = await getUserById(parsedUser.id);
        if (freshUser) {
          setUser(storedUserToUser(freshUser));
        } else {
          await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error("Failed to load auth:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (loginOrEmail: string, password: string) => {
    const storedUser = await authenticateUser(loginOrEmail, password);
    const userData = storedUserToUser(storedUser);
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
    setUser(userData);
  };

  const register = async (email: string, password: string, name: string) => {
    const storedUser = await createUser(email, password, name);
    const userData = storedUserToUser(storedUser);
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  };

  const completeOnboarding = async () => {
    if (!user) return;
    await updateUser(user.id, { onboardingCompleted: true });
    const updatedUser = { ...user, onboardingCompleted: true };
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);
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

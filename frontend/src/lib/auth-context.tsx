"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { safeStorage } from "@/lib/utils";
import type { LoginResponse, SubscriptionPlan, User } from "@/lib/types";

export interface CustomerSignupInput {
  name: string;
  email: string;
  password: string;
  phone: string;
}

export interface BusinessSignupInput {
  name: string;
  email: string;
  password: string;
  phone: string;
  businessName: string;
  category: string;
  description?: string;
  plan: Exclude<SubscriptionPlan, "full_service">;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  registerCustomer: (input: CustomerSignupInput) => Promise<User>;
  registerBusiness: (input: BusinessSignupInput) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  /** Where should this user land after login/register based on their state? */
  getPostAuthRoute: () => string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = safeStorage.getItem("accessToken");
    if (!token) {
      setIsLoading(false);
      return;
    }
    api.setToken(token);

    // Use cached user data for instant load, then revalidate in background
    const cached = safeStorage.getItem("cachedUser");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setUser(parsed);
        setIsLoading(false);
      } catch { /* ignore bad cache */ }
    }

    api
      .get<User>("/auth/me")
      .then((u) => {
        if (u) {
          setUser(u);
          safeStorage.setItem("cachedUser", JSON.stringify(u));
        }
      })
      .catch(() => {
        safeStorage.removeItem("accessToken");
        safeStorage.removeItem("refreshToken");
        safeStorage.removeItem("cachedUser");
        api.setToken(null);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const storeSession = (data: LoginResponse) => {
    safeStorage.setItem("accessToken", data.accessToken);
    safeStorage.setItem("refreshToken", data.refreshToken);
    api.setToken(data.accessToken);
    setUser(data.user);
  };

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const data = await api.post<LoginResponse>("/auth/login", { email, password });
    if (!data) throw new Error("Login failed");
    storeSession(data);
    return data.user;
  }, []);

  const registerCustomer = useCallback(async (input: CustomerSignupInput): Promise<User> => {
    const data = await api.post<LoginResponse>("/auth/register", input);
    if (!data) throw new Error("Registration failed");
    storeSession(data);
    return data.user;
  }, []);

  const registerBusiness = useCallback(async (input: BusinessSignupInput): Promise<User> => {
    const data = await api.post<LoginResponse>("/auth/business/register", input);
    if (!data) throw new Error("Business registration failed");
    storeSession(data);
    return data.user;
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const u = await api.get<User>("/auth/me");
      if (u) setUser(u);
    } catch {
      // ignore
    }
  }, []);

  const logout = useCallback(() => {
    api.post("/auth/logout").catch(() => {});
    safeStorage.removeItem("accessToken");
    safeStorage.removeItem("refreshToken");
    safeStorage.removeItem("cachedUser");
    api.setToken(null);
    setUser(null);
  }, []);

  const getPostAuthRoute = useCallback((): string => {
    if (!user) return "/login";
    if (user.role === "super_admin") return "/admin";
    if (user.role === "customer") return "/";
    // client_admin
    const ob = user.onboarding;
    if (!ob) return "/dashboard";
    if (ob.subscription?.status === "pending") return "/list-your-business/pending";
    if (ob.subscription?.status === "rejected") return "/list-your-business/plans";
    if (!ob.setupCompleted) return "/setup";
    return "/dashboard";
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        registerCustomer,
        registerBusiness,
        logout,
        refreshUser,
        isAuthenticated: !!user,
        getPostAuthRoute,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

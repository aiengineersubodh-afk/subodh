"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  AdminRoleRecord,
  NotificationItem,
  PhdScholarProfile,
  Profile,
  StudentProfile,
  UserSubscription,
  WebsiteSettings,
} from "@/types/database";

export interface SessionData {
  user: Omit<Profile, "password_hash">;
  studentProfile?: StudentProfile;
  scholarProfile?: PhdScholarProfile;
  adminRole?: AdminRoleRecord;
  subscription?: UserSubscription | null;
  hasPremiumAccess?: boolean;
  unreadNotificationsCount: number;
}

interface AuthContextValue {
  session: SessionData | null;
  notifications: NotificationItem[];
  supabaseConnected: boolean;
  settings: WebsiteSettings | null;
  loading: boolean;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
  markNotificationRead: (id?: string, all?: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  notifications: [],
  supabaseConnected: false,
  settings: null,
  loading: true,
  refreshSession: async () => {},
  logout: async () => {},
  markNotificationRead: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setSession(data.session || null);
        setNotifications(data.notifications || []);
        setSupabaseConnected(Boolean(data.supabaseConnected));
        setSettings(data.settings || null);
      }
    } catch (err) {
      console.error("Failed to fetch session:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession(null);
    setNotifications([]);
    window.location.href = "/login";
  };

  const markNotificationRead = async (id?: string, all?: boolean) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: id, markAllRead: all }),
    });
    await refreshSession();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        notifications,
        supabaseConnected,
        settings,
        loading,
        refreshSession,
        logout,
        markNotificationRead,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

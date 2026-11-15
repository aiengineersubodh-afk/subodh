"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BookOpen,
  CheckCheck,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, notifications, settings, logout, markNotificationRead } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<string>("domains");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const updateFromUrl = () => {
        const params = new URLSearchParams(window.location.search);
        setCurrentTab(params.get("tab") || "domains");
      };
      updateFromUrl();
      const onTabChange = (e: Event) => {
        const ce = e as CustomEvent<string>;
        if (ce.detail) setCurrentTab(ce.detail);
      };
      window.addEventListener("starsky:switch-tab", onTabChange);
      window.addEventListener("popstate", updateFromUrl);
      return () => {
        window.removeEventListener("starsky:switch-tab", onTabChange);
        window.removeEventListener("popstate", updateFromUrl);
      };
    }
  }, [pathname]);

  const handleNavLinkClick = (tab?: string) => {
    setMobileMenuOpen(false);
    if (tab && typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("starsky:switch-tab", { detail: tab })
      );
    }
  };

  const siteName = settings?.site_name || "STARSKY";
  const tagline = settings?.tagline || "Connecting Research Minds. Creating Opportunities.";

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/explore?tab=domains", label: "Open Internships", tab: "domains" },
    { href: "/about", label: "About Us" },
    { href: "/explore?tab=scholars", label: "Researchers", tab: "scholars" },
    { href: "/contact", label: "Contact Us" },
  ];

  const dashboardHref =
    session?.user.role === "admin"
      ? "/admin"
      : session?.user.role === "scholar"
      ? "/dashboard/scholar"
      : "/dashboard/student";

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <header className="sticky top-0 z-50 bg-[#222326] border-b border-[#33353A]">
      {/* Top Institutional Status Bar */}
      <div className="bg-[#F7F8FA] border-b border-[#E5E7EB] px-4 sm:px-6 lg:px-8 py-1.5 text-xs text-[#666666]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#2563EB]" />
            <span className="font-medium text-[#202124]">{siteName}</span>
            <span className="hidden sm:inline text-[#666666]">— {tagline}</span>
          </div>
          <div className="flex items-center gap-4">
            {session ? (
              <>
                <Link
                  href="/explore?tab=internships"
                  className="hover:text-[#2563EB] transition-colors font-medium"
                >
                  Browse Open Internships
                </Link>
                <span className="text-[#E5E7EB]">|</span>
                <Link
                  href="/admin/login"
                  className="hover:text-[#2563EB] transition-colors flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Admin Portal</span>
                </Link>
              </>
            ) : (
              <span className="text-xs text-[#666666] font-medium">
                Academic Authentication Gateway
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Charcoal Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-[#222326]">
        <div className="flex items-center justify-between h-20">
          {/* Brand Identity */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-white font-bold text-lg tracking-tight group-hover:bg-[#2563EB] transition-colors">
              <Sparkles className="w-5 h-5 text-[#2563EB] group-hover:text-white transition-colors" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-white block leading-none">
                {siteName}
              </span>
              <span className="text-[11px] text-gray-400 font-medium tracking-wide block mt-1">
                Connecting Research Minds
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          {session ? (
            <nav className="hidden lg:flex items-center gap-7">
              {navLinks.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : item.tab
                    ? pathname.startsWith("/explore") && currentTab === item.tab
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => handleNavLinkClick(item.tab)}
                    className={`text-sm font-medium transition-colors py-2 border-b-2 cursor-pointer ${
                      isActive
                        ? "border-[#2563EB] text-white font-semibold"
                        : "border-transparent text-gray-300 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          ) : (
            <div className="hidden lg:flex items-center gap-2 text-xs text-gray-400">
              <span className="w-2 h-2 rounded-full bg-[#F97316]" />
              <span>Research Collaboration & Internship Platform</span>
            </div>
          )}

          {/* Right Auth / User Controls */}
          <div className="hidden lg:flex items-center gap-3">
            {session ? (
              <div className="flex items-center gap-3">
                {/* Notification Bell */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setNotifOpen((prev) => !prev)}
                    className="relative p-2.5 rounded-lg border border-white/20 text-white hover:border-[#2563EB] transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#2563EB] text-white text-[10px] font-bold flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-96 bg-white border border-[#E5E7EB] rounded-xl shadow-xl z-50 overflow-hidden">
                      <div className="px-4 py-3 bg-[#F7F8FA] border-b border-[#E5E7EB] flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#202124]">
                          Notifications ({unreadCount} unread)
                        </span>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={() => markNotificationRead(undefined, true)}
                            className="text-xs text-[#2563EB] hover:underline flex items-center gap-1 font-medium"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-[#E5E7EB]">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-sm text-[#666666]">
                            No notifications yet.
                          </div>
                        ) : (
                          notifications.slice(0, 12).map((n) => (
                            <div
                              key={n.id}
                              onClick={() => {
                                if (!n.is_read) markNotificationRead(n.id, false);
                                setNotifOpen(false);
                              }}
                              className={`p-3.5 text-left transition-colors cursor-pointer hover:bg-[#F7F8FA] ${
                                !n.is_read ? "bg-[#EFF6FF]" : "bg-white"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-semibold text-[#202124]">
                                  {n.title}
                                </p>
                                {!n.is_read && (
                                  <span className="w-2 h-2 rounded-full bg-[#2563EB] shrink-0 mt-1" />
                                )}
                              </div>
                              <p className="text-xs text-[#666666] mt-1 leading-relaxed">
                                {n.message}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-[10px] text-[#666666]">
                                  {new Date(n.created_at).toLocaleDateString()}
                                </span>
                                {n.link_url && (
                                  <Link
                                    href={n.link_url}
                                    className="text-[11px] font-medium text-[#2563EB] flex items-center gap-0.5"
                                  >
                                    View <ChevronRight className="w-3 h-3" />
                                  </Link>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Dashboard Button */}
                <Link
                  href={dashboardHref}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-white/10 border border-white/15 text-white hover:bg-white/20 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-[#2563EB]" />
                  <span>
                    {session.user.role === "admin"
                      ? "Admin Panel"
                      : session.user.role === "scholar"
                      ? "Scholar Dashboard"
                      : "Student Dashboard"}
                  </span>
                </Link>

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-medium border border-white/20 text-gray-300 hover:text-white hover:border-white/40 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2.5 rounded-lg text-xs font-bold text-white border border-white/20 hover:border-[#F97316] hover:text-[#F97316] transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2.5 rounded-lg text-xs font-bold bg-[#F97316] text-white hover:bg-[#EA580C] transition-colors shadow-xs"
                >
                  Create Account
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-2.5 rounded-lg border border-white/20 text-white hover:border-[#F97316] transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#222326] border-b border-[#33353A] px-4 pt-3 pb-6 space-y-3">
          {session && (
            <div className="space-y-1">
              {navLinks.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : item.tab
                    ? pathname.startsWith("/explore") && currentTab === item.tab
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => handleNavLinkClick(item.tab)}
                    className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-white/10 text-white font-semibold border-l-2 border-[#2563EB]"
                        : "text-white hover:bg-white/10"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
          <div className="pt-3 border-t border-[#33353A] flex flex-col gap-2">
            {session ? (
              <>
                <Link
                  href={dashboardHref}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 px-4 rounded-lg bg-white/10 border border-white/15 text-white text-sm font-semibold text-center flex items-center justify-center gap-2"
                >
                  <User className="w-4 h-4 text-[#F97316]" />
                  <span>Go to Dashboard ({session.user.full_name})</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full py-2.5 px-4 rounded-lg border border-white/20 text-sm font-medium text-gray-300 hover:text-white"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 px-4 rounded-lg border border-white/20 text-center text-xs font-bold text-white hover:border-[#F97316] hover:text-[#F97316]"
                >
                  Login to Your Account
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#F97316] text-center text-xs font-bold text-white hover:bg-[#EA580C]"
                >
                  Create a New Account
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}


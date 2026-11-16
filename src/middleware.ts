import { NextRequest, NextResponse } from "next/server";
import { verifySignedTokenAsync, SESSION_COOKIE_NAME } from "@/lib/session-token";

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // 1. Always allow public static files & assets
  if (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/videos/") ||
    pathname.startsWith("/animations/") ||
    pathname.startsWith("/uploads/") ||
    pathname.startsWith("/sample-documents/") ||
    pathname.startsWith("/screenshots/")
  ) {
    return NextResponse.next();
  }

  // 2. Public API endpoints (authentication, public assets, health check)
  if (
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/register") ||
    pathname.startsWith("/api/auth/logout") ||
    pathname.startsWith("/api/auth/reset-password") ||
    pathname.startsWith("/api/auth/me") ||
    pathname.startsWith("/api/public") ||
    pathname.startsWith("/api/assets")
  ) {
    return NextResponse.next();
  }

  // Extract session token
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const payload = token ? await verifySignedTokenAsync(token) : null;

  // 3. Protected Backend APIs
  if (pathname.startsWith("/api/")) {
    if (!payload) {
      return NextResponse.json(
        { error: "Unauthorized: Authentication required." },
        { status: 401 }
      );
    }
    if (pathname.startsWith("/api/admin") && payload.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Administrator privileges required." },
        { status: 403 }
      );
    }
    return NextResponse.next();
  }

  // 4. Public Authentication Gateway Pages (/login, /register, /admin/login)
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/admin/login";

  if (isAuthPage) {
    if (payload) {
      // Logged-in user opening the login/register URL -> Redirect to their existing dashboard
      const redirectParam = req.nextUrl.searchParams.get("redirect");
      if (
        redirectParam &&
        redirectParam.startsWith("/") &&
        !redirectParam.startsWith("//") &&
        !redirectParam.startsWith("/login") &&
        !redirectParam.startsWith("/register")
      ) {
        const isTargetingAdmin =
          redirectParam.startsWith("/admin") && redirectParam !== "/admin/login";
        const isTargetingScholar = redirectParam.startsWith("/dashboard/scholar");
        const isTargetingStudent = redirectParam.startsWith("/dashboard/student");

        if (isTargetingAdmin && payload.role !== "admin") {
          const userDashboard =
            payload.role === "scholar" ? "/dashboard/scholar" : "/dashboard/student";
          return NextResponse.redirect(new URL(userDashboard, req.url));
        }
        if (isTargetingScholar && payload.role !== "scholar") {
          const userDashboard =
            payload.role === "admin" ? "/admin" : "/dashboard/student";
          return NextResponse.redirect(new URL(userDashboard, req.url));
        }
        if (isTargetingStudent && payload.role !== "student") {
          const userDashboard =
            payload.role === "admin" ? "/admin" : "/dashboard/scholar";
          return NextResponse.redirect(new URL(userDashboard, req.url));
        }
        return NextResponse.redirect(new URL(redirectParam, req.url));
      }

      let dashboardUrl = "/dashboard/student";
      if (payload.role === "admin") {
        dashboardUrl = "/admin";
      } else if (payload.role === "scholar") {
        dashboardUrl = "/dashboard/scholar";
      }
      return NextResponse.redirect(new URL(dashboardUrl, req.url));
    }
    // Visitor is unauthenticated: allow access to the Authentication Gateway
    return NextResponse.next();
  }

  // 5. Protected Website Pages (Scholars, Dashboards, Admin, Onboarding)
  const isProtectedPage =
    pathname.startsWith("/scholars") ||
    pathname.startsWith("/dashboard") ||
    (pathname.startsWith("/admin") && pathname !== "/admin/login") ||
    pathname.startsWith("/onboarding");

  if (isProtectedPage && !payload) {
    // Unauthenticated visitor attempting to access protected route -> Redirect to Gateway with destination
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", `${pathname}${search}`);

    const res = NextResponse.redirect(loginUrl);
    if (token) {
      res.cookies.delete(SESSION_COOKIE_NAME);
    }
    return res;
  }

  // 6. Role-Based Route Guards for Authenticated Users
  if (payload) {
    // Protect /admin routes from non-admin users
    if (pathname.startsWith("/admin") && payload.role !== "admin") {
      const userDashboard =
        payload.role === "scholar" ? "/dashboard/scholar" : "/dashboard/student";
      return NextResponse.redirect(new URL(userDashboard, req.url));
    }

    // Protect /dashboard/scholar from non-scholar users
    if (pathname.startsWith("/dashboard/scholar") && payload.role !== "scholar") {
      const userDashboard =
        payload.role === "admin" ? "/admin" : "/dashboard/student";
      return NextResponse.redirect(new URL(userDashboard, req.url));
    }

    // Protect /dashboard/student from non-student users
    if (pathname.startsWith("/dashboard/student") && payload.role !== "student") {
      const userDashboard =
        payload.role === "admin" ? "/admin" : "/dashboard/scholar";
      return NextResponse.redirect(new URL(userDashboard, req.url));
    }
  }

  // Allow public pages (/, /explore, /about, /contact, /careers, /internships/:id)
  const res = NextResponse.next();
  if (token && !payload) {
    res.cookies.delete(SESSION_COOKIE_NAME);
  }
  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files with extensions.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

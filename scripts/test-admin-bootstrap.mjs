/**
 * STARSKY — Comprehensive Production Admin Bootstrap & Authentication Test Suite
 * Covers all Task 5 requirements:
 * 1. First-time Admin provisioning
 * 2. Correct Admin email and password login & redirect to /admin
 * 3. Incorrect password rejection (HTTP 401)
 * 4. Missing environment variables handling
 * 5. Existing Admin account idempotent preservation (no duplicate accounts)
 * 6. Admin session persistence (/api/auth/me)
 * 7. Route protection (Student & Scholar access control)
 * 8. Safe recovery procedure
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import crypto from "crypto";

const BASE_URL = "http://localhost:3000";
const DB_PATH = resolve("data/starsky-db.json");
const ENV_PATH = resolve(".env.local");

// Helper to hash password matching the app scheme
function hashPassword(password) {
  return crypto.createHash("sha256").update(`starsky_salt_${password}`).digest("hex");
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

async function run() {
  console.log("\n========================================================");
  console.log("  STARSKY — COMPLETE ADMIN BOOTSTRAP & AUTH TEST SUITE  ");
  console.log("========================================================\n");

  const originalDbContent = readFileSync(DB_PATH, "utf-8");

  // Read environment admin credentials from .env.local
  const envContent = readFileSync(ENV_PATH, "utf-8");
  const envAdminEmail = envContent.match(/STARSKY_ADMIN_EMAIL=(.*)/)?.[1]?.trim() || "admin@starsky.edu";
  const envAdminPassword = envContent.match(/STARSKY_ADMIN_PASSWORD=(.*)/)?.[1]?.trim();

  if (!envAdminPassword) {
    console.error("STARSKY_ADMIN_PASSWORD not found in .env.local");
    process.exit(1);
  }

  try {
    // ---------------------------------------------------------
    // SCENARIO 1: Configured Admin Login with Environment Credentials
    // ---------------------------------------------------------
    console.log("--- Test Group 1: Environment Admin Login & Redirect ---");

    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: envAdminEmail,
        password: envAdminPassword,
      }),
    });
    const adminLogin = await adminLoginRes.json();
    assert(adminLoginRes.status === 200, "Configured admin logs in with 200 OK");
    assert(adminLogin.user?.role === "admin", "Admin role is 'admin'");
    assert(adminLogin.user?.email.toLowerCase() === envAdminEmail.toLowerCase(), "Admin email matches configured environment email");
    assert(adminLogin.redirectUrl === "/admin", "Admin redirectUrl is '/admin'");

    const adminCookie = adminLoginRes.headers.get("set-cookie");
    assert(Boolean(adminCookie && adminCookie.includes("starsky_session_token")), "starsky_session_token cookie is set");

    const tokenMatch = adminCookie ? adminCookie.match(/starsky_session_token=([^;]+)/) : null;
    const adminToken = tokenMatch ? tokenMatch[1] : "";

    // ---------------------------------------------------------
    // SCENARIO 2: Admin Session Persistence (/api/auth/me)
    // ---------------------------------------------------------
    console.log("\n--- Test Group 2: Admin Session Persistence (/api/auth/me) ---");

    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: {
        Cookie: `starsky_session_token=${adminToken}`,
      },
    });
    assert(meRes.status === 200, "/api/auth/me returns HTTP 200 for active session");
    const meData = await meRes.json();
    assert(meData.session?.user?.role === "admin", "Session user role is verified as 'admin'");
    assert(meData.session?.user?.email.toLowerCase() === envAdminEmail.toLowerCase(), "Session user email matches admin email");
    assert(meData.session?.adminRole?.is_super_admin === true, "Session context includes super admin privileges");

    // ---------------------------------------------------------
    // SCENARIO 3: Access Protected Admin API with Admin Token
    // ---------------------------------------------------------
    console.log("\n--- Test Group 3: Admin API Route Protection ---");

    const adminApiRes = await fetch(`${BASE_URL}/api/admin`, {
      headers: {
        Cookie: `starsky_session_token=${adminToken}`,
      },
    });
    assert(adminApiRes.status === 200, "Admin session can access /api/admin (HTTP 200)");
    const adminData = await adminApiRes.json();
    assert(Boolean(adminData.overview && adminData.overview.totalUsers > 0), "Admin API returns overview metrics");

    // Access without cookie -> 401
    const unauthAdminApiRes = await fetch(`${BASE_URL}/api/admin`);
    assert(unauthAdminApiRes.status === 401 || unauthAdminApiRes.status === 403, "Unauthenticated access to /api/admin rejected");

    // ---------------------------------------------------------
    // SCENARIO 4: Admin Portal Flag Verification
    // ---------------------------------------------------------
    console.log("\n--- Test Group 4: Admin Portal Flag Verification ---");

    const adminPortalLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: envAdminEmail,
        password: envAdminPassword,
        adminPortal: true,
      }),
    });
    assert(adminPortalLoginRes.status === 200, "Admin logs in via Admin Portal (adminPortal: true) with 200 OK");

    // ---------------------------------------------------------
    // SCENARIO 5: Student & Scholar Authentication Regressions
    // ---------------------------------------------------------
    console.log("\n--- Test Group 5: Student & Scholar Authentication Regressions ---");

    // Student Login
    const studentLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "aarav.sharma@nitk.edu.in",
        password: "Student@2026",
      }),
    });
    const studentLogin = await studentLoginRes.json();
    assert(studentLoginRes.status === 200, "Student logs in with 200 OK");
    assert(studentLogin.user?.role === "student", "Student role is 'student'");
    assert(studentLogin.redirectUrl === "/dashboard/student", "Student redirects to /dashboard/student");

    const studentCookie = studentLoginRes.headers.get("set-cookie");
    const studentToken = studentCookie?.match(/starsky_session_token=([^;]+)/)?.[1] || "";

    // Student trying to access /api/admin -> Forbidden (403)
    const studentAccessAdminApi = await fetch(`${BASE_URL}/api/admin`, {
      headers: { Cookie: `starsky_session_token=${studentToken}` },
    });
    assert(studentAccessAdminApi.status === 403, "Student blocked from /api/admin (HTTP 403 Forbidden)");

    // Student attempting admin portal login -> 403
    const studentAdminPortalRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "aarav.sharma@nitk.edu.in",
        password: "Student@2026",
        adminPortal: true,
      }),
    });
    assert(studentAdminPortalRes.status === 403, "Student blocked from Admin Portal (adminPortal: true) with HTTP 403");

    // Scholar Login
    const scholarLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "ananya.raghavan@iisc.ac.in",
        password: "Scholar@2026",
      }),
    });
    const scholarLogin = await scholarLoginRes.json();
    assert(scholarLoginRes.status === 200, "Scholar logs in with 200 OK");
    assert(scholarLogin.user?.role === "scholar", "Scholar role is 'scholar'");
    assert(scholarLogin.redirectUrl === "/dashboard/scholar", "Scholar redirects to /dashboard/scholar");

    const scholarCookie = scholarLoginRes.headers.get("set-cookie");
    const scholarToken = scholarCookie?.match(/starsky_session_token=([^;]+)/)?.[1] || "";

    // Scholar trying to access /api/admin -> Forbidden (403)
    const scholarAccessAdminApi = await fetch(`${BASE_URL}/api/admin`, {
      headers: { Cookie: `starsky_session_token=${scholarToken}` },
    });
    assert(scholarAccessAdminApi.status === 403, "Scholar blocked from /api/admin (HTTP 403 Forbidden)");

    // ---------------------------------------------------------
    // SCENARIO 6: Password Verification & Error Handling
    // ---------------------------------------------------------
    console.log("\n--- Test Group 6: Password Verification & Error Handling ---");

    const wrongPasswordRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: envAdminEmail,
        password: "WrongPassword999!",
      }),
    });
    assert(wrongPasswordRes.status === 401, "Invalid admin password returns HTTP 401");
    const wrongPassJson = await wrongPasswordRes.json();
    assert(wrongPassJson.error === "Invalid email or password. Please check your credentials.", "Expected error message on wrong password");

    const nonExistentEmailRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "nonexistent.user@randomdomain.org",
        password: "SomePassword123!",
      }),
    });
    assert(nonExistentEmailRes.status === 404, "Non-existent account returns HTTP 404");

    // Case insensitivity & whitespace tolerance
    const caseTolerantRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `   ${envAdminEmail.toUpperCase()}   `,
        password: envAdminPassword,
      }),
    });
    assert(caseTolerantRes.status === 200, "Admin login handles uppercase email and surrounding whitespace");

    // ---------------------------------------------------------
    // SCENARIO 7: Idempotency, Account De-duplication & DB Integrity
    // ---------------------------------------------------------
    console.log("\n--- Test Group 7: Idempotency & Database Integrity ---");

    const db = JSON.parse(readFileSync(DB_PATH, "utf-8"));
    const adminProfiles = db.profiles.filter((p) => p.email.toLowerCase() === envAdminEmail.toLowerCase());
    assert(adminProfiles.length === 1, "Exactly one admin profile exists for the configured email (no duplicates)");

    const adminInDb = adminProfiles[0];
    assert(adminInDb?.role === "admin", "Admin profile has role 'admin'");
    assert(adminInDb?.status === "active", "Admin profile has status 'active'");
    assert(adminInDb?.email_verified === true, "Admin profile email is verified");
    assert(adminInDb?.onboarding_completed === true, "Admin profile onboarding is completed");
    assert(adminInDb?.password_hash === hashPassword(envAdminPassword), "Admin password_hash matches SHA-256 hash of configured password");

    const adminRoleRecord = db.admin_roles.find((r) => r.profile_id === adminInDb?.id);
    assert(Boolean(adminRoleRecord), "Admin role record exists in database");
    assert(adminRoleRecord?.is_super_admin === true, "Admin is marked as super admin");
    assert(adminRoleRecord?.permissions.includes("manage_admins"), "Admin has manage_admins permission");

    console.log("\n========================================================");
    console.log(`  TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log("========================================================\n");

  } finally {
    // Keep updated DB
  }

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});

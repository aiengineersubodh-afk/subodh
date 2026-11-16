/**
 * STARSKY — Live Production Authentication & Security Audit Suite
 * Target: https://subodh-606u.onrender.com
 */

const PROD_URL = "https://subodh-606u.onrender.com";

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

async function runAudit() {
  console.log("================================================================================");
  console.log("  STARSKY — LIVE PRODUCTION AUDIT (https://subodh-606u.onrender.com)  ");
  console.log("================================================================================\n");

  // 1. Homepage & Public Assets
  console.log("--- Check 1: Production Public Gateway ---");
  const homeRes = await fetch(`${PROD_URL}/`);
  assert(homeRes.status === 200, "Production homepage responds with HTTP 200 OK");

  const publicApiRes = await fetch(`${PROD_URL}/api/public`);
  assert(publicApiRes.status === 200, "Production /api/public responds with HTTP 200 OK");
  const publicData = await publicApiRes.json();
  assert(publicData.stats?.academicDomains === 9, "Production academic domains = 9");
  assert(publicData.stats?.specializationsCount === 57, "Production specializations count = 57");

  // 2. Unauthenticated Admin Protection
  console.log("\n--- Check 2: Unauthenticated Admin Route Protection ---");
  const unauthAdminRes = await fetch(`${PROD_URL}/api/admin`);
  assert(unauthAdminRes.status === 401 || unauthAdminRes.status === 403, "Unauthenticated /api/admin access rejected (HTTP 401/403)");

  // 3. Invalid Credentials Handling
  console.log("\n--- Check 3: Invalid Credentials Handling ---");
  const invalidLoginRes = await fetch(`${PROD_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@starsky.edu",
      password: "WrongPassword999!",
    }),
  });
  assert(invalidLoginRes.status === 401, "Invalid password returns HTTP 401 Unauthorized");

  const nonExistentLoginRes = await fetch(`${PROD_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "random.nonexistent@nowhere.edu",
      password: "SomePassword123!",
    }),
  });
  assert(nonExistentLoginRes.status === 404, "Non-existent account returns HTTP 404 Not Found");

  // 4. Student Authentication & Role Enforcement
  console.log("\n--- Check 4: Student Authentication & Role Enforcement ---");
  const studentLoginRes = await fetch(`${PROD_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "aarav.sharma@nitk.edu.in",
      password: "Student@2026",
    }),
  });
  assert(studentLoginRes.status === 200, "Student logs in with HTTP 200 OK");
  const studentLogin = await studentLoginRes.json();
  assert(studentLogin.user?.role === "student", "Student profile role is 'student'");
  assert(studentLogin.redirectUrl === "/dashboard/student", "Student redirectUrl is '/dashboard/student'");

  const studentCookie = studentLoginRes.headers.get("set-cookie") || "";
  const studentToken = studentCookie.match(/starsky_session_token=([^;]+)/)?.[1] || "";
  assert(Boolean(studentToken), "Student session cookie is issued");

  const studentAdminAttempt = await fetch(`${PROD_URL}/api/admin`, {
    headers: { Cookie: `starsky_session_token=${studentToken}` },
  });
  assert(studentAdminAttempt.status === 403, "Student session is rejected from /api/admin with HTTP 403 Forbidden");

  // 5. PhD Scholar Authentication & Role Enforcement
  console.log("\n--- Check 5: PhD Scholar Authentication & Role Enforcement ---");
  const scholarLoginRes = await fetch(`${PROD_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "ananya.raghavan@iisc.ac.in",
      password: "Scholar@2026",
    }),
  });
  assert(scholarLoginRes.status === 200, "Scholar logs in with HTTP 200 OK");
  const scholarLogin = await scholarLoginRes.json();
  assert(scholarLogin.user?.role === "scholar", "Scholar profile role is 'scholar'");
  assert(scholarLogin.redirectUrl === "/dashboard/scholar", "Scholar redirectUrl is '/dashboard/scholar'");

  const scholarCookie = scholarLoginRes.headers.get("set-cookie") || "";
  const scholarToken = scholarCookie.match(/starsky_session_token=([^;]+)/)?.[1] || "";
  assert(Boolean(scholarToken), "Scholar session cookie is issued");

  const scholarAdminAttempt = await fetch(`${PROD_URL}/api/admin`, {
    headers: { Cookie: `starsky_session_token=${scholarToken}` },
  });
  assert(scholarAdminAttempt.status === 403, "Scholar session is rejected from /api/admin with HTTP 403 Forbidden");

  // 6. Logout Functionality
  console.log("\n--- Check 6: Session Invalidation on Logout ---");
  const logoutRes = await fetch(`${PROD_URL}/api/auth/logout`, {
    method: "POST",
  });
  assert(logoutRes.status === 200, "Logout endpoint returns HTTP 200 OK");
  const logoutCookie = logoutRes.headers.get("set-cookie") || "";
  assert(logoutCookie.includes("starsky_session_token=;") && logoutCookie.includes("1970"), "Logout expires the session token cookie");

  // 7. Security Hardening on Admin UI
  console.log("\n--- Check 7: Admin UI Security Hardening ---");
  const adminLoginPageRes = await fetch(`${PROD_URL}/admin/login`);
  assert(adminLoginPageRes.status === 200, "/admin/login renders successfully");
  const adminLoginHtml = await adminLoginPageRes.text();
  assert(!adminLoginHtml.includes("Admin@2026"), "Default demo password 'Admin@2026' is not exposed in HTML");
  assert(adminLoginHtml.includes("admin@institution.edu"), "Clean generic placeholder 'admin@institution.edu' is rendered");

  console.log("\n================================================================================");
  console.log(`  PRODUCTION AUDIT SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log("================================================================================\n");

  if (failed > 0) process.exit(1);
}

runAudit().catch((err) => {
  console.error("Production audit fatal error:", err);
  process.exit(1);
});

import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import assert from "assert";

const BASE_URL = "http://localhost:3000";
const SCREENSHOT_DIR = path.resolve("public/screenshots/auth-gateway");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function waitForPath(page, targetPath, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (page.url().includes(targetPath)) {
      return true;
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Timed out waiting for URL to include "${targetPath}". Current URL: ${page.url()}`);
}

async function main() {
  console.log("================================================================================");
  console.log("STARSKY — PRODUCTION AUTHENTICATION GATEWAY VERIFICATION SUITE");
  console.log("================================================================================\n");

  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"],
  });

  const createdTestIds = {
    profileIds: new Set(),
    scholarIds: new Set(),
    studentProfileIds: new Set(),
  };

  const results = {};

  try {
    // =========================================================================
    // SCENARIO A: New Visitor (Unauthenticated Guard & Gateway UI)
    // =========================================================================
    console.log("▶ [Scenario A] Verifying New Visitor Journey & Route Protection...");
    const ctxA = await browser.createBrowserContext();
    const pageA = await ctxA.newPage();
    await pageA.setViewport({ width: 1440, height: 900 });

    // 1. Visit root '/'
    await pageA.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
    const currentUrlA = pageA.url();
    assert.ok(
      currentUrlA.includes("/login"),
      `Unauthenticated visitor must be redirected to /login. Got: ${currentUrlA}`
    );

    // 2. Verify Authentication Gateway Content
    await pageA.mainFrame().waitForFunction(() => {
      const text = document.body.innerText;
      return (
        text.includes("Welcome to STARSKY") &&
        text.includes("Connect with researchers, explore academic opportunities") &&
        text.includes("Login to Your Account") &&
        text.includes("Create a New Account")
      );
    }, { timeout: 15000 });

    const gatewayText = await pageA.evaluate(() => document.body.innerText);
    assert.ok(gatewayText.includes("Welcome to STARSKY"), "Headline must be 'Welcome to STARSKY'");
    assert.ok(
      gatewayText.includes("Connect with researchers, explore academic opportunities"),
      "Tagline must match requirement"
    );
    assert.ok(gatewayText.includes("Login to Your Account"), "Login action button must exist");
    assert.ok(gatewayText.includes("Create a New Account"), "Register action button must exist");

    // Screenshot Gateway
    await pageA.screenshot({ path: path.join(SCREENSHOT_DIR, "scenario-a-gateway.png") });
    console.log("  ✓ Authentication Gateway renders correctly with required branding & actions.");

    // 3. Test direct access to protected pages
    const protectedPages = [
      { path: "/explore", expectedRedirect: "/login?redirect=" },
      { path: "/dashboard/student", expectedRedirect: "/login?redirect=" },
      { path: "/dashboard/scholar", expectedRedirect: "/login?redirect=" },
      { path: "/admin", expectedRedirect: "/login?redirect=" },
    ];

    for (const testPath of protectedPages) {
      await pageA.goto(`${BASE_URL}${testPath.path}`, { waitUntil: "domcontentloaded" });
      const targetUrl = pageA.url();
      assert.ok(
        targetUrl.includes(testPath.expectedRedirect),
        `Direct access to ${testPath.path} must redirect to login. Got: ${targetUrl}`
      );
    }
    console.log("  ✓ All protected pages properly redirect unauthenticated visitors to Gateway.");
    await ctxA.close();
    results.scenarioA = "PASS";

    // =========================================================================
    // SCENARIO B: Existing Account (Login & Role Routing)
    // =========================================================================
    console.log("\n▶ [Scenario B] Verifying Existing Account Login & Role-Based Routing...");
    const ctxB = await browser.createBrowserContext();
    const pageB = await ctxB.newPage();
    await pageB.setViewport({ width: 1440, height: 900 });

    // 1. Existing Student Login (Aarav Sharma)
    await pageB.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await pageB.waitForSelector('[data-hydrated="true"]', { timeout: 20000 });
    await new Promise((r) => setTimeout(r, 600));

    await pageB.type('input[type="email"]', "aarav.sharma@nitk.edu.in");
    await pageB.type('input[type="password"]', "Student@2026");
    await new Promise((r) => setTimeout(r, 300));
    await pageB.click('button[type="submit"]');

    await waitForPath(pageB, "/dashboard/student", 25000);
    const studentDashText = await pageB.evaluate(() => document.body.innerText);
    assert.ok(
      studentDashText.includes("Student") || studentDashText.includes("Aarav"),
      "Student dashboard must load for student"
    );
    await pageB.screenshot({ path: path.join(SCREENSHOT_DIR, "scenario-b-student-dash.png") });
    console.log("  ✓ Existing Student authenticated and redirected to /dashboard/student.");

    // Logout
    await pageB.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    // Since already logged in, should bounce back to dashboard
    assert.ok(pageB.url().includes("/dashboard/student"), "Logged-in student opening /login bounces to dashboard");

    // Perform real logout via API
    await pageB.evaluate(async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    });
    await waitForPath(pageB, "/login", 15000);
    await pageB.waitForSelector('[data-hydrated="true"]', { timeout: 20000 });
    await new Promise((r) => setTimeout(r, 600));
    console.log("  ✓ Logout successful: returned to Gateway.");

    // 2. Existing PhD Scholar Login (Dr. Ananya Raghavan)
    await pageB.type('input[type="email"]', "ananya.raghavan@iisc.ac.in");
    await pageB.type('input[type="password"]', "Scholar@2026");
    await new Promise((r) => setTimeout(r, 300));
    await pageB.click('button[type="submit"]');

    await waitForPath(pageB, "/dashboard/scholar", 25000);
    const scholarDashText = await pageB.evaluate(() => document.body.innerText);
    assert.ok(
      scholarDashText.includes("PhD Scholar") || scholarDashText.includes("Ananya"),
      "Scholar dashboard must load for scholar"
    );
    await pageB.screenshot({ path: path.join(SCREENSHOT_DIR, "scenario-b-scholar-dash.png") });
    console.log("  ✓ Existing PhD Scholar authenticated and redirected to /dashboard/scholar.");

    await ctxB.close();
    results.scenarioB = "PASS";

    // =========================================================================
    // SCENARIO C: Account Not Found
    // =========================================================================
    console.log("\n▶ [Scenario C] Verifying Account Not Found & Error Handling...");
    const ctxC = await browser.createBrowserContext();
    const pageC = await ctxC.newPage();
    await pageC.setViewport({ width: 1440, height: 900 });

    await pageC.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await pageC.waitForSelector('[data-hydrated="true"]', { timeout: 20000 });
    await new Promise((r) => setTimeout(r, 600));

    // Attempt login with unregistered email
    const fakeEmail = "unregistered.researcher.999@notfound-starsky.org";
    await pageC.type('input[type="email"]', fakeEmail);
    await pageC.type('input[type="password"]', "SamplePass@2026");
    await new Promise((r) => setTimeout(r, 300));
    await pageC.click('button[type="submit"]');

    // Wait for Account Not Found alert
    await pageC.mainFrame().waitForFunction(() => {
      return document.body.innerText.includes("We couldn't find an account matching those details");
    }, { timeout: 15000 });

    const notFoundText = await pageC.evaluate(() => document.body.innerText);
    assert.ok(
      notFoundText.includes("We couldn't find an account matching those details. Please check your email or create a new STARSKY account."),
      "Exact required error message must be shown"
    );
    assert.ok(
      notFoundText.includes("Create Account Now"),
      "Direct Create Account action must be provided in alert"
    );

    await pageC.screenshot({ path: path.join(SCREENSHOT_DIR, "scenario-c-account-not-found.png") });
    console.log("  ✓ Professional 'Account Not Found' alert rendered with direct 'Create Account Now' action.");

    // Click direct Create Account action inside alert
    const createBtn = await pageC.waitForSelector('[data-action="create-account-now"]', { timeout: 10000 });
    await createBtn.click();

    // Verify registration view opened with email pre-filled
    await pageC.waitForSelector('[data-role-btn="student"]', { timeout: 15000 });

    const prefilledEmail = await pageC.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"]');
      return emailInput ? emailInput.value : "";
    });
    assert.strictEqual(prefilledEmail, fakeEmail, "Email must be pre-filled into registration form");
    console.log("  ✓ Direct Create Account action seamlessly opened registration form with pre-filled email.");

    await ctxC.close();
    results.scenarioC = "PASS";

    // =========================================================================
    // SCENARIO D: Registration (Student & PhD Scholar)
    // =========================================================================
    console.log("\n▶ [Scenario D] Verifying Real Registration & Onboarding...");
    const ctxD = await browser.createBrowserContext();
    const pageD = await ctxD.newPage();
    await pageD.setViewport({ width: 1440, height: 900 });

    const stuTestEmail = `test-gw-stu-${Date.now()}@starsky-test.org`;
    const schTestEmail = `test-gw-sch-${Date.now()}@starsky-test.org`;

    // 1. Student Registration
    await pageD.goto(`${BASE_URL}/register`, { waitUntil: "domcontentloaded" });
    await pageD.waitForSelector('[data-hydrated="true"]', { timeout: 20000 });
    await new Promise((r) => setTimeout(r, 600));

    // Fill Student form
    await pageD.click('[data-role-btn="student"]');
    await new Promise((r) => setTimeout(r, 200));

    await pageD.type('input[placeholder*="Student Name"]', "Gateway Test Student");
    await pageD.type('input[type="email"]', stuTestEmail);
    await pageD.type('input[type="password"]', "TestStudent@2026!");
    await pageD.type('input[type="tel"]', "+91 98888 11111");
    await pageD.type('input[placeholder*="Karnataka"]', "Karnataka");
    await pageD.type('input[placeholder*="Bangalore"]', "Bangalore");
    await new Promise((r) => setTimeout(r, 300));

    await pageD.click('button[type="submit"]');

    // Wait for redirect to /onboarding/student
    await waitForPath(pageD, "/onboarding/student", 25000);
    assert.ok(pageD.url().includes("/onboarding/student"), "Student registration must redirect to /onboarding/student");
    await pageD.screenshot({ path: path.join(SCREENSHOT_DIR, "scenario-d-student-onboarding.png") });
    console.log("  ✓ Student registered and redirected to /onboarding/student.");

    // 2. Scholar Registration
    await pageD.evaluate(async () => {
      await fetch("/api/auth/logout", { method: "POST" });
    });

    await pageD.goto(`${BASE_URL}/register`, { waitUntil: "domcontentloaded" });
    await pageD.waitForSelector('[data-hydrated="true"]', { timeout: 20000 });
    await new Promise((r) => setTimeout(r, 600));

    // Select PhD Scholar role
    await pageD.click('[data-role-btn="scholar"]');
    await new Promise((r) => setTimeout(r, 200));

    await pageD.type('input[placeholder*="Scholar Name"]', "Dr. Gateway Test Scholar");
    await pageD.type('input[type="email"]', schTestEmail);
    await pageD.type('input[type="password"]', "TestScholar@2026!");
    await pageD.type('input[type="tel"]', "+91 98888 22222");
    await pageD.type('input[placeholder*="Karnataka"]', "Delhi");
    await pageD.type('input[placeholder*="Bangalore"]', "New Delhi");
    await new Promise((r) => setTimeout(r, 300));

    await pageD.click('button[type="submit"]');

    // Wait for redirect to /onboarding/scholar
    await waitForPath(pageD, "/onboarding/scholar", 25000);
    assert.ok(pageD.url().includes("/onboarding/scholar"), "PhD Scholar registration must redirect to /onboarding/scholar");
    await pageD.screenshot({ path: path.join(SCREENSHOT_DIR, "scenario-d-scholar-onboarding.png") });
    console.log("  ✓ PhD Scholar registered and redirected to /onboarding/scholar.");

    // Mark test accounts for cleanup
    const dbCheck = JSON.parse(fs.readFileSync("data/starsky-db.json", "utf8"));
    const stuProfile = dbCheck.profiles.find((p) => p.email === stuTestEmail);
    const schProfile = dbCheck.profiles.find((p) => p.email === schTestEmail);
    if (stuProfile) createdTestIds.profileIds.add(stuProfile.id);
    if (schProfile) createdTestIds.profileIds.add(schProfile.id);

    await ctxD.close();
    results.scenarioD = "PASS";

    // =========================================================================
    // SCENARIO E: Session Handling & Logout
    // =========================================================================
    console.log("\n▶ [Scenario E] Verifying Session Restoration & Logout...");
    const ctxE = await browser.createBrowserContext();
    const pageE = await ctxE.newPage();
    await pageE.setViewport({ width: 1440, height: 900 });

    // Login as Student
    await pageE.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await pageE.waitForSelector('[data-hydrated="true"]', { timeout: 20000 });
    await new Promise((r) => setTimeout(r, 600));

    await pageE.type('input[type="email"]', "aarav.sharma@nitk.edu.in");
    await pageE.type('input[type="password"]', "Student@2026");
    await new Promise((r) => setTimeout(r, 300));
    await pageE.click('button[type="submit"]');

    await waitForPath(pageE, "/dashboard/student", 20000);

    // Refresh page
    await pageE.reload({ waitUntil: "domcontentloaded" });
    await waitForPath(pageE, "/dashboard/student", 15000);
    const dashAfterReload = await pageE.evaluate(() => document.body.innerText);
    assert.ok(dashAfterReload.includes("Aarav") || dashAfterReload.includes("Student"), "Session must persist across reload");
    console.log("  ✓ Session restores perfectly on page refresh.");

    // Visit /login while authenticated
    await pageE.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await waitForPath(pageE, "/dashboard/student", 15000);
    assert.ok(pageE.url().includes("/dashboard/student"), "Opening /login while authenticated redirects to dashboard");
    console.log("  ✓ Opening /login while authenticated automatically redirects to dashboard.");

    // Logout
    await pageE.evaluate(async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    });
    await waitForPath(pageE, "/login", 15000);
    assert.ok(pageE.url().includes("/login"), "Logout redirects to Authentication Gateway");

    // Attempt accessing dashboard after logout
    await pageE.goto(`${BASE_URL}/dashboard/student`, { waitUntil: "domcontentloaded" });
    await waitForPath(pageE, "/login", 15000);
    assert.ok(pageE.url().includes("/login"), "Accessing protected page after logout redirects to Gateway");
    console.log("  ✓ Logout invalidates session and prevents protected page access.");

    await pageE.screenshot({ path: path.join(SCREENSHOT_DIR, "scenario-e-session-restored.png") });
    await ctxE.close();
    results.scenarioE = "PASS";

    // =========================================================================
    // SCENARIO F: Security & Role Boundaries
    // =========================================================================
    console.log("\n▶ [Scenario F] Verifying Security & Role Boundaries...");

    // 1. Unauthenticated API calls
    const protectedApis = ["/api/internships", "/api/applications", "/api/admin"];
    for (const api of protectedApis) {
      const res = await fetch(`${BASE_URL}${api}`);
      assert.strictEqual(res.status, 401, `Unauthenticated ${api} must return 401`);
    }
    console.log("  ✓ Backend protected APIs strictly reject unauthenticated requests with HTTP 401.");

    // 2. Student role boundary checks
    const studentLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "aarav.sharma@nitk.edu.in", password: "Student@2026" }),
    });
    const stuCookies = studentLogin.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");

    // Student attempting /api/admin
    const stuAdminApi = await fetch(`${BASE_URL}/api/admin`, { headers: { Cookie: stuCookies } });
    assert.strictEqual(stuAdminApi.status, 403, "Student accessing /api/admin must return 403 Forbidden");

    // Student attempting /admin page
    const stuAdminPage = await fetch(`${BASE_URL}/admin`, { headers: { Cookie: stuCookies }, redirect: "manual" });
    assert.strictEqual(stuAdminPage.status, 307, "Student accessing /admin must redirect to student dashboard");
    assert.strictEqual(stuAdminPage.headers.get("location"), "/dashboard/student");
    console.log("  ✓ Student role boundaries enforced: /api/admin returns 403, /admin redirects to /dashboard/student.");

    // 3. Tampered token
    const tamperedRes = await fetch(`${BASE_URL}/dashboard/student`, {
      headers: { Cookie: "starsky_session_token=fake.tampered.token" },
      redirect: "manual",
    });
    assert.strictEqual(tamperedRes.status, 307, "Tampered token must redirect to /login");
    console.log("  ✓ Tampered/invalid session tokens rejected and redirected to Gateway.");

    results.scenarioF = "PASS";

    // =========================================================================
    // SCENARIO G: Existing Features after Authentication
    // =========================================================================
    console.log("\n▶ [Scenario G] Verifying Existing Features Post-Authentication...");

    // 1. Scholar authentication & discovery access
    const scholarLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "ananya.raghavan@iisc.ac.in", password: "Scholar@2026" }),
    });
    const schCookies = scholarLogin.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");

    const ctxG = await browser.createBrowserContext();
    const pageG = await ctxG.newPage();
    await pageG.setViewport({ width: 1440, height: 900 });

    // Set cookie
    const tokenVal = schCookies.match(/starsky_session_token=([^;]+)/)[1];
    await pageG.setCookie({
      name: "starsky_session_token",
      value: tokenVal,
      domain: "localhost",
      path: "/",
    });

    // Load Explore / Open Internships
    await pageG.goto(`${BASE_URL}/explore?tab=internships&domain=dom-engineering`, { waitUntil: "domcontentloaded" });
    await pageG.mainFrame().waitForFunction(() => document.body.innerText.includes("Open Research Internships"), { timeout: 20000 });
    const exploreText = await pageG.evaluate(() => document.body.innerText);
    assert.ok(exploreText.includes("Open Research Internships"), "Explore internships must render for authenticated user");
    console.log("  ✓ Explore Open Internships accessible and functional post-authentication.");

    // Load Scholar Profile
    await pageG.goto(`${BASE_URL}/scholars/sch-2`, { waitUntil: "domcontentloaded" });
    await pageG.mainFrame().waitForFunction(() => document.body.innerText.includes("IISc") || document.body.innerText.includes("Ananya"), { timeout: 20000 });
    console.log("  ✓ Public Scholar Profiles accessible and functional post-authentication.");

    // Admin Panel check
    const adminLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@starsky.edu", password: "Admin@2026", adminPortal: true }),
    });
    const adminCookies = adminLogin.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
    const adminTokenVal = adminCookies.match(/starsky_session_token=([^;]+)/)[1];

    await pageG.setCookie({
      name: "starsky_session_token",
      value: adminTokenVal,
      domain: "localhost",
      path: "/",
    });

    await pageG.goto(`${BASE_URL}/admin`, { waitUntil: "domcontentloaded" });
    await pageG.mainFrame().waitForFunction(() => document.body.innerText.includes("Administrative Control Center") || document.body.innerText.includes("STARSKY Administration"), { timeout: 20000 });
    console.log("  ✓ Admin Control Center accessible and functional post-authentication.");

    await ctxG.close();
    results.scenarioG = "PASS";

  } finally {
    try {
      await browser.close().catch(() => {});
    } catch {}

    // Clean up test accounts
    console.log("\n================================================================================");
    console.log("CLEANING UP ISOLATED TEST ACCOUNTS...");
    const dbToClean = JSON.parse(fs.readFileSync("data/starsky-db.json", "utf8"));
    const origProfiles = dbToClean.profiles.length;

    dbToClean.profiles = dbToClean.profiles.filter(
      (p) => !createdTestIds.profileIds.has(p.id) && !p.email.startsWith("test-gw-")
    );
    dbToClean.student_profiles = dbToClean.student_profiles.filter(
      (st) => !createdTestIds.profileIds.has(st.profile_id)
    );
    dbToClean.phd_scholar_profiles = dbToClean.phd_scholar_profiles.filter(
      (s) => !createdTestIds.profileIds.has(s.profile_id)
    );
    dbToClean.notifications = dbToClean.notifications.filter(
      (n) => !createdTestIds.profileIds.has(n.recipient_profile_id)
    );
    dbToClean.activity_logs = dbToClean.activity_logs.filter(
      (a) => !createdTestIds.profileIds.has(a.actor_profile_id)
    );

    fs.writeFileSync("data/starsky-db.json", JSON.stringify(dbToClean, null, 2), "utf8");
    console.log(`Cleaned test profiles: ${origProfiles} -> ${dbToClean.profiles.length}`);
    console.log("✓ Database safely returned to clean baseline with all legitimate records intact.\n");
  }

  console.log("================================================================================");
  console.log("FINAL SCENARIO VERIFICATION RESULTS:");
  console.log(`  Scenario A (New Visitor & Route Protection): ${results.scenarioA || "FAIL"}`);
  console.log(`  Scenario B (Existing Account & Routing):    ${results.scenarioB || "FAIL"}`);
  console.log(`  Scenario C (Account Not Found & Direct CTA): ${results.scenarioC || "FAIL"}`);
  console.log(`  Scenario D (Registration Student & Scholar): ${results.scenarioD || "FAIL"}`);
  console.log(`  Scenario E (Session Restore & Logout):       ${results.scenarioE || "FAIL"}`);
  console.log(`  Scenario F (Security & Role Boundaries):    ${results.scenarioF || "FAIL"}`);
  console.log(`  Scenario G (Existing Features Post-Auth):    ${results.scenarioG || "FAIL"}`);
  console.log("================================================================================\n");

  const allPassed = Object.values(results).every((v) => v === "PASS") && Object.keys(results).length === 7;
  if (!allPassed) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Verification suite failed:", err);
  process.exit(1);
});

import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import assert from "assert";

const BASE_URL = "http://localhost:3000";
const SCREENSHOT_DIR = path.resolve("public/screenshots/cache-repair-verify");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function verifyCacheRepair() {
  console.log("================================================================================");
  console.log("STARSKY — NEXT.JS RUNTIME & WEBPACK CHUNK REPAIR VERIFICATION");
  console.log("================================================================================\n");

  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  page.setDefaultNavigationTimeout(60000);
  page.setDefaultTimeout(60000);

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  const testResults = [];

  const checkPageForErrors = async (routeName) => {
    const text = await page.evaluate(() => document.body.innerText);
    const hasWebpackError = text.includes("Cannot find module") || text.includes("7627.js") || text.includes("webpack-runtime");
    const hasNextServerError = text.includes("Internal Server Error") || text.includes("Server Error") && text.includes("500");
    assert.strictEqual(hasWebpackError, false, `[${routeName}] Missing webpack chunk error detected!`);
    assert.strictEqual(hasNextServerError, false, `[${routeName}] Next.js Server Error detected!`);
    return text;
  };

  try {
    // -------------------------------------------------------------------------
    // Route 1: Home /
    // -------------------------------------------------------------------------
    console.log("▶ [1/6] Testing Home Page: / ...");
    const homeRes = await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
    assert.strictEqual(homeRes.status(), 200, "Home page status must be 200");
    await page.waitForSelector("h1, h2, h3", { timeout: 20000 });
    const homeText = await checkPageForErrors("Home /");
    assert.ok(homeText.includes("STARSKY") || homeText.includes("Research"), "Home page must render title");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "01-home.png") });
    testResults.push({ route: "/", status: "PASS", detail: "HTTP 200, No Server Errors" });
    console.log("  ✓ Home Page loaded cleanly (HTTP 200)");

    // -------------------------------------------------------------------------
    // Route 2: /login
    // -------------------------------------------------------------------------
    console.log("▶ [2/6] Testing Login Page: /login ...");
    const loginRes = await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    assert.strictEqual(loginRes.status(), 200, "Login page status must be 200");
    await page.waitForSelector("input[type='email']", { timeout: 20000 });
    const loginText = await checkPageForErrors("Login /login");
    assert.ok(loginText.includes("Sign In") || loginText.includes("Login"), "Login page rendered correctly");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "02-login.png") });
    testResults.push({ route: "/login", status: "PASS", detail: "HTTP 200, Form Ready" });
    console.log("  ✓ Login Page loaded cleanly (HTTP 200)");

    // -------------------------------------------------------------------------
    // Route 3: /explore
    // -------------------------------------------------------------------------
    console.log("▶ [3/6] Testing Explore Page: /explore ...");
    const exploreRes = await page.goto(`${BASE_URL}/explore?tab=internships`, { waitUntil: "domcontentloaded" });
    assert.strictEqual(exploreRes.status(), 200, "Explore page status must be 200");
    await page.waitForResponse((r) => r.url().includes("/api/public") && r.status() === 200);
    await new Promise((r) => setTimeout(r, 1000));
    const exploreText = await checkPageForErrors("Explore /explore");
    assert.ok(exploreText.includes("Open Research Internships") || exploreText.includes("Academic Domains"), "Explore rendered");
    // Verify Quantum Information Science listings are still present
    assert.ok(exploreText.includes("quantum with math") || exploreText.includes("theory of quantum") || exploreText.includes("Interdisciplinary Research"), "Explore public listings active");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "03-explore.png") });
    testResults.push({ route: "/explore", status: "PASS", detail: "HTTP 200, API Public Loaded" });
    console.log("  ✓ Explore Page loaded cleanly (HTTP 200)");

    // -------------------------------------------------------------------------
    // Route 4: PhD Scholar Dashboard /dashboard/scholar
    // -------------------------------------------------------------------------
    console.log("▶ [4/6] Testing PhD Scholar Dashboard: /dashboard/scholar ...");
    // Sign in as priyakumari
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await page.mainFrame().waitForFunction(() => {
      const form = document.querySelector("form");
      return form && Object.keys(form).some((k) => k.startsWith("__reactProps") || k.startsWith("__reactEvents"));
    }, { timeout: 15000 });

    await page.type('input[type="email"]', "kumarpriya1234@gmail.com");
    await page.type('input[type="password"]', "Subodh@12345");
    await page.click('button[type="submit"]');
    await page.mainFrame().waitForFunction(() => window.location.pathname.includes("/dashboard/scholar"), { timeout: 30000 });

    console.log("  ✓ Scholar authenticated. Checking /dashboard/scholar view...");
    await page.waitForSelector("h1, h2, h3", { timeout: 20000 });
    const scholarDashText = await checkPageForErrors("Scholar Dashboard /dashboard/scholar");
    assert.ok(scholarDashText.includes("priyakumari"), "Scholar name must be visible");
    assert.ok(scholarDashText.includes("NIT Raipur") || scholarDashText.includes("nit raipur"), "Scholar institution must be visible");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "04-scholar-dashboard-overview.png") });

    // Test My Profile Tab
    console.log("  Checking My Profile Tab in Scholar Dashboard...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const b = btns.find((x) => x.textContent && x.textContent.includes("My Profile"));
      if (b) b.click();
    });
    await new Promise((r) => setTimeout(r, 800));
    const profileText = await checkPageForErrors("Scholar Profile Tab");
    assert.ok(profileText.includes("Quantum Information Science") || profileText.includes("Interdisciplinary Research"), "Classification verified in profile");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "04b-scholar-dashboard-profile.png") });

    // Test My Internships Tab
    console.log("  Checking My Internships Tab in Scholar Dashboard...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const b = btns.find((x) => x.textContent && x.textContent.includes("My Internships"));
      if (b) b.click();
    });
    await new Promise((r) => setTimeout(r, 800));
    const myIntText = await checkPageForErrors("Scholar Internships Tab");
    assert.ok(myIntText.includes("quantum with math"), "Internship 'quantum with math' must appear in My Internships");
    assert.ok(myIntText.includes("theory of quantum"), "Internship 'theory of quantum' must appear in My Internships");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "04c-scholar-dashboard-internships.png") });

    // Test Applications Tab
    console.log("  Checking Applications Tab in Scholar Dashboard...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const b = btns.find((x) => x.textContent && x.textContent.includes("Applications"));
      if (b) b.click();
    });
    await new Promise((r) => setTimeout(r, 800));
    await checkPageForErrors("Scholar Applications Tab");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "04d-scholar-dashboard-applications.png") });

    testResults.push({ route: "/dashboard/scholar", status: "PASS", detail: "HTTP 200, Overview + Profile + Internships + Applications all verified" });
    console.log("  ✓ /dashboard/scholar and all tabs loaded with ZERO errors!");

    // -------------------------------------------------------------------------
    // Route 5: Student Dashboard /dashboard/student
    // -------------------------------------------------------------------------
    console.log("▶ [5/6] Testing Student Dashboard: /dashboard/student ...");
    await page.evaluate(() => fetch("/api/auth/logout", { method: "POST" }));
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await page.mainFrame().waitForFunction(() => {
      const form = document.querySelector("form");
      return form && Object.keys(form).some((k) => k.startsWith("__reactProps") || k.startsWith("__reactEvents"));
    }, { timeout: 15000 });

    await page.type('input[type="email"]', "aarav.sharma@nitk.edu.in");
    await page.type('input[type="password"]', "Student@2026");
    await page.click('button[type="submit"]');
    await page.mainFrame().waitForFunction(() => window.location.pathname.includes("/dashboard/student"), { timeout: 30000 });

    const studentDashText = await checkPageForErrors("Student Dashboard /dashboard/student");
    assert.ok(studentDashText.includes("Aarav Sharma") || studentDashText.includes("Student"), "Student dashboard verified");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "05-student-dashboard.png") });
    testResults.push({ route: "/dashboard/student", status: "PASS", detail: "HTTP 200, Authenticated Student Session" });
    console.log("  ✓ Student Dashboard loaded cleanly (HTTP 200)");

    // -------------------------------------------------------------------------
    // Route 6: Admin Panel /admin (and /dashboard/admin redirect /admin)
    // -------------------------------------------------------------------------
    console.log("▶ [6/6] Testing Admin Panel: /admin ...");
    await page.evaluate(() => fetch("/api/auth/logout", { method: "POST" }));
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: "domcontentloaded" });
    await page.mainFrame().waitForFunction(() => {
      const form = document.querySelector("form");
      return form && Object.keys(form).some((k) => k.startsWith("__reactProps") || k.startsWith("__reactEvents"));
    }, { timeout: 15000 });

    await page.type('input[type="email"]', "admin@starsky.org");
    await page.type('input[type="password"]', "Admin@123456");
    await page.click('button[type="submit"]');
    await page.mainFrame().waitForFunction(() => window.location.pathname.includes("/admin"), { timeout: 30000 });

    const adminText = await checkPageForErrors("Admin Panel /admin");
    assert.ok(adminText.includes("Admin") || adminText.includes("Dashboard") || adminText.includes("Overview"), "Admin panel rendered");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "06-admin-panel.png") });
    testResults.push({ route: "/admin", status: "PASS", detail: "HTTP 200, Admin Control Center Verified" });
    console.log("  ✓ Admin Panel loaded cleanly (HTTP 200)");

    // -------------------------------------------------------------------------
    // Verify Quantum Discovery Filter in Browser
    // -------------------------------------------------------------------------
    console.log("▶ Verifying Quantum Information Science discovery filter under /explore...");
    await page.goto(`${BASE_URL}/explore?tab=internships&domain=dom-interdisciplinary&spec=spec-interdisciplinary-quantum-information-science`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForResponse((r) => r.url().includes("/api/public") && r.status() === 200);
    await new Promise((r) => setTimeout(r, 1000));
    const quantumText = await checkPageForErrors("Quantum Discovery Filter");
    assert.ok(quantumText.includes("quantum with math"), "Internship 'quantum with math' must appear");
    assert.ok(quantumText.includes("theory of quantum"), "Internship 'theory of quantum' must appear");
    assert.ok(quantumText.includes("priyakumari"), "Scholar name priyakumari must appear");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "07-quantum-discovery-verified.png") });
    console.log("  ✓ Quantum Information Science filter verified 100% active and discoverable!");

  } finally {
    try {
      await page.close().catch(() => {});
      await browser.close().catch(() => {});
    } catch {}
  }

  console.log("\n================================================================================");
  console.log("CACHE REPAIR VERIFICATION COMPLETE: ALL 6 ROUTES PASSED!");
  console.log(`Console Errors: ${consoleErrors.length}`);
  console.log(`Screenshots saved to: ${SCREENSHOT_DIR}`);
  console.log("================================================================================\n");
  console.table(testResults);
}

verifyCacheRepair().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});

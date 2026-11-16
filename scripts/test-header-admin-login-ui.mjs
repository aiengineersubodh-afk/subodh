import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import assert from "assert";

const BASE_URL = "http://localhost:3000";
const SCREENSHOT_DIR = path.resolve("public/screenshots/header-admin-login");

const envFile = fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf-8") : "";
const adminEmail = process.env.STARSKY_ADMIN_EMAIL || envFile.match(/STARSKY_ADMIN_EMAIL=(.*)/)?.[1]?.trim() || "admin@starsky.edu";
const adminPassword = process.env.STARSKY_ADMIN_PASSWORD || envFile.match(/STARSKY_ADMIN_PASSWORD=(.*)/)?.[1]?.trim() || "Admin@2026";

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForPath(page, targetSnippet, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (page.url().includes(targetSnippet)) {
      return true;
    }
    await delay(250);
  }
  throw new Error(`Timed out waiting for URL to include "${targetSnippet}". Current URL: ${page.url()}`);
}

async function runTests() {
  console.log("================================================================================");
  console.log("STARSKY — HEADER CLEANUP, ADMIN LOGIN REDIRECTION & LOGIN UI VERIFICATION");
  console.log("================================================================================\n");

  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"],
  });

  const testReport = {
    testA_public_header_top_bar_clean: false,
    testA_main_nav_open_internships_intact: false,
    testA_mobile_header_responsive: false,
    testB_admin_login_via_normal_page: false,
    testB_admin_dashboard_features_accessible: false,
    testC_student_login_redirect_student_dashboard: false,
    testC_student_blocked_from_admin_portal: false,
    testD_scholar_login_redirect_scholar_dashboard: false,
    testD_scholar_blocked_from_admin_portal: false,
    testE_login_left_panel_removed: false,
    testE_login_evaluation_accounts_removed: false,
    testE_login_form_centered_and_responsive: false,
    testE_password_toggle_and_validation_work: false,
    testF_authenticated_login_visit_redirects_by_role: false,
  };

  try {
    // =========================================================================
    // TEST A: PUBLIC HEADER CLEANUP
    // =========================================================================
    console.log("▶ [Test A] Auditing Public Website Navigation Header...");
    const publicPage = await browser.newPage();
    const publicClient = await publicPage.target().createCDPSession();
    await publicClient.send("Network.clearBrowserCookies");
    await publicClient.send("Network.clearBrowserCache");
    await publicPage.setViewport({ width: 1440, height: 900 });

    await publicPage.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
    await publicPage.waitForSelector("header");
    await delay(800);

    // 1. Check Top Slim Bar
    const topBarText = await publicPage.evaluate(() => {
      const topBar = document.querySelector(".bg-\\[\\#F7F8FA\\].border-b");
      return topBar ? topBar.innerText : "";
    });
    console.log(`  - Slim top bar text: "${topBarText.replace(/\n+/g, " ")}"`);

    assert.ok(
      !topBarText.includes("Browse Open Internships"),
      "Slim top bar MUST NOT contain 'Browse Open Internships'"
    );
    assert.ok(
      !topBarText.includes("Admin Portal"),
      "Slim top bar MUST NOT contain 'Admin Portal'"
    );
    assert.ok(
      topBarText.includes("STARSKY"),
      "Slim top bar must retain STARSKY branding"
    );
    assert.ok(
      topBarText.includes("Connecting Research Minds. Creating Opportunities."),
      "Slim top bar must retain platform tagline"
    );
    testReport.testA_public_header_top_bar_clean = true;
    console.log("  ✓ Verified: Top slim bar is clean, with 'Browse Open Internships' and 'Admin Portal' removed!");

    // 2. Check Main Navigation
    const mainNavLinks = await publicPage.evaluate(() => {
      const nav = document.querySelector("nav.hidden.lg\\:flex");
      if (!nav) return [];
      return Array.from(nav.querySelectorAll("a")).map((a) => ({
        text: a.innerText.trim(),
        href: a.getAttribute("href"),
      }));
    });
    console.log("  - Main nav items found:", mainNavLinks.map((l) => l.text).join(", "));

    const openInternshipsNav = mainNavLinks.find((l) => l.text === "Open Internships");
    assert.ok(openInternshipsNav, "Main navigation MUST retain 'Open Internships'");
    assert.ok(
      openInternshipsNav.href.includes("/explore"),
      "Open Internships must link to /explore"
    );

    const expectedLabels = ["Home", "Open Internships", "About Us", "Researchers", "Contact Us", "Careers"];
    for (const label of expectedLabels) {
      assert.ok(
        mainNavLinks.some((l) => l.text === label),
        `Main navigation must contain '${label}'`
      );
    }
    testReport.testA_main_nav_open_internships_intact = true;
    console.log("  ✓ Verified: All main navigation links intact including Open Internships!");

    await publicPage.screenshot({
      path: path.join(SCREENSHOT_DIR, "01_public_header_desktop_cleaned.png"),
    });

    // 3. Check Mobile Viewport
    await publicPage.setViewport({ width: 390, height: 844 });
    await delay(500);

    const mobileTopBarText = await publicPage.evaluate(() => {
      const topBar = document.querySelector(".bg-\\[\\#F7F8FA\\].border-b");
      return topBar ? topBar.innerText : "";
    });
    assert.ok(!mobileTopBarText.includes("Admin Portal"), "Mobile top bar must not show Admin Portal");
    assert.ok(!mobileTopBarText.includes("Browse Open Internships"), "Mobile top bar must not show Browse Open Internships");

    // Open mobile hamburger menu
    await publicPage.click('button[aria-label="Toggle Menu"]');
    await delay(500);

    const mobileMenuText = await publicPage.evaluate(() => {
      const menu = document.querySelector(".lg\\:hidden.bg-\\[\\#222326\\]");
      return menu ? menu.innerText : "";
    });
    assert.ok(mobileMenuText.includes("Open Internships"), "Mobile menu must contain Open Internships");
    assert.ok(mobileMenuText.includes("Researchers"), "Mobile menu must contain Researchers");
    testReport.testA_mobile_header_responsive = true;
    console.log("  ✓ Verified: Mobile header and responsive menu are clean and intact!");

    await publicPage.screenshot({
      path: path.join(SCREENSHOT_DIR, "02_public_header_mobile_cleaned.png"),
    });
    await publicPage.close();

    // =========================================================================
    // TEST E: LOGIN PAGE UI SIMPLIFICATION (SINGLE-COLUMN CENTERED)
    // =========================================================================
    console.log("\n▶ [Test E] Auditing Simplified Single-Column Login Page UI...");
    const loginUiPage = await browser.newPage();
    const loginUiClient = await loginUiPage.target().createCDPSession();
    await loginUiClient.send("Network.clearBrowserCookies");
    await loginUiClient.send("Network.clearBrowserCache");
    await loginUiPage.setViewport({ width: 1440, height: 900 });

    await loginUiPage.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await loginUiPage.waitForSelector('[data-hydrated="true"]');
    await delay(800);

    const pageText = await loginUiPage.evaluate(() => document.body.innerText);

    // 1. Verify Left Panel Content is Completely Removed
    assert.ok(
      !pageText.includes("STARSKY Academic Gateway"),
      "Must not contain 'STARSKY Academic Gateway' badge"
    );
    assert.ok(
      !pageText.includes("Evaluation Test Accounts"),
      "Must not contain 'Evaluation Test Accounts'"
    );
    assert.ok(
      !pageText.includes("One-click fill"),
      "Must not contain 'One-click fill'"
    );
    assert.ok(
      !pageText.includes("Student: Aarav Sharma (NITK)"),
      "Must not contain demo student account card"
    );
    assert.ok(
      !pageText.includes("PhD Scholar: Dr. Ananya (IISc)"),
      "Must not contain demo scholar account card"
    );
    assert.ok(
      !pageText.includes("Sign in via Admin Portal →"),
      "Must not contain 'Sign in via Admin Portal →' link in left panel"
    );
    assert.ok(
      !pageText.includes("Paper Co-authorship & Lab Fellowship"),
      "Must not contain left panel marketing bullets"
    );
    testReport.testE_login_left_panel_removed = true;
    testReport.testE_login_evaluation_accounts_removed = true;
    console.log("  ✓ Verified: Left marketing panel and Evaluation Test Accounts completely removed!");

    // 2. Verify Single-Column Centered Layout
    const cardMetrics = await loginUiPage.evaluate(() => {
      const card = document.querySelector(".max-w-xl");
      if (!card) return null;
      const rect = card.getBoundingClientRect();
      const parentRect = card.parentElement.getBoundingClientRect();
      const leftOffset = rect.left - parentRect.left;
      const rightOffset = parentRect.right - rect.right;
      return {
        width: rect.width,
        height: rect.height,
        centered: Math.abs(leftOffset - rightOffset) < 10,
        className: card.className,
      };
    });

    console.log("  - Login card dimensions:", cardMetrics);
    assert.ok(cardMetrics, "Must find centered max-w-xl card");
    assert.ok(cardMetrics.centered, "Card must be horizontally centered on the page");
    assert.ok(cardMetrics.width <= 600, "Card width must be constrained and not full-screen");
    testReport.testE_login_form_centered_and_responsive = true;
    console.log("  ✓ Verified: Login form is cleanly centered in a professional responsive card!");

    // 3. Verify Form Elements & Interactivity
    assert.ok(pageText.includes("Welcome to STARSKY"), "Must preserve 'Welcome to STARSKY'");
    assert.ok(pageText.includes("Login to Your Account"), "Must preserve 'Login to Your Account' tab");
    assert.ok(pageText.includes("Create a New Account"), "Must preserve 'Create a New Account' tab");

    // Test Password Visibility Toggle
    const passInputTypeBefore = await loginUiPage.$eval('input[type="password"]', (el) => el.type);
    assert.strictEqual(passInputTypeBefore, "password");
    await loginUiPage.click('button[aria-label="Show password"]');
    await delay(200);
    const passInputTypeAfter = await loginUiPage.$eval('input[placeholder="••••••••"]', (el) => el.type);
    assert.strictEqual(passInputTypeAfter, "text", "Password input type must toggle to text");
    await loginUiPage.click('button[aria-label="Hide password"]');
    await delay(200);

    // Test Invalid Login Credentials Validation
    await loginUiPage.type('input[type="email"]', "invalid.test@starsky.edu");
    await loginUiPage.type('input[placeholder="••••••••"]', "WrongPassword123!");
    await loginUiPage.click('button[type="submit"]');
    await loginUiPage.waitForSelector(".bg-red-50, .bg-amber-50", { timeout: 12000 });
    await delay(300);

    const loginErrorText = await loginUiPage.evaluate(() => {
      const err = document.querySelector(".bg-red-50") || document.querySelector(".bg-amber-50");
      return err ? err.innerText : "";
    });
    console.log(`  - Login validation message: "${loginErrorText.trim()}"`);
    assert.ok(
      loginErrorText.includes("couldn't find") || loginErrorText.includes("Invalid") || loginErrorText.includes("Account Not Found"),
      "Must show descriptive error on invalid login"
    );
    testReport.testE_password_toggle_and_validation_work = true;
    console.log("  ✓ Verified: Password toggle, form validation, and error messages work as expected!");

    await loginUiPage.screenshot({
      path: path.join(SCREENSHOT_DIR, "03_login_page_clean_single_column.png"),
    });

    // Test Forgot Password modal
    await loginUiPage.evaluate(() => {
      const forgotBtn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.innerText && b.innerText.includes("Forgot password?")
      );
      if (forgotBtn) forgotBtn.click();
    });
    await delay(400);
    const forgotModalVisible = await loginUiPage.evaluate(() => {
      const modal = document.querySelector(".fixed.inset-0");
      return modal && modal.innerText.includes("Reset Account Password");
    });
    assert.ok(forgotModalVisible, "Forgot password modal must open");
    await loginUiPage.evaluate(() => {
      const modal = document.querySelector(".fixed.inset-0");
      const closeBtn = Array.from(modal.querySelectorAll("button")).find(
        (b) => b.innerText && b.innerText.includes("Close")
      );
      if (closeBtn) closeBtn.click();
    });
    await delay(300);

    // Switch to Register tab
    await loginUiPage.evaluate(() => {
      const regTab = Array.from(document.querySelectorAll("button")).find(
        (b) => b.innerText && b.innerText.includes("Create a New Account")
      );
      if (regTab) regTab.click();
    });
    await delay(400);
    const registerText = await loginUiPage.evaluate(() => document.body.innerText.toLowerCase());
    assert.ok(registerText.includes("select account role"), "Register view must display role selector");
    assert.ok(registerText.includes("student"), "Register view must display Student role option");
    assert.ok(registerText.includes("phd scholar"), "Register view must display PhD Scholar role option");
    console.log("  ✓ Verified: Seamless tab switching between Login and Registration in single card!");

    await loginUiPage.screenshot({
      path: path.join(SCREENSHOT_DIR, "04_register_page_clean_single_column.png"),
    });
    await loginUiPage.close();

    // =========================================================================
    // TEST B: ADMIN LOGIN THROUGH NORMAL LOGIN PAGE
    // =========================================================================
    console.log("\n▶ [Test B] Testing Admin Login through Normal /login Page...");
    const adminPage = await browser.newPage();
    const adminClient = await adminPage.target().createCDPSession();
    await adminClient.send("Network.clearBrowserCookies");
    await adminClient.send("Network.clearBrowserCache");
    await adminPage.setViewport({ width: 1440, height: 900 });

    await adminPage.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await adminPage.waitForSelector('[data-hydrated="true"]');
    await delay(500);

    // Enter existing Admin credentials
    await adminPage.type('input[type="email"]', adminEmail);
    await adminPage.type('input[type="password"]', adminPassword);
    await adminPage.click('button[type="submit"]');

    // Wait for redirect to Admin Dashboard
    await waitForPath(adminPage, "/admin");
    console.log(`  - Admin logged in via /login and reached: ${adminPage.url()}`);
    assert.ok(adminPage.url().includes("/admin"), "Must redirect directly to /admin dashboard");
    testReport.testB_admin_login_via_normal_page = true;

    // Verify Admin Portal features load
    await adminPage.waitForSelector("h1", { timeout: 15000 });
    const adminHeading = await adminPage.$eval("h1", (el) => el.innerText);
    console.log(`  - Admin Dashboard heading: "${adminHeading}"`);
    assert.ok(
      adminHeading.includes("Admin") || adminHeading.includes("Dashboard") || adminHeading.includes("STARSKY"),
      "Admin heading must be present"
    );

    const adminBodyText = await adminPage.evaluate(() => document.body.innerText);
    assert.ok(
      adminBodyText.includes("Overview") || adminBodyText.includes("Total Users") || adminBodyText.includes("PhD Scholars"),
      "Admin dashboard metrics and overview must be rendered"
    );
    testReport.testB_admin_dashboard_features_accessible = true;
    console.log("  ✓ Verified: Admin authenticated through normal /login and dashboard fully functional!");

    await adminPage.screenshot({
      path: path.join(SCREENSHOT_DIR, "05_admin_dashboard_after_login.png"),
    });

    // Check opening /login while authenticated as Admin
    await adminPage.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await delay(1000);
    console.log(`  - Authenticated Admin visiting /login redirected to: ${adminPage.url()}`);
    assert.ok(adminPage.url().includes("/admin"), "Authenticated Admin visiting /login must be kept on /admin");
    testReport.testF_authenticated_login_visit_redirects_by_role = true;

    await adminPage.close();

    // =========================================================================
    // TEST C: STUDENT LOGIN THROUGH NORMAL LOGIN PAGE & ADMIN PROTECTION
    // =========================================================================
    console.log("\n▶ [Test C] Testing Student Login through Normal /login Page & Access Control...");
    const studentPage = await browser.newPage();
    const studentClient = await studentPage.target().createCDPSession();
    await studentClient.send("Network.clearBrowserCookies");
    await studentClient.send("Network.clearBrowserCache");
    await studentPage.setViewport({ width: 1440, height: 900 });

    await studentPage.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await studentPage.waitForSelector('[data-hydrated="true"]');
    await delay(500);

    // Enter existing Student credentials (Aarav Sharma)
    await studentPage.type('input[type="email"]', "aarav.sharma@nitk.edu.in");
    await studentPage.type('input[type="password"]', "Student@2026");
    await studentPage.click('button[type="submit"]');

    await waitForPath(studentPage, "/dashboard/student");
    console.log(`  - Student logged in via /login and reached: ${studentPage.url()}`);
    assert.ok(studentPage.url().includes("/dashboard/student"), "Student must land on /dashboard/student");
    testReport.testC_student_login_redirect_student_dashboard = true;

    // Verify Student CANNOT access /admin
    await studentPage.goto(`${BASE_URL}/admin`, { waitUntil: "domcontentloaded" });
    await delay(1200);
    console.log(`  - Student navigating to /admin was redirected to: ${studentPage.url()}`);
    assert.ok(
      !studentPage.url().includes("/admin"),
      "Student MUST NOT be allowed to access /admin"
    );
    assert.ok(
      studentPage.url().includes("/dashboard/student") || studentPage.url().includes("/login"),
      "Student must be kept on their student dashboard"
    );
    testReport.testC_student_blocked_from_admin_portal = true;
    console.log("  ✓ Verified: Student redirected to Student Dashboard and blocked from /admin!");

    await studentPage.screenshot({
      path: path.join(SCREENSHOT_DIR, "06_student_dashboard_after_login.png"),
    });
    await studentPage.close();

    // =========================================================================
    // TEST D: PHD SCHOLAR LOGIN THROUGH NORMAL LOGIN PAGE & ADMIN PROTECTION
    // =========================================================================
    console.log("\n▶ [Test D] Testing PhD Scholar Login through Normal /login Page & Access Control...");
    const scholarPage = await browser.newPage();
    const scholarClient = await scholarPage.target().createCDPSession();
    await scholarClient.send("Network.clearBrowserCookies");
    await scholarClient.send("Network.clearBrowserCache");
    await scholarPage.setViewport({ width: 1440, height: 900 });

    await scholarPage.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await scholarPage.waitForSelector('[data-hydrated="true"]');
    await delay(500);

    // Enter existing PhD Scholar credentials (Dr. Ananya Raghavan)
    await scholarPage.type('input[type="email"]', "ananya.raghavan@iisc.ac.in");
    await scholarPage.type('input[type="password"]', "Scholar@2026");
    await scholarPage.click('button[type="submit"]');

    await waitForPath(scholarPage, "/dashboard/scholar");
    console.log(`  - PhD Scholar logged in via /login and reached: ${scholarPage.url()}`);
    assert.ok(scholarPage.url().includes("/dashboard/scholar"), "Scholar must land on /dashboard/scholar");
    testReport.testD_scholar_login_redirect_scholar_dashboard = true;

    // Verify Scholar CANNOT access /admin
    await scholarPage.goto(`${BASE_URL}/admin`, { waitUntil: "domcontentloaded" });
    await delay(1200);
    console.log(`  - Scholar navigating to /admin was redirected to: ${scholarPage.url()}`);
    assert.ok(
      !scholarPage.url().includes("/admin"),
      "PhD Scholar MUST NOT be allowed to access /admin"
    );
    assert.ok(
      scholarPage.url().includes("/dashboard/scholar") || scholarPage.url().includes("/login"),
      "PhD Scholar must be kept on their scholar dashboard"
    );
    testReport.testD_scholar_blocked_from_admin_portal = true;
    console.log("  ✓ Verified: PhD Scholar redirected to Scholar Dashboard and blocked from /admin!");

    await scholarPage.screenshot({
      path: path.join(SCREENSHOT_DIR, "07_scholar_dashboard_after_login.png"),
    });
    await scholarPage.close();

    console.log("\n================================================================================");
    console.log("ALL VERIFICATION SCENARIOS PASSED WITH 100% SUCCESS!");
    console.log("================================================================================");
    console.table(testReport);

  } finally {
    await browser.close();
  }
}

runTests().catch((err) => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});

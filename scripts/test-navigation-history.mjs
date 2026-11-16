import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import assert from "assert";

const BASE_URL = "http://localhost:3000";
const SCREENSHOT_DIR = path.resolve("public/screenshots/navigation-history");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForPath(page, targetSnippet, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (page.url().includes(targetSnippet)) {
      return true;
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Timed out waiting for URL to include "${targetSnippet}". Current URL: ${page.url()}`);
}

async function main() {
  console.log("================================================================================");
  console.log("STARSKY — BROWSER BACK & FORWARD NAVIGATION (STEP-BY-STEP) VERIFICATION");
  console.log("================================================================================\n");

  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"],
  });

  const results = {};

  try {
    // Authenticate evaluator student session
    console.log("Authenticating test session...");
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "aarav.sharma@nitk.edu.in", password: "Student@2026" }),
    });
    const setCookieHeaders = loginRes.headers.getSetCookie();
    const tokenCookie = setCookieHeaders.map((c) => c.split(";")[0]).join("; ");
    const tokenVal = tokenCookie.match(/starsky_session_token=([^;]+)/)[1];

    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    await page.setCookie({
      name: "starsky_session_token",
      value: tokenVal,
      domain: "localhost",
      path: "/",
    });
    console.log("✓ Session authenticated.\n");

    // =========================================================================
    // TEST A: Explore Navigation (Step-by-Step Back)
    // =========================================================================
    console.log("▶ [Test A] Executing Step-by-Step Explore Journey & Back Verification...");

    // 1. Open Home
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
    assert.strictEqual(new URL(page.url()).pathname, "/", "Step 1: Must be on Home page");
    console.log("  1. Home page loaded: " + page.url());

    // 2. Open Explore Academic Domains
    const exploreLink = await page.waitForSelector('a[href="/explore?tab=domains"], a[href="/explore"]');
    await exploreLink.click();
    await waitForPath(page, "/explore");
    await page.waitForSelector("#academic-domains-section", { timeout: 15000 });
    console.log("  2. Explore Academic Domains loaded: " + page.url());

    // 3. Select Engineering
    await page.waitForSelector('[data-domain-id="dom-engineering"]', { timeout: 15000 });
    await page.click('[data-domain-id="dom-engineering"]');
    await waitForPath(page, "domain=dom-engineering");
    await page.waitForFunction(() => document.body.innerText.includes("Engineering — Specializations"), { timeout: 15000 });
    console.log("  3. Engineering Domain selected: " + page.url());

    // 4. Select Computer Science Engineering
    await page.waitForSelector('[data-spec-id="spec-engineering-computer-science-engineering"]', { timeout: 15000 });
    await page.click('[data-spec-id="spec-engineering-computer-science-engineering"]');
    await waitForPath(page, "spec=spec-engineering-computer-science-engineering");
    await page.waitForFunction(() => document.body.innerText.includes("Computer Science Engineering"), { timeout: 15000 });
    console.log("  4. Computer Science Engineering selected: " + page.url());

    // 5. Open a PhD Scholar profile
    const scholarLink = await page.waitForSelector('a[href^="/scholars/"]:not([href*="apply"])', { timeout: 15000 });
    await scholarLink.click();
    await waitForPath(page, "/scholars/");
    await page.waitForFunction(() => document.body.innerText.includes("Verified PhD Scholar"), { timeout: 15000 });
    console.log("  5. PhD Scholar Profile opened: " + page.url());

    // 6. Open an internship detail page
    const internshipLink = await page.waitForSelector('a[href^="/internships/"]', { timeout: 15000 });
    await internshipLink.click();
    await waitForPath(page, "/internships/");
    await page.waitForFunction(() => document.body.innerText.includes("Positions Open") || document.body.innerText.includes("Stipend"), { timeout: 15000 });
    console.log("  6. Internship Details opened: " + page.url());
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "test-a-step6-internship.png") });

    // 7. Click browser Back repeatedly & confirm single-step history
    console.log("  Testing Step-by-Step Back Navigation:");

    // Back Step 1: From Internship Details -> Scholar Profile
    await page.goBack();
    await waitForPath(page, "/scholars/");
    assert.ok(page.url().includes("/scholars/"), "Back 1 must return to Scholar Profile. Got: " + page.url());
    console.log("  ✓ Back 1 -> Restored Scholar Profile: " + page.url());

    // Back Step 2: From Scholar Profile -> Computer Science Engineering
    await page.goBack();
    await waitForPath(page, "spec=spec-engineering-computer-science-engineering");
    assert.ok(page.url().includes("spec=spec-engineering-computer-science-engineering"), "Back 2 must return to Computer Science Engineering. Got: " + page.url());
    await page.waitForFunction(() => document.body.innerText.includes("Computer Science Engineering"), { timeout: 15000 });
    console.log("  ✓ Back 2 -> Restored Computer Science Engineering: " + page.url());

    // Back Step 3: From Computer Science Engineering -> Engineering
    await page.goBack();
    await waitForPath(page, "domain=dom-engineering");
    assert.ok(page.url().includes("domain=dom-engineering") && !page.url().includes("spec="), "Back 3 must return to Engineering domain. Got: " + page.url());
    await page.waitForFunction(() => document.body.innerText.includes("Engineering — Specializations"), { timeout: 15000 });
    console.log("  ✓ Back 3 -> Restored Engineering Specializations: " + page.url());

    // Back Step 4: From Engineering -> Explore Academic Domains
    await page.goBack();
    await waitForPath(page, "/explore");
    assert.ok(!page.url().includes("domain="), "Back 4 must return to All Academic Domains. Got: " + page.url());
    await page.waitForFunction(() => document.body.innerText.includes("Select an Academic Domain"), { timeout: 15000 });
    console.log("  ✓ Back 4 -> Restored All 9 Academic Domains: " + page.url());

    // Back Step 5: From Explore Academic Domains -> Home
    await page.goBack();
    await waitForPath(page, BASE_URL);
    assert.strictEqual(new URL(page.url()).pathname, "/", "Back 5 must return to Home. Got: " + page.url());
    console.log("  ✓ Back 5 -> Restored Home page: " + page.url());

    results.testA = "PASS";

    // =========================================================================
    // TEST B: Forward Navigation
    // =========================================================================
    console.log("\n▶ [Test B] Executing Step-by-Step Forward Verification...");

    // Forward Step 1: Home -> Explore Academic Domains
    await page.goForward();
    await waitForPath(page, "/explore");
    assert.ok(!page.url().includes("domain="), "Forward 1 must restore Explore Academic Domains");
    await page.waitForFunction(() => document.body.innerText.includes("Select an Academic Domain"), { timeout: 15000 });
    console.log("  ✓ Forward 1 -> Restored All Academic Domains: " + page.url());

    // Forward Step 2: Explore Academic Domains -> Engineering
    await page.goForward();
    await waitForPath(page, "domain=dom-engineering");
    assert.ok(page.url().includes("domain=dom-engineering"), "Forward 2 must restore Engineering domain");
    await page.waitForFunction(() => document.body.innerText.includes("Engineering — Specializations"), { timeout: 15000 });
    console.log("  ✓ Forward 2 -> Restored Engineering domain: " + page.url());

    // Forward Step 3: Engineering -> Computer Science Engineering
    await page.goForward();
    await waitForPath(page, "spec=spec-engineering-computer-science-engineering");
    assert.ok(page.url().includes("spec=spec-engineering-computer-science-engineering"), "Forward 3 must restore Computer Science Engineering");
    await page.waitForFunction(() => document.body.innerText.includes("Computer Science Engineering"), { timeout: 15000 });
    console.log("  ✓ Forward 3 -> Restored Computer Science Engineering: " + page.url());

    // Forward Step 4: Computer Science Engineering -> Scholar Profile
    await page.goForward();
    await waitForPath(page, "/scholars/");
    assert.ok(page.url().includes("/scholars/"), "Forward 4 must restore Scholar Profile");
    await page.waitForFunction(() => document.body.innerText.includes("Verified PhD Scholar"), { timeout: 15000 });
    console.log("  ✓ Forward 4 -> Restored Scholar Profile: " + page.url());

    // Forward Step 5: Scholar Profile -> Internship Details
    await page.goForward();
    await waitForPath(page, "/internships/");
    assert.ok(page.url().includes("/internships/"), "Forward 5 must restore Internship Details");
    await page.waitForFunction(() => document.body.innerText.includes("Positions Open") || document.body.innerText.includes("Stipend"), { timeout: 15000 });
    console.log("  ✓ Forward 5 -> Restored Internship Details: " + page.url());

    // Test specific requirement: "click Back three times. Click Forward once. Confirm only one next step is restored."
    await page.goBack(); // -> Scholar
    await delay(600);
    await page.goBack(); // -> CSE
    await delay(600);
    await page.goBack(); // -> Engineering
    await delay(600);
    assert.ok(page.url().includes("domain=dom-engineering") && !page.url().includes("spec="), "Must be at Engineering after 3 backs. URL: " + page.url());
    console.log("  Clicked Back 3 times -> At Engineering: " + page.url());

    await page.goForward(); // -> CSE
    await waitForPath(page, "spec=spec-engineering-computer-science-engineering");
    assert.ok(page.url().includes("spec=spec-engineering-computer-science-engineering"), "Forward 1 must restore exactly CSE. Got: " + page.url());
    console.log("  ✓ Clicked Forward 1 time -> Exactly restored Computer Science Engineering: " + page.url());

    results.testB = "PASS";

    // =========================================================================
    // TEST C: Page Refresh
    // =========================================================================
    console.log("\n▶ [Test C] Verifying Page Refresh & State Retention...");

    // Already at CSE specialization
    const cseUrlBefore = page.url();
    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForPath(page, "spec=spec-engineering-computer-science-engineering");
    assert.strictEqual(page.url(), cseUrlBefore, "URL must be identical after refresh");
    await page.waitForFunction(() => document.body.innerText.includes("Computer Science Engineering"), { timeout: 15000 });
    console.log("  ✓ Page refreshed: URL and specialization selection fully preserved.");

    // Verify Back and Forward continue working after refresh
    await page.goBack();
    await waitForPath(page, "domain=dom-engineering");
    assert.ok(page.url().includes("domain=dom-engineering") && !page.url().includes("spec="), "Back after refresh must work");
    console.log("  ✓ Back after refresh successfully navigated to Engineering.");

    await page.goForward();
    await waitForPath(page, "spec=spec-engineering-computer-science-engineering");
    assert.ok(page.url().includes("spec=spec-engineering-computer-science-engineering"), "Forward after refresh must work");
    console.log("  ✓ Forward after refresh successfully returned to CSE.");

    results.testC = "PASS";

    // =========================================================================
    // TEST D: Direct URL Access & Back
    // =========================================================================
    console.log("\n▶ [Test D] Verifying Direct URL Access...");
    const directCtx = await browser.createBrowserContext();
    const directPage = await directCtx.newPage();
    await directPage.setViewport({ width: 1440, height: 900 });

    await directPage.setCookie({
      name: "starsky_session_token",
      value: tokenVal,
      domain: "localhost",
      path: "/",
    });

    // 1. Open specialization URL directly
    const directUrl = `${BASE_URL}/explore?tab=internships&domain=dom-engineering&spec=spec-engineering-computer-science-engineering`;
    await directPage.goto(directUrl, { waitUntil: "domcontentloaded" });
    await waitForPath(directPage, "spec=spec-engineering-computer-science-engineering");
    await directPage.waitForFunction(() => document.body.innerText.includes("Computer Science Engineering"), { timeout: 15000 });
    console.log("  1. Direct URL opened successfully: " + directPage.url());

    // 2. Navigate to a scholar profile
    await directPage.waitForSelector('a[href^="/scholars/"]:not([href*="apply"])', { timeout: 15000 });
    const directSchUrl = await directPage.evaluate(() => {
      const a = document.querySelector('a[href^="/scholars/"]:not([href*="apply"])');
      return a ? a.getAttribute("href") : null;
    });
    await directPage.goto(`${BASE_URL}${directSchUrl}`, { waitUntil: "domcontentloaded" });
    await waitForPath(directPage, "/scholars/");
    console.log("  2. Navigated to Scholar Profile: " + directPage.url());

    // 3. Press Back
    await directPage.goBack();
    await waitForPath(directPage, "spec=spec-engineering-computer-science-engineering");
    assert.ok(directPage.url().includes("spec=spec-engineering-computer-science-engineering"), "Back must return to specialization directly");
    await directPage.waitForFunction(() => document.body.innerText.includes("Computer Science Engineering"), { timeout: 15000 });
    console.log("  ✓ Back from Scholar Profile restored specialization directly without needing Home first.");

    await directCtx.close();
    results.testD = "PASS";

    // =========================================================================
    // TEST E: Other Website Sections
    // =========================================================================
    console.log("\n▶ [Test E] Verifying Other Website Sections...");
    const ctxE = await browser.createBrowserContext();
    const pageE = await ctxE.newPage();
    await pageE.setViewport({ width: 1440, height: 900 });

    await pageE.setCookie({
      name: "starsky_session_token",
      value: tokenVal,
      domain: "localhost",
      path: "/",
    });

    // Journey 1: Home -> About Us -> Back -> Forward
    console.log("  Subtest 1: Home → About Us → Back & Forward");
    await pageE.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
    await pageE.waitForSelector('a[href="/about"]');
    await pageE.click('a[href="/about"]');
    await waitForPath(pageE, "/about");
    console.log("    Navigated to About Us: " + pageE.url());

    await pageE.goBack();
    await waitForPath(pageE, BASE_URL);
    assert.strictEqual(new URL(pageE.url()).pathname, "/", "Must return to Home on Back");
    console.log("    ✓ Back returned to Home");

    await pageE.goForward();
    await waitForPath(pageE, "/about");
    assert.strictEqual(new URL(pageE.url()).pathname, "/about", "Must restore About Us on Forward");
    console.log("    ✓ Forward restored About Us");

    // Journey 2: Home -> Researchers -> Scholar Profile -> Back & Forward
    console.log("  Subtest 2: Home → Researchers → Scholar Profile → Back & Forward");
    await pageE.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
    await pageE.waitForSelector('a[href="/explore?tab=scholars"]');
    await pageE.click('a[href="/explore?tab=scholars"]');
    await waitForPath(pageE, "tab=scholars");
    console.log("    Navigated to Researchers: " + pageE.url());

    await pageE.waitForSelector('a[href^="/scholars/"]:not([href*="apply"])');
    const schLink = await pageE.evaluate(() => document.querySelector('a[href^="/scholars/"]:not([href*="apply"])').getAttribute("href"));
    await pageE.goto(`${BASE_URL}${schLink}`, { waitUntil: "domcontentloaded" });
    await waitForPath(pageE, "/scholars/");
    console.log("    Navigated to Scholar Profile: " + pageE.url());

    await pageE.goBack();
    await waitForPath(pageE, "tab=scholars");
    assert.ok(pageE.url().includes("tab=scholars"), "Back must return to Researchers tab");
    console.log("    ✓ Back returned to Researchers");

    await pageE.goForward();
    await waitForPath(pageE, "/scholars/");
    assert.ok(pageE.url().includes("/scholars/"), "Forward must restore Scholar Profile");
    console.log("    ✓ Forward restored Scholar Profile");

    // Journey 3: Home -> Open Internships -> Internship Details -> Back & Forward
    console.log("  Subtest 3: Home → Open Internships → Internship Details → Back & Forward");
    await pageE.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
    await pageE.waitForSelector('a[href="/explore?tab=internships"]');
    await pageE.click('a[href="/explore?tab=internships"]');
    await waitForPath(pageE, "tab=internships");
    console.log("    Navigated to Open Internships: " + pageE.url());

    await pageE.waitForSelector('a[href^="/internships/"]');
    const intLink = await pageE.evaluate(() => document.querySelector('a[href^="/internships/"]').getAttribute("href"));
    await pageE.goto(`${BASE_URL}${intLink}`, { waitUntil: "domcontentloaded" });
    await waitForPath(pageE, "/internships/");
    console.log("    Navigated to Internship Details: " + pageE.url());

    await pageE.goBack();
    await waitForPath(pageE, "tab=internships");
    assert.ok(pageE.url().includes("tab=internships"), "Back must return to Open Internships");
    console.log("    ✓ Back returned to Open Internships");

    await pageE.goForward();
    await waitForPath(pageE, "/internships/");
    assert.ok(pageE.url().includes("/internships/"), "Forward must restore Internship Details");
    console.log("    ✓ Forward restored Internship Details");

    // Journey 4: Dashboard -> Internal sections -> Back & Forward
    console.log("  Subtest 4: Student Dashboard → Internal Tabs → Back & Forward");
    await pageE.goto(`${BASE_URL}/dashboard/student`, { waitUntil: "domcontentloaded" });
    assert.strictEqual(new URL(pageE.url()).pathname, "/dashboard/student");
    console.log("    Navigated to Student Dashboard: " + pageE.url());

    // Click My Applications
    await pageE.waitForSelector('button[data-tab="applications"]', { timeout: 15000 });
    await pageE.click('button[data-tab="applications"]');
    await waitForPath(pageE, "tab=applications");
    console.log("    Switched to My Applications tab: " + pageE.url());

    // Click Back
    await pageE.goBack();
    await waitForPath(pageE, "/dashboard/student");
    assert.ok(!pageE.url().includes("tab=applications"), "Back must return to dashboard overview");
    console.log("    ✓ Back returned to Dashboard Overview: " + pageE.url());

    // Click Forward
    await pageE.goForward();
    await waitForPath(pageE, "tab=applications");
    assert.ok(pageE.url().includes("tab=applications"), "Forward must restore My Applications tab");
    console.log("    ✓ Forward restored My Applications tab: " + pageE.url());

    // PhD Scholar Dashboard test
    console.log("  Subtest 5: PhD Scholar Dashboard → Internal Tabs → Back & Forward");
    const schLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "ananya.raghavan@iisc.ac.in", password: "Scholar@2026" }),
    });
    const schSetCookie = schLoginRes.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
    const schTokenVal = schSetCookie.match(/starsky_session_token=([^;]+)/)[1];

    await pageE.setCookie({
      name: "starsky_session_token",
      value: schTokenVal,
      domain: "localhost",
      path: "/",
    });

    await pageE.goto(`${BASE_URL}/dashboard/scholar`, { waitUntil: "domcontentloaded" });
    console.log("    Navigated to Scholar Dashboard: " + pageE.url());

    // Click My Internships
    await pageE.waitForSelector('button[data-tab="internships"]', { timeout: 15000 });
    await pageE.click('button[data-tab="internships"]');
    await waitForPath(pageE, "tab=internships");
    console.log("    Switched to My Internships tab: " + pageE.url());

    await pageE.goBack();
    await waitForPath(pageE, "/dashboard/scholar");
    assert.ok(!pageE.url().includes("tab=internships"), "Back must return to scholar dashboard overview");
    console.log("    ✓ Back returned to Scholar Dashboard Overview: " + pageE.url());

    await pageE.goForward();
    await waitForPath(pageE, "tab=internships");
    assert.ok(pageE.url().includes("tab=internships"), "Forward must restore My Internships tab");
    console.log("    ✓ Forward restored My Internships tab: " + pageE.url());

    await ctxE.close();
    results.testE = "PASS";

  } finally {
    try {
      await browser.close().catch(() => {});
    } catch {}
  }

  console.log("\n================================================================================");
  console.log("FINAL NAVIGATION HISTORY TEST RESULTS:");
  console.log(`  Test A (Explore Step-by-Step Back Navigation): ${results.testA || "FAIL"}`);
  console.log(`  Test B (Step-by-Step Forward Navigation):      ${results.testB || "FAIL"}`);
  console.log(`  Test C (Page Refresh & State Retention):       ${results.testC || "FAIL"}`);
  console.log(`  Test D (Direct URL Access & Back):             ${results.testD || "FAIL"}`);
  console.log(`  Test E (Other Website Sections & Dashboards):  ${results.testE || "FAIL"}`);
  console.log("================================================================================\n");

  const allPassed = Object.values(results).every((v) => v === "PASS") && Object.keys(results).length === 5;
  if (!allPassed) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Navigation history verification failed:", err);
  process.exit(1);
});

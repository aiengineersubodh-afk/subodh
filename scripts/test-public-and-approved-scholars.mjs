import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import assert from "assert";

const BASE_URL = "http://localhost:3000";
const SCREENSHOT_DIR = path.resolve("public/screenshots/public-and-approved");

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
    await delay(300);
  }
  throw new Error(`Timed out waiting for URL to include "${targetSnippet}". Current URL: ${page.url()}`);
}

async function runTests() {
  console.log("================================================================================");
  console.log("STARSKY — PUBLIC WEBSITE ACCESS + APPROVED SCHOLARS SUITE");
  console.log("================================================================================\n");

  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"],
  });

  const testReport = {
    task1_approved_directory: false,
    task1_data_sanitization: false,
    task1_lifecycle_pending_hidden: false,
    task1_lifecycle_approved_visible: false,
    task2_public_home: false,
    task2_public_domains: false,
    task2_public_about: false,
    task2_public_scholars: false,
    task2_public_contact: false,
    task2_public_careers: false,
    task2_public_internship_detail: false,
    task2_protected_apply_redirect: false,
    task2_protected_apply_resume: false,
    task2_protected_scholar_profile_redirect: false,
    task2_protected_scholar_profile_view: false,
    task2_contact_draft_preservation: false,
    task2_dashboard_admin_guards: false,
  };

  try {
    // =========================================================================
    // TASK 1: API & APPROVED SCHOLARS DIRECTORY AUDIT
    // =========================================================================
    console.log("▶ [Task 1] Testing /api/public scholars directory and data sanitization...");
    const publicRes = await fetch(`${BASE_URL}/api/public`);
    assert.strictEqual(publicRes.status, 200, "GET /api/public must return 200");
    const publicData = await publicRes.json();

    const totalScholars = publicData.totalApprovedScholarsCount;
    const scholarsList = publicData.scholars;
    console.log(`  ✓ Public directory returned ${scholarsList.length} scholars (Total: ${totalScholars})`);
    assert.ok(scholarsList.length >= 10, "Must return all approved scholars, not just first 5");
    assert.strictEqual(scholarsList.length, totalScholars, "Visible scholars count must match total approved scholars count");
    assert.strictEqual(publicData.lockedScholarsCount, 0, "lockedScholarsCount must be 0");
    assert.strictEqual(publicData.lockedScholarPreviews.length, 0, "lockedScholarPreviews must be empty");
    testReport.task1_approved_directory = true;

    // Verify profile data sanitization
    let allSanitized = true;
    for (const item of scholarsList) {
      if (item.profile.password_hash !== undefined || item.profile.email !== "" || item.profile.phone !== "") {
        allSanitized = false;
        console.error(`  ✗ Scholar profile ${item.scholar.id} not properly sanitized:`, item.profile);
      }
    }
    assert.ok(allSanitized, "All scholar profile private fields (password_hash, email, phone) must be stripped");
    console.log("  ✓ All approved PhD scholar public profiles are completely sanitized");
    testReport.task1_data_sanitization = true;

    // =========================================================================
    // TASK 1: SCHOLAR REGISTRATION -> PENDING (HIDDEN) -> ADMIN APPROVE -> VISIBLE
    // =========================================================================
    console.log("\n▶ [Task 1] Testing New Scholar Lifecycle: Register -> Pending (Hidden) -> Approve -> Visible...");
    const timestamp = Date.now();
    const testScholarEmail = `test.scholar.${timestamp}@starsky.edu`;
    const testScholarName = `Dr. Lifecycle Scholar ${timestamp}`;

    // 1. Register new scholar
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: testScholarName,
        email: testScholarEmail,
        password: "Password@123",
        role: "scholar",
        phone: "+91 9876543210",
        country: "India",
        state: "Karnataka",
        city: "Bengaluru",
      }),
    });
    const regData = await regRes.json();
    assert.strictEqual(regRes.status, 200, "Registration must succeed");
    const testUserId = regData.user.id;
    const scholarCookie = regRes.headers.getSetCookie
      ? regRes.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ")
      : (regRes.headers.get("set-cookie") || "");

    // 2. Submit onboarding to create scholar profile (pending approval)
    const onbRes = await fetch(`${BASE_URL}/api/onboarding/scholar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: scholarCookie,
      },
      body: JSON.stringify({
        is_draft: true,
        university_institution: "Indian Institute of Science (IISc)",
        department: "Department of Computational Data Sciences",
        domain_id: "dom-engineering",
        specialization_id: "spec-engineering-data-science",
        current_research_topic: "Automated Scalable Deep Inference",
        biography: "Test scholar for end-to-end lifecycle verification.",
        enrollment_year: 2022,
        expected_completion_year: 2026,
      }),
    });
    assert.strictEqual(onbRes.status, 200, "Scholar onboarding profile submission must succeed");

    // 3. Verify that the pending scholar is NOT present in public directory
    const checkPendingRes = await fetch(`${BASE_URL}/api/public`);
    const checkPendingData = await checkPendingRes.json();
    const isPendingFound = checkPendingData.scholars.some(
      (s) => s.profile.full_name === testScholarName || s.profile.id === testUserId
    );
    assert.strictEqual(isPendingFound, false, "Pending PhD scholar MUST NOT appear in the public Researchers directory");
    console.log("  ✓ Verified: Pending PhD scholar is NOT visible in public Researchers directory");
    testReport.task1_lifecycle_pending_hidden = true;

    // 4. Admin logs in
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@starsky.edu",
        password: "Admin@2026",
        adminPortal: true,
      }),
    });
    assert.strictEqual(adminLoginRes.status, 200, "Admin login must succeed");
    const adminCookie = adminLoginRes.headers.getSetCookie
      ? adminLoginRes.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ")
      : (adminLoginRes.headers.get("set-cookie") || "");

    // 5. Admin retrieves all scholars to find test scholar ID
    const adminScholarsRes = await fetch(`${BASE_URL}/api/admin`, {
      headers: { Cookie: adminCookie },
    });
    const adminScholarsData = await adminScholarsRes.json();
    const createdScholarObj = adminScholarsData.scholars.find(
      (s) => s.profile?.id === testUserId
    );
    assert.ok(createdScholarObj, "Admin API must locate the new scholar record");
    const testScholarId = createdScholarObj.scholar.id;
    assert.strictEqual(createdScholarObj.scholar.verification_status, "pending", "Initial status must be pending");

    // 6. Admin approves scholar
    const approveRes = await fetch(`${BASE_URL}/api/admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        action: "verify_scholar",
        payload: {
          scholarId: testScholarId,
          verification_status: "approved",
          verification_notes: "Automated verification test approval.",
        },
      }),
    });
    assert.strictEqual(approveRes.status, 200, "Admin scholar approval must succeed");

    // 7. Verify scholar IMMEDIATELY appears in public directory
    const checkApprovedRes = await fetch(`${BASE_URL}/api/public`);
    const checkApprovedData = await checkApprovedRes.json();
    const approvedScholarItem = checkApprovedData.scholars.find(
      (s) => s.scholar.id === testScholarId
    );
    assert.ok(approvedScholarItem, "Newly approved PhD scholar MUST automatically appear in the public Researchers directory");
    assert.strictEqual(approvedScholarItem.profile.password_hash, undefined, "Password hash must be stripped");
    assert.strictEqual(approvedScholarItem.profile.email, "", "Email must be blanked in public directory");
    assert.strictEqual(approvedScholarItem.profile.phone, "", "Phone must be blanked in public directory");
    console.log(`  ✓ Verified: Newly approved PhD scholar (${testScholarName}) automatically appeared in public directory!`);
    testReport.task1_lifecycle_approved_visible = true;

    // Clean up test scholar
    await fetch(`${BASE_URL}/api/admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        action: "update_user_status",
        payload: {
          profileId: testUserId,
          deleteAccount: true,
        },
      }),
    });
    console.log("  ✓ Cleaned up test scholar record cleanly.");

    // =========================================================================
    // TASK 2: PUBLIC BROWSING (NO LOGIN REQUIRED)
    // =========================================================================
    console.log("\n▶ [Task 2] Testing Public Browsing with Incognito/Unauthenticated Browser...");
    const guestCtx = await browser.createBrowserContext();
    const guestPage = await guestCtx.newPage();
    await guestPage.setViewport({ width: 1440, height: 900 });

    // 1. Visit Home (/)
    console.log("  - Visiting Home (/) as unauthenticated visitor...");
    await guestPage.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
    await delay(1000);
    assert.strictEqual(guestPage.url(), `${BASE_URL}/`, "Home page must NOT redirect to /login");
    // Verify Navbar contains standard links and Login/Register
    const homeNavText = await guestPage.evaluate(() => document.querySelector("header")?.innerText || "");
    assert.ok(homeNavText.includes("Open Internships"), "Navbar must show 'Open Internships'");
    assert.ok(homeNavText.includes("Researchers"), "Navbar must show 'Researchers'");
    assert.ok(homeNavText.includes("About Us"), "Navbar must show 'About Us'");
    assert.ok(homeNavText.includes("Contact Us"), "Navbar must show 'Contact Us'");
    assert.ok(homeNavText.includes("Careers"), "Navbar must show 'Careers'");
    assert.ok(homeNavText.includes("Login"), "Navbar must show 'Login' button");
    assert.ok(homeNavText.includes("Create Account"), "Navbar must show 'Create Account' button");
    await guestPage.screenshot({ path: path.join(SCREENSHOT_DIR, "01_public_home.png") });
    console.log("  ✓ Home (/) renders completely for unauthenticated visitor with full navbar");
    testReport.task2_public_home = true;

    // 2. Visit Open Internships (/explore?tab=domains)
    console.log("  - Visiting Open Internships (/explore?tab=domains)...");
    await guestPage.goto(`${BASE_URL}/explore?tab=domains`, { waitUntil: "domcontentloaded" });
    await guestPage.waitForSelector(".card-corporate", { timeout: 20000 });
    assert.ok(guestPage.url().includes("/explore?tab=domains"), "Must stay on /explore?tab=domains");
    const domainCardsCount = await guestPage.evaluate(() => document.querySelectorAll(".card-corporate").length);
    assert.ok(domainCardsCount > 0, "Academic domain cards must be visible");
    await guestPage.screenshot({ path: path.join(SCREENSHOT_DIR, "02_public_domains.png") });
    console.log("  ✓ Open Internships (/explore?tab=domains) renders publicly");
    testReport.task2_public_domains = true;

    // 3. Visit About Us (/about)
    console.log("  - Visiting About Us (/about)...");
    await guestPage.goto(`${BASE_URL}/about`, { waitUntil: "domcontentloaded" });
    await delay(1000);
    assert.strictEqual(guestPage.url(), `${BASE_URL}/about`, "About page must NOT redirect to /login");
    await guestPage.screenshot({ path: path.join(SCREENSHOT_DIR, "03_public_about.png") });
    console.log("  ✓ About Us (/about) renders publicly");
    testReport.task2_public_about = true;

    // 4. Visit Researchers (/explore?tab=scholars)
    console.log("  - Visiting Researchers (/explore?tab=scholars)...");
    await guestPage.goto(`${BASE_URL}/explore?tab=scholars`, { waitUntil: "domcontentloaded" });
    await guestPage.waitForFunction(() => {
      const links = Array.from(document.querySelectorAll("a"));
      return links.some((a) => a.innerText && a.innerText.trim() === "View Profile");
    }, { timeout: 25000 });
    assert.ok(guestPage.url().includes("/explore?tab=scholars"), "Must stay on /explore?tab=scholars");
    const scholarCardCount = await guestPage.evaluate(() => {
      const links = Array.from(document.querySelectorAll("a"));
      return links.filter((a) => a.innerText && a.innerText.trim() === "View Profile").length;
    });
    assert.ok(scholarCardCount >= 1, "Must render verified researcher cards");
    // Verify NO locked preview or locked text
    const pageContent = await guestPage.evaluate(() => document.body.innerText);
    assert.ok(!pageContent.includes("Free Preview (5 of"), "Must NOT display 'Free Preview (5 of' text");
    assert.ok(!pageContent.includes("Premium-locked verified scholars"), "Must NOT show locked scholars counter");
    await guestPage.screenshot({ path: path.join(SCREENSHOT_DIR, "04_public_researchers.png") });
    console.log(`  ✓ Researchers (/explore?tab=scholars) renders public directory with ${scholarCardCount} approved scholars on current page`);
    testReport.task2_public_scholars = true;

    // 5. Visit Contact Us (/contact)
    console.log("  - Visiting Contact Us (/contact)...");
    await guestPage.goto(`${BASE_URL}/contact`, { waitUntil: "domcontentloaded" });
    await delay(1000);
    assert.strictEqual(guestPage.url(), `${BASE_URL}/contact`, "Contact page must NOT redirect to /login");
    await guestPage.screenshot({ path: path.join(SCREENSHOT_DIR, "05_public_contact.png") });
    console.log("  ✓ Contact Us (/contact) renders publicly");
    testReport.task2_public_contact = true;

    // 6. Visit Careers (/careers)
    console.log("  - Visiting Careers (/careers)...");
    await guestPage.goto(`${BASE_URL}/careers`, { waitUntil: "domcontentloaded" });
    await delay(1000);
    assert.strictEqual(guestPage.url(), `${BASE_URL}/careers`, "Careers page must NOT redirect to /login");
    await guestPage.screenshot({ path: path.join(SCREENSHOT_DIR, "06_public_careers.png") });
    console.log("  ✓ Careers (/careers) renders publicly");
    testReport.task2_public_careers = true;

    // 7. Visit Internship Details (/internships/int-1)
    console.log("  - Visiting Internship Details (/internships/int-1)...");
    await guestPage.goto(`${BASE_URL}/internships/int-1`, { waitUntil: "domcontentloaded" });
    await delay(1500);
    assert.ok(guestPage.url().includes("/internships/int-1"), "Internship detail page must NOT redirect to /login");
    await guestPage.screenshot({ path: path.join(SCREENSHOT_DIR, "07_public_internship_detail.png") });
    console.log("  ✓ Internship Details (/internships/int-1) renders publicly");
    testReport.task2_public_internship_detail = true;

    // =========================================================================
    // TASK 2: PROTECTED ACTION 1 — INTERNSHIP APPLICATION FLOW
    // =========================================================================
    console.log("\n▶ [Task 2] Testing Protected Action 1: Internship Application -> Login Gateway -> Resume Application...");
    // Click "Apply for This Position" on /internships/int-1
    await guestPage.waitForFunction(() => {
      const applyBtn = Array.from(document.querySelectorAll("button, a")).find(
        (el) => el.innerText && (el.innerText.includes("Apply for This Position") || el.innerText.includes("Apply for Internship"))
      );
      return Boolean(applyBtn);
    }, { timeout: 20000 });
    await guestPage.evaluate(() => {
      const applyBtn = Array.from(document.querySelectorAll("button, a")).find(
        (el) => el.innerText && (el.innerText.includes("Apply for This Position") || el.innerText.includes("Apply for Internship"))
      );
      if (applyBtn) applyBtn.click();
    });
    await waitForPath(guestPage, "/login", 15000);

    // Verify redirected to /login with redirect=/internships/int-1?apply=true
    const afterApplyUrl = guestPage.url();
    console.log(`  - After clicking Apply, URL is: ${afterApplyUrl}`);
    assert.ok(afterApplyUrl.includes("/login"), "Must redirect to /login");
    assert.ok(
      afterApplyUrl.includes("redirect=%2Finternships%2Fint-1%3Fapply%3Dtrue") ||
      afterApplyUrl.includes("redirect=/internships/int-1?apply=true"),
      "Must preserve redirect destination with apply=true"
    );
    await guestPage.screenshot({ path: path.join(SCREENSHOT_DIR, "08_apply_login_redirect.png") });
    testReport.task2_protected_apply_redirect = true;

    // Perform Login as Student
    await guestPage.type('input[type="email"]', "diya.nair@vit.ac.in");
    await guestPage.type('input[type="password"]', "Student@2026");
    await guestPage.click('button[type="submit"]');

    // Wait for redirect back to /internships/int-1?apply=true
    await waitForPath(guestPage, "/internships/int-1");
    console.log(`  - Successfully returned to: ${guestPage.url()}`);
    assert.ok(guestPage.url().includes("/internships/int-1"), "Must return to internship page");

    // Wait for Application Modal to automatically open
    await guestPage.waitForFunction(() => {
      return (
        Boolean(document.querySelector(".fixed.inset-0")) &&
        document.body.innerText.toLowerCase().includes("research internship application")
      );
    }, { timeout: 25000 });
    await guestPage.screenshot({ path: path.join(SCREENSHOT_DIR, "09_apply_modal_auto_opened.png") });
    console.log("  ✓ Verified: Apply action triggered login, and returning opened application modal seamlessly!");
    testReport.task2_protected_apply_resume = true;

    await guestCtx.close();

    // =========================================================================
    // TASK 2: PROTECTED ACTION 2 — VIEW PHD SCHOLAR PROFILE
    // =========================================================================
    console.log("\n▶ [Task 2] Testing Protected Action 2: View Scholar Profile -> Login Gateway -> View Profile...");
    const scholarCtx = await browser.createBrowserContext();
    const scholarPage = await scholarCtx.newPage();
    await scholarPage.setViewport({ width: 1440, height: 900 });

    // A. Direct navigation test: /scholars/sch-1 as unauthenticated visitor
    console.log("  - Directly navigating to /scholars/sch-1 as unauthenticated visitor...");
    await scholarPage.goto(`${BASE_URL}/scholars/sch-1`, { waitUntil: "domcontentloaded" });
    await delay(1000);
    const directUrl = scholarPage.url();
    assert.ok(directUrl.includes("/login"), "Direct /scholars/:id access must be intercepted by middleware");
    assert.ok(
      directUrl.includes("redirect=%2Fscholars%2Fsch-1") || directUrl.includes("redirect=/scholars/sch-1"),
      "Must preserve redirect to /scholars/sch-1"
    );
    console.log("  ✓ Direct /scholars/sch-1 correctly redirected to login gateway");

    // B. UI Click test: Open Researchers directory, click "View Profile"
    await scholarPage.goto(`${BASE_URL}/explore?tab=scholars`, { waitUntil: "domcontentloaded" });
    await scholarPage.waitForFunction(() => {
      const links = Array.from(document.querySelectorAll("a"));
      return links.some((a) => a.innerText && a.innerText.trim() === "View Profile");
    }, { timeout: 25000 });
    // Click first "View Profile" link
    await scholarPage.evaluate(() => {
      const viewProfileLinks = Array.from(document.querySelectorAll("a")).filter(
        (a) => a.innerText && a.innerText.trim() === "View Profile"
      );
      if (viewProfileLinks[0]) viewProfileLinks[0].click();
    });
    await delay(1500);

    const uiRedirectUrl = scholarPage.url();
    assert.ok(uiRedirectUrl.includes("/login"), "Clicking View Profile must redirect to /login");
    assert.ok(uiRedirectUrl.includes("redirect="), "Must have redirect parameter");
    await scholarPage.screenshot({ path: path.join(SCREENSHOT_DIR, "10_view_profile_login_redirect.png") });
    testReport.task2_protected_scholar_profile_redirect = true;

    // Log in as student
    await scholarPage.type('input[type="email"]', "aarav.sharma@nitk.edu.in");
    await scholarPage.type('input[type="password"]', "Student@2026");
    await scholarPage.click('button[type="submit"]');

    // Wait for redirect to scholar profile
    await waitForPath(scholarPage, "/scholars/");
    await delay(2000);
    console.log(`  - After login, landed on: ${scholarPage.url()}`);
    assert.ok(scholarPage.url().includes("/scholars/"), "Must land on scholar profile page");

    // Verify scholar profile details are rendered
    const scholarProfileText = await scholarPage.evaluate(() => document.body.innerText);
    assert.ok(scholarProfileText.includes("Current Research Topic") || scholarProfileText.includes("Publications"), "Scholar profile details must render");
    assert.ok(!scholarProfileText.includes("Upgrade to STARSKY Premium to unlock the complete PhD"), "Profile must NOT be blocked by premium lock");
    await scholarPage.screenshot({ path: path.join(SCREENSHOT_DIR, "11_scholar_profile_rendered.png") });
    console.log("  ✓ Verified: Logged-in user seamlessly accesses full verified PhD Scholar profile!");
    testReport.task2_protected_scholar_profile_view = true;

    await scholarCtx.close();

    // =========================================================================
    // TASK 2: PROTECTED ACTION 3 — CONTACT US FORM DRAFT PRESERVATION
    // =========================================================================
    console.log("\n▶ [Task 2] Testing Protected Action 3: Contact Us Draft -> Login -> Restore Draft -> Submit...");
    const contactCtx = await browser.createBrowserContext();
    const contactPage = await contactCtx.newPage();
    await contactPage.setViewport({ width: 1440, height: 900 });

    await contactPage.goto(`${BASE_URL}/contact`, { waitUntil: "domcontentloaded" });
    await delay(1000);

    // Type into form as unauthenticated visitor
    const testName = "Dr. Evelyn Reed";
    const testEmail = "evelyn.reed@cambridge.org";
    const testSubject = "Academic Research Collaboration Inquiry";
    const testMsg = "We would like to establish a joint doctoral mentorship exchange program.";

    await contactPage.type('input[placeholder*="Name"]', testName);
    await contactPage.type('input[placeholder*="you@"]', testEmail);
    await contactPage.type('input[placeholder*="e.g., Scholar"]', testSubject);
    await contactPage.type('textarea[placeholder*="detailed"]', testMsg);

    await contactPage.screenshot({ path: path.join(SCREENSHOT_DIR, "12_contact_unauthenticated_filled.png") });

    // Click "Submit Message"
    await contactPage.evaluate(() => {
      const submitBtn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.innerText && b.innerText.includes("Submit Message")
      );
      if (submitBtn) submitBtn.click();
    });
    await delay(1500);

    // Verify redirected to /login?redirect=/contact
    const contactRedirectUrl = contactPage.url();
    console.log(`  - After clicking submit, URL is: ${contactRedirectUrl}`);
    assert.ok(contactRedirectUrl.includes("/login"), "Must redirect to login");
    assert.ok(contactRedirectUrl.includes("redirect=%2Fcontact") || contactRedirectUrl.includes("redirect=/contact"), "Must preserve redirect=/contact");

    // Verify draft is stored in sessionStorage
    const draftInStorage = await contactPage.evaluate(() => {
      return sessionStorage.getItem("starsky_contact_draft");
    });
    assert.ok(draftInStorage, "sessionStorage must contain 'starsky_contact_draft'");
    const parsedDraft = JSON.parse(draftInStorage);
    assert.strictEqual(parsedDraft.subject, testSubject, "Draft subject must match");
    assert.strictEqual(parsedDraft.message, testMsg, "Draft message must match");
    console.log("  ✓ Form draft safely stored in sessionStorage");

    // Log in as student
    await contactPage.type('input[type="email"]', "aarav.sharma@nitk.edu.in");
    await contactPage.type('input[type="password"]', "Student@2026");
    await contactPage.click('button[type="submit"]');

    // Wait for return to /contact
    await waitForPath(contactPage, "/contact");
    await delay(1500);
    console.log(`  - Returned to: ${contactPage.url()}`);
    assert.ok(contactPage.url().includes("/contact"), "Must return to /contact");

    // Verify draft restored into form fields
    const restoredSubject = await contactPage.$eval('input[placeholder*="e.g., Scholar"]', (el) => el.value);
    const restoredMessage = await contactPage.$eval('textarea[placeholder*="detailed"]', (el) => el.value);
    assert.strictEqual(restoredSubject, testSubject, "Subject must be restored");
    assert.strictEqual(restoredMessage, testMsg, "Message must be restored");

    // Verify draft banner
    const hasDraftBanner = await contactPage.evaluate(() => {
      return document.body.innerText.includes("Message Draft Restored");
    });
    assert.ok(hasDraftBanner, "Must show 'Message Draft Restored' banner");
    await contactPage.screenshot({ path: path.join(SCREENSHOT_DIR, "13_contact_draft_restored.png") });
    console.log("  ✓ Draft restored successfully into form fields without data loss");

    // Submit message
    await contactPage.evaluate(() => {
      const submitBtn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.innerText && b.innerText.includes("Submit Message")
      );
      if (submitBtn) submitBtn.click();
    });
    await delay(2000);

    // Verify success message
    const isSubmitted = await contactPage.evaluate(() => {
      return document.body.innerText.includes("Message Sent Successfully");
    });
    assert.ok(isSubmitted, "Must display 'Message Sent Successfully'");
    await contactPage.screenshot({ path: path.join(SCREENSHOT_DIR, "14_contact_submitted_success.png") });
    console.log("  ✓ Contact message submitted successfully after authentication!");
    testReport.task2_contact_draft_preservation = true;

    await contactCtx.close();

    // =========================================================================
    // TASK 2: DASHBOARDS & ADMIN PROTECTED ROUTE GUARDS
    // =========================================================================
    console.log("\n▶ [Task 2] Testing Dashboards & Admin Route Guards...");
    const guardCtx = await browser.createBrowserContext();
    const guardPage = await guardCtx.newPage();

    // Unauthenticated -> /dashboard/student
    await guardPage.goto(`${BASE_URL}/dashboard/student`, { waitUntil: "domcontentloaded" });
    await delay(500);
    assert.ok(guardPage.url().includes("/login?redirect="), "Must redirect to login with redirect param");

    // Unauthenticated -> /dashboard/scholar
    await guardPage.goto(`${BASE_URL}/dashboard/scholar`, { waitUntil: "domcontentloaded" });
    await delay(500);
    assert.ok(guardPage.url().includes("/login?redirect="), "Must redirect to login with redirect param");

    // Unauthenticated -> /admin
    await guardPage.goto(`${BASE_URL}/admin`, { waitUntil: "domcontentloaded" });
    await delay(500);
    assert.ok(guardPage.url().includes("/login?redirect="), "Must redirect to login with redirect param");

    // Authenticated Student -> /admin
    await guardPage.type('input[type="email"]', "aarav.sharma@nitk.edu.in");
    await guardPage.type('input[type="password"]', "Student@2026");
    await guardPage.click('button[type="submit"]');
    await delay(2000);
    // Student attempting to access /admin must be redirected to /dashboard/student
    await guardPage.goto(`${BASE_URL}/admin`, { waitUntil: "domcontentloaded" });
    await delay(1000);
    assert.ok(guardPage.url().includes("/dashboard/student"), "Student accessing /admin must be redirected to /dashboard/student");
    console.log("  ✓ Verified: Strict role-based protection on Dashboards and Admin portals");
    testReport.task2_dashboard_admin_guards = true;

    await guardCtx.close();

    console.log("\n================================================================================");
    console.log("ALL TEST SCENARIOS PASSED WITH 100% SUCCESS!");
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

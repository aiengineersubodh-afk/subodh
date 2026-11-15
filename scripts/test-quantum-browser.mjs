import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import assert from "assert";

const BASE_URL = "http://localhost:3000";
const SCREENSHOT_DIR = path.resolve("public/screenshots/quantum-test");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runQuantumVerification() {
  console.log("================================================================================");
  console.log("STARSKY — QUANTUM INFORMATION SCIENCE REAL BROWSER VERIFICATION");
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
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  let createdAppId = null;

  try {
    // -------------------------------------------------------------------------
    // STEP 1: Log in as priyakumari (PhD Scholar)
    // -------------------------------------------------------------------------
    console.log("▶ [Step 1] Signing in as PhD Scholar priyakumari...");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await page.mainFrame().waitForFunction(() => {
      const form = document.querySelector("form");
      return form && Object.keys(form).some((k) => k.startsWith("__reactProps") || k.startsWith("__reactEvents"));
    }, { timeout: 15000 });

    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', "kumarpriya1234@gmail.com");
    await page.type('input[type="password"]', "Subodh@12345");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "01-priya-login-filled.png") });

    await page.click('button[type="submit"]');
    await page.mainFrame().waitForFunction(() => window.location.pathname.includes("/dashboard"), { timeout: 30000 });
    console.log("  ✓ Successfully authenticated. Current URL:", page.url());

    // -------------------------------------------------------------------------
    // STEP 2: Verify Scholar Academic Classification in Dashboard
    // -------------------------------------------------------------------------
    console.log("▶ [Step 2] Verifying Scholar Profile and Classification in UI...");
    await page.waitForSelector("h1, h2, h3");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "02-priya-dashboard.png") });

    const dashText = await page.evaluate(() => document.body.innerText);
    assert.ok(dashText.includes("priyakumari"), "Scholar full name must appear");
    assert.ok(dashText.includes("nit raipur") || dashText.includes("NIT Raipur"), "Institution must appear");
    assert.ok(dashText.includes("Quantum Information Science") || dashText.includes("Interdisciplinary Research"), "Specialization/Domain must appear");
    console.log("  ✓ Verified: priyakumari | nit raipur | Interdisciplinary Research → Quantum Information Science");

    // -------------------------------------------------------------------------
    // STEP 3: Verify Existing Published Internships in My Internships
    // -------------------------------------------------------------------------
    console.log("▶ [Step 3] Checking 'My Internships' in Scholar Dashboard...");
    // Click on My Internships tab
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const myIntBtn = btns.find((b) => b.textContent && b.textContent.includes("My Internships"));
      if (myIntBtn) myIntBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "03-priya-my-internships.png") });

    const myIntText = await page.evaluate(() => document.body.innerText);
    assert.ok(myIntText.includes("quantum with math"), "Internship 1 'quantum with math' must be visible");
    assert.ok(myIntText.includes("theory of quantum"), "Internship 2 'theory of quantum' must be visible");
    console.log("  ✓ Both published internships visible in Scholar Dashboard: 'quantum with math' & 'theory of quantum'");

    // -------------------------------------------------------------------------
    // STEP 4, 5, 6, 7: Open Internships Discovery via Academic Taxonomy
    // -------------------------------------------------------------------------
    console.log("▶ [Step 4-7] Navigating to Open Internships and filtering by Interdisciplinary Research → Quantum Information Science...");
    await page.goto(`${BASE_URL}/explore`, { waitUntil: "domcontentloaded" });

    // Wait for /api/public data
    await page.mainFrame().waitForFunction(() => {
      const h3s = Array.from(document.querySelectorAll("h3"));
      return h3s.some((h) => h.textContent && h.textContent.trim() === "Interdisciplinary Research");
    }, { timeout: 25000 });

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "04-explore-domains.png") });

    // Click on Interdisciplinary Research domain
    await page.evaluate(() => {
      const h3s = Array.from(document.querySelectorAll("h3"));
      const h = h3s.find((c) => c.textContent && c.textContent.trim() === "Interdisciplinary Research");
      if (h) {
        (h.closest(".card-corporate") || h).click();
      }
    });

    // Wait for specializations view
    console.log("  Waiting for specializations under Interdisciplinary Research...");
    await page.mainFrame().waitForFunction(() => {
      const h3s = Array.from(document.querySelectorAll("h3"));
      return h3s.some((h) => h.textContent && h.textContent.includes("Quantum Information Science"));
    }, { timeout: 25000 });

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "05-explore-interdisciplinary-specs.png") });

    // Click on Quantum Information Science card
    console.log("  Clicking on Quantum Information Science specialization card...");
    await page.evaluate(() => {
      const h3s = Array.from(document.querySelectorAll("h3"));
      const target = h3s.find((h) => h.textContent && h.textContent.trim() === "Quantum Information Science");
      if (target) {
        const card = target.closest("[role='button']") || target.closest(".cursor-pointer") || target;
        card.click();
      }
    });

    // Wait for internships tab to filter and render
    console.log("  Waiting for Open Internships to display Quantum Information Science internships...");
    await page.mainFrame().waitForFunction(() => {
      const text = document.body.innerText;
      return text.includes("quantum with math") && text.includes("theory of quantum");
    }, { timeout: 25000 });

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "06-explore-quantum-filtered-internships.png") });

    const openIntText = await page.evaluate(() => document.body.innerText);
    assert.ok(openIntText.includes("quantum with math"), "Internship 'quantum with math' must appear in Open Internships");
    assert.ok(openIntText.includes("theory of quantum"), "Internship 'theory of quantum' must appear in Open Internships");
    assert.ok(openIntText.includes("priyakumari"), "Scholar name 'priyakumari' must appear");
    assert.ok(openIntText.includes("Showing 2 open research internships under Interdisciplinary Research → Quantum Information Science"), "Accurate result count banner must appear");
    console.log("  ✓ BOTH internships successfully appear under Interdisciplinary Research → Quantum Information Science!");

    // -------------------------------------------------------------------------
    // STEP 8: Open Internship Details & Verify Full Information
    // -------------------------------------------------------------------------
    console.log("▶ [Step 8] Opening Internship Details page for 'quantum with math'...");
    await page.goto(`${BASE_URL}/internships/int-8630d2f3`, { waitUntil: "domcontentloaded" });
    await page.mainFrame().waitForFunction(() => document.body.innerText.includes("quantum with math"), { timeout: 20000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "07-quantum-internship-details-1.png") });

    const int1Text = await page.evaluate(() => document.body.innerText);
    assert.ok(int1Text.includes("quantum with math"), "Title must render");
    assert.ok(int1Text.includes("priyakumari"), "Mentor name must render");
    assert.ok(int1Text.includes("nit raipur"), "Institution must render");
    assert.ok(int1Text.includes("Quantum Information Science"), "Specialization must render");
    assert.ok(int1Text.includes("PyTorch") && int1Text.includes("ROS2"), "Skills must render");
    console.log("  ✓ Internship 1 ('quantum with math') details page rendered perfectly");

    console.log("▶ Opening Internship Details page for 'theory of quantum'...");
    await page.goto(`${BASE_URL}/internships/int-04849811`, { waitUntil: "domcontentloaded" });
    await page.mainFrame().waitForFunction(() => document.body.innerText.includes("theory of quantum"), { timeout: 20000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "08-quantum-internship-details-2.png") });

    const int2Text = await page.evaluate(() => document.body.innerText);
    assert.ok(int2Text.includes("theory of quantum"), "Title must render");
    assert.ok(int2Text.includes("priyakumari"), "Mentor name must render");
    assert.ok(int2Text.includes("nit raipur"), "Institution must render");
    assert.ok(int2Text.includes("Quantum Information Science"), "Specialization must render");
    assert.ok(int2Text.includes("Python") && int2Text.includes("Literature Analysis"), "Skills must render");
    console.log("  ✓ Internship 2 ('theory of quantum') details page rendered perfectly");

    // -------------------------------------------------------------------------
    // STEP 9-11: Student Journey — Log In & Apply
    // -------------------------------------------------------------------------
    console.log("▶ [Step 9-11] Logging out scholar and signing in as Student (Aarav Sharma)...");
    await page.evaluate(() => fetch("/api/auth/logout", { method: "POST" }));
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await page.mainFrame().waitForFunction(() => {
      const form = document.querySelector("form");
      return form && Object.keys(form).some((k) => k.startsWith("__reactProps") || k.startsWith("__reactEvents"));
    }, { timeout: 15000 });

    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', "aarav.sharma@nitk.edu.in");
    await page.type('input[type="password"]', "Student@2026");
    await page.click('button[type="submit"]');
    await page.mainFrame().waitForFunction(() => window.location.pathname.includes("/dashboard/student"), { timeout: 30000 });
    console.log("  ✓ Student signed in successfully.");

    // Open Internship as Student
    console.log("  Navigating to 'quantum with math' as Student...");
    await page.goto(`${BASE_URL}/internships/int-8630d2f3`, { waitUntil: "domcontentloaded" });
    // Wait for session and page to be fully loaded with student session active
    await page.mainFrame().waitForFunction(() => {
      return document.body.innerText.includes("quantum with math") &&
             document.body.innerText.includes("Student Dashboard") &&
             document.body.innerText.includes("Apply for This Position");
    }, { timeout: 25000 });

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "09-student-view-internship.png") });

    // Click Apply
    console.log("  Clicking 'Apply for This Position' button...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const applyBtn = btns.find((b) => b.textContent && b.textContent.includes("Apply for This Position"));
      if (applyBtn) applyBtn.click();
    });

    // Wait for application modal
    await page.waitForSelector("textarea", { timeout: 15000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "10-application-modal-open.png") });

    // Fill SOP
    console.log("  Filling Statement of Purpose...");
    const sopText = "I have a strong background in quantum state tomographies, linear algebra, and mathematical modeling, and I am very keen to contribute to this research internship under your guidance.";
    const sopInput = await page.$("textarea");
    await sopInput.click();
    await sopInput.type(sopText);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "11-application-modal-filled.png") });

    // Submit Application
    console.log("  Clicking Review Application...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const revBtn = btns.find((b) => b.textContent && b.textContent.includes("Review Application"));
      if (revBtn) revBtn.click();
    });

    // Wait for Review screen
    await page.mainFrame().waitForFunction(() => {
      return document.body.innerText.includes("Review Your Application") || document.body.innerText.includes("Confirm & Submit");
    }, { timeout: 15000 });

    console.log("  Clicking Confirm & Submit Application...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const confBtn = btns.find((b) => b.textContent && b.textContent.includes("Confirm & Submit"));
      if (confBtn) confBtn.click();
    });

    await page.mainFrame().waitForFunction(() => {
      return document.body.innerText.includes("Application Submitted Successfully") || document.body.innerText.includes("Submitted");
    }, { timeout: 20000 });

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "12-application-submitted-success.png") });
    console.log("  ✓ Student application successfully submitted through Real UI!");

    // Verify in database
    const dbCheck = JSON.parse(fs.readFileSync("data/starsky-db.json", "utf8"));
    const createdApp = dbCheck.internship_applications.find((a) => a.internship_id === "int-8630d2f3" && a.student_email === "aarav.sharma@nitk.edu.in");
    assert.ok(createdApp, "Student application record must be stored in database");
    createdAppId = createdApp.id;
    console.log(`  ✓ Application record confirmed in DB: ${createdApp.id}, status: ${createdApp.status}`);

    // -------------------------------------------------------------------------
    // STEP 12-16: Scholar Verification of Submitted Application
    // -------------------------------------------------------------------------
    console.log("▶ [Step 12-16] Logging out student and logging back in as priyakumari to verify applicant...");
    await page.evaluate(() => fetch("/api/auth/logout", { method: "POST" }));
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await page.mainFrame().waitForFunction(() => {
      const form = document.querySelector("form");
      return form && Object.keys(form).some((k) => k.startsWith("__reactProps") || k.startsWith("__reactEvents"));
    }, { timeout: 15000 });

    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', "kumarpriya1234@gmail.com");
    await page.type('input[type="password"]', "Subodh@12345");
    await page.click('button[type="submit"]');
    await page.mainFrame().waitForFunction(() => window.location.pathname.includes("/dashboard"), { timeout: 30000 });

    // Open Applications tab
    console.log("  Navigating to Scholar Dashboard → Applications tab...");
    await page.goto(`${BASE_URL}/dashboard/scholar?tab=applications`, { waitUntil: "domcontentloaded" });
    await page.mainFrame().waitForFunction(() => {
      return document.body.innerText.includes("Aarav Sharma") || document.body.innerText.includes("quantum with math");
    }, { timeout: 20000 });

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "13-scholar-applications-view.png") });

    const scholarAppsText = await page.evaluate(() => document.body.innerText);
    assert.ok(scholarAppsText.includes("Aarav Sharma"), "Student name 'Aarav Sharma' must appear in scholar dashboard");
    assert.ok(scholarAppsText.includes("quantum with math"), "Target internship 'quantum with math' must appear in application card");
    console.log("  ✓ Student Aarav Sharma is clearly visible in priyakumari's Applications dashboard!");

    // Verify management controls
    const hasControls = await page.evaluate(() => {
      const selects = document.querySelectorAll("select");
      const buttons = Array.from(document.querySelectorAll("button"));
      return selects.length > 0 || buttons.some((b) => b.textContent && (b.textContent.includes("Review") || b.textContent.includes("Status") || b.textContent.includes("Accept")));
    });
    console.log("  ✓ Application management controls (Review/Status/Notes) present:", hasControls);

  } finally {
    // Clean up temporary test application from DB so state remains pristine
    if (createdAppId) {
      console.log(`\n[CLEANUP] Removing test student application ${createdAppId}...`);
      const cleanDb = JSON.parse(fs.readFileSync("data/starsky-db.json", "utf8"));
      cleanDb.internship_applications = cleanDb.internship_applications.filter((a) => a.id !== createdAppId);
      fs.writeFileSync("data/starsky-db.json", JSON.stringify(cleanDb, null, 2), "utf8");
      console.log("  ✓ Test application cleaned up from database.");
    }

    try {
      await page.close().catch(() => {});
      await browser.close().catch(() => {});
      console.log("  ✓ Headless Chrome closed cleanly.");
    } catch {}
  }

  console.log("\n================================================================================");
  console.log("QUANTUM INFORMATION SCIENCE VERIFICATION COMPLETE: ALL CHECKS PASSED!");
  console.log(`Console Errors: ${consoleErrors.length}`);
  console.log(`Screenshots saved to: ${SCREENSHOT_DIR}`);
  console.log("================================================================================\n");
}

runQuantumVerification().catch((err) => {
  console.error("Quantum verification failed:", err);
  process.exit(1);
});

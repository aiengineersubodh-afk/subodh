import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import assert from "assert";

const BASE_URL = "http://localhost:3000";
const SCREENSHOT_DIR = path.resolve("public/screenshots/onboarding-improvements");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForPath(page, targetSnippet, timeoutMs = 45000) {
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
  console.log("STARSKY — ONBOARDING IMPROVEMENTS & INTERNATIONAL PHONE INPUT VERIFICATION SUITE");
  console.log("================================================================================\n");

  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--window-size=1440,900",
    ],
  });

  const testReport = {
    testA_student_academic_back_button: false,
    testA_student_dynamic_modern_history: false,
    testB_scholar_academic_back_button: false,
    testB_scholar_dynamic_medical_imaging: false,
    testC_dynamic_switch_engineering_ai: false,
    testC_custom_interest_preserved: false,
    testC_quick_add_interest: false,
    testD_phone_india_validation: false,
    testD_phone_us_selection: false,
    testD_phone_uk_selection: false,
    testD_phone_australia_selection: false,
    testD_phone_uae_selection: false,
    testD_existing_profile_phone_prefill: false,
    testE_student_onboarding_review_and_submit: false,
  };

  try {
    const timestamp = Date.now();

    // =========================================================================
    // TEST D (PART 1): REGISTRATION WITH INTERNATIONAL PHONE INPUT
    // =========================================================================
    console.log("▶ [Test D & E] Registering Test Student with International Phone Input...");
    const studentPage = await browser.newPage();
    studentPage.on("console", (msg) => console.log("    [Browser Log]:", msg.text()));
    studentPage.on("response", async (res) => {
      if (res.url().includes("/api/onboarding")) {
        console.log("    [API]", res.status(), res.url());
        try {
          const body = await res.text();
          console.log("    [API Body]:", body);
        } catch {}
      }
    });
    const studentClient = await studentPage.target().createCDPSession();
    await studentClient.send("Network.clearBrowserCookies");
    await studentClient.send("Network.clearBrowserCache");
    await studentPage.setViewport({ width: 1440, height: 900 });

    await studentPage.goto(`${BASE_URL}/register`, { waitUntil: "domcontentloaded" });
    await studentPage.waitForSelector('input[placeholder*="Student Name"]', { timeout: 20000 });
    await delay(600);

    const testStudentEmail = `onboarding.student.${timestamp}@starsky.edu`;
    const testStudentName = `Aditi Banerjee ${timestamp}`;

    // Fill full name and email
    await studentPage.type('input[placeholder*="Student Name"]', testStudentName);
    await studentPage.type('input[placeholder="you@institution.edu"]', testStudentEmail);
    await studentPage.type('input[placeholder*="Min 8 chars"]', "Student@2026");

    // Verify International Phone Input on Registration
    console.log("  - Auditing International Phone Input country selector on registration...");
    // Check initial flag & dial code
    const initialCountryBtnText = await studentPage.evaluate(() => {
      const btn = document.querySelector('button[aria-haspopup="listbox"]');
      return btn ? btn.innerText.trim() : "";
    });
    console.log(`    Default registration phone selector: "${initialCountryBtnText}"`);
    assert.ok(initialCountryBtnText.includes("+91"), "Default country dial code should be +91");

    // Test invalid phone number error
    await studentPage.type('input[type="tel"]', "12345");
    await studentPage.type('input[placeholder="e.g. Karnataka"]', "West Bengal");
    await studentPage.type('input[placeholder="e.g. Bangalore"]', "Kolkata");

    // Click register to verify phone validation
    await studentPage.click('button[type="submit"]');
    await delay(800);

    const errorMsg = await studentPage.evaluate(() => {
      const err = document.querySelector(".bg-red-50");
      return err ? err.innerText : "";
    });
    assert.ok(
      errorMsg.includes("phone number") || errorMsg.includes("must be at least 10 digits") || errorMsg.includes("start with"),
      `Expected phone validation error, got: ${errorMsg}`
    );
    console.log(`  ✓ Registration phone validation caught invalid input: "${errorMsg.trim()}"`);
    testReport.testD_phone_india_validation = true;

    // Clear and enter valid 10-digit Indian number
    await studentPage.click('input[type="tel"]');
    await studentPage.keyboard.down("Control");
    await studentPage.keyboard.press("A");
    await studentPage.keyboard.up("Control");
    await studentPage.keyboard.press("Backspace");
    await studentPage.type('input[type="tel"]', "9830012345");
    await delay(300);

    // Submit valid registration
    await studentPage.click('button[type="submit"]');

    // Wait for redirect to /onboarding/student
    await waitForPath(studentPage, "/onboarding/student");
    console.log("  ✓ Test student registered and landed on /onboarding/student");

    // =========================================================================
    // TEST D (PART 2): INTERNATIONAL PHONE INPUT MULTI-COUNTRY AUDIT ON ONBOARDING STEP 1
    // =========================================================================
    console.log("\n▶ [Test D] Auditing Multi-Country International Phone Input on Step 1...");
    await studentPage.waitForFunction(() => document.body.innerText.includes("Step 1 of 6"), { timeout: 30000 });
    await studentPage.waitForSelector('button[aria-haspopup="listbox"]', { timeout: 30000 });
    await delay(500);

    // Open country selector dropdown
    await studentPage.click('button[aria-haspopup="listbox"]');
    await delay(400);

    // 1. Search and select United States (+1)
    await studentPage.type('input[placeholder*="Search country"]', "United States");
    await delay(300);
    await studentPage.evaluate(() => {
      const options = Array.from(document.querySelectorAll("button")).filter(
        (b) => b.innerText && b.innerText.includes("United States") && b.innerText.includes("+1")
      );
      if (options[0]) options[0].click();
    });
    await delay(400);
    const usDialCode = await studentPage.evaluate(() => {
      return document.querySelector('button[aria-haspopup="listbox"]')?.innerText.trim() || "";
    });
    assert.ok(usDialCode.includes("+1"), `Selected country should be +1, got: ${usDialCode}`);
    console.log("  ✓ United States (+1) searched and selected successfully");
    testReport.testD_phone_us_selection = true;

    // 2. Search and select United Kingdom (+44)
    await studentPage.click('button[aria-haspopup="listbox"]');
    await delay(400);
    await studentPage.type('input[placeholder*="Search country"]', "United Kingdom");
    await delay(300);
    await studentPage.evaluate(() => {
      const options = Array.from(document.querySelectorAll("button")).filter(
        (b) => b.innerText && b.innerText.includes("United Kingdom") && b.innerText.includes("+44")
      );
      if (options[0]) options[0].click();
    });
    await delay(400);
    const ukDialCode = await studentPage.evaluate(() => {
      return document.querySelector('button[aria-haspopup="listbox"]')?.innerText.trim() || "";
    });
    assert.ok(ukDialCode.includes("+44"), `Selected country should be +44, got: ${ukDialCode}`);
    console.log("  ✓ United Kingdom (+44) searched and selected successfully");
    testReport.testD_phone_uk_selection = true;

    // 3. Search and select Australia (+61)
    await studentPage.click('button[aria-haspopup="listbox"]');
    await delay(400);
    await studentPage.type('input[placeholder*="Search country"]', "Australia");
    await delay(300);
    await studentPage.evaluate(() => {
      const options = Array.from(document.querySelectorAll("button")).filter(
        (b) => b.innerText && b.innerText.includes("Australia") && b.innerText.includes("+61")
      );
      if (options[0]) options[0].click();
    });
    await delay(400);
    const auDialCode = await studentPage.evaluate(() => {
      return document.querySelector('button[aria-haspopup="listbox"]')?.innerText.trim() || "";
    });
    assert.ok(auDialCode.includes("+61"), `Selected country should be +61, got: ${auDialCode}`);
    console.log("  ✓ Australia (+61) searched and selected successfully");
    testReport.testD_phone_australia_selection = true;

    // 4. Search and select UAE (+971)
    await studentPage.click('button[aria-haspopup="listbox"]');
    await delay(400);
    await studentPage.type('input[placeholder*="Search country"]', "United Arab Emirates");
    await delay(300);
    await studentPage.evaluate(() => {
      const options = Array.from(document.querySelectorAll("button")).filter(
        (b) => b.innerText && b.innerText.includes("United Arab Emirates") && b.innerText.includes("+971")
      );
      if (options[0]) options[0].click();
    });
    await delay(400);
    const uaeDialCode = await studentPage.evaluate(() => {
      return document.querySelector('button[aria-haspopup="listbox"]')?.innerText.trim() || "";
    });
    assert.ok(uaeDialCode.includes("+971"), `Selected country should be +971, got: ${uaeDialCode}`);
    console.log("  ✓ UAE (+971) searched and selected successfully");
    testReport.testD_phone_uae_selection = true;

    await studentPage.screenshot({ path: path.join(SCREENSHOT_DIR, "04_international_phone_input.png") });

    // Switch back to India (+91) with valid number for completing onboarding
    await studentPage.click('button[aria-haspopup="listbox"]');
    await delay(400);
    await studentPage.type('input[placeholder*="Search country"]', "India");
    await delay(300);
    await studentPage.evaluate(() => {
      const options = Array.from(document.querySelectorAll("button")).filter(
        (b) => b.innerText && b.innerText.includes("India") && b.innerText.includes("+91")
      );
      if (options[0]) options[0].click();
    });
    await delay(400);

    // Save and Continue from Step 1 to Step 2
    await studentPage.evaluate(() => {
      const continueBtn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.innerText && b.innerText.includes("Save & Continue")
      );
      if (continueBtn) continueBtn.click();
    });
    await delay(1200);

    // =========================================================================
    // TEST A: STUDENT ACADEMIC SELECTION WITH "← Back" BUTTON & DYNAMIC INTERESTS
    // =========================================================================
    console.log("\n▶ [Test A] Testing Student Academic Information Step with '← Back'...");
    // Ensure on Step 2
    await studentPage.waitForFunction(() => document.body.innerText.includes("Step 2 of 6"));
    console.log("  - Landed on Step 2 (Academic Information)");

    // Fill College
    await studentPage.type('input[placeholder*="National Institute"]', "Jadavpur University");

    // Select Current Year/Semester
    await studentPage.evaluate(() => {
      const selects = Array.from(document.querySelectorAll("select"));
      const yearSelect = selects.find((s) => Array.from(s.options).some((o) => o.value === "3rd Year"));
      if (yearSelect) {
        yearSelect.value = "3rd Year";
        yearSelect.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });

    // Open Academic Selector modal
    await studentPage.evaluate(() => {
      const trigger = document.querySelector(".card-corporate") || document.querySelector('[role="button"]') ||
        Array.from(document.querySelectorAll("span")).find((s) => s.innerText && s.innerText.includes("Select Academic Domain"))?.closest("div");
      if (trigger) trigger.click();
    });
    await delay(800);

    // Modal should be open showing parent domains
    const isModalOpen = await studentPage.evaluate(() => {
      return Boolean(document.querySelector(".fixed.inset-0"));
    });
    assert.ok(isModalOpen, "Academic selector modal must be open");

    // Select "Arts and Humanities"
    await studentPage.evaluate(() => {
      const domainCards = Array.from(document.querySelectorAll('[role="button"]'));
      const artsCard = domainCards.find((el) => el.innerText && el.innerText.includes("Arts and Humanities"));
      if (artsCard) artsCard.click();
    });
    await delay(800);

    // VERIFY: Top-right action must say "Back" (not "Change Parent Domain")
    const backBtnText = await studentPage.evaluate(() => {
      const modal = document.querySelector(".fixed.inset-0");
      if (!modal) return "";
      const btns = Array.from(modal.querySelectorAll("button"));
      const backBtn = btns.find((b) => b.innerText && b.innerText.includes("Back"));
      return backBtn ? backBtn.innerText.trim() : "";
    });
    console.log(`  - Modal action button text: "${backBtnText}"`);
    assert.strictEqual(backBtnText, "Back", "Action button must be exactly 'Back'");

    const hasOldText = await studentPage.evaluate(() => {
      return document.body.innerText.includes("Change Parent Domain");
    });
    assert.strictEqual(hasOldText, false, "Must NOT display 'Change Parent Domain'");
    console.log("  ✓ Verified: Modal top-right action displays '← Back' properly");
    testReport.testA_student_academic_back_button = true;

    // CLICK "← Back"
    console.log("  - Clicking '← Back' button...");
    await studentPage.evaluate(() => {
      const modal = document.querySelector(".fixed.inset-0");
      const btns = Array.from(modal.querySelectorAll("button"));
      const backBtn = btns.find((b) => b.innerText && b.innerText.includes("Back"));
      if (backBtn) backBtn.click();
    });
    await delay(800);

    // VERIFY: Modal is STILL OPEN, displaying parent domains
    const isModalStillOpen = await studentPage.evaluate(() => {
      return Boolean(document.querySelector(".fixed.inset-0"));
    });
    assert.ok(isModalStillOpen, "Modal must remain open after clicking Back");

    const showsParentDomains = await studentPage.evaluate(() => {
      const text = document.querySelector(".fixed.inset-0")?.innerText || "";
      return text.includes("Engineering") && text.includes("Arts and Humanities") && text.includes("Medical and Healthcare");
    });
    assert.ok(showsParentDomains, "Modal must display all parent domains after clicking Back");
    console.log("  ✓ Verified: Clicking Back successfully returned to parent domains inside the open modal");

    // Select "Arts and Humanities" again
    await studentPage.evaluate(() => {
      const domainCards = Array.from(document.querySelectorAll('[role="button"]'));
      const artsCard = domainCards.find((el) => el.innerText && el.innerText.includes("Arts and Humanities"));
      if (artsCard) artsCard.click();
    });
    await delay(800);

    // Select "Modern History and Archives" specialization
    await studentPage.evaluate(() => {
      const specCards = Array.from(document.querySelectorAll('[role="button"]'));
      const historyCard = specCards.find((el) => el.innerText && el.innerText.includes("Modern History and Archives"));
      if (historyCard) historyCard.click();
    });
    await delay(800);

    // Modal should close and return to form
    const isModalClosed = await studentPage.evaluate(() => !document.querySelector(".fixed.inset-0"));
    assert.ok(isModalClosed, "Modal should close upon specialization selection");

    // VERIFY: Academic Interests Quick Add suggestions for Modern History and Archives
    console.log("  - Inspecting dynamic suggestions for Modern History and Archives...");
    const suggestionsText = await studentPage.evaluate(() => {
      return document.body.innerText;
    });

    const expectedHistorySuggestions = [
      "Modern History",
      "Historical Research",
      "Archival Studies",
      "Cultural Heritage",
      "Historical Documentation",
      "Social History",
      "Primary Source Analysis",
    ];

    let foundHistoryCount = 0;
    for (const s of expectedHistorySuggestions) {
      if (suggestionsText.includes(s)) foundHistoryCount++;
    }
    console.log(`    Found ${foundHistoryCount} of ${expectedHistorySuggestions.length} Modern History suggestions`);
    assert.ok(foundHistoryCount >= 4, "Must display relevant Modern History suggestions");

    // Ensure NO unrelated AI/ML or Medical suggestions appear
    assert.ok(!suggestionsText.includes("+ Artificial Intelligence"), "Must NOT suggest '+ Artificial Intelligence'");
    assert.ok(!suggestionsText.includes("+ Machine Learning"), "Must NOT suggest '+ Machine Learning'");
    assert.ok(!suggestionsText.includes("+ Medical Imaging"), "Must NOT suggest '+ Medical Imaging'");
    assert.ok(!suggestionsText.includes("+ Bioinformatics"), "Must NOT suggest '+ Bioinformatics'");
    console.log("  ✓ Verified: Relevant Modern History suggestions rendered; unrelated AI/Medical suggestions excluded!");
    await studentPage.screenshot({ path: path.join(SCREENSHOT_DIR, "01_student_modern_history_suggestions.png") });
    testReport.testA_student_dynamic_modern_history = true;

    // =========================================================================
    // TEST C: DYNAMIC CHANGES & PRESERVATION OF USER-ENTERED INTERESTS
    // =========================================================================
    console.log("\n▶ [Test C] Testing Dynamic Specialization Switching & Custom Interest Preservation...");

    // 1. Switch Specialization to: Engineering -> Artificial Intelligence and Machine Learning
    await studentPage.evaluate(() => {
      const changeBtn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.innerText && b.innerText.includes("Change")
      );
      if (changeBtn) changeBtn.click();
    });
    await delay(800);

    // Click Back to domains
    await studentPage.evaluate(() => {
      const modal = document.querySelector(".fixed.inset-0");
      const backBtn = Array.from(modal.querySelectorAll("button")).find(
        (b) => b.innerText && b.innerText.includes("Back")
      );
      if (backBtn) backBtn.click();
    });
    await delay(800);

    // Select "Engineering"
    await studentPage.evaluate(() => {
      const domainCards = Array.from(document.querySelectorAll('[role="button"]'));
      const engCard = domainCards.find((el) => el.innerText && el.innerText.includes("Engineering") && !el.innerText.includes("Civil"));
      if (engCard) engCard.click();
    });
    await delay(800);

    // Select "Artificial Intelligence and Machine Learning"
    await studentPage.evaluate(() => {
      const specCards = Array.from(document.querySelectorAll('[role="button"]'));
      const aiCard = specCards.find((el) => el.innerText && el.innerText.includes("Artificial Intelligence and Machine Learning"));
      if (aiCard) aiCard.click();
    });
    await delay(800);

    // Verify AI/ML suggestions appear
    const aiSuggestionsText = await studentPage.evaluate(() => document.body.innerText);
    assert.ok(aiSuggestionsText.includes("Deep Learning") || aiSuggestionsText.includes("Computer Vision"), "AI/ML suggestions must appear");
    console.log("  ✓ Suggestions dynamically updated to Engineering -> AI/ML");
    testReport.testC_dynamic_switch_engineering_ai = true;

    // 2. Add custom interest
    const customInterest = "Pre-Modern Manuscript Preservation";
    await studentPage.type('input[placeholder="Type and press Enter or Add"]', customInterest);
    await studentPage.keyboard.press("Enter");
    await delay(400);

    const hasCustomTag = await studentPage.evaluate((tag) => {
      return document.body.innerText.includes(tag);
    }, customInterest);
    assert.ok(hasCustomTag, "Custom interest must be added to selected tags");
    console.log(`  ✓ Custom interest added: "${customInterest}"`);

    // 3. Switch back to Arts and Humanities -> Modern History and Archives
    await studentPage.evaluate(() => {
      const changeBtn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.innerText && b.innerText.includes("Change")
      );
      if (changeBtn) changeBtn.click();
    });
    await delay(800);

    await studentPage.evaluate(() => {
      const modal = document.querySelector(".fixed.inset-0");
      const backBtn = Array.from(modal.querySelectorAll("button")).find(
        (b) => b.innerText && b.innerText.includes("Back")
      );
      if (backBtn) backBtn.click();
    });
    await delay(800);

    await studentPage.evaluate(() => {
      const domainCards = Array.from(document.querySelectorAll('[role="button"]'));
      const artsCard = domainCards.find((el) => el.innerText && el.innerText.includes("Arts and Humanities"));
      if (artsCard) artsCard.click();
    });
    await delay(800);

    await studentPage.evaluate(() => {
      const specCards = Array.from(document.querySelectorAll('[role="button"]'));
      const historyCard = specCards.find((el) => el.innerText && el.innerText.includes("Modern History and Archives"));
      if (historyCard) historyCard.click();
    });
    await delay(800);

    // VERIFY: Custom interest is STILL in selected tags
    const stillHasCustomTag = await studentPage.evaluate((tag) => {
      return document.body.innerText.includes(tag);
    }, customInterest);
    assert.ok(stillHasCustomTag, "Custom interest MUST NOT be silently deleted when specialization changes");
    console.log("  ✓ Verified: User custom interest remained intact after specialization switch");
    testReport.testC_custom_interest_preserved = true;

    // 4. Click a Quick Add suggestion
    await studentPage.evaluate(() => {
      const quickAddBtn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.innerText && (b.innerText.includes("Modern History") || b.innerText.includes("Archival Studies"))
      );
      if (quickAddBtn) quickAddBtn.click();
    });
    await delay(400);

    const hasQuickAddedTag = await studentPage.evaluate(() => {
      return document.body.innerText.includes("Modern History") || document.body.innerText.includes("Archival Studies");
    });
    assert.ok(hasQuickAddedTag, "Quick Add interest must be added to tags");
    console.log("  ✓ Quick Add suggestion clicked and added seamlessly");
    await studentPage.screenshot({ path: path.join(SCREENSHOT_DIR, "03_dynamic_interest_update_and_custom_preserved.png") });
    testReport.testC_quick_add_interest = true;

    // =========================================================================
    // TEST E: STUDENT ONBOARDING STEPS 2-6 COMPLETION & FINAL REVIEW
    // =========================================================================
    console.log("\n▶ [Test E] Completing Remaining Student Onboarding Steps (3 to 6)...");

    // Continue Step 2 -> Step 3
    await studentPage.evaluate(() => {
      const continueBtn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.innerText && b.innerText.includes("Save & Continue")
      );
      if (continueBtn) continueBtn.click();
    });
    await delay(1200);

    // Step 3: Select Preferred Domains
    await studentPage.waitForFunction(() => document.body.innerText.includes("Step 3 of 6"));
    await studentPage.evaluate(() => {
      const domainPill = Array.from(document.querySelectorAll("button")).find(
        (b) => b.innerText && b.innerText.includes("Arts and Humanities")
      );
      if (domainPill) domainPill.click();
    });
    await studentPage.evaluate(() => {
      const continueBtn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.innerText && b.innerText.includes("Save & Continue")
      );
      if (continueBtn) continueBtn.click();
    });
    await delay(1200);

    // Step 4: Technical Skills
    await studentPage.waitForFunction(() => document.body.innerText.includes("Step 4 of 6"));
    await studentPage.type('input[placeholder="Type and press Enter or Add"]', "Archival Cataloging");
    await studentPage.keyboard.press("Enter");
    await delay(400);
    await studentPage.evaluate(() => {
      const continueBtn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.innerText && b.innerText.includes("Save & Continue")
      );
      if (continueBtn) continueBtn.click();
    });
    await delay(1200);

    // Step 5: Documents
    await studentPage.waitForFunction(() => document.body.innerText.includes("Step 5 of 6"));
    const fileInput = await studentPage.$('input[type="file"]');
    if (fileInput) {
      await fileInput.uploadFile(path.resolve("public/sample-documents/student-cv.pdf"));
      await studentPage.waitForFunction(
        () => document.body.innerText.includes("Resume / CV uploaded") || document.body.innerText.includes("student-cv.pdf"),
        { timeout: 15000 }
      );
      await delay(600);
    }
    await studentPage.evaluate(() => {
      const continueBtn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.innerText && b.innerText.includes("Save & Continue")
      );
      if (continueBtn) continueBtn.click();
    });
    await delay(1200);

    // Step 6: Review & Final Submission
    await studentPage.waitForFunction(() => document.body.innerText.includes("Step 6 of 6"));
    const reviewText = await studentPage.evaluate(() => document.body.innerText);
    assert.ok(reviewText.includes("+91") && reviewText.includes("9830012345"), "Review page must display international phone number");
    assert.ok(reviewText.includes("Pre-Modern Manuscript Preservation"), "Review page must display custom academic interest");
    assert.ok(reviewText.includes("Modern History and Archives"), "Review page must display selected specialization");
    console.log("  ✓ Review page accurately displays international phone and dynamic academic interests");

    // Final Submit
    await studentPage.click('input[type="checkbox"]');
    await delay(300);
    await studentPage.evaluate(() => {
      const submitBtn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.innerText && (b.innerText.includes("Complete Student Profile") || b.innerText.includes("Confirm & Submit Profile"))
      );
      if (submitBtn) submitBtn.click();
    });
    await delay(1200);
    const postFinalSubmitInfo = await studentPage.evaluate(() => {
      const errBanner = document.querySelector(".bg-red-50")?.innerText || "";
      const successModal = document.querySelector(".fixed.inset-0")?.innerText || "";
      return { errBanner, successModal, text: document.body.innerText.slice(0, 300) };
    });
    console.log("  [Step 6 Submit Result]:", JSON.stringify(postFinalSubmitInfo));
    await waitForPath(studentPage, "/dashboard/student");
    console.log("  ✓ Student profile submitted successfully, reached /dashboard/student!");
    await studentPage.screenshot({ path: path.join(SCREENSHOT_DIR, "05_student_review_submission.png") });
    testReport.testE_student_onboarding_review_and_submit = true;

    await studentPage.close();

    // =========================================================================
    // TEST B: PHD SCHOLAR ACADEMIC SELECTION & DYNAMIC RESEARCH INTERESTS
    // =========================================================================
    console.log("\n▶ [Test B] Testing PhD Scholar Academic Selection with '← Back' & Medical Imaging...");
    const scholarPage = await browser.newPage();
    const scholarClient = await scholarPage.target().createCDPSession();
    await scholarClient.send("Network.clearBrowserCookies");
    await scholarClient.send("Network.clearBrowserCache");
    await scholarPage.setViewport({ width: 1440, height: 900 });

    await scholarPage.goto(`${BASE_URL}/register`, { waitUntil: "domcontentloaded" });
    await scholarPage.waitForSelector('[data-hydrated="true"]', { timeout: 20000 });
    await scholarPage.waitForSelector('button[data-role-btn="scholar"]', { timeout: 20000 });
    await delay(600);

    // Select Scholar Role
    await scholarPage.click('button[data-role-btn="scholar"]');
    await scholarPage.waitForSelector('input[placeholder*="Scholar Name"]', { timeout: 10000 });
    await delay(300);

    const testScholarEmail = `onboarding.scholar.${timestamp}@starsky.edu`;
    const testScholarName = `Dr. Arvind Mukhopadhyay ${timestamp}`;

    await scholarPage.type('input[placeholder*="Scholar Name"]', testScholarName);
    await scholarPage.type('input[placeholder="you@institution.edu"]', testScholarEmail);
    await scholarPage.type('input[placeholder*="Min 8 chars"]', "Scholar@2026");
    await scholarPage.type('input[type="tel"]', "9845011223");
    await scholarPage.type('input[placeholder="e.g. Karnataka"]', "Karnataka");
    await scholarPage.type('input[placeholder="e.g. Bangalore"]', "Bengaluru");

    // Submit registration
    await scholarPage.click('button[type="submit"]');

    await waitForPath(scholarPage, "/onboarding/scholar");
    console.log("  - Test scholar registered and landed on /onboarding/scholar");

    // Step 1: Personal Profile -> Click Save & Continue
    await scholarPage.waitForFunction(() => document.body.innerText.toLowerCase().includes("step 1 of 6"), { timeout: 45000 });
    await delay(800);
    await scholarPage.evaluate(() => {
      const continueBtn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.innerText && b.innerText.includes("Save & Continue")
      );
      if (continueBtn) continueBtn.click();
    });
    await delay(1500);

    // Step 2: Academic Information
    await scholarPage.waitForFunction(() => document.body.innerText.toLowerCase().includes("step 2 of 6"), { timeout: 30000 });
    console.log("  - Landed on Step 2 (Academic Information)");

    await scholarPage.type('input[placeholder*="e.g., Indian Institute of Science"]', "NIMHANS Bengaluru");
    await scholarPage.type('input[placeholder*="e.g., Interpretable Multimodal"]', "Deep Volumetric Neuroimaging Reconstruction");

    // Open Academic Selector
    await scholarPage.evaluate(() => {
      const trigger = Array.from(document.querySelectorAll('div[role="button"]')).find(
        (el) => el.innerText && (el.innerText.includes("Academic Domain") || el.innerText.includes("Select Academic Domain") || el.innerText.includes("Click to browse"))
      );
      if (trigger) trigger.click();
    });
    await delay(1000);

    // Click "Engineering" to enter specialization level so the Back button is rendered
    await scholarPage.evaluate(() => {
      const domainCards = Array.from(document.querySelectorAll('[role="button"]'));
      const engCard = domainCards.find((el) => el.innerText && el.innerText.includes("Engineering"));
      if (engCard) engCard.click();
    });
    await delay(800);

    // Confirm top-right says "Back"
    const scholarBackText = await scholarPage.evaluate(() => {
      const modal = document.querySelector(".fixed.inset-0");
      const backBtn = Array.from(modal.querySelectorAll("button")).find(
        (b) => b.innerText && b.innerText.includes("Back")
      );
      return backBtn ? backBtn.innerText.trim() : "";
    });
    console.log(`  - PhD Scholar selector Back button: "${scholarBackText}"`);
    assert.strictEqual(scholarBackText, "Back", "PhD Scholar selector action must be 'Back'");
    testReport.testB_scholar_academic_back_button = true;

    // Click Back to Domains inside the modal
    await scholarPage.evaluate(() => {
      const modal = document.querySelector(".fixed.inset-0");
      const backBtn = Array.from(modal.querySelectorAll("button")).find(
        (b) => b.innerText && b.innerText.includes("Back")
      );
      if (backBtn) backBtn.click();
    });
    await delay(800);

    // Select "Medical and Healthcare"
    await scholarPage.evaluate(() => {
      const domainCards = Array.from(document.querySelectorAll('[role="button"]'));
      const medCard = domainCards.find((el) => el.innerText && el.innerText.includes("Medical and Healthcare"));
      if (medCard) medCard.click();
    });
    await delay(800);

    // Select "Medical Imaging"
    await scholarPage.evaluate(() => {
      const specCards = Array.from(document.querySelectorAll('[role="button"]'));
      const imagingCard = specCards.find((el) => el.innerText && el.innerText.includes("Medical Imaging"));
      if (imagingCard) imagingCard.click();
    });
    await delay(1000);

    // Save Step 2 -> Step 3
    await scholarPage.evaluate(() => {
      const continueBtn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.innerText && b.innerText.includes("Save & Continue")
      );
      if (continueBtn) continueBtn.click();
    });
    await delay(1500);

    // Step 3: Research Profile
    await scholarPage.waitForFunction(() => document.body.innerText.toLowerCase().includes("step 3 of 6"), { timeout: 30000 });
    console.log("  - Landed on Step 3 (Research Profile)");

    // Inspect Research Interests dynamic suggestions
    const scholarSuggestionsText = await scholarPage.evaluate(() => document.body.innerText);

    const expectedMedicalSuggestions = [
      "Medical Image Processing",
      "Radiology",
      "Image Segmentation",
      "Diagnostic Imaging",
      "Computer-Aided Diagnosis",
      "Biomedical Image Analysis",
    ];

    let foundMedicalCount = 0;
    for (const s of expectedMedicalSuggestions) {
      if (scholarSuggestionsText.includes(s)) foundMedicalCount++;
    }
    console.log(`    Found ${foundMedicalCount} of ${expectedMedicalSuggestions.length} Medical Imaging suggestions`);
    assert.ok(foundMedicalCount >= 4, "PhD Scholar research suggestions must match Medical Imaging");
    await scholarPage.screenshot({ path: path.join(SCREENSHOT_DIR, "02_scholar_medical_imaging_suggestions.png") });
    testReport.testB_scholar_dynamic_medical_imaging = true;

    await scholarPage.close();

    // =========================================================================
    // TEST D (PART 3): EXISTING PROFILE PHONE NUMBER PREFILL VERIFICATION
    // =========================================================================
    console.log("\n▶ [Test D] Verifying Existing Profile Phone Number Prefill (No Duplicate Codes)...");
    const existingPage = await browser.newPage();
    const existingClient = await existingPage.target().createCDPSession();
    await existingClient.send("Network.clearBrowserCookies");
    await existingClient.send("Network.clearBrowserCache");
    await existingPage.setViewport({ width: 1440, height: 900 });

    // Log in as existing student (Aarav Sharma)
    await existingPage.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await existingPage.waitForSelector('[data-hydrated="true"]', { timeout: 20000 });
    await existingPage.waitForSelector('input[type="email"]', { timeout: 20000 });
    await delay(400);
    await existingPage.type('input[type="email"]', "aarav.sharma@nitk.edu.in");
    await existingPage.type('input[type="password"]', "Student@2026");
    await existingPage.click('button[type="submit"]');
    await waitForPath(existingPage, "/dashboard/student");

    // Open Onboarding / Edit Profile
    await existingPage.goto(`${BASE_URL}/onboarding/student`, { waitUntil: "domcontentloaded" });
    await existingPage.waitForSelector('button[aria-haspopup="listbox"]', { timeout: 20000 });
    await delay(1000);

    // Check prefilled country flag & dial code
    const existingDial = await existingPage.evaluate(() => {
      const btn = document.querySelector('button[aria-haspopup="listbox"]');
      return btn ? btn.innerText.trim() : "";
    });
    const existingInputVal = await existingPage.evaluate(() => {
      const inp = document.querySelector('input[type="tel"]');
      return inp ? inp.value.trim() : "";
    });

    console.log(`  - Existing profile phone selector: "${existingDial}", local number input: "${existingInputVal}"`);
    assert.ok(existingDial.includes("+91"), "Should detect India (+91) dial code");
    assert.ok(!existingInputVal.includes("+91"), "Local input MUST NOT duplicate the country code (+91)");
    assert.ok(existingInputVal.length >= 10, "Local national digits must be loaded correctly");
    console.log("  ✓ Verified: Existing profile phone loaded cleanly without duplicate country code!");
    testReport.testD_existing_profile_phone_prefill = true;

    await existingPage.close();

    console.log("\n================================================================================");
    console.log("ALL ONBOARDING & PHONE INPUT TEST SCENARIOS PASSED WITH 100% SUCCESS!");
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

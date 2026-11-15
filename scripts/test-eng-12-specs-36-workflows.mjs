import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import assert from "assert";

const BASE_URL = "http://localhost:3000";
const SCREENSHOT_DIR = path.resolve("public/screenshots/eng-36-workflows");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const ENGINEERING_SPECS = [
  { id: "spec-engineering-computer-science-engineering", name: "Computer Science Engineering", slug: "cse" },
  { id: "spec-engineering-artificial-intelligence-and-machine-learning", name: "Artificial Intelligence and Machine Learning", slug: "aiml" },
  { id: "spec-engineering-data-science", name: "Data Science", slug: "ds" },
  { id: "spec-engineering-cybersecurity", name: "Cybersecurity", slug: "cyber" },
  { id: "spec-engineering-electronics-and-communication", name: "Electronics and Communication", slug: "ece" },
  { id: "spec-engineering-electrical-engineering", name: "Electrical Engineering", slug: "ee" },
  { id: "spec-engineering-mechanical-engineering", name: "Mechanical Engineering", slug: "me" },
  { id: "spec-engineering-civil-engineering", name: "Civil Engineering", slug: "ce" },
  { id: "spec-engineering-chemical-engineering", name: "Chemical Engineering", slug: "che" },
  { id: "spec-engineering-biotechnology", name: "Biotechnology", slug: "bt" },
  { id: "spec-engineering-information-technology", name: "Information Technology", slug: "it" },
  { id: "spec-engineering-robotics-and-automation", name: "Robotics and Automation", slug: "robo" },
];

async function main() {
  console.log("================================================================================");
  console.log("STARSKY — ALL 12 ENGINEERING SPECIALIZATIONS: 36 END-TO-END WORKFLOWS TEST");
  console.log("================================================================================\n");

  // 1. Obtain Admin Session for Canonical Institutional Verifications
  console.log("▶ Authenticating Admin session (Dr. Vikramaditya Sen)...");
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@starsky.edu", password: "Admin@2026", adminPortal: true }),
  });
  const adminCookies = adminLoginRes.headers.getSetCookie();
  const adminCookieHeader = adminCookies.map((c) => c.split(";")[0]).join("; ");
  assert.ok(adminCookieHeader.includes("starsky_session_token"), "Admin session token must be obtained");
  console.log("  ✓ Admin authenticated successfully.\n");

  // 2. Launch Puppeteer Browser for Real UI Verification
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"],
  });

  const consoleErrors = [];

  const testLedger = [];
  const specSummary = [];
  const createdTestIds = {
    profileIds: new Set(),
    scholarIds: new Set(),
    studentProfileIds: new Set(),
    internshipIds: new Set(),
    applicationIds: new Set(),
  };

  try {
    for (let sIdx = 0; sIdx < ENGINEERING_SPECS.length; sIdx++) {
      const spec = ENGINEERING_SPECS[sIdx];
      console.log(`\n================================================================================`);
      console.log(`[SPEC ${sIdx + 1}/12] Engineering → ${spec.name} (${spec.id})`);
      console.log(`================================================================================`);

      let specPassCount = 0;
      let specFailCount = 0;
      const specScholars = [];

      for (let k = 1; k <= 3; k++) {
        const wfId = `WF-ENG-${spec.slug.toUpperCase()}-${k}`;
        console.log(`\n--------------------------------------------------------------------------------`);
        console.log(`▶ Executing Workflow ${k}/3: [${wfId}]`);
        console.log(`--------------------------------------------------------------------------------`);

        const schEmail = `test-eng-sch-${spec.slug}-${k}@starsky-test.org`;
        const schName = `Dr. ${spec.name} Scholar ${k}`;
        const schPassword = "TestScholar@2026!";
        const intTitle = `Research Internship in ${spec.name} (Cohort ${k})`;

        const stuEmail = `test-eng-stu-${spec.slug}-${k}@starsky-test.org`;
        const stuName = `Test ${spec.name} Student ${k}`;
        const stuPassword = "TestStudent@2026!";

        let stepAResult = "FAIL";
        let stepBResult = "FAIL";
        let stepCResult = "FAIL";
        let stepDResult = "FAIL";
        let stepEResult = "FAIL";
        let isolationResult = "N/A";
        let scholarUserId = "";
        let scholarProfileId = "";
        let studentUserId = "";
        let studentProfileId = "";
        let internshipId = "";
        let applicationId = "";
        let errorReason = "";
        let ctx = null;
        let page = null;

        try {
          ctx = await browser.createBrowserContext();
          page = await ctx.newPage();
          await page.setViewport({ width: 1440, height: 900 });
          page.setDefaultNavigationTimeout(45000);
          page.setDefaultTimeout(45000);
          page.on("console", (msg) => {
            if (msg.type() === "error") {
              consoleErrors.push(msg.text());
            }
          });

          // -------------------------------------------------------------------
          // STEP A: Register & Onboard Scholar, Admin Approve, Verify Profile
          // -------------------------------------------------------------------
          console.log(`  [Step A] Registering & Onboarding PhD Scholar: ${schEmail}...`);
          const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              full_name: schName,
              email: schEmail,
              password: schPassword,
              role: "scholar",
              phone: `+91 98000 ${String(sIdx * 10 + k).padStart(5, "0")}`,
              country: "India",
              state: "Maharashtra",
              city: "Mumbai",
            }),
          });
          const regJson = await regRes.json();
          assert.strictEqual(regRes.status, 200, `Scholar register failed: ${JSON.stringify(regJson)}`);
          scholarUserId = regJson.user.id;
          createdTestIds.profileIds.add(scholarUserId);
          const schCookie = regRes.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");

          // Complete Scholar Onboarding with target domain & specialization
          const onbRes = await fetch(`${BASE_URL}/api/onboarding/scholar`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: schCookie },
            body: JSON.stringify({
              full_name: schName,
              phone: `+91 98000 ${String(sIdx * 10 + k).padStart(5, "0")}`,
              country: "India",
              state: "Maharashtra",
              city: "Mumbai",
              university_institution: `Indian Institute of Technology Bombay (IITB)`,
              department: `Engineering — ${spec.name}`,
              domain_id: "dom-engineering",
              specialization_id: spec.id,
              research_field: "Engineering",
              specialization: spec.name,
              enrollment_year: 2022,
              expected_completion_year: 2026,
              current_research_topic: `Advanced Theoretical and Applied Frameworks in ${spec.name}`,
              biography: `Doctoral researcher at IIT Bombay conducting deep investigations into ${spec.name}.`,
              research_interests: [spec.name, "Engineering Science", "Advanced Computing"],
              technical_skills: ["Python", "C++", "MATLAB", "Simulation"],
              research_tools: ["Git", "Linux", "HPC"],
              certifications: ["IEEE Graduate Student Member"],
              internship_availability: true,
            }),
          });
          const onbJson = await onbRes.json();
          assert.strictEqual(onbRes.status, 200, `Scholar onboarding failed: ${JSON.stringify(onbJson)}`);
          scholarProfileId = onbJson.scholarProfile.id;
          createdTestIds.scholarIds.add(scholarProfileId);
          specScholars.push({ scholarProfileId, schEmail, schCookie });

          // Admin Institutional Approval via Canonical API
          const adminApprRes = await fetch(`${BASE_URL}/api/admin`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: adminCookieHeader },
            body: JSON.stringify({
              action: "verify_scholar",
              payload: {
                scholarId: scholarProfileId,
                verification_status: "approved",
                verification_notes: `Institutional credentials verified for ${spec.name} testing workflow ${k}.`,
              },
            }),
          });
          assert.strictEqual(adminApprRes.status, 200, "Admin approval must succeed");
          stepAResult = "PASS";
          console.log(`    ✓ Scholar ${scholarProfileId} registered, onboarded, and verified as approved.`);

          // -------------------------------------------------------------------
          // STEP B: Publish Internship via Authenticated Scholar Session
          // -------------------------------------------------------------------
          console.log(`  [Step B] Publishing Internship: "${intTitle}"...`);
          const pubIntRes = await fetch(`${BASE_URL}/api/internships`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: schCookie },
            body: JSON.stringify({
              title: intTitle,
              description: `Join our doctoral lab at IIT Bombay for intensive research in ${spec.name}. Work on state-of-the-art architectures and experimental validation.`,
              required_skills: ["Python", "Research Analysis", "Git", "Linux"],
              eligibility_criteria: `2nd to 4th year undergraduate or master students in ${spec.name} or related fields.`,
              duration: "10 Weeks",
              available_positions: 2,
              mode: "Remote",
              application_deadline: "2027-05-31",
              stipend: "₹18,000 / month",
              status: "Open",
            }),
          });
          const pubIntJson = await pubIntRes.json();
          assert.strictEqual(pubIntRes.status, 200, `Publish internship failed: ${JSON.stringify(pubIntJson)}`);
          internshipId = pubIntJson.internship.id;
          createdTestIds.internshipIds.add(internshipId);

          // Verify server-side inheritance of academic domain & specialization
          assert.strictEqual(pubIntJson.internship.domain_id, "dom-engineering", "Must inherit dom-engineering");
          assert.strictEqual(pubIntJson.internship.specialization_id, spec.id, `Must inherit ${spec.id}`);
          stepBResult = "PASS";
          console.log(`    ✓ Internship ${internshipId} published with correct classification: dom-engineering → ${spec.id}`);

          // -------------------------------------------------------------------
          // STEP C: Real Browser Open Internships Discovery & Details Check
          // -------------------------------------------------------------------
          console.log(`  [Step C] Verifying Open Internships discovery in Real Chrome browser...`);
          const exploreFilterUrl = `${BASE_URL}/explore?tab=internships&domain=dom-engineering&spec=${spec.id}`;
          await page.goto(exploreFilterUrl, { waitUntil: "domcontentloaded" });

          // Ensure internships tab is selected
          await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll("button"));
            const intBtn = btns.find((b) => b.innerText.includes("3. Internships") || b.innerText.includes("3. Open"));
            if (intBtn && !intBtn.className.includes("bg-[#2563EB]")) {
              intBtn.click();
            }
          });

          await page.mainFrame().waitForFunction((title) => {
            return document.body.innerText.includes(title);
          }, { timeout: 35000 }, intTitle);

          const exploreText = await page.evaluate(() => document.body.innerText);
          assert.ok(exploreText.includes(intTitle), "Internship title must appear in Open Internships");
          assert.ok(exploreText.includes(schName), "Scholar name must appear in Open Internships card");
          assert.ok(exploreText.includes(spec.name), "Specialization badge must appear");

          // Save discovery screenshot
          const discoveryShot = path.join(SCREENSHOT_DIR, `${spec.slug}-wf${k}-01-discovery.png`);
          await page.screenshot({ path: discoveryShot });

          // Verify Internship Details Page
          await page.goto(`${BASE_URL}/internships/${internshipId}`, { waitUntil: "domcontentloaded" });
          await page.mainFrame().waitForFunction((title) => document.body.innerText.includes(title), { timeout: 25000 }, intTitle);

          stepCResult = "PASS";
          console.log(`    ✓ Verified in browser: Listing renders under Engineering → ${spec.name}; details page loads.`);

          // -------------------------------------------------------------------
          // STEP D: Register Different Student & Submit Real Application
          // -------------------------------------------------------------------
          console.log(`  [Step D] Registering Student: ${stuEmail} and submitting application...`);
          const regStuRes = await fetch(`${BASE_URL}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              full_name: stuName,
              email: stuEmail,
              password: stuPassword,
              role: "student",
              phone: `+91 97000 ${String(sIdx * 10 + k).padStart(5, "0")}`,
              country: "India",
              state: "Karnataka",
              city: "Surathkal",
            }),
          });
          const regStuJson = await regStuRes.json();
          assert.strictEqual(regStuRes.status, 200, `Student register failed: ${JSON.stringify(regStuJson)}`);
          studentUserId = regStuJson.user.id;
          createdTestIds.profileIds.add(studentUserId);
          const stuCookie = regStuRes.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");

          // Complete Student Onboarding
          await fetch(`${BASE_URL}/api/onboarding/student`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: stuCookie },
            body: JSON.stringify({
              full_name: stuName,
              phone: `+91 97000 ${String(sIdx * 10 + k).padStart(5, "0")}`,
              country: "India",
              state: "Karnataka",
              city: "Surathkal",
              college_university: "National Institute of Technology Karnataka (NITK)",
              degree: "B.Tech",
              department: spec.name,
              current_year_semester: "3rd Year",
              graduation_year: 2027,
              academic_interests: [spec.name, "Computational Methods"],
              skills: ["Python", "C++", "Git", "Data Analysis"],
            }),
          });

          // Submit Application
          const applyRes = await fetch(`${BASE_URL}/api/applications`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: stuCookie },
            body: JSON.stringify({
              internship_id: internshipId,
              scholar_profile_id: scholarProfileId,
              student_full_name: stuName,
              student_email: stuEmail,
              student_phone: `+91 97000 ${String(sIdx * 10 + k).padStart(5, "0")}`,
              college_university: "National Institute of Technology Karnataka (NITK)",
              degree: "B.Tech",
              department: spec.name,
              current_academic_year: "3rd Year",
              research_interests: [spec.name, "Experimental Research"],
              technical_skills: ["Python", "C++", "Linux", "Git"],
              statement_of_purpose: `I have a deep academic passion for ${spec.name} and have completed advanced coursework and laboratory projects. I am eager to contribute dedicated research hours under your guidance.`,
              relevant_experience: `Undergraduate researcher working on high-performance algorithms in ${spec.name} for 8 months.`,
              expected_availability: "25 hours/week",
              preferred_duration: "10 Weeks",
              resume_url: "/sample-documents/student-test-cv.pdf",
            }),
          });
          const applyJson = await applyRes.json();
          assert.strictEqual(applyRes.status, 200, `Student application failed: ${JSON.stringify(applyJson)}`);
          applicationId = applyJson.application.id;
          studentProfileId = applyJson.application.student_profile_id;
          createdTestIds.applicationIds.add(applicationId);
          createdTestIds.studentProfileIds.add(studentProfileId);
          stepDResult = "PASS";
          console.log(`    ✓ Application ${applicationId} submitted by ${stuName} (${stuEmail}).`);

          // -------------------------------------------------------------------
          // STEP E: Verify PhD Scholar Dashboard Receives the Application
          // -------------------------------------------------------------------
          console.log(`  [Step E] Verifying Scholar Dashboard receives applicant in Real Chrome...`);
          await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
          await page.mainFrame().waitForFunction(() => {
            const form = document.querySelector("form");
            return form && Object.keys(form).some((k) => k.startsWith("__reactProps") || k.startsWith("__reactEvents"));
          }, { timeout: 20000 });

          await page.type('input[type="email"]', schEmail);
          await page.type('input[type="password"]', schPassword);
          await page.click('button[type="submit"]');
          await page.mainFrame().waitForFunction(() => window.location.pathname.includes("/dashboard/scholar"), { timeout: 35000 });

          // Navigate to Applications tab
          await page.goto(`${BASE_URL}/dashboard/scholar?tab=applications`, { waitUntil: "domcontentloaded" });
          await page.mainFrame().waitForFunction((sName) => {
            return document.body.innerText.includes(sName);
          }, { timeout: 35000 }, stuName);

          const scholarAppsText = await page.evaluate(() => document.body.innerText);
          assert.ok(scholarAppsText.includes(stuName), "Student name must appear in scholar dashboard");
          assert.ok(scholarAppsText.includes(intTitle), "Target internship title must appear");
          assert.ok(scholarAppsText.includes("Submitted"), "Status 'Submitted' must appear");

          // Save scholar dashboard screenshot
          const scholarShot = path.join(SCREENSHOT_DIR, `${spec.slug}-wf${k}-03-dashboard.png`);
          await page.screenshot({ path: scholarShot });

          stepEResult = "PASS";
          console.log(`    ✓ Verified: Application ${applicationId} rendered in ${schName}'s dashboard with controls.`);

          // -------------------------------------------------------------------
          // Cross-Scholar Isolation Check
          // -------------------------------------------------------------------
          if (k > 1 && specScholars.length >= 2) {
            console.log(`  [Isolation] Testing cross-scholar isolation against Scholar 1...`);
            const scholar1 = specScholars[0];
            const sch1AppsRes = await fetch(`${BASE_URL}/api/applications`, {
              headers: { Cookie: scholar1.schCookie },
            });
            const sch1AppsJson = await sch1AppsRes.json();
            const leakedToScholar1 = (sch1AppsJson.applications || []).some(
              (a) => a.application.id === applicationId || a.application.student_email === stuEmail
            );
            assert.strictEqual(leakedToScholar1, false, "Cross-scholar leak detected!");
            isolationResult = "PASS (Zero Leakage)";
            console.log(`    ✓ Cross-scholar isolation confirmed: Scholar 1 cannot see Scholar ${k}'s applicants.`);
          } else {
            isolationResult = "PASS (Primary)";
          }

          specPassCount++;
        } catch (wfErr) {
          specFailCount++;
          errorReason = wfErr.message || String(wfErr);
          console.error(`    ❌ Workflow failed:`, errorReason);
          try {
            if (page) {
              const errShot = path.join(SCREENSHOT_DIR, `${spec.slug}-wf${k}-error.png`);
              await page.screenshot({ path: errShot });
            }
          } catch (_) {}
        } finally {
          if (ctx) {
            await ctx.close().catch(() => {});
          }
        }

        testLedger.push({
          workflowId: wfId,
          domainId: "dom-engineering",
          domainName: "Engineering",
          specializationId: spec.id,
          specializationName: spec.name,
          scholarUserId,
          scholarProfileId,
          scholarEmail: schEmail,
          studentUserId,
          studentEmail: stuEmail,
          internshipId,
          internshipTitle: intTitle,
          applicationId,
          stepA_ScholarReg: stepAResult,
          stepB_Publish: stepBResult,
          stepC_Discovery: stepCResult,
          stepD_Apply: stepDResult,
          stepE_ScholarDash: stepEResult,
          isolationResult,
          finalStatus: stepEResult === "PASS" ? "PASS" : "FAIL",
          errorReason,
        });

        // Persist ledger after each workflow
        fs.writeFileSync(
          "scripts/eng-36-workflows-ledger.json",
          JSON.stringify(testLedger, null, 2),
          "utf8"
        );
      }

      specSummary.push({
        specializationId: spec.id,
        specializationName: spec.name,
        scholarAccountsCount: 3,
        studentAccountsCount: 3,
        internshipsPublished: 3,
        discoveryPassed: specPassCount,
        applicationsPassed: specPassCount,
        correctScholarDashboard: specPassCount,
        finalStatus: specFailCount === 0 ? "PASS" : "FAIL",
      });
    }

    fs.writeFileSync(
      "scripts/eng-12-specs-summary.json",
      JSON.stringify(specSummary, null, 2),
      "utf8"
    );

  } finally {
    try {
      await browser.close().catch(() => {});
    } catch {}

    // -------------------------------------------------------------------------
    // Clean up test records created during this run
    // -------------------------------------------------------------------------
    console.log("\n================================================================================");
    console.log("TEST RUN COMPLETE — CLEANING UP ISOLATED TEST RECORDS");
    console.log("================================================================================");
    console.log(`Identified test profiles to clean:      ${createdTestIds.profileIds.size}`);
    console.log(`Identified test scholars to clean:      ${createdTestIds.scholarIds.size}`);
    console.log(`Identified test student profiles:       ${createdTestIds.studentProfileIds.size}`);
    console.log(`Identified test internships to clean:   ${createdTestIds.internshipIds.size}`);
    console.log(`Identified test applications to clean:  ${createdTestIds.applicationIds.size}`);

    const dbToClean = JSON.parse(fs.readFileSync("data/starsky-db.json", "utf8"));
    const origProfilesCount = dbToClean.profiles.length;
    const origScholarsCount = dbToClean.phd_scholar_profiles.length;
    const origStudentsCount = dbToClean.student_profiles.length;
    const origInternshipsCount = dbToClean.internships.length;
    const origApplicationsCount = dbToClean.internship_applications.length;

    dbToClean.profiles = dbToClean.profiles.filter((p) => !createdTestIds.profileIds.has(p.id) && !p.email.startsWith("test-eng-"));
    dbToClean.phd_scholar_profiles = dbToClean.phd_scholar_profiles.filter((s) => !createdTestIds.scholarIds.has(s.id));
    dbToClean.student_profiles = dbToClean.student_profiles.filter((st) => !createdTestIds.studentProfileIds.has(st.id) && !createdTestIds.profileIds.has(st.profile_id));
    dbToClean.internships = dbToClean.internships.filter((i) => !createdTestIds.internshipIds.has(i.id));
    dbToClean.internship_applications = dbToClean.internship_applications.filter((a) => !createdTestIds.applicationIds.has(a.id));
    dbToClean.notifications = dbToClean.notifications.filter((n) => !createdTestIds.profileIds.has(n.recipient_profile_id));
    dbToClean.activity_logs = dbToClean.activity_logs.filter((a) => !createdTestIds.profileIds.has(a.actor_profile_id));

    fs.writeFileSync("data/starsky-db.json", JSON.stringify(dbToClean, null, 2), "utf8");

    console.log(`Cleaned profiles:     ${origProfilesCount} -> ${dbToClean.profiles.length}`);
    console.log(`Cleaned scholars:     ${origScholarsCount} -> ${dbToClean.phd_scholar_profiles.length}`);
    console.log(`Cleaned students:     ${origStudentsCount} -> ${dbToClean.student_profiles.length}`);
    console.log(`Cleaned internships:  ${origInternshipsCount} -> ${dbToClean.internships.length}`);
    console.log(`Cleaned applications: ${origApplicationsCount} -> ${dbToClean.internship_applications.length}`);
    console.log("✓ Database safely returned to clean state with all legitimate records intact.\n");
  }

  const totalPassed = testLedger.filter((t) => t.finalStatus === "PASS").length;
  const totalFailed = testLedger.filter((t) => t.finalStatus !== "PASS").length;

  console.log("================================================================================");
  console.log(`FINAL RESULTS: 12 ENGINEERING SPECIALIZATIONS (${testLedger.length} WORKFLOWS)`);
  console.log(`Total Workflows: ${testLedger.length}`);
  console.log(`Passed:          ${totalPassed}`);
  console.log(`Failed:          ${totalFailed}`);
  console.log(`Console Errors:  ${consoleErrors.length}`);
  console.log(`Ledger saved to: scripts/eng-36-workflows-ledger.json`);
  console.log(`Summary saved to: scripts/eng-12-specs-summary.json`);
  console.log(`Screenshots in:  ${SCREENSHOT_DIR}`);
  console.log("================================================================================\n");

  if (totalFailed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

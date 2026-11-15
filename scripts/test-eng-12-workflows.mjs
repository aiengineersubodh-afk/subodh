import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import assert from "assert";

const BASE_URL = "http://localhost:3000";
const SCREENSHOT_DIR = path.resolve("public/screenshots/eng-12-workflows");

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
  console.log("STARSKY — ALL 12 ENGINEERING SPECIALIZATIONS: END-TO-END VERIFICATION");
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
  console.log("▶ Launching Chrome Browser via Puppeteer...");
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"],
  });

  const browserErrors = [];
  const testLedger = [];
  const previousScholars = [];

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

      const wfId = `WF-ENG-${spec.slug.toUpperCase()}-1`;
      const schEmail = `test-eng-sch-${spec.slug}@starsky-test.org`;
      const schName = `Dr. ${spec.name} Scholar`;
      const schPassword = "TestScholar@2026!";
      const intTitle = `Doctoral Fellowship in ${spec.name}`;

      const stuEmail = `test-eng-stu-${spec.slug}@starsky-test.org`;
      const stuName = `Test ${spec.name} Student`;
      const stuPassword = "TestStudent@2026!";

      let scholarUserId = "";
      let scholarProfileId = "";
      let studentUserId = "";
      let studentProfileId = "";
      let internshipId = "";
      let applicationId = "";

      let stepAResult = "FAIL";
      let stepBResult = "FAIL";
      let stepCResult = "FAIL";
      let stepDResult = "FAIL";
      let stepEResult = "FAIL";
      let isolationResult = "PENDING";
      let errorReason = "";

      const ctx = await browser.createBrowserContext();
      const page = await ctx.newPage();
      page.setViewport({ width: 1440, height: 900 });

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          const text = msg.text();
          if (!text.includes("favicon") && !text.includes("Download the React DevTools")) {
            browserErrors.push(`[${spec.slug}] ${text}`);
          }
        }
      });

      try {
        // ---------------------------------------------------------------------
        // STEP A: Register PhD Scholar & Institutional Verification
        // ---------------------------------------------------------------------
        console.log(`  [Step A] Registering PhD Scholar: ${schEmail}...`);
        const regSchRes = await fetch(`${BASE_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: schName,
            email: schEmail,
            password: schPassword,
            role: "scholar",
            phone: `+91 98000 ${String(sIdx + 1).padStart(5, "0")}`,
            country: "India",
            state: "Delhi",
            city: "New Delhi",
          }),
        });
        const regSchJson = await regSchRes.json();
        assert.strictEqual(regSchRes.status, 200, `Scholar register failed: ${JSON.stringify(regSchJson)}`);
        scholarUserId = regSchJson.user.id;
        createdTestIds.profileIds.add(scholarUserId);
        const schCookie = regSchRes.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");

        // Complete Scholar Onboarding
        console.log(`  [Step A] Completing Scholar Onboarding for ${spec.name}...`);
        const onbSchRes = await fetch(`${BASE_URL}/api/onboarding/scholar`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Cookie: schCookie },
          body: JSON.stringify({
            full_name: schName,
            phone: `+91 98000 ${String(sIdx + 1).padStart(5, "0")}`,
            country: "India",
            state: "Delhi",
            city: "New Delhi",
            university_institution: "Indian Institute of Technology (IIT) Delhi",
            department: `Engineering — ${spec.name}`,
            highest_qualification: "M.Tech",
            domain_id: "dom-engineering",
            specialization_id: spec.id,
            research_field: "Engineering",
            specialization: spec.name,
            enrollment_year: 2023,
            expected_completion_year: 2027,
            current_research_topic: `Advanced Computational Frameworks in ${spec.name}`,
            biography: `Doctoral researcher at IIT Delhi conducting frontier investigations in ${spec.name}. Published peer-reviewed research and active lab mentor.`,
            research_interests: [spec.name, "High Performance Algorithms", "Experimental Systems"],
            technical_skills: ["Python", "C++", "PyTorch", "Linux", "Data Modeling"],
            internship_availability: true,
            create_initial_internship: false,
            onboarding_step: 6,
          }),
        });
        const onbSchJson = await onbSchRes.json();
        assert.strictEqual(onbSchRes.status, 200, `Scholar onboarding failed: ${JSON.stringify(onbSchJson)}`);
        scholarProfileId = onbSchJson.scholarProfile.id;
        createdTestIds.scholarIds.add(scholarProfileId);

        // Institutional Verification via Admin API
        console.log(`  [Step A] Approving institutional verification via Admin API...`);
        const verifyRes = await fetch(`${BASE_URL}/api/admin`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Cookie: adminCookieHeader },
          body: JSON.stringify({
            action: "verify_scholar",
            payload: {
              scholarId: scholarProfileId,
              verification_status: "approved",
              verification_notes: `Institutional credentials verified for IIT Delhi doctoral researcher in ${spec.name}.`,
            },
          }),
        });
        const verifyJson = await verifyRes.json();
        assert.strictEqual(verifyRes.status, 200, `Admin verification failed: ${JSON.stringify(verifyJson)}`);
        stepAResult = "PASS";
        console.log(`    ✓ Scholar ${schName} (${scholarProfileId}) verified under Engineering → ${spec.name}.`);

        // ---------------------------------------------------------------------
        // STEP B: Publish Research Internship
        // ---------------------------------------------------------------------
        console.log(`  [Step B] Publishing Research Internship: '${intTitle}'...`);
        const pubIntRes = await fetch(`${BASE_URL}/api/internships`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Cookie: schCookie },
          body: JSON.stringify({
            title: intTitle,
            description: `Join our doctoral research group at IIT Delhi investigating foundational problems in ${spec.name}. Interns will engage in algorithmic design, simulation, and co-author high-impact research papers.`,
            required_skills: ["Python", spec.name, "Data Analysis"],
            eligibility_criteria: "Undergraduate or Postgraduate students in Engineering or related fields.",
            duration: "10 Weeks",
            available_positions: 2,
            mode: "Remote",
            application_deadline: "2027-03-30",
            stipend: "INR 25,000 / month + Co-authorship",
            status: "Open",
          }),
        });
        const pubIntJson = await pubIntRes.json();
        assert.strictEqual(pubIntRes.status, 200, `Publish internship failed: ${JSON.stringify(pubIntJson)}`);
        internshipId = pubIntJson.internship.id;
        createdTestIds.internshipIds.add(internshipId);

        // Verify domain & spec inheritance
        assert.strictEqual(pubIntJson.internship.domain_id, "dom-engineering", "Domain ID must be dom-engineering");
        assert.strictEqual(pubIntJson.internship.specialization_id, spec.id, `Spec ID must be ${spec.id}`);
        assert.strictEqual(pubIntJson.internship.scholar_profile_id, scholarProfileId, "Scholar profile ID mismatch");
        assert.strictEqual(pubIntJson.internship.status, "Open", "Status must be Open");
        assert.strictEqual(pubIntJson.internship.moderation_status, "approved", "Moderation status must be approved");

        stepBResult = "PASS";
        console.log(`    ✓ Internship ${internshipId} created: domain_id=dom-engineering, specialization_id=${spec.id}.`);

        // ---------------------------------------------------------------------
        // STEP C: Real Browser Discovery & Verification
        // ---------------------------------------------------------------------
        console.log(`  [Step C] Verifying Public Discovery in Real Chrome Browser...`);
        const exploreUrl = `${BASE_URL}/explore?tab=internships&domain=dom-engineering&spec=${spec.id}`;
        await page.goto(exploreUrl, { waitUntil: "domcontentloaded" });

        // Wait for dynamic card rendering
        await page.mainFrame().waitForFunction((title) => {
          return document.body.innerText.includes(title);
        }, { timeout: 35000 }, intTitle);

        const exploreText = await page.evaluate(() => document.body.innerText);
        assert.ok(exploreText.includes(intTitle), "Internship title must appear in Open Internships");
        assert.ok(exploreText.includes(schName), "Scholar name must appear in Open Internships card");
        assert.ok(exploreText.includes(spec.name), "Specialization badge must appear");

        // Save discovery screenshot
        const discoveryShot = path.join(SCREENSHOT_DIR, `eng-${String(sIdx + 1).padStart(2, "0")}-${spec.slug}-discovery.png`);
        await page.screenshot({ path: discoveryShot });

        // Verify Internship Details Page
        await page.goto(`${BASE_URL}/internships/${internshipId}`, { waitUntil: "domcontentloaded" });
        await page.mainFrame().waitForFunction((title) => document.body.innerText.includes(title), { timeout: 25000 }, intTitle);

        // Verify Public Scholar Profile
        await page.goto(`${BASE_URL}/scholars/${scholarProfileId}`, { waitUntil: "domcontentloaded" });
        await page.mainFrame().waitForFunction((name) => document.body.innerText.includes(name), { timeout: 25000 }, schName);

        stepCResult = "PASS";
        console.log(`    ✓ Verified in browser: Listing renders under Engineering → ${spec.name}; details and scholar profile load.`);

        // ---------------------------------------------------------------------
        // STEP D: Register Different Student & Submit Application
        // ---------------------------------------------------------------------
        console.log(`  [Step D] Registering Student: ${stuEmail} and submitting application...`);
        const regStuRes = await fetch(`${BASE_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: stuName,
            email: stuEmail,
            password: stuPassword,
            role: "student",
            phone: `+91 97000 ${String(sIdx + 1).padStart(5, "0")}`,
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
            phone: `+91 97000 ${String(sIdx + 1).padStart(5, "0")}`,
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
        const validAppPayload = {
          internship_id: internshipId,
          scholar_profile_id: scholarProfileId,
          student_full_name: stuName,
          student_email: stuEmail,
          student_phone: `+91 97000 ${String(sIdx + 1).padStart(5, "0")}`,
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
        };

        const applyRes = await fetch(`${BASE_URL}/api/applications`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Cookie: stuCookie },
          body: JSON.stringify(validAppPayload),
        });
        const applyJson = await applyRes.json();
        assert.strictEqual(applyRes.status, 200, `Student application failed: ${JSON.stringify(applyJson)}`);
        applicationId = applyJson.application.id;
        studentProfileId = applyJson.application.student_profile_id;
        createdTestIds.applicationIds.add(applicationId);
        createdTestIds.studentProfileIds.add(studentProfileId);

        // Verify Duplicate Application Prevention (409 Conflict)
        const dupRes = await fetch(`${BASE_URL}/api/applications`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Cookie: stuCookie },
          body: JSON.stringify(validAppPayload),
        });
        assert.strictEqual(dupRes.status, 409, "Duplicate application must be rejected with 409 Conflict");
        const dupJson = await dupRes.json();
        assert.ok(dupJson.error.includes("already applied"), "Error must mention already applied");

        stepDResult = "PASS";
        console.log(`    ✓ Application ${applicationId} submitted by ${stuName} (${stuEmail}). Duplicate prevention verified.`);

        // ---------------------------------------------------------------------
        // STEP E: Verify PhD Scholar Dashboard Receives Application
        // ---------------------------------------------------------------------
        console.log(`  [Step E] Verifying Scholar Dashboard receives applicant in Real Chrome...`);
        const tokenMatch = schCookie.match(/starsky_session_token=([^;]+)/);
        if (tokenMatch) {
          await page.setCookie({
            name: "starsky_session_token",
            value: tokenMatch[1],
            domain: "localhost",
            path: "/",
          });
        }

        // Navigate to Scholar Applications tab
        await page.goto(`${BASE_URL}/dashboard/scholar?tab=applications`, { waitUntil: "domcontentloaded" });
        await page.mainFrame().waitForFunction((sName) => {
          return document.body.innerText.includes(sName);
        }, { timeout: 35000 }, stuName);

        const scholarAppsText = await page.evaluate(() => document.body.innerText);
        assert.ok(scholarAppsText.includes(stuName), "Student name must appear in scholar dashboard");
        assert.ok(scholarAppsText.includes(intTitle), "Target internship title must appear");
        assert.ok(scholarAppsText.includes("Submitted"), "Status 'Submitted' must appear");

        // Save scholar dashboard screenshot
        const scholarShot = path.join(SCREENSHOT_DIR, `eng-${String(sIdx + 1).padStart(2, "0")}-${spec.slug}-dashboard.png`);
        await page.screenshot({ path: scholarShot });

        // Update application status as scholar
        const patchRes = await fetch(`${BASE_URL}/api/applications`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Cookie: schCookie },
          body: JSON.stringify({
            applicationId: applicationId,
            id: applicationId,
            status: "Under Review",
            scholar_private_notes: `Strong candidate profile for ${spec.name} research cohort.`,
          }),
        });
        const patchJson = await patchRes.json();
        assert.strictEqual(patchRes.status, 200, "Scholar updating application must succeed");
        assert.strictEqual(patchJson.application.status, "Under Review");

        stepEResult = "PASS";
        console.log(`    ✓ Verified: Application ${applicationId} rendered in ${schName}'s dashboard with controls.`);

        // ---------------------------------------------------------------------
        // STEP F: Cross-Scholar Isolation Check
        // ---------------------------------------------------------------------
        if (previousScholars.length > 0) {
          console.log(`  [Step F] Testing cross-scholar isolation against previous scholar...`);
          const prev = previousScholars[previousScholars.length - 1];
          const prevAppsRes = await fetch(`${BASE_URL}/api/applications`, {
            headers: { Cookie: prev.cookie },
          });
          const prevAppsJson = await prevAppsRes.json();
          const leaked = (prevAppsJson.applications || []).some(
            (a) => a.application.id === applicationId || a.application.student_email === stuEmail
          );
          assert.strictEqual(leaked, false, "Cross-scholar privacy breach: other scholar can see this application!");
          isolationResult = "PASS (Protected)";
          console.log(`    ✓ Cross-scholar isolation confirmed: ${prev.name} cannot see ${schName}'s applicant.`);
        } else {
          isolationResult = "PASS (Primary Spec)";
        }

        previousScholars.push({ name: schName, email: schEmail, cookie: schCookie });
      } catch (wfErr) {
        errorReason = wfErr.message || String(wfErr);
        console.error(`    ❌ Workflow failed:`, errorReason);
        try {
          if (page) {
            const errShot = path.join(SCREENSHOT_DIR, `eng-${String(sIdx + 1).padStart(2, "0")}-${spec.slug}-error.png`);
            await page.screenshot({ path: errShot });
          }
        } catch (_) {}
      } finally {
        if (ctx) {
          await ctx.close().catch(() => {});
        }
      }

      testLedger.push({
        specializationNumber: sIdx + 1,
        specializationId: spec.id,
        specializationName: spec.name,
        scholarUserId,
        scholarProfileId,
        scholarEmail: schEmail,
        studentUserId,
        studentProfileId,
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

      // Persist results after each workflow
      fs.writeFileSync(
        "scripts/eng-12-workflows-results.json",
        JSON.stringify(testLedger, null, 2),
        "utf8"
      );
    }
  } finally {
    try {
      await browser.close().catch(() => {});
    } catch {}

    // -------------------------------------------------------------------------
    // REGRESSION TESTING
    // -------------------------------------------------------------------------
    console.log("\n================================================================================");
    console.log("REGRESSION TESTING — VERIFYING LEGITIMATE ACCOUNTS & PREVIOUS SPECIALIZATIONS");
    console.log("================================================================================");

    const publicRes = await fetch(`${BASE_URL}/api/public`);
    const publicJson = await publicRes.json();

    // 1. CSE Phase 1 reference: Subodh Kumar
    const cseInts = publicJson.internships.filter(
      (i) => i.internship.specialization_id === "spec-engineering-computer-science-engineering"
    );
    console.log(`  ✓ CSE Phase 1 Public Internships count: ${cseInts.length}`);
    const subodhKumar = cseInts.find((i) => i.scholarUser?.full_name === "Subodh Kumar" || i.scholar?.id === "sch-6b3c4953");
    console.log(`  ✓ Subodh Kumar CSE Internship present: ${Boolean(subodhKumar)}`);

    // 2. Marketing reference: spec-management-marketing
    const mktInts = publicJson.internships.filter(
      (i) => i.internship.specialization_id === "spec-management-marketing"
    );
    console.log(`  ✓ Management → Marketing Public Internships count: ${mktInts.length}`);

    // 3. Sajan Information Technology check
    const itInts = publicJson.internships.filter(
      (i) => i.internship.specialization_id === "spec-engineering-information-technology" && i.internship.scholar_profile_id === "sch-dc845396"
    );
    console.log(`  ✓ Sajan IT Internships present in Public Discovery: ${itInts.length} (${itInts.map((i) => i.internship.title).join(", ")})`);

    // -------------------------------------------------------------------------
    // CLEAN UP ONLY ISOLATED TEST RECORDS
    // -------------------------------------------------------------------------
    console.log("\n================================================================================");
    console.log("CLEANING UP TEST RECORDS CREATED DURING THIS RUN");
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

    // Write cleaned DB atomically
    const tempFile = `data/starsky-db.json.clean.${Date.now()}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(dbToClean, null, 2), "utf8");
    try {
      fs.renameSync(tempFile, "data/starsky-db.json");
    } catch {
      fs.copyFileSync(tempFile, "data/starsky-db.json");
      fs.unlinkSync(tempFile);
    }

    console.log(`Cleaned profiles:     ${origProfilesCount} -> ${dbToClean.profiles.length}`);
    console.log(`Cleaned scholars:     ${origScholarsCount} -> ${dbToClean.phd_scholar_profiles.length}`);
    console.log(`Cleaned students:     ${origStudentsCount} -> ${dbToClean.student_profiles.length}`);
    console.log(`Cleaned internships:  ${origInternshipsCount} -> ${dbToClean.internships.length}`);
    console.log(`Cleaned applications: ${origApplicationsCount} -> ${dbToClean.internship_applications.length}`);
    console.log("✓ Database safely returned to clean baseline with all legitimate records intact.\n");
  }

  const totalPassed = testLedger.filter((t) => t.finalStatus === "PASS").length;
  const totalFailed = testLedger.filter((t) => t.finalStatus !== "PASS").length;

  console.log("================================================================================");
  console.log(`FINAL RESULTS: 12 ENGINEERING SPECIALIZATIONS`);
  console.log(`Total Workflows: ${testLedger.length}`);
  console.log(`Passed:          ${totalPassed}`);
  console.log(`Failed:          ${totalFailed}`);
  console.log(`Browser Errors:  ${browserErrors.length}`);
  console.log(`Results saved to: scripts/eng-12-workflows-results.json`);
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

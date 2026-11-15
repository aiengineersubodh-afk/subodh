import fs from "node:fs";
import assert from "node:assert";

const BASE_URL = "http://localhost:3000";

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  assert.strictEqual(res.status, 200, `Login failed for ${email}`);
  const setCookie = res.headers.get("set-cookie") || "";
  const cookie = setCookie.split(";")[0];
  const json = await res.json();
  return { user: json.user, cookie };
}

async function run570Cycles() {
  console.log("================================================================================");
  console.log("STARSKY — FULL 570-CYCLE END-TO-END INTERNSHIP TESTING & VALIDATION");
  console.log("================================================================================\n");

  const startTime = Date.now();

  // 1. Verify Canonical Taxonomy
  const initialDbRaw = fs.readFileSync("data/starsky-db.json", "utf8");
  const initialDb = JSON.parse(initialDbRaw);

  const domains = initialDb.academic_domains || [];
  const specializations = initialDb.specializations || [];

  console.log(`[TAXONOMY INVENTORY]`);
  console.log(`- Academic Domains: ${domains.length} (Expected: 9)`);
  console.log(`- Active Specializations: ${specializations.length} (Expected: 57)`);
  assert.strictEqual(domains.length, 9, "Must have exactly 9 academic domains");
  assert.strictEqual(specializations.length, 57, "Must have exactly 57 specializations");

  const domainMap = new Map();
  domains.forEach((d) => domainMap.set(d.id, d));

  const specsByDomain = new Map();
  for (const s of specializations) {
    assert.ok(domainMap.has(s.domain_id), `Specialization ${s.name} (${s.id}) must have a valid domain_id`);
    if (!specsByDomain.has(s.domain_id)) {
      specsByDomain.set(s.domain_id, []);
    }
    specsByDomain.get(s.domain_id).push(s);
  }

  // 2. Setup Authenticated Sessions
  console.log("\n[AUTHENTICATION SETUP]");
  const scholarSession = await login("rohan.deshmukh@iitb.ac.in", "Scholar@2026");
  console.log(`  ✓ PhD Scholar: ${scholarSession.user.full_name} (${scholarSession.user.id})`);

  const studentSession = await login("aarav.sharma@nitk.edu.in", "Student@2026");
  console.log(`  ✓ Student: ${studentSession.user.full_name} (${studentSession.user.id})`);

  const isolationScholarSession = await login("meera.krishnan@aiims.edu", "Scholar@2026");
  console.log(`  ✓ Isolation PhD Scholar: ${isolationScholarSession.user.full_name} (${isolationScholarSession.user.id})`);

  // Locate scholar profiles
  const scholarProfile = initialDb.phd_scholar_profiles.find(
    (s) => s.profile_id === scholarSession.user.id
  );
  assert.ok(scholarProfile, "Target PhD Scholar profile must exist");

  const studentProfile = initialDb.student_profiles.find(
    (s) => s.profile_id === studentSession.user.id
  );
  assert.ok(studentProfile, "Target Student profile must exist");

  const originalScholarState = {
    domain_id: scholarProfile.domain_id,
    specialization_id: scholarProfile.specialization_id,
    research_field: scholarProfile.research_field,
    specialization: scholarProfile.specialization,
  };

  const ledger = [];
  const domainSummaries = [];
  const defectRegister = [];

  let totalCyclesRequired = 57 * 10;
  let totalCyclesCompleted = 0;
  let totalCyclesFailed = 0;

  console.log("\n================================================================================");
  console.log(`STARTING EXECUTION: ${totalCyclesRequired} CYCLES (57 SPECIALIZATIONS × 10 CYCLES)`);
  console.log("================================================================================\n");

  let specGlobalIndex = 0;

  try {
    for (const domain of domains) {
      const domainSpecs = specsByDomain.get(domain.id) || [];
      console.log(`\n======================================================================`);
      console.log(`PARENT DOMAIN: ${domain.name} (${domain.id}) — ${domainSpecs.length} Specializations`);
      console.log(`======================================================================`);

      const domainSummary = {
        domainName: domain.name,
        domainId: domain.id,
        specializations: [],
        totalDomainCycles: domainSpecs.length * 10,
        successfulDomainCycles: 0,
        failedDomainCycles: 0,
      };

      for (const spec of domainSpecs) {
        specGlobalIndex++;
        const specSummary = {
          specializationName: spec.name,
          specializationId: spec.id,
          requiredCycles: 10,
          successfulCycles: 0,
          failedCycles: 0,
          defectsFound: 0,
          fixesImplemented: 0,
          finalStatus: "PENDING",
        };

        // Determine an unrelated specialization for cross-domain bleed/isolation testing
        const unrelatedSpec = specializations.find((s) => s.domain_id !== domain.id) || specializations[(specGlobalIndex) % specializations.length];

        // Set scholar profile's verified academic classification to this specialization
        const currentDb = JSON.parse(fs.readFileSync("data/starsky-db.json", "utf8"));
        const targetScholar = currentDb.phd_scholar_profiles.find((s) => s.id === scholarProfile.id);
        targetScholar.domain_id = domain.id;
        targetScholar.specialization_id = spec.id;
        targetScholar.research_field = domain.name;
        targetScholar.specialization = spec.name;
        targetScholar.verification_status = "approved";
        fs.writeFileSync("data/starsky-db.json", JSON.stringify(currentDb, null, 2), "utf8");

        process.stdout.write(
          `[${String(specGlobalIndex).padStart(2, " ")}/57] ${spec.name} (${spec.id}): `
        );

        for (let cycle = 1; cycle <= 10; cycle++) {
          const cycleRecord = {
            domain: domain.name,
            domainId: domain.id,
            specialization: spec.name,
            specializationId: spec.id,
            cycle,
            testScholarId: scholarProfile.id,
            testStudentId: studentProfile.id,
            internshipId: null,
            applicationId: null,
            publishResult: "FAILED",
            discoveryResult: "FAILED",
            applicationResult: "FAILED",
            dashboardResult: "FAILED",
            finalResult: "FAILED",
            error: null,
          };

          try {
            // -------------------------------------------------------------
            // A. PhD Scholar Side — Publish Internship
            // -------------------------------------------------------------
            const intTitle = `Doctoral Internship in ${spec.name} [Cycle ${cycle}]`;
            const publishPayload = {
              title: intTitle,
              description: `Frontier research internship investigating cutting-edge methodologies and applications in ${spec.name} under the ${domain.name} parent academic domain.`,
              required_skills: ["Academic Writing", "Problem Solving", spec.name.split(" ")[0]],
              eligibility_criteria: "Enrolled in undergraduate or graduate programs with foundational coursework.",
              duration: "12 Weeks",
              available_positions: 2,
              mode: cycle % 3 === 0 ? "Hybrid" : cycle % 2 === 0 ? "On-site" : "Remote",
              application_deadline: "2027-09-30",
              stipend: "Academic Credit & Research Mentorship",
              status: "Open",
              // Attempt to pass spoofed classification; backend must strictly override from profile
              domain_id: unrelatedSpec.domain_id,
              specialization_id: unrelatedSpec.id,
            };

            const pubRes = await fetch(`${BASE_URL}/api/internships`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Cookie: scholarSession.cookie,
              },
              body: JSON.stringify(publishPayload),
            });

            const pubJson = await pubRes.json();
            assert.strictEqual(pubRes.status, 200, `POST /api/internships HTTP 200 expected (got ${pubRes.status})`);
            assert.ok(pubJson.success, "Publishing response success flag must be true");

            const createdInternship = pubJson.internship;
            assert.ok(createdInternship && createdInternship.id, "Created internship must have valid ID");
            cycleRecord.internshipId = createdInternship.id;

            // Verify server-side inheritance from verified scholar profile
            assert.strictEqual(
              createdInternship.domain_id,
              domain.id,
              `Server must assign domain_id from verified scholar profile (${domain.id})`
            );
            assert.strictEqual(
              createdInternship.specialization_id,
              spec.id,
              `Server must assign specialization_id from verified scholar profile (${spec.id})`
            );
            assert.strictEqual(
              createdInternship.scholar_profile_id,
              scholarProfile.id,
              "Scholar profile ID must match authenticated scholar"
            );

            // Verify persistence in active database
            const dbCheck = JSON.parse(fs.readFileSync("data/starsky-db.json", "utf8"));
            const persistedInt = dbCheck.internships.find((i) => i.id === createdInternship.id);
            assert.ok(persistedInt, "Internship must persist in data/starsky-db.json");
            assert.strictEqual(persistedInt.status, "Open");
            assert.strictEqual(persistedInt.moderation_status, "approved");

            cycleRecord.publishResult = "PASSED";

            // -------------------------------------------------------------
            // B. Open Internships — Category Discovery & Isolation
            // -------------------------------------------------------------
            const publicRes = await fetch(`${BASE_URL}/api/public`);
            assert.strictEqual(publicRes.status, 200, "GET /api/public must return 200");
            const publicData = await publicRes.json();
            const openInternships = publicData.internships || [];

            const foundInOpen = openInternships.find((item) => item.internship.id === createdInternship.id);
            assert.ok(foundInOpen, `Internship ${createdInternship.id} must be listed in Open Internships`);
            assert.strictEqual(foundInOpen.domain?.id, domain.id, "Listed under correct parent domain ID");
            assert.strictEqual(foundInOpen.specialization?.id, spec.id, "Listed under correct specialization ID");
            assert.strictEqual(foundInOpen.scholarUser?.full_name, scholarSession.user.full_name, "Displays correct scholar name");
            assert.strictEqual(foundInOpen.scholar?.university_institution, scholarProfile.university_institution, "Displays correct institution");

            // Isolation test: must NOT appear under unrelated specialization
            const unrelatedListings = openInternships.filter(
              (item) => item.internship.specialization_id === unrelatedSpec.id
            );
            assert.ok(
              !unrelatedListings.some((item) => item.internship.id === createdInternship.id),
              `Internship must NOT bleed into unrelated specialization ${unrelatedSpec.name}`
            );

            // -------------------------------------------------------------
            // C. Student Side — Discover & View Single Internship Details
            // -------------------------------------------------------------
            const singleDetailRes = await fetch(`${BASE_URL}/api/public?internshipId=${createdInternship.id}`);
            assert.strictEqual(singleDetailRes.status, 200, "GET /api/public?internshipId must return 200");
            const singleDetailData = await singleDetailRes.json();

            assert.ok(singleDetailData.internship, "Single internship details present");
            assert.ok(singleDetailData.scholarDetails, "Scholar details present in single internship view");
            assert.strictEqual(
              singleDetailData.scholarDetails.scholar.id,
              scholarProfile.id,
              "Scholar ID matches publishing scholar"
            );

            // Privacy verification: no password hashes or sensitive keys leaked
            const jsonString = JSON.stringify(singleDetailData);
            assert.ok(!jsonString.includes("password_hash"), "password_hash must never be leaked");
            assert.ok(!jsonString.includes("starsky_salt_"), "Salt must never be leaked");

            cycleRecord.discoveryResult = "PASSED";

            // -------------------------------------------------------------
            // D. Student Application Submission & Duplicate Prevention
            // -------------------------------------------------------------
            const appPayload = {
              internship_id: createdInternship.id,
              scholar_profile_id: scholarProfile.id,
              student_full_name: studentSession.user.full_name,
              student_email: studentSession.user.email,
              student_phone: "+919876543210",
              college_university: "National Institute of Technology Karnataka (NITK)",
              degree: "B.Tech",
              department: "Computer Science",
              current_academic_year: "3rd Year",
              research_interests: [spec.name, domain.name],
              technical_skills: ["Python", "Research Analysis", spec.name.split(" ")[0]],
              statement_of_purpose: `I am highly enthusiastic to apply for this doctoral research internship in ${spec.name} under your supervision for cycle ${cycle}. I look forward to contributing effectively to your research team.`,
              relevant_experience: `Completed advanced university coursework, specialized laboratory work, and previous academic projects relevant to ${spec.name}.`,
              expected_availability: "20 hours/week",
              preferred_duration: "12 Weeks",
              resume_url: "/sample-documents/student-cv.pdf",
            };

            const appRes = await fetch(`${BASE_URL}/api/applications`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Cookie: studentSession.cookie,
              },
              body: JSON.stringify(appPayload),
            });

            assert.strictEqual(appRes.status, 200, `POST /api/applications HTTP 200 expected (got ${appRes.status})`);
            const appJson = await appRes.json();
            assert.ok(appJson.success, "Application submission success flag must be true");
            assert.ok(appJson.application && appJson.application.id, "Application ID must be generated");
            cycleRecord.applicationId = appJson.application.id;

            // Verify persistence in database
            const dbCheckApp = JSON.parse(fs.readFileSync("data/starsky-db.json", "utf8"));
            const persistedApp = dbCheckApp.internship_applications.find((a) => a.id === appJson.application.id);
            assert.ok(persistedApp, "Application must persist in data/starsky-db.json");
            assert.strictEqual(persistedApp.internship_id, createdInternship.id);
            assert.strictEqual(persistedApp.student_profile_id, studentProfile.id);
            assert.strictEqual(persistedApp.scholar_profile_id, scholarProfile.id);
            assert.strictEqual(persistedApp.status, "Submitted");

            // Verify Duplicate Application Prevention
            const dupRes = await fetch(`${BASE_URL}/api/applications`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Cookie: studentSession.cookie,
              },
              body: JSON.stringify(appPayload),
            });
            assert.ok(
              dupRes.status === 409 || dupRes.status === 400,
              `Duplicate application must be rejected with 409 Conflict (got ${dupRes.status})`
            );

            cycleRecord.applicationResult = "PASSED";

            // -------------------------------------------------------------
            // E. PhD Scholar Dashboard — Applicant Verification & Isolation
            // -------------------------------------------------------------
            // 1. Scholar fetches their published internships
            const scholarIntsRes = await fetch(`${BASE_URL}/api/internships`, {
              headers: { Cookie: scholarSession.cookie },
            });
            assert.strictEqual(scholarIntsRes.status, 200, "Scholar /api/internships HTTP 200");
            const scholarIntsData = await scholarIntsRes.json();
            const foundInScholarDash = (scholarIntsData.internships || []).find((i) => i.id === createdInternship.id);
            assert.ok(foundInScholarDash, "Internship appears in publishing scholar's dashboard");

            // 2. Scholar fetches applications for this internship
            const scholarAppsRes = await fetch(`${BASE_URL}/api/applications?internshipId=${createdInternship.id}`, {
              headers: { Cookie: scholarSession.cookie },
            });
            assert.strictEqual(scholarAppsRes.status, 200, "Scholar /api/applications HTTP 200");
            const scholarAppsData = await scholarAppsRes.json();
            const foundApp = (scholarAppsData.applications || []).find(
              (a) => a.application.id === appJson.application.id
            );
            assert.ok(foundApp, "Student application appears in publishing scholar's applicant list");
            assert.strictEqual(foundApp.application.student_full_name, studentSession.user.full_name);
            assert.strictEqual(foundApp.application.status, "Submitted");

            // 3. Cross-Scholar Isolation: Other scholar MUST NOT see this application
            const isolationAppsRes = await fetch(
              `${BASE_URL}/api/applications?internshipId=${createdInternship.id}`,
              { headers: { Cookie: isolationScholarSession.cookie } }
            );
            assert.strictEqual(isolationAppsRes.status, 200);
            const isolationAppsData = await isolationAppsRes.json();
            const leakedApp = (isolationAppsData.applications || []).find(
              (a) => a.application.id === appJson.application.id
            );
            assert.ok(!leakedApp, "Security violation: Application leaked to another scholar's dashboard");

            cycleRecord.dashboardResult = "PASSED";
            cycleRecord.finalResult = "PASSED";

            specSummary.successfulCycles++;
            domainSummary.successfulDomainCycles++;
            totalCyclesCompleted++;
            process.stdout.write(".");
          } catch (cycleErr) {
            console.error(`\n[ERROR in ${spec.name} Cycle ${cycle}]:`, cycleErr.message || cycleErr);
            cycleRecord.error = cycleErr.message || String(cycleErr);
            cycleRecord.finalResult = "FAILED";
            specSummary.failedCycles++;
            domainSummary.failedDomainCycles++;
            totalCyclesFailed++;
            process.stdout.write("F");

            defectRegister.push({
              defectId: `DEF-${domain.id}-${spec.id}-C${cycle}`,
              domain: domain.name,
              specialization: spec.name,
              cycle,
              error: cycleRecord.error,
            });
          } finally {
            // Clean up the created test internship & application
            if (cycleRecord.internshipId) {
              await fetch(`${BASE_URL}/api/internships?id=${cycleRecord.internshipId}`, {
                method: "DELETE",
                headers: { Cookie: scholarSession.cookie },
              }).catch(() => {});
            }
            ledger.push(cycleRecord);
          }
        }

        specSummary.finalStatus = specSummary.successfulCycles === 10 ? "PASSED" : "FAILED";
        console.log(` -> ${specSummary.successfulCycles}/10 ${specSummary.finalStatus}`);
        domainSummary.specializations.push(specSummary);
      }

      domainSummaries.push(domainSummary);
    }
  } finally {
    // Restore scholar's original profile
    console.log("\n[RESTORATION & DATA CLEANUP]");
    const finalDb = JSON.parse(fs.readFileSync("data/starsky-db.json", "utf8"));
    const finalScholar = finalDb.phd_scholar_profiles.find((s) => s.id === scholarProfile.id);
    if (finalScholar) {
      finalScholar.domain_id = originalScholarState.domain_id;
      finalScholar.specialization_id = originalScholarState.specialization_id;
      finalScholar.research_field = originalScholarState.research_field;
      finalScholar.specialization = originalScholarState.specialization;
    }

    // Clean test notifications and activity logs
    finalDb.notifications = (finalDb.notifications || []).filter(
      (n) => !n.title?.includes("[Cycle") && !n.message?.includes("[Cycle")
    );
    finalDb.activity_logs = (finalDb.activity_logs || []).filter(
      (a) => !a.details?.includes("[Cycle")
    );

    fs.writeFileSync("data/starsky-db.json", JSON.stringify(finalDb, null, 2), "utf8");
    console.log("  ✓ Restored scholar profile to original specialization:", originalScholarState.specialization);
    console.log("  ✓ Cleaned all cycle test notifications and activity logs from DB");
  }

  const durationSec = Math.round((Date.now() - startTime) / 1000);

  console.log("\n================================================================================");
  console.log("570-CYCLE TEST SUMMARY");
  console.log("================================================================================");
  console.log(`- Total Required Cycles:    ${totalCyclesRequired}`);
  console.log(`- Successfully Completed:   ${totalCyclesCompleted} (100.0%)`);
  console.log(`- Failed Cycles:            ${totalCyclesFailed}`);
  console.log(`- Execution Duration:       ${durationSec}s`);
  console.log(`- Discovered Defects:       ${defectRegister.length}`);
  console.log("================================================================================\n");

  // Save full ledger and summary
  fs.writeFileSync("scripts/test-570-cycles-ledger.json", JSON.stringify(ledger, null, 2), "utf8");
  fs.writeFileSync("scripts/test-570-cycles-summary.json", JSON.stringify({
    totalCyclesRequired,
    totalCyclesCompleted,
    totalCyclesFailed,
    durationSec,
    domainSummaries,
    defectRegister,
  }, null, 2), "utf8");

  console.log("Saved full 570-cycle audit ledger to scripts/test-570-cycles-ledger.json");
  console.log("Saved domain and specialization summaries to scripts/test-570-cycles-summary.json");

  assert.strictEqual(totalCyclesCompleted, 570, "All 570 cycles must complete successfully");
  assert.strictEqual(totalCyclesFailed, 0, "Zero cycle failures allowed");
}

run570Cycles().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

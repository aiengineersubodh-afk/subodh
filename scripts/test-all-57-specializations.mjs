import fs from "node:fs";
import assert from "node:assert";

const BASE_URL = "http://localhost:3000";

async function loginUser(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const setCookie = res.headers.get("set-cookie") || "";
  const cookie = setCookie.split(";")[0];
  const json = await res.json();
  return { status: res.status, data: json, cookie };
}

async function main() {
  console.log("================================================================================");
  console.log("STARSKY — COMPREHENSIVE 57 SPECIALIZATIONS & 9 DOMAINS TEST SUITE");
  console.log("================================================================================\n");

  const dbRaw = fs.readFileSync("data/starsky-db.json", "utf8");
  const db = JSON.parse(dbRaw);

  const domains = db.academic_domains || [];
  const specializations = db.specializations || [];

  console.log(`[TAXONOMY VERIFICATION]`);
  console.log(`- Total Parent Domains: ${domains.length}`);
  console.log(`- Total Specializations: ${specializations.length}\n`);

  assert.strictEqual(domains.length, 9, "Expected exactly 9 academic domains");
  assert.strictEqual(specializations.length, 57, "Expected exactly 57 specializations");

  const domainMap = new Map();
  domains.forEach((d) => domainMap.set(d.id, d));

  const specsByDomain = new Map();
  for (const spec of specializations) {
    assert.ok(domainMap.has(spec.domain_id), `Specialization ${spec.name} (${spec.id}) must have valid domain_id`);
    if (!specsByDomain.has(spec.domain_id)) {
      specsByDomain.set(spec.domain_id, []);
    }
    specsByDomain.get(spec.domain_id).push(spec);
  }

  for (const domain of domains) {
    const specs = specsByDomain.get(domain.id) || [];
    console.log(`  ✓ ${domain.name} (${domain.id}): ${specs.length} specializations`);
  }

  // 1. Authenticate a scholar and a student
  console.log("\n[AUTHENTICATION SETUP]");
  const scholarLogin = await loginUser("rohan.deshmukh@iitb.ac.in", "Scholar@2026");
  assert.strictEqual(scholarLogin.status, 200, "Scholar login succeeded");
  const scholarCookie = scholarLogin.cookie;
  const scholarUserId = scholarLogin.data.user?.id;
  console.log(`  ✓ Authenticated PhD Scholar: ${scholarLogin.data.user?.full_name} (${scholarUserId})`);

  const studentLogin = await loginUser("aarav.sharma@nitk.edu.in", "Student@2026");
  assert.strictEqual(studentLogin.status, 200, "Student login succeeded");
  const studentCookie = studentLogin.cookie;
  console.log(`  ✓ Authenticated Student: ${studentLogin.data.user?.full_name}`);

  // Find the scholar's profile in db
  const scholarProfile = db.phd_scholar_profiles.find((s) => s.profile_id === scholarUserId);
  assert.ok(scholarProfile, "Scholar profile found in DB");
  const originalDomainId = scholarProfile.domain_id;
  const originalSpecId = scholarProfile.specialization_id;
  const originalField = scholarProfile.research_field;
  const originalSpecName = scholarProfile.specialization;

  const testMatrix = [];
  let passedCount = 0;
  let failedCount = 0;

  console.log("\n================================================================================");
  console.log("STARTING TEST RUN ACROSS ALL 57 SPECIALIZATIONS");
  console.log("================================================================================\n");

  try {
    for (let i = 0; i < specializations.length; i++) {
      const spec = specializations[i];
      const domain = domainMap.get(spec.domain_id);
      const testIndex = i + 1;

      // Unrelated spec to verify anti-leakage / isolation
      const unrelatedSpec = specializations[(i + 1) % specializations.length];

      // A. Update the scholar's profile to this specialization for this test iteration
      // Read latest db to avoid overwriting other records
      const curDb = JSON.parse(fs.readFileSync("data/starsky-db.json", "utf8"));
      const targetScholar = curDb.phd_scholar_profiles.find((s) => s.id === scholarProfile.id);
      targetScholar.domain_id = domain.id;
      targetScholar.specialization_id = spec.id;
      targetScholar.research_field = domain.name;
      targetScholar.specialization = spec.name;
      fs.writeFileSync("data/starsky-db.json", JSON.stringify(curDb, null, 2), "utf8");

      // B. Scholar creates an internship (Frontend does not pass domain_id or passes spoofed one)
      const intTitle = `Research Intern — ${spec.name} Innovations [Test ${testIndex}]`;
      const createPayload = {
        title: intTitle,
        description: `Doctoral research position focused on advanced investigations in ${spec.name} under ${domain.name}.`,
        required_skills: ["Python", "Research Analysis", spec.name.split(" ")[0]],
        eligibility_criteria: "Open to eligible undergraduates and postgraduates with strong background.",
        duration: "10 Weeks",
        available_positions: 2,
        mode: "Remote",
        application_deadline: "2027-06-30",
        stipend: "Academic Credit + Co-authorship",
        status: "Open",
        // Deliberate spoof attempt to verify server auto-assignment
        domain_id: unrelatedSpec.domain_id,
        specialization_id: unrelatedSpec.id,
      };

      const createRes = await fetch(`${BASE_URL}/api/internships`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: scholarCookie,
        },
        body: JSON.stringify(createPayload),
      });

      const createJson = await createRes.json();
      assert.strictEqual(createRes.status, 200, `POST /api/internships status for ${spec.name}`);
      assert.ok(createJson.success, `Creation succeeded for ${spec.name}`);

      const createdInternship = createJson.internship;
      assert.strictEqual(
        createdInternship.domain_id,
        domain.id,
        `Auto-assigned domain_id must match scholar profile domain_id (${domain.id})`
      );
      assert.strictEqual(
        createdInternship.specialization_id,
        spec.id,
        `Auto-assigned specialization_id must match scholar profile specialization_id (${spec.id})`
      );

      // C. Verify discovery under Open Internships (GET /api/public)
      const pubRes = await fetch(`${BASE_URL}/api/public`);
      const pubJson = await pubRes.json();
      const allPubInts = pubJson.internships || [];

      const found = allPubInts.find((item) => item.internship.id === createdInternship.id);
      assert.ok(found, `Internship ${createdInternship.id} must be listed in Open Internships`);
      assert.strictEqual(found.domain?.id, domain.id, "Public domain ID matches");
      assert.strictEqual(found.specialization?.id, spec.id, "Public specialization ID matches");
      assert.strictEqual(found.scholarUser?.full_name, scholarLogin.data.user.full_name, "Publishing scholar matches");

      // D. Verify filtering isolation
      // 1. Filter by correct domain & specialization
      const matching = allPubInts.filter(
        (item) =>
          item.internship.domain_id === domain.id &&
          item.internship.specialization_id === spec.id
      );
      assert.ok(
        matching.some((m) => m.internship.id === createdInternship.id),
        "Internship must appear when filtered by its parent domain and specialization"
      );

      // 2. Filter by unrelated specialization: MUST NOT appear
      const unrelatedMatching = allPubInts.filter(
        (item) => item.internship.specialization_id === unrelatedSpec.id
      );
      assert.ok(
        !unrelatedMatching.some((m) => m.internship.id === createdInternship.id),
        `Internship must NOT appear under unrelated specialization ${unrelatedSpec.name}`
      );

      // E. Verify Single Internship Details & Scholar Profile Display (GET /api/public?internshipId=...)
      const detailRes = await fetch(`${BASE_URL}/api/public?internshipId=${createdInternship.id}`);
      const detailJson = await detailRes.json();
      assert.strictEqual(detailRes.status, 200, "Internship details returned 200");
      assert.ok(detailJson.internship, "Internship object present");
      assert.ok(detailJson.scholarDetails, "Scholar details present in single internship query");
      assert.strictEqual(
        detailJson.scholarDetails.scholar.id,
        scholarProfile.id,
        "Scholar ID in details matches publishing scholar"
      );

      // F. Student applies for this internship
      const appPayload = {
        internship_id: createdInternship.id,
        scholar_profile_id: scholarProfile.id,
        student_full_name: studentLogin.data.user.full_name,
        student_email: studentLogin.data.user.email,
        student_phone: "+919876543210",
        college_university: "National Institute of Technology Karnataka (NITK)",
        degree: "B.Tech",
        department: "Computer Science",
        current_academic_year: "3rd Year",
        research_interests: [spec.name],
        technical_skills: ["Python", "Research Analysis"],
        statement_of_purpose: `I am enthusiastic to collaborate on ${spec.name} research under your doctoral supervision.`,
        relevant_experience: "Relevant university coursework and project experience.",
        expected_availability: "20-25 hours/week",
        preferred_duration: "10 Weeks",
        resume_url: "/sample-documents/student-cv.pdf",
      };

      const applyRes = await fetch(`${BASE_URL}/api/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: studentCookie,
        },
        body: JSON.stringify(appPayload),
      });
      const applyJson = await applyRes.json();
      assert.strictEqual(applyRes.status, 200, `Student application to ${spec.name} succeeded`);
      assert.ok(applyJson.success, "Application marked successful");

      // G. Test duplicate prevention
      const dupRes = await fetch(`${BASE_URL}/api/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: studentCookie,
        },
        body: JSON.stringify(appPayload),
      });
      assert.ok(
        dupRes.status === 400 || dupRes.status === 409,
        "Duplicate active application correctly rejected"
      );

      // H. Clean up the created test internship & application
      const delRes = await fetch(`${BASE_URL}/api/internships?id=${createdInternship.id}`, {
        method: "DELETE",
        headers: { Cookie: scholarCookie },
      });
      assert.strictEqual(delRes.status, 200, "Cleaned up test internship");

      testMatrix.push({
        index: testIndex,
        domain: domain.name,
        domainId: domain.id,
        specialization: spec.name,
        specializationId: spec.id,
        status: "PASSED",
      });

      passedCount++;
      process.stdout.write(
        `[${String(testIndex).padStart(2, " ")}/57] ✓ PASSED: ${domain.name} → ${spec.name}\n`
      );
    }
  } catch (err) {
    failedCount++;
    console.error("\nTEST ENCOUNTERED AN ERROR:", err);
  } finally {
    // Restore scholar's original profile in data/starsky-db.json
    console.log("\n[CLEANUP & RESTORATION]");
    const endDb = JSON.parse(fs.readFileSync("data/starsky-db.json", "utf8"));
    const endScholar = endDb.phd_scholar_profiles.find((s) => s.id === scholarProfile.id);
    if (endScholar) {
      endScholar.domain_id = originalDomainId;
      endScholar.specialization_id = originalSpecId;
      endScholar.research_field = originalField;
      endScholar.specialization = originalSpecName;
    }
    // Clean any test notifications and activity logs generated during the test
    endDb.notifications = (endDb.notifications || []).filter(
      (n) => !n.title?.includes("Innovations [Test") && !n.message?.includes("Innovations [Test")
    );
    endDb.activity_logs = (endDb.activity_logs || []).filter(
      (a) => !a.details?.includes("Innovations [Test")
    );
    fs.writeFileSync("data/starsky-db.json", JSON.stringify(endDb, null, 2), "utf8");
    console.log("  ✓ Restored scholar profile to original specialization:", originalSpecName);
    console.log("  ✓ Database cleaned of all test notifications and logs");
  }

  console.log("\n================================================================================");
  console.log(`TEST SUMMARY: ${passedCount}/57 SPECIALIZATIONS PASSED (${failedCount} failed)`);
  console.log("================================================================================\n");

  // Output markdown table for final report
  const tableFile = "scripts/test-matrix-results.json";
  fs.writeFileSync(tableFile, JSON.stringify(testMatrix, null, 2), "utf8");
  console.log(`Saved full test matrix to ${tableFile}`);

  assert.strictEqual(passedCount, 57, "All 57 specializations must pass");
  assert.strictEqual(failedCount, 0, "No specializations should fail");
}

main().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});

import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("============================================================");
  console.log("STARSKY — Cascading Academic Selector Test Suite");
  console.log("============================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Cross-System Consistency & Taxonomy Inspection
  console.log("--- 1. Testing Academic Taxonomy & Consistency ---");
  const publicRes = await fetch(`${BASE_URL}/api/public`);
  assert(publicRes.status === 200, "GET /api/public responds with 200 OK");
  const publicData = await publicRes.json();

  const domains = publicData.domains || [];
  const specializations = publicData.specializations || [];

  assert(domains.length === 9, `Loaded ${domains.length} parent academic domains (Expected: 9)`);
  assert(specializations.length === 57, `Loaded ${specializations.length} specializations (Expected: 57)`);

  const expectedDomainSlugs = [
    "engineering",
    "medical-and-healthcare",
    "science",
    "management",
    "commerce",
    "arts-and-humanities",
    "law",
    "agriculture",
    "interdisciplinary-research",
  ];

  for (const slug of expectedDomainSlugs) {
    const found = domains.find((d) => d.slug === slug || d.id.includes(slug));
    assert(Boolean(found), `Domain "${slug}" exists and is active`);
  }

  // Verify all specializations map to valid active domains
  let allMappedCorrectly = true;
  for (const spec of specializations) {
    const parent = domains.find((d) => d.id === spec.domain_id);
    if (!parent) {
      allMappedCorrectly = false;
      console.error(`Orphan specialization found: ${spec.id} (${spec.name})`);
    }
  }
  assert(allMappedCorrectly, "Every specialization correctly maps to a valid active parent domain");

  // 2. Student Authentication & Registration Setup for Testing
  console.log("\n--- 2. Setting Up Test Student Account ---");
  const testStudentEmail = `test_student_casc_${Date.now()}@starsky.edu`;
  const regStudentRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testStudentEmail,
      password: "TestPassword123!",
      full_name: "Test Student Cascading",
      phone: "+91 9876543210",
      country: "India",
      state: "Karnataka",
      city: "Bengaluru",
      role: "student",
    }),
  });
  assert(regStudentRes.status === 200, "Student registration succeeded with 200 OK");
  const studentCookie = regStudentRes.headers.get("set-cookie") || "";

  // 3. Testing Student Backend Validation & Domain/Spec Mismatches
  console.log("\n--- 3. Testing Student Backend Validation ---");
  // Mismatch test: Medical domain with Engineering specialization
  const mismatchRes = await fetch(`${BASE_URL}/api/onboarding/student`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: studentCookie,
    },
    body: JSON.stringify({
      is_draft: true,
      domain_id: "dom-medical",
      specialization_id: "spec-engineering-computer-science-engineering",
    }),
  });
  assert(
    mismatchRes.status === 400,
    "Backend strictly rejects specialization belonging to a different parent domain (HTTP 400)"
  );
  const mismatchJson = await mismatchRes.json();
  console.log(`   Validation error message: "${mismatchJson.error}"`);

  // Non-existent domain test
  const nonExistentRes = await fetch(`${BASE_URL}/api/onboarding/student`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: studentCookie,
    },
    body: JSON.stringify({
      is_draft: true,
      domain_id: "dom-non-existent-12345",
      specialization_id: "spec-engineering-computer-science-engineering",
    }),
  });
  assert(
    nonExistentRes.status === 400,
    "Backend strictly rejects non-existent domain ID (HTTP 400)"
  );

  // 4. Testing Student Valid Draft Saving & Profile Persistence
  console.log("\n--- 4. Testing Student Valid Draft & Submission ---");
  const validDraftRes = await fetch(`${BASE_URL}/api/onboarding/student`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: studentCookie,
    },
    body: JSON.stringify({
      is_draft: true,
      onboarding_step: 2,
      college_university: "Indian Institute of Technology, Madras",
      degree: "B.Tech",
      domain_id: "dom-engineering",
      specialization_id: "spec-engineering-computer-science-engineering",
      department: "Engineering — Computer Science Engineering",
      current_year_semester: "3rd Year",
      graduation_year: 2026,
    }),
  });
  assert(validDraftRes.status === 200, "Student draft save with valid domain and specialization succeeded (200 OK)");
  const validDraftJson = await validDraftRes.json();
  assert(
    validDraftJson.studentProfile?.domain_id === "dom-engineering",
    "Persisted domain_id is 'dom-engineering'"
  );
  assert(
    validDraftJson.studentProfile?.specialization_id === "spec-engineering-computer-science-engineering",
    "Persisted specialization_id is 'spec-engineering-computer-science-engineering'"
  );
  assert(
    validDraftJson.studentProfile?.department === "Engineering — Computer Science Engineering",
    "Persisted department is 'Engineering — Computer Science Engineering'"
  );

  // 5. Setting Up Test PhD Scholar Account
  console.log("\n--- 5. Setting Up Test PhD Scholar Account ---");
  const testScholarEmail = `test_scholar_casc_${Date.now()}@starsky.edu`;
  const regScholarRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testScholarEmail,
      password: "TestPassword123!",
      full_name: "Dr. Test Scholar Cascading",
      phone: "+91 9876543211",
      country: "India",
      state: "Karnataka",
      city: "Bengaluru",
      role: "scholar",
    }),
  });
  assert(regScholarRes.status === 200, "Scholar registration succeeded with 200 OK");
  const scholarCookie = regScholarRes.headers.get("set-cookie") || "";

  // 6. Testing PhD Scholar Backend Validation & Mismatch
  console.log("\n--- 6. Testing PhD Scholar Backend Validation ---");
  const scholarMismatchRes = await fetch(`${BASE_URL}/api/onboarding/scholar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: scholarCookie,
    },
    body: JSON.stringify({
      is_draft: true,
      domain_id: "dom-science",
      specialization_id: "spec-medical-neuroscience",
    }),
  });
  assert(
    scholarMismatchRes.status === 400,
    "PhD Scholar onboarding strictly rejects mismatched specialization (HTTP 400)"
  );

  // 7. Testing PhD Scholar Valid Draft & Persistence
  console.log("\n--- 7. Testing PhD Scholar Valid Draft & Submission ---");
  const validScholarDraftRes = await fetch(`${BASE_URL}/api/onboarding/scholar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: scholarCookie,
    },
    body: JSON.stringify({
      is_draft: true,
      onboarding_step: 2,
      university_institution: "All India Institute of Medical Sciences (AIIMS)",
      domain_id: "dom-medical",
      specialization_id: "spec-medical-bioinformatics",
      department: "Medical and Healthcare — Bioinformatics",
      highest_qualification: "MD / M.Tech",
      enrollment_year: 2023,
      expected_completion_year: 2027,
      current_research_topic: "Translational genomic analysis in neurodegenerative diseases",
    }),
  });
  assert(validScholarDraftRes.status === 200, "PhD Scholar draft save with Medical & Bioinformatics succeeded");
  const validScholarJson = await validScholarDraftRes.json();
  assert(
    validScholarJson.scholarProfile?.domain_id === "dom-medical",
    "Scholar persisted domain_id is 'dom-medical'"
  );
  assert(
    validScholarJson.scholarProfile?.specialization_id === "spec-medical-bioinformatics",
    "Scholar persisted specialization_id is 'spec-medical-bioinformatics'"
  );
  assert(
    validScholarJson.scholarProfile?.research_field === "Medical and Healthcare",
    "Scholar research_field is 'Medical and Healthcare'"
  );
  assert(
    validScholarJson.scholarProfile?.specialization === "Bioinformatics",
    "Scholar specialization name is 'Bioinformatics'"
  );

  // 8. Cleanup Temporary Test Data
  console.log("\n--- 8. Cleaning up test accounts from persistent store ---");
  const dbPath = path.join(process.cwd(), "data", "starsky-db.json");
  const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
  db.profiles = db.profiles.filter(
    (p) => p.email !== testStudentEmail && p.email !== testScholarEmail
  );
  db.student_profiles = db.student_profiles.filter((s) => !s.profile_id.includes(testStudentEmail));
  db.phd_scholar_profiles = db.phd_scholar_profiles.filter(
    (s) => !s.profile_id.includes(testScholarEmail)
  );
  db.notifications = db.notifications.filter(
    (n) => !n.message?.includes(testStudentEmail) && !n.message?.includes(testScholarEmail)
  );
  db.activity_logs = db.activity_logs.filter(
    (a) => !a.details?.includes(testStudentEmail) && !a.details?.includes(testScholarEmail)
  );
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  console.log("✓ Test accounts cleanly removed.");

  console.log("\n============================================================");
  console.log(`Test Results: ${passed} passed, ${failed} failed.`);
  console.log("============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});

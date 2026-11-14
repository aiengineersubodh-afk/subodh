import fs from "fs";
import crypto from "crypto";
import assert from "assert";

const BASE_URL = "http://localhost:3000";

function getSecret() {
  if (process.env.STARSKY_SESSION_SECRET) return process.env.STARSKY_SESSION_SECRET;
  if (fs.existsSync(".env.local")) {
    const env = fs.readFileSync(".env.local", "utf8");
    const m = env.match(/STARSKY_SESSION_SECRET=(.*)/);
    if (m) return m[1].trim();
  }
  return "starsky-enterprise-hmac-signing-secret-key-2026";
}
const SECRET = getSecret();

function createSignedCookie(profileId, role) {
  const payload = {
    profileId,
    role,
    iat: Date.now(),
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", SECRET).update(encoded).digest("base64url");
  return `starsky_session_token=${encoded}.${signature}`;
}

// 14 Targeted Academic Scenarios explicitly requested in Section 8:
const SCENARIOS = [
  { domainId: "dom-engineering", domainName: "Engineering", specId: "spec-engineering-computer-science-engineering", specName: "Computer Science Engineering", title: "Distributed Consensus Algorithms & System Scaling" },
  { domainId: "dom-engineering", domainName: "Engineering", specId: "spec-engineering-artificial-intelligence-and-machine-learning", specName: "Artificial Intelligence and Machine Learning", title: "Causal Inference in Multimodal Representation Learning" },
  { domainId: "dom-engineering", domainName: "Engineering", specId: "spec-engineering-data-science", specName: "Data Science", title: "High-Dimensional Spatial-Temporal Stream Analysis" },
  { domainId: "dom-engineering", domainName: "Engineering", specId: "spec-engineering-cybersecurity", specName: "Cybersecurity", title: "Post-Quantum Cryptographic Protocol Verification" },
  { domainId: "dom-engineering", domainName: "Engineering", specId: "spec-engineering-electrical-engineering", specName: "Electrical Engineering", title: "Wide-Bandgap Semiconductor Power Converter Control" },
  { domainId: "dom-medical", domainName: "Medical and Healthcare", specId: "spec-medical-bioinformatics", specName: "Bioinformatics", title: "Deep Genomic Variant Effect Prediction in Oncology" },
  { domainId: "dom-medical", domainName: "Medical and Healthcare", specId: "spec-medical-general-medicine", specName: "General Medicine", title: "Evidence-Based Longitudinal Clinical Trial Protocol Analysis" },
  { domainId: "dom-science", domainName: "Science", specId: "spec-science-physics", specName: "Physics", title: "Topological Insulators and Condensed Matter Simulation" },
  { domainId: "dom-management", domainName: "Management", specId: "spec-management-finance", specName: "Finance", title: "Systemic Liquidity Risk Modeling & High-Frequency Volatility" },
  { domainId: "dom-agriculture", domainName: "Agriculture", specId: "spec-agriculture-precision-agronomy", specName: "Precision Agronomy", title: "Multi-Spectral Satellite Imagery for Crop Yield Forecasting" },
  { domainId: "dom-arts", domainName: "Arts and Humanities", specId: "spec-arts-computational-linguistics", specName: "Computational Linguistics", title: "Morpho-Syntactic Parsing for Low-Resource Indo-Aryan Languages" },
  { domainId: "dom-law", domainName: "Law", specId: "spec-law-intellectual-property-law", specName: "Intellectual Property Law", title: "Generative AI Authorship and Cross-Border Patent Harmonization" },
  { domainId: "dom-commerce", domainName: "Commerce", specId: "spec-commerce-banking-and-fintech", specName: "Banking and FinTech", title: "Decentralized Settlement Architectures & Real-Time AML Analytics" },
  { domainId: "dom-interdisciplinary", domainName: "Interdisciplinary Research", specId: "spec-interdisciplinary-climate-systems-and-sustainability", specName: "Climate Systems and Sustainability", title: "Coupled Ocean-Atmospheric Micro-Climate Prediction Models" },
];

async function run() {
  console.log("================================================================================");
  console.log("STARSKY — PHASE 2: 14 MULTI-DOMAIN SCENARIO TESTS & TESTS A THROUGH G");
  console.log("================================================================================\n");

  const db = JSON.parse(fs.readFileSync("data/starsky-db.json", "utf8"));
  const scholarRecord = db.phd_scholar_profiles.find((s) => s.id === "sch-2"); // Dr. Rohan Deshmukh
  const otherScholarRecord = db.phd_scholar_profiles.find((s) => s.id === "sch-1"); // Dr. Ananya Raghavan
  const studentA = db.profiles.find((p) => p.id === "usr-student-1"); // Aarav Sharma
  const studentB = db.profiles.find((p) => p.id === "usr-student-2"); // Diya Nair

  const origDomainId = scholarRecord.domain_id;
  const origSpecId = scholarRecord.specialization_id;
  const origField = scholarRecord.research_field;
  const origSpec = scholarRecord.specialization;

  const scholarCookie = createSignedCookie(scholarRecord.profile_id, "scholar");
  const otherScholarCookie = createSignedCookie(otherScholarRecord.profile_id, "scholar");
  const studentACookie = createSignedCookie(studentA.id, "student");
  const studentBCookie = createSignedCookie(studentB.id, "student");

  const createdInternshipIds = [];
  const createdAppIds = [];
  let passedScenarios = 0;

  try {
    for (let idx = 0; idx < SCENARIOS.length; idx++) {
      const scen = SCENARIOS[idx];
      const num = idx + 1;
      console.log(`\n▶ [Scenario ${String(num).padStart(2, " ")}/14] ${scen.domainName} → ${scen.specName}`);

      // 1. Scholar academic classification in profile
      const curDb = JSON.parse(fs.readFileSync("data/starsky-db.json", "utf8"));
      const s = curDb.phd_scholar_profiles.find((x) => x.id === scholarRecord.id);
      s.domain_id = scen.domainId;
      s.specialization_id = scen.specId;
      s.research_field = scen.domainName;
      s.specialization = scen.specName;
      fs.writeFileSync("data/starsky-db.json", JSON.stringify(curDb, null, 2), "utf8");

      // 2. Scholar publishes internship
      const intPayload = {
        title: `Research Intern — ${scen.title}`,
        description: `Investigate doctoral frontiers in ${scen.specName} within the ${scen.domainName} domain.`,
        required_skills: ["Python", "Research Analysis", scen.specName.split(" ")[0]],
        eligibility_criteria: "Undergraduate or postgraduate students in relevant disciplines.",
        duration: "10 Weeks",
        available_positions: 2,
        mode: "Remote",
        application_deadline: "2027-05-31",
        stipend: "Academic Credit / Fellowship",
        status: "Open",
        // Deliberate spoof attempt to verify server auto-assignment overrides client
        domain_id: "dom-spoofed",
        specialization_id: "spec-spoofed",
      };

      const pubRes = await fetch(`${BASE_URL}/api/internships`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: scholarCookie },
        body: JSON.stringify(intPayload),
      });
      const pubData = await pubRes.json();
      assert.strictEqual(pubRes.status, 200, `POST /api/internships status for ${scen.specName}`);
      const intObj = pubData.internship;
      createdInternshipIds.push(intObj.id);

      assert.strictEqual(intObj.domain_id, scen.domainId, `Auto-assigned domain_id matches ${scen.domainId}`);
      assert.strictEqual(intObj.specialization_id, scen.specId, `Auto-assigned specialization_id matches ${scen.specId}`);
      assert.strictEqual(intObj.scholar_profile_id, scholarRecord.id, "Scholar profile ID bound correctly");
      console.log(`  ✓ Published Internship ID: ${intObj.id}`);
      console.log(`  ✓ Server Auto-Assignment: ${intObj.domain_id} → ${intObj.specialization_id} (Client spoof overridden)`);

      // 3. Open Internships Discovery (GET /api/public)
      const listRes = await fetch(`${BASE_URL}/api/public`);
      const listData = await listRes.json();
      const allPub = listData.internships || [];
      const foundInPub = allPub.find((i) => i.internship.id === intObj.id);
      assert.ok(foundInPub, "Internship discoverable in public listing");
      assert.strictEqual(foundInPub.domain?.id, scen.domainId, "Parent domain ID matches in public discovery");
      assert.strictEqual(foundInPub.specialization?.id, scen.specId, "Specialization ID matches in public discovery");
      console.log(`  ✓ Discovered in Open Internships: ${foundInPub.domain?.name} → ${foundInPub.specialization?.name}`);

      // 4. Strict isolation: Ensure it does NOT appear under unrelated specializations
      const unrelatedSpecId = SCENARIOS[(idx + 1) % SCENARIOS.length].specId;
      const unrelatedMatch = allPub.filter((i) => i.internship.specialization_id === unrelatedSpecId);
      assert.ok(!unrelatedMatch.some((i) => i.internship.id === intObj.id), "Internship does not leak into unrelated specialization");
      console.log(`  ✓ Strict academic isolation: Does NOT leak into unrelated specializations`);

      // 5. Single Internship Details & Scholar Profile Display (GET /api/public?internshipId=...)
      const detailRes = await fetch(`${BASE_URL}/api/public?internshipId=${intObj.id}`);
      const detailData = await detailRes.json();
      assert.strictEqual(detailRes.status, 200, "Internship detail query succeeded");
      assert.ok(detailData.internship, "Internship detail object present");
      assert.ok(detailData.scholarDetails, "Scholar details present");
      assert.strictEqual(detailData.scholarDetails.scholar.id, scholarRecord.id, "Publishing scholar ID verified");
      console.log(`  ✓ Detail View: Mentor ${detailData.scholarDetails.profile.full_name} (${detailData.scholarDetails.scholar.university_institution})`);

      // 6. Student A applies for this internship
      const appPayload = {
        internship_id: intObj.id,
        scholar_profile_id: scholarRecord.id,
        student_full_name: studentA.full_name,
        student_email: studentA.email,
        student_phone: studentA.phone || "+91 98765 43210",
        college_university: "National Institute of Technology Karnataka (NITK)",
        degree: "B.Tech",
        department: "Computer Science",
        current_academic_year: "3rd Year",
        research_interests: [scen.specName],
        technical_skills: ["Python", "Research Analysis"],
        statement_of_purpose: `Applying for research in ${scen.specName} to contribute to doctoral investigations.`,
        relevant_experience: "Completed relevant university lab courses.",
        expected_availability: "20 hours/week",
        preferred_duration: "10 Weeks",
        resume_url: "/sample-documents/student-cv.pdf",
      };

      const applyRes = await fetch(`${BASE_URL}/api/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: studentACookie },
        body: JSON.stringify(appPayload),
      });
      const applyData = await applyRes.json();
      assert.strictEqual(applyRes.status, 200, "Application submission succeeded");
      createdAppIds.push(applyData.application.id);
      console.log(`  ✓ Student Application Submitted: App ID ${applyData.application.id}`);

      // 7. Verify application appears in publishing scholar's dashboard
      const dashAppsRes = await fetch(`${BASE_URL}/api/applications?internshipId=${intObj.id}`, {
        headers: { Cookie: scholarCookie },
      });
      const dashAppsData = await dashAppsRes.json();
      const appsForThisInt = dashAppsData.applications || [];
      assert.strictEqual(appsForThisInt.length, 1, `Scholar sees exactly 1 application for ${intObj.title}`);
      assert.strictEqual(appsForThisInt[0].application.id, applyData.application.id, "Application ID matches");
      console.log(`  ✓ Scholar Dashboard Verification: Application visible under '${intObj.title}'`);

      passedScenarios++;
    }

    console.log("\n================================================================================");
    console.log(`14/14 MULTI-DOMAIN SCENARIOS PASSED SUCCESSFULLY`);
    console.log("================================================================================\n");

    // -------------------------------------------------------------------------
    // SECTION 9: ADVANCED MULTIPLE STUDENT APPLICATION TESTS (TESTS A THROUGH G)
    // -------------------------------------------------------------------------
    console.log("\n▶ EXECUTING SECTION 9: TESTS A THROUGH G (ISOLATED TRIPLE-INTERNSHIP TEST)");

    // Scholar publishes 3 distinct internships for Section 9 test suite
    const createTestInt = async (title) => {
      const p = {
        title,
        description: `Investigating foundational doctoral questions in ${title}.`,
        required_skills: ["Python", "Algorithms", "Research Analysis"],
        eligibility_criteria: "Undergraduate or postgraduate researchers.",
        duration: "10 Weeks",
        available_positions: 2,
        mode: "Remote",
        application_deadline: "2027-06-30",
        stipend: "Academic Credit / Fellowship",
        status: "Open",
      };
      const r = await fetch(`${BASE_URL}/api/internships`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: scholarCookie },
        body: JSON.stringify(p),
      });
      const d = await r.json();
      assert.strictEqual(r.status, 200, `Created Section 9 test internship: ${title}`);
      createdInternshipIds.push(d.internship.id);
      return d.internship.id;
    };

    const testInt1 = await createTestInt("Section 9 — Distributed Consensus Protocol Analysis");
    const testInt2 = await createTestInt("Section 9 — Asynchronous Graph Learning & Network Dynamics");
    const testInt3 = await createTestInt("Section 9 — Autonomous Perception & Sensor Fusion Architecture");

    // TEST A: Student A applies to testInt1
    console.log("  • Running Test A: Student A applies to Internship 1...");
    const appAPayload = {
      internship_id: testInt1,
      scholar_profile_id: scholarRecord.id,
      student_full_name: studentA.full_name,
      student_email: studentA.email,
      student_phone: studentA.phone || "+91 98765 43210",
      college_university: "National Institute of Technology Karnataka (NITK)",
      degree: "B.Tech",
      department: "Computer Science",
      current_academic_year: "3rd Year",
      research_interests: ["Distributed Systems", "Consensus Protocols"],
      technical_skills: ["Python", "Go", "Docker"],
      statement_of_purpose: "Passionate about doctoral research in consensus protocols and distributed fault tolerance.",
      relevant_experience: "Implemented Raft consensus algorithm in undergraduate networking laboratory.",
      expected_availability: "20 hours/week",
      preferred_duration: "10 Weeks",
      resume_url: "/sample-documents/student-cv.pdf",
    };
    const resA = await fetch(`${BASE_URL}/api/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: studentACookie },
      body: JSON.stringify(appAPayload),
    });
    const dataA = await resA.json();
    assert.strictEqual(resA.status, 200, "Student A application succeeded");
    createdAppIds.push(dataA.application.id);
    console.log("  ✓ Test A Passed: Student A applied to Internship 1 (Status: Submitted)");

    // TEST B: Student B applies to testInt1
    console.log("  • Running Test B: Student B applies to Internship 1...");
    const appBPayload = {
      ...appAPayload,
      student_full_name: studentB.full_name,
      student_email: studentB.email,
      student_phone: studentB.phone || "+91 98765 12345",
      college_university: "Vellore Institute of Technology",
      degree: "B.Tech",
      department: "IT",
      current_academic_year: "4th Year",
      statement_of_purpose: "Interested in distributed consensus protocols and replication mechanisms.",
      relevant_experience: "Completed distributed database coursework and built key-value store.",
    };
    const resB = await fetch(`${BASE_URL}/api/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: studentBCookie },
      body: JSON.stringify(appBPayload),
    });
    const dataB = await resB.json();
    assert.strictEqual(resB.status, 200, "Student B application succeeded");
    createdAppIds.push(dataB.application.id);

    // Verify scholar sees both applications for testInt1
    const resDashBoth = await fetch(`${BASE_URL}/api/applications?internshipId=${testInt1}`, {
      headers: { Cookie: scholarCookie },
    });
    const dataDashBoth = await resDashBoth.json();
    assert.strictEqual((dataDashBoth.applications || []).length, 2, "Scholar sees both applications for Internship 1");
    console.log("  ✓ Test B Passed: Scholar dashboard displays both Student A and Student B applications (Total: 2)");

    // TEST C: Student A applies to testInt2 from same scholar
    console.log("  • Running Test C: Student A applies to Internship 2 from same scholar...");
    const appA2Payload = {
      ...appAPayload,
      internship_id: testInt2,
      statement_of_purpose: "Applying to the Graph Learning opportunity to investigate graph neural networks.",
    };
    const resC = await fetch(`${BASE_URL}/api/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: studentACookie },
      body: JSON.stringify(appA2Payload),
    });
    const dataC = await resC.json();
    assert.strictEqual(resC.status, 200, "Student A application to Internship 2 succeeded");
    createdAppIds.push(dataC.application.id);
    assert.strictEqual(dataC.application.internship_id, testInt2, "Application linked to Internship 2, not Internship 1");
    console.log("  ✓ Test C Passed: Student A application linked independently to Internship 2");

    // TEST D: Student A attempts duplicate application to testInt1
    console.log("  • Running Test D: Student A attempts duplicate application to Internship 1...");
    const resDup = await fetch(`${BASE_URL}/api/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: studentACookie },
      body: JSON.stringify(appAPayload),
    });
    const dataDup = await resDup.json();
    assert.strictEqual(resDup.status, 409, `Duplicate application rejected with 409: ${dataDup.error}`);
    console.log(`  ✓ Test D Passed: Duplicate active application rejected safely (HTTP 409: "${dataDup.error}")`);

    // TEST E: Student A checks unapplied testInt3
    console.log("  • Running Test E: Student A checks unapplied Internship 3...");
    const resE = await fetch(`${BASE_URL}/api/public?internshipId=${testInt3}`, {
      headers: { Cookie: studentACookie },
    });
    const dataE = await resE.json();
    assert.strictEqual(dataE.studentApplication, null, "Internship 3 shows unapplied state for Student A");
    console.log("  ✓ Test E Passed: Internship 3 independently retains unapplied state");

    // TEST F: Student applies to an internship from another specialization
    console.log("  • Running Test F: Application appears only in dashboard of scholar who published it...");
    const resF = await fetch(`${BASE_URL}/api/applications`, {
      headers: { Cookie: otherScholarCookie },
    });
    const dataF = await resF.json();
    const otherScholarApps = dataF.applications || [];
    const leak = otherScholarApps.find((a) => createdAppIds.includes(a.application.id));
    assert.ok(!leak, "Other scholar cannot see applications for this scholar's internship");
    console.log("  ✓ Test F Passed: Applications appear exclusively in publishing scholar's dashboard");

    // TEST G: A different scholar attempts to access another scholar's applications via PATCH
    console.log("  • Running Test G: Cross-scholar access blocked by backend authorization...");
    const targetAppId = dataA.application.id;
    const resG = await fetch(`${BASE_URL}/api/applications`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: otherScholarCookie },
      body: JSON.stringify({ applicationId: targetAppId, status: "Rejected" }),
    });
    assert.strictEqual(resG.status, 403, "Cross-scholar modification blocked with HTTP 403 Forbidden");
    console.log("  ✓ Test G Passed: Backend authorization strictly blocked cross-scholar modification (HTTP 403)");

    console.log("\n================================================================================");
    console.log("ALL TESTS A THROUGH G PASSED WITH 100% SUCCESS");
    console.log("================================================================================\n");

  } finally {
    // Clean up created test internships & applications to preserve database baseline
    console.log("\n[CLEANUP & RESTORATION]");
    const cleanDb = JSON.parse(fs.readFileSync("data/starsky-db.json", "utf8"));
    cleanDb.internships = cleanDb.internships.filter((i) => !createdInternshipIds.includes(i.id));
    cleanDb.internship_applications = cleanDb.internship_applications.filter((a) => !createdAppIds.includes(a.id));
    
    // Restore scholar to original
    const endScholar = cleanDb.phd_scholar_profiles.find((s) => s.id === scholarRecord.id);
    if (endScholar) {
      endScholar.domain_id = origDomainId;
      endScholar.specialization_id = origSpecId;
      endScholar.research_field = origField;
      endScholar.specialization = origSpec;
    }
    
    // Clean test notifications and activity logs
    cleanDb.notifications = (cleanDb.notifications || []).filter(
      (n) => !n.title?.includes("Consensus Algorithms") && !n.message?.includes("Consensus Algorithms")
    );
    cleanDb.activity_logs = (cleanDb.activity_logs || []).filter(
      (a) => !a.details?.includes("Consensus Algorithms")
    );

    fs.writeFileSync("data/starsky-db.json", JSON.stringify(cleanDb, null, 2), "utf8");
    console.log(`  ✓ Cleaned up ${createdInternshipIds.length} test internships and ${createdAppIds.length} test applications`);
    console.log(`  ✓ Restored scholar profile back to: ${origField} → ${origSpec}`);
    console.log(`  ✓ Baseline applications preserved: ${cleanDb.internship_applications.map((a) => a.id).join(", ")}`);
  }
}

run().catch((err) => {
  console.error("Execution failed:", err);
  process.exit(1);
});

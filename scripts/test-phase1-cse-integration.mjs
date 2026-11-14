import fs from "fs";
import crypto from "crypto";

const BASE_URL = "http://localhost:3000";

function getSecret() {
  if (process.env.STARSKY_SESSION_SECRET) return process.env.STARSKY_SESSION_SECRET;
  if (fs.existsSync(".env.local")) {
    const env = fs.readFileSync(".env.local", "utf8");
    const m = env.match(/STARSKY_SESSION_SECRET=(.*)/);
    if (m) return m[1].trim();
  }
  if (fs.existsSync(".env")) {
    const env = fs.readFileSync(".env", "utf8");
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

async function runTests() {
  console.log("================================================================================");
  console.log("STARSKY — PHASE 1: CSE DOMAIN-WISE INTERNSHIP PUBLISHING & APPLICATION TEST");
  console.log("Parent Domain: Engineering | Specialization: Computer Science Engineering");
  console.log("================================================================================\n");

  const dbBefore = JSON.parse(fs.readFileSync("data/starsky-db.json", "utf8"));
  const originalAppIds = dbBefore.internship_applications.map((a) => a.id);
  console.log(`Original DB state: ${originalAppIds.length} existing applications: ${originalAppIds.join(", ")}`);

  // Target Accounts:
  // Scholar: usr-scholar-55893117 (sch-6b3c4953, Subodh Kumar, Nit patna)
  // Student A: usr-student-1 (Aarav Sharma)
  // Student B: usr-student-2 (Diya Nair)
  // Other Scholar: usr-scholar-1 (sch-1, Ananya Raghavan)
  const scholarCookie = createSignedCookie("usr-scholar-55893117", "scholar");
  const otherScholarCookie = createSignedCookie("usr-scholar-1", "scholar");
  const studentACookie = createSignedCookie("usr-student-1", "student");
  const studentBCookie = createSignedCookie("usr-student-2", "student");

  let createdInternships = [];
  let createdApplications = [];

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Publish Internship 1 (Deep Learning Research Intern)
    // -------------------------------------------------------------------------
    console.log("\n▶ TEST 1: Publish 'Deep Learning Research Intern' with Server Auto-Assignment");
    const int1Payload = {
      title: "Deep Learning Research Intern",
      description: "Students should know how to train machine learning and deep learning models.",
      required_skills: ["Python", "PyTorch", "Data Preprocessing", "Machine Learning"],
      eligibility_criteria: "Undergraduate or postgraduate students from relevant disciplines.",
      duration: "8 Weeks",
      available_positions: 2,
      mode: "Remote",
      application_deadline: "2027-03-31",
      stipend: "Academic Credit + Publication Co-authorship",
      status: "Open",
      // Spoofed values to verify anti-tampering
      domain_id: "dom-medical",
      specialization_id: "spec-medical-surgery",
      scholar_profile_id: "sch-1",
    };

    const res1 = await fetch(`${BASE_URL}/api/internships`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: scholarCookie },
      body: JSON.stringify(int1Payload),
    });
    const data1 = await res1.json();

    if (!res1.ok || !data1.internship) {
      throw new Error(`Failed to publish Internship 1: ${JSON.stringify(data1)}`);
    }

    const int1 = data1.internship;
    createdInternships.push(int1.id);
    console.log(`  ✓ Created Internship 1 ID: ${int1.id}`);
    console.log(`  ✓ Server-assigned Scholar Profile ID: ${int1.scholar_profile_id} (Expected: sch-6b3c4953)`);
    console.log(`  ✓ Server-assigned Domain ID: ${int1.domain_id} (Expected: dom-engineering)`);
    console.log(`  ✓ Server-assigned Specialization ID: ${int1.specialization_id} (Expected: spec-engineering-computer-science-engineering)`);

    if (int1.scholar_profile_id !== "sch-6b3c4953") throw new Error("Tampered scholar_profile_id was not overridden!");
    if (int1.domain_id !== "dom-engineering") throw new Error("Tampered domain_id was not overridden!");
    if (int1.specialization_id !== "spec-engineering-computer-science-engineering") throw new Error("Tampered specialization_id was not overridden!");
    console.log("  ✓ Anti-tampering check: PASSED (Client spoof values ignored, verified profile bound)");

    // -------------------------------------------------------------------------
    // TEST 2: Multiple Internship Publishing (Machine Learning & Computer Vision)
    // -------------------------------------------------------------------------
    console.log("\n▶ TEST 2: Multiple Internship Publishing for Same CSE Scholar Account");
    const int2Payload = {
      title: "Machine Learning Research Intern",
      description: "Focus on classical machine learning, feature engineering, and statistical modeling.",
      required_skills: ["Python", "Scikit-Learn", "Pandas", "Feature Engineering"],
      eligibility_criteria: "UG / PG students with strong Python & statistics background.",
      duration: "10 Weeks",
      available_positions: 3,
      mode: "Hybrid",
      application_deadline: "2027-04-30",
      stipend: "INR 15,000 / month + Co-authorship",
      status: "Open",
    };
    const res2 = await fetch(`${BASE_URL}/api/internships`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: scholarCookie },
      body: JSON.stringify(int2Payload),
    });
    const data2 = await res2.json();
    const int2 = data2.internship;
    createdInternships.push(int2.id);
    console.log(`  ✓ Created Internship 2 ID: ${int2.id} ('${int2.title}')`);

    const int3Payload = {
      title: "Computer Vision Research Intern",
      description: "Explore 3D reconstruction, object detection, and visual transformers.",
      required_skills: ["PyTorch", "OpenCV", "Computer Vision", "Transformers"],
      eligibility_criteria: "Students with linear algebra and deep learning foundations.",
      duration: "12 Weeks",
      available_positions: 1,
      mode: "Remote",
      application_deadline: "2027-05-31",
      stipend: "Academic Fellowship",
      status: "Open",
    };
    const res3 = await fetch(`${BASE_URL}/api/internships`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: scholarCookie },
      body: JSON.stringify(int3Payload),
    });
    const data3 = await res3.json();
    const int3 = data3.internship;
    createdInternships.push(int3.id);
    console.log(`  ✓ Created Internship 3 ID: ${int3.id} ('${int3.title}')`);

    if (int1.id === int2.id || int2.id === int3.id) throw new Error("Internship IDs must be distinct!");
    console.log("  ✓ All 3 internships saved independently with unique IDs");

    // -------------------------------------------------------------------------
    // TEST 3: Public Discovery & Academic Taxonomy Filtering (Section 3 & 10)
    // -------------------------------------------------------------------------
    console.log("\n▶ TEST 3: Open Internships Discovery & Hierarchy Filtering");
    const pubRes = await fetch(`${BASE_URL}/api/public`);
    const pubData = await pubRes.json();

    const cseInternships = pubData.internships.filter(
      (i) =>
        i.internship.domain_id === "dom-engineering" &&
        i.internship.specialization_id === "spec-engineering-computer-science-engineering"
    );
    console.log(`  ✓ Found ${cseInternships.length} active internships under Engineering → Computer Science Engineering`);

    const foundTitles = cseInternships.map((i) => i.internship.title);
    if (!foundTitles.includes("Deep Learning Research Intern")) throw new Error("Deep Learning internship not found in public API!");
    if (!foundTitles.includes("Machine Learning Research Intern")) throw new Error("Machine Learning internship not found in public API!");
    if (!foundTitles.includes("Computer Vision Research Intern")) throw new Error("Computer Vision internship not found in public API!");
    console.log("  ✓ All 3 published internships discoverable under Engineering → Computer Science Engineering");

    // Verify card fields for Deep Learning Research Intern
    const dlCard = cseInternships.find((i) => i.internship.id === int1.id);
    console.log(`  ✓ Scholar: ${dlCard.scholarUser.full_name} (${dlCard.scholar.university_institution})`);
    console.log(`  ✓ Department: ${dlCard.scholar.department}`);
    console.log(`  ✓ Verification Status: ${dlCard.scholar.verification_status}`);
    console.log(`  ✓ Domain & Specialization: ${dlCard.domain.name} → ${dlCard.specialization.name}`);
    console.log(`  ✓ Duration: ${dlCard.internship.duration} | Mode: ${dlCard.internship.mode} | Positions: ${dlCard.internship.available_positions}`);

    // Verify isolation from other specializations
    const dataScienceInternships = pubData.internships.filter(
      (i) => i.internship.specialization_id === "spec-engineering-data-science"
    );
    if (dataScienceInternships.some((i) => createdInternships.includes(i.internship.id))) {
      throw new Error("CSE internships incorrectly leaked into Data Science specialization!");
    }
    console.log("  ✓ Strict taxonomy isolation verified: CSE internships do not leak into Data Science or other specializations");

    // -------------------------------------------------------------------------
    // TEST 4: PhD Scholar Public Profile Inspection (Section 4)
    // -------------------------------------------------------------------------
    console.log("\n▶ TEST 4: View Full PhD Scholar Profile & Privacy Check");
    const scholarRes = await fetch(`${BASE_URL}/api/public?scholarId=sch-6b3c4953`);
    const scholarData = await scholarRes.json();
    if (!scholarData.scholar) throw new Error("Failed to load scholar public profile!");

    const sProfile = scholarData.scholar;
    console.log(`  ✓ Name: ${sProfile.profile.full_name} | University: ${sProfile.scholar.university_institution}`);
    console.log(`  ✓ Research Topic: ${sProfile.scholar.current_research_topic}`);
    console.log(`  ✓ Active Internships Count: ${sProfile.internships.length}`);
    console.log(`  ✓ Publications Count: ${sProfile.publications.length}`);
    if (sProfile.profile.email) throw new Error("Private email exposed on public profile!");
    if (sProfile.profile.phone) throw new Error("Private phone exposed on public profile!");
    console.log("  ✓ Privacy protection verified: Private email and phone strictly hidden");

    // -------------------------------------------------------------------------
    // TEST 5: Single Internship Detail Page Endpoint (Section 5)
    // -------------------------------------------------------------------------
    console.log("\n▶ TEST 5: Single Internship Details (/api/public?internshipId=...)");
    const detailRes = await fetch(`${BASE_URL}/api/public?internshipId=${int1.id}`);
    const detailData = await detailRes.json();
    if (!detailData.internship) throw new Error("Failed to load single internship detail!");
    console.log(`  ✓ Details loaded for '${detailData.internship.internship.title}'`);
    console.log(`  ✓ Enriched Mentor: ${detailData.scholarDetails.profile.full_name} (${detailData.scholarDetails.scholar.university_institution})`);

    // -------------------------------------------------------------------------
    // TEST 6: Multiple Student Application Tests (Section 8)
    // -------------------------------------------------------------------------
    console.log("\n▶ TEST 6: Multiple Student Application Workflow (Tests A through E)");

    // Test A: Student A applies to Deep Learning internship
    console.log("  • Submitting Application: Student A -> Deep Learning Research Intern");
    const appA1Payload = {
      internship_id: int1.id,
      scholar_profile_id: int1.scholar_profile_id,
      student_full_name: "Aarav Sharma",
      student_email: "aarav.sharma@nitk.edu.in",
      student_phone: "+91 98765 43210",
      college_university: "National Institute of Technology Karnataka, Surathkal",
      degree: "B.Tech",
      department: "Computer Science and Engineering",
      current_academic_year: "3rd Year (6th Semester)",
      research_interests: ["Deep Learning", "Generative Models", "Neural Networks"],
      technical_skills: ["Python", "PyTorch", "NumPy", "OpenCV"],
      statement_of_purpose: "I have completed deep learning coursework and built transformer projects. I want to contribute to doctoral research in deep learning.",
      relevant_experience: "Built an image classifier using ResNet-50 and deployed on Hugging Face Spaces.",
      expected_availability: "20 hours/week",
      preferred_duration: "8 Weeks",
      resume_url: "/sample-documents/student-cv.pdf",
    };

    const resAppA1 = await fetch(`${BASE_URL}/api/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: studentACookie },
      body: JSON.stringify(appA1Payload),
    });
    const dataAppA1 = await resAppA1.json();
    if (!resAppA1.ok || !dataAppA1.application) {
      throw new Error(`Test A failed: ${JSON.stringify(dataAppA1)}`);
    }
    const appA1 = dataAppA1.application;
    createdApplications.push(appA1.id);
    console.log(`    ✓ Test A Passed: Student A applied successfully (App ID: ${appA1.id}, Status: ${appA1.status})`);

    // Test B: Student B applies to Deep Learning internship
    console.log("  • Submitting Application: Student B -> Deep Learning Research Intern");
    const appB1Payload = {
      internship_id: int1.id,
      scholar_profile_id: int1.scholar_profile_id,
      student_full_name: "Diya Nair",
      student_email: "diya.nair@vit.ac.in",
      student_phone: "+91 98765 12345",
      college_university: "Vellore Institute of Technology",
      degree: "B.Tech",
      department: "Information Technology",
      current_academic_year: "4th Year (7th Semester)",
      research_interests: ["Deep Learning", "Computer Vision", "Graph Neural Networks"],
      technical_skills: ["Python", "PyTorch", "TensorFlow", "Scikit-Learn"],
      statement_of_purpose: "I am passionate about deep learning algorithms and excited to assist in research paper implementations.",
      relevant_experience: "Published an undergraduate survey on GNNs and implemented PyTorch models.",
      expected_availability: "25 hours/week",
      preferred_duration: "8 Weeks",
      resume_url: "/sample-documents/student-cv.pdf",
    };

    const resAppB1 = await fetch(`${BASE_URL}/api/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: studentBCookie },
      body: JSON.stringify(appB1Payload),
    });
    const dataAppB1 = await resAppB1.json();
    if (!resAppB1.ok || !dataAppB1.application) {
      throw new Error(`Test B failed: ${JSON.stringify(dataAppB1)}`);
    }
    const appB1 = dataAppB1.application;
    createdApplications.push(appB1.id);
    console.log(`    ✓ Test B Passed: Student B applied successfully (App ID: ${appB1.id}, Status: ${appB1.status})`);

    // Test C: Student A applies to Machine Learning internship
    console.log("  • Submitting Application: Student A -> Machine Learning Research Intern");
    const appA2Payload = {
      ...appA1Payload,
      internship_id: int2.id,
      preferred_duration: "10 Weeks",
      statement_of_purpose: "Applying for the Machine Learning opportunity to deepen expertise in statistical modeling.",
    };
    const resAppA2 = await fetch(`${BASE_URL}/api/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: studentACookie },
      body: JSON.stringify(appA2Payload),
    });
    const dataAppA2 = await resAppA2.json();
    if (!resAppA2.ok || !dataAppA2.application) {
      throw new Error(`Test C failed: ${JSON.stringify(dataAppA2)}`);
    }
    const appA2 = dataAppA2.application;
    createdApplications.push(appA2.id);
    console.log(`    ✓ Test C Passed: Student A applied to second internship (App ID: ${appA2.id}, linked to ${int2.id})`);

    // Test D: Student A attempts to apply AGAIN to Deep Learning internship
    console.log("  • Submitting Duplicate Application: Student A -> Deep Learning Research Intern");
    const resDup = await fetch(`${BASE_URL}/api/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: studentACookie },
      body: JSON.stringify(appA1Payload),
    });
    const dataDup = await resDup.json();
    if (resDup.status === 409) {
      console.log(`    ✓ Test D Passed: Duplicate application prevented safely (HTTP 409: "${dataDup.error}")`);
    } else {
      throw new Error(`Test D failed: Expected HTTP 409, got ${resDup.status}: ${JSON.stringify(dataDup)}`);
    }

    // Test E: Check Computer Vision internship application state for Student A
    console.log("  • Checking Independent Application State: Student A on Computer Vision internship");
    const resStateE = await fetch(`${BASE_URL}/api/public?internshipId=${int3.id}`, {
      headers: { Cookie: studentACookie },
    });
    const dataStateE = await resStateE.json();
    if (dataStateE.studentApplication) {
      throw new Error(`Test E failed: Student A should not be marked as applied for internship 3!`);
    }
    console.log("    ✓ Test E Passed: Computer Vision internship shows unapplied (independent application states verified)");

    // -------------------------------------------------------------------------
    // TEST 7: PhD Scholar Dashboard — Applications Display & Decision Management (Section 6)
    // -------------------------------------------------------------------------
    console.log("\n▶ TEST 7: PhD Scholar Dashboard — Application Management & Status Updates");
    const scholarAppsRes = await fetch(`${BASE_URL}/api/applications`, {
      headers: { Cookie: scholarCookie },
    });
    const scholarAppsData = await scholarAppsRes.json();
    const allScholarApps = scholarAppsData.applications || [];
    console.log(`  ✓ Scholar Dashboard loaded ${allScholarApps.length} total applications for published internships`);

    // Filter by Deep Learning Internship (int1)
    const dlApps = allScholarApps.filter((a) => a.application.internship_id === int1.id);
    console.log(`  ✓ Deep Learning Research Intern has ${dlApps.length} applicants (Expected: 2)`);
    if (dlApps.length !== 2) throw new Error(`Expected 2 applicants for Deep Learning, got ${dlApps.length}`);

    // Filter by Machine Learning Internship (int2)
    const mlApps = allScholarApps.filter((a) => a.application.internship_id === int2.id);
    console.log(`  ✓ Machine Learning Research Intern has ${mlApps.length} applicants (Expected: 1)`);
    if (mlApps.length !== 1) throw new Error(`Expected 1 applicant for Machine Learning, got ${mlApps.length}`);

    // Update statuses
    console.log("  • Updating Application Statuses by Scholar...");
    const update1 = await fetch(`${BASE_URL}/api/applications`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: scholarCookie },
      body: JSON.stringify({
        applicationId: appA1.id,
        status: "Under Review",
        scholar_private_notes: "Strong PyTorch portfolio; candidate shortlisted for technical round.",
      }),
    });
    const updateData1 = await update1.json();
    if (!update1.ok || updateData1.application.status !== "Under Review") {
      throw new Error(`Failed to update appA1 status: ${JSON.stringify(updateData1)}`);
    }
    console.log(`    ✓ App ${appA1.id} updated to 'Under Review' with private notes`);

    const update2 = await fetch(`${BASE_URL}/api/applications`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: scholarCookie },
      body: JSON.stringify({
        applicationId: appB1.id,
        status: "Shortlisted",
      }),
    });
    const updateData2 = await update2.json();
    if (!update2.ok || updateData2.application.status !== "Shortlisted") {
      throw new Error(`Failed to update appB1 status: ${JSON.stringify(updateData2)}`);
    }
    console.log(`    ✓ App ${appB1.id} updated to 'Shortlisted'`);

    const update3 = await fetch(`${BASE_URL}/api/applications`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: scholarCookie },
      body: JSON.stringify({
        applicationId: appA2.id,
        status: "Accepted",
      }),
    });
    const updateData3 = await update3.json();
    if (!update3.ok || updateData3.application.status !== "Accepted") {
      throw new Error(`Failed to update appA2 status: ${JSON.stringify(updateData3)}`);
    }
    console.log(`    ✓ App ${appA2.id} updated to 'Accepted'`);

    // -------------------------------------------------------------------------
    // TEST 8: Cross-Scholar Security & Authorization Enforcement (Section 6 & 9)
    // -------------------------------------------------------------------------
    console.log("\n▶ TEST 8: Cross-Scholar Authorization & Access Control");
    // Other scholar (Dr. Ananya Raghavan) attempts to view applications for Subodh Kumar's internship
    const otherScholarAppsRes = await fetch(`${BASE_URL}/api/applications`, {
      headers: { Cookie: otherScholarCookie },
    });
    const otherScholarAppsData = await otherScholarAppsRes.json();
    const otherApps = otherScholarAppsData.applications || [];
    const leakedApp = otherApps.find((a) => createdApplications.includes(a.application.id));
    if (leakedApp) {
      throw new Error(`SECURITY BREACH: Other scholar can see application ${leakedApp.application.id}!`);
    }
    console.log("  ✓ Cross-scholar isolation: Other scholars CANNOT view these applications");

    // Other scholar attempts to PATCH Subodh Kumar's application
    const crossPatchRes = await fetch(`${BASE_URL}/api/applications`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: otherScholarCookie },
      body: JSON.stringify({
        applicationId: appA1.id,
        status: "Rejected",
      }),
    });
    if (crossPatchRes.status === 403) {
      console.log("  ✓ Cross-scholar modification blocked: HTTP 403 Forbidden returned");
    } else {
      throw new Error(`Cross-scholar patch should return 403, got ${crossPatchRes.status}`);
    }

    // -------------------------------------------------------------------------
    // TEST 9: Student Access & Privacy Protection (Section 8 & 9)
    // -------------------------------------------------------------------------
    console.log("\n▶ TEST 9: Student Data Privacy & Self-Access Only");
    const stuARes = await fetch(`${BASE_URL}/api/applications`, {
      headers: { Cookie: studentACookie },
    });
    const stuAData = await stuARes.json();
    const stuAApps = stuAData.applications || [];
    console.log(`  ✓ Student A sees ${stuAApps.length} own application(s)`);

    // Check that Student A does NOT see Student B's application
    if (stuAApps.some((a) => a.application.id === appB1.id)) {
      throw new Error("Student A can see Student B's application!");
    }
    console.log("  ✓ Student A cannot see Student B's applications");

    // Check that Student A does NOT see scholar private notes
    const viewedAppA1 = stuAApps.find((a) => a.application.id === appA1.id);
    if (viewedAppA1?.application.scholar_private_notes) {
      throw new Error("Scholar private notes were leaked to student!");
    }
    console.log("  ✓ Scholar private notes strictly hidden from student");

    // -------------------------------------------------------------------------
    // TEST 10: Baseline Preservation (Section 11)
    // -------------------------------------------------------------------------
    console.log("\n▶ TEST 10: Preserved Baseline Data Verification");
    const dbNow = JSON.parse(fs.readFileSync("data/starsky-db.json", "utf8"));
    const currentAppIds = new Set(dbNow.internship_applications.map((a) => a.id));
    for (const origId of originalAppIds) {
      if (!currentAppIds.has(origId)) {
        throw new Error(`Baseline application ${origId} was deleted!`);
      }
    }
    console.log(`  ✓ All ${originalAppIds.length} original applications preserved: ${originalAppIds.join(", ")}`);
    console.log(`  ✓ Total applications in DB before cleanup: ${dbNow.internship_applications.length}`);
    console.log(`  ✓ Total internships in DB before cleanup: ${dbNow.internships.length}`);

    // Clean up test internships and test applications
    const testIntIds = [int1.id, int2.id, int3.id];
    const testAppIds = [appA1.id, appB1.id, appA2.id];
    const dbClean = JSON.parse(fs.readFileSync("data/starsky-db.json", "utf8"));
    dbClean.internships = dbClean.internships.filter((i) => !testIntIds.includes(i.id));
    dbClean.internship_applications = dbClean.internship_applications.filter((a) => !testAppIds.includes(a.id));
    fs.writeFileSync("data/starsky-db.json", JSON.stringify(dbClean, null, 2), "utf8");
    console.log(`  ✓ Cleaned up ${testIntIds.length} test internships and ${testAppIds.length} test applications`);

    console.log("\n================================================================================");
    console.log("ALL 10 TEST SUITES PASSED SUCCESSFULLY (100% PASS RATE, 0 FAILURES)");
    console.log("Phase 1 CSE Domain-Wise Publishing & Application Integration is Fully Verified!");
    console.log("================================================================================\n");
  } catch (err) {
    console.error("\n❌ TEST SUITE FAILURE:", err);
    process.exit(1);
  }
}

runTests();

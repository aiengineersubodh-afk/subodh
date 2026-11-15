import fs from "fs";

const db = JSON.parse(fs.readFileSync("data/starsky-db.json", "utf8"));
const priya = db.phd_scholar_profiles.find((s) => s.id === "sch-cf4fc5e8");

console.log("=== CURRENT STATE ===");
console.log("Scholar ID:", priya.id);
console.log("Scholar Name:", db.profiles.find((p) => p.id === priya.profile_id)?.full_name);
console.log("Domain ID:", priya.domain_id);
console.log("Spec ID:", priya.specialization_id);
console.log("Verification Status:", priya.verification_status);

const qInts = db.internships.filter((i) => i.scholar_profile_id === priya.id);
console.log("Internships count:", qInts.length);
qInts.forEach((i) => {
  console.log(`  - [${i.id}] "${i.title}" status: ${i.status}, moderation: ${i.moderation_status}, domain: ${i.domain_id}, spec: ${i.specialization_id}`);
});

console.log("\n=== TESTING SIMULATED APPROVED STATE ===");
// Temporarily simulate approved in-memory
const testDb = JSON.parse(JSON.stringify(db));
const testPriya = testDb.phd_scholar_profiles.find((s) => s.id === "sch-cf4fc5e8");
testPriya.verification_status = "approved";

// Run getEnrichedInternships logic
const publicEnriched = testDb.internships
  .filter((i) => i.status === "Open" && i.moderation_status === "approved")
  .map((internship) => {
    const scholar = testDb.phd_scholar_profiles.find((s) => s.id === internship.scholar_profile_id);
    const scholarUser = scholar ? testDb.profiles.find((p) => p.id === scholar.profile_id) : undefined;
    const domain = testDb.academic_domains.find((d) => d.id === internship.domain_id);
    const specialization = testDb.specializations.find((sp) => sp.id === internship.specialization_id);
    return { internship, scholar, scholarUser, domain, specialization };
  })
  .filter((item) => Boolean(item.scholar && item.scholarUser && item.scholarUser.status === "active") && item.scholar.verification_status === "approved");

console.log("Total public enriched when approved:", publicEnriched.length);
const qPublic = publicEnriched.filter((item) => item.internship.specialization_id === "spec-interdisciplinary-quantum-information-science");
console.log("Quantum Information Science public internships:", qPublic.length);
qPublic.forEach((item) => {
  console.log(`  ✓ [${item.internship.id}] "${item.internship.title}" under ${item.domain?.name} (${item.domain?.id}) → ${item.specialization?.name} (${item.specialization?.id})`);
});

// Test Frontend Filtering Logic in explore/page.tsx
const selectedDomainId = "dom-interdisciplinary";
const selectedSpecId = "spec-interdisciplinary-quantum-information-science";

const filtered = publicEnriched.filter(({ internship }) => {
  if (selectedDomainId && internship.domain_id !== selectedDomainId) return false;
  if (selectedSpecId && internship.specialization_id !== selectedSpecId) return false;
  return true;
});

console.log(`\nFrontend filtered under ${selectedDomainId} → ${selectedSpecId}: ${filtered.length} internships`);
filtered.forEach((f) => {
  console.log(`  ✓ Matched: "${f.internship.title}" (ID: ${f.internship.id})`);
});

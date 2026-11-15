import fs from "fs";

const db = JSON.parse(fs.readFileSync("data/starsky-db.json", "utf8"));

console.log("=== TOTAL RECORDS ===");
console.log(`Profiles: ${db.profiles.length}`);
console.log(`PhD Scholar Profiles: ${db.phd_scholar_profiles.length}`);
console.log(`Internships: ${db.internships.length}`);

console.log("\n=== SEARCHING SCHOLARS FOR 'Raipur' OR 'Quantum' ===");
const matchingScholars = db.phd_scholar_profiles.filter((s) => {
  const uni = (s.university_institution || "").toLowerCase();
  const topic = (s.current_research_topic || "").toLowerCase();
  const spec = (s.specialization || "").toLowerCase();
  const field = (s.research_field || "").toLowerCase();
  return uni.includes("raipur") || topic.includes("quantum") || spec.includes("quantum") || field.includes("interdisciplinary");
});

console.log("\n=== SIMULATING getEnrichedInternships(true) ===");
const publicInts = db.internships.filter((i) => i.status === "Open" && i.moderation_status === "approved");
console.log(`Open & approved internships in DB: ${publicInts.length}`);
for (const i of publicInts) {
  const scholar = db.phd_scholar_profiles.find((s) => s.id === i.scholar_profile_id);
  const user = scholar ? db.profiles.find((p) => p.id === scholar.profile_id) : null;
  console.log(`[${i.id}] ${i.title}`);
  console.log(`   Domain: ${i.domain_id} | Spec: ${i.specialization_id}`);
  console.log(`   Scholar: ${user?.full_name} (${scholar?.id}) | Scholar Verification: ${scholar?.verification_status}`);
}

for (const s of matchingScholars) {
  const user = db.profiles.find((p) => p.id === s.profile_id);
  console.log("\n------------------------------------------------------------");
  console.log(`Scholar Profile ID: ${s.id}`);
  console.log(`User ID:            ${s.profile_id} (${user?.full_name}, ${user?.email}, status: ${user?.status})`);
  console.log(`Institution:        ${s.university_institution}`);
  console.log(`Research Topic:     ${s.current_research_topic}`);
  console.log(`Domain ID:          ${s.domain_id}`);
  console.log(`Domain Name:        ${s.research_field}`);
  console.log(`Specialization ID:  ${s.specialization_id}`);
  console.log(`Specialization Name:${s.specialization}`);
  console.log(`Verification Status:${s.verification_status}`);
  console.log(`Internship Avail:   ${s.internship_availability}`);

  const ints = db.internships.filter((i) => i.scholar_profile_id === s.id);
  console.log(`Published Internships: ${ints.length}`);
  for (const i of ints) {
    console.log(`  -> ID: ${i.id}`);
    console.log(`     Title: ${i.title}`);
    console.log(`     Domain ID: ${i.domain_id}`);
    console.log(`     Specialization ID: ${i.specialization_id}`);
    console.log(`     Status: ${i.status}`);
    console.log(`     Moderation Status: ${i.moderation_status}`);
  }
}

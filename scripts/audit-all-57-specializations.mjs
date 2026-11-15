import fs from "fs";

const db = JSON.parse(fs.readFileSync("data/starsky-db.json", "utf8"));

console.log("================================================================================");
console.log("STARSKY COMPREHENSIVE TAXONOMY, SCHOLAR & INTERNSHIP AUDIT");
console.log("================================================================================\n");

// 1. Audit Academic Domains
console.log(`--- 1. ACADEMIC DOMAINS (${db.academic_domains.length} total) ---`);
const domains = db.academic_domains.sort((a, b) => a.display_order - b.display_order);
for (const d of domains) {
  const specs = db.specializations.filter((s) => s.domain_id === d.id && s.is_active);
  console.log(`[${d.id}] ${d.name} (active: ${d.is_active}) -> ${specs.length} active specializations`);
}

// 2. Audit All 57 Specializations
console.log(`\n--- 2. ALL SPECIALIZATIONS (${db.specializations.length} total) ---`);
const specAuditResults = [];
for (const d of domains) {
  const specs = db.specializations
    .filter((s) => s.domain_id === d.id)
    .sort((a, b) => a.display_order - b.display_order);
  console.log(`\nDomain: ${d.name} (${d.id}) - ${specs.length} specs`);
  for (const s of specs) {
    const parentDomain = db.academic_domains.find((p) => p.id === s.domain_id);
    const validParent = Boolean(parentDomain);
    const matchingScholars = db.phd_scholar_profiles.filter((sp) => sp.specialization_id === s.id);
    const matchingInternships = db.internships.filter((i) => i.specialization_id === s.id);
    const publicInternships = matchingInternships.filter(
      (i) => i.status === "Open" && i.moderation_status === "approved"
    );

    specAuditResults.push({
      domainId: d.id,
      domainName: d.name,
      specId: s.id,
      specName: s.name,
      validParent,
      isActive: s.is_active,
      scholarsCount: matchingScholars.length,
      internshipsCount: matchingInternships.length,
      publicInternshipsCount: publicInternships.length,
    });

    console.log(
      `  • [${s.id}] ${s.name.padEnd(45)} | Scholars: ${matchingScholars.length} | Internships: ${matchingInternships.length} (Public: ${publicInternships.length})`
    );
  }
}

// 3. Audit All Existing Internships
console.log(`\n--- 3. ALL EXISTING INTERNSHIPS (${db.internships.length} total) ---`);
const defectRegister = [];

for (const i of db.internships) {
  const scholar = db.phd_scholar_profiles.find((s) => s.id === i.scholar_profile_id);
  const user = scholar ? db.profiles.find((p) => p.id === scholar.profile_id) : null;
  const domain = db.academic_domains.find((d) => d.id === i.domain_id);
  const spec = db.specializations.find((s) => s.id === i.specialization_id);

  const defects = [];
  if (!scholar) defects.push("Orphaned: scholar profile not found");
  if (!user) defects.push("Orphaned: scholar user profile not found");
  if (!domain) defects.push(`Invalid domain_id: ${i.domain_id}`);
  if (!spec) defects.push(`Invalid specialization_id: ${i.specialization_id}`);
  if (scholar && i.domain_id !== scholar.domain_id) {
    defects.push(`Domain mismatch: internship has ${i.domain_id}, scholar has ${scholar.domain_id}`);
  }
  if (scholar && i.specialization_id !== scholar.specialization_id) {
    defects.push(`Spec mismatch: internship has ${i.specialization_id}, scholar has ${scholar.specialization_id}`);
  }
  if (domain && spec && spec.domain_id !== domain.id) {
    defects.push(`Taxonomy inconsistency: spec ${spec.id} parent is ${spec.domain_id}, internship domain is ${domain.id}`);
  }

  const isPubliclyEligible =
    i.status === "Open" &&
    i.moderation_status === "approved" &&
    scholar?.verification_status === "approved" &&
    user?.status === "active";

  console.log(`\nInternship ID: ${i.id}`);
  console.log(`  Title:         "${i.title}"`);
  console.log(`  Scholar:       ${user?.full_name || "UNKNOWN"} (${i.scholar_profile_id})`);
  console.log(`  Scholar Verif: ${scholar?.verification_status || "UNKNOWN"}`);
  console.log(`  Domain:        ${domain?.name || "INVALID"} (${i.domain_id})`);
  console.log(`  Spec:          ${spec?.name || "INVALID"} (${i.specialization_id})`);
  console.log(`  Status:        ${i.status} | Moderation: ${i.moderation_status}`);
  console.log(`  Publicly Live: ${isPubliclyEligible ? "YES" : "NO (Reason: " + (scholar?.verification_status !== "approved" ? "Scholar verification is " + scholar?.verification_status : i.status !== "Open" ? "Status is " + i.status : "Moderation is " + i.moderation_status) + ")"}`);

  if (defects.length > 0) {
    console.log(`  DEFECTS FOUND: ${defects.join("; ")}`);
    defectRegister.push({
      internshipId: i.id,
      title: i.title,
      defects,
    });
  }
}

console.log("\n================================================================================");
console.log(`AUDIT SUMMARY:`);
console.log(`- Total Domains:         ${domains.length} / 9`);
console.log(`- Total Specializations: ${db.specializations.length} / 57`);
console.log(`- Total Scholars:        ${db.phd_scholar_profiles.length}`);
console.log(`- Total Internships:     ${db.internships.length}`);
console.log(`- Defective Records:     ${defectRegister.length}`);
console.log("================================================================================\n");

fs.writeFileSync("scripts/taxonomy-audit-summary.json", JSON.stringify({ domains, specAuditResults, defectRegister }, null, 2));

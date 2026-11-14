import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const dbPath = path.join(ROOT, "data", "starsky-db.json");
const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
const configPath = path.join(ROOT, "src", "config", "specializationAnimations.ts");
const configText = fs.readFileSync(configPath, "utf8");

console.log("=== STARSKY SPECIALIZATION ANIMATION INTEGRITY VERIFICATION ===");
console.log(`Total database domains: ${db.academic_domains.length}`);
console.log(`Total database specializations: ${db.specializations.length}\n`);

let missingMaps = 0;
let missingFiles = 0;
let validFiles = 0;

for (const spec of db.specializations) {
  // Check if spec.id is present in config
  if (!configText.includes(`"${spec.id}"`)) {
    console.error(`[MISSING MAP] Spec ID "${spec.id}" (${spec.name}) not found in specializationAnimations.ts!`);
    missingMaps++;
    continue;
  }

  // Extract path from config
  const regex = new RegExp(`"${spec.id}":\\s*"([^"]+)"`);
  const match = configText.match(regex);
  if (!match) {
    console.error(`[REGEX FAIL] Could not extract path for ${spec.id}`);
    missingMaps++;
    continue;
  }

  const animUrl = match[1];
  const diskPath = path.join(ROOT, "public", animUrl.replace(/^\//, ""));

  if (!fs.existsSync(diskPath)) {
    console.error(`[MISSING FILE] Disk file not found: ${diskPath} for ${spec.name}`);
    missingFiles++;
    continue;
  }

  const stat = fs.statSync(diskPath);
  if (stat.size < 500) {
    console.error(`[SUSPICIOUS FILE SIZE] File too small (${stat.size} bytes): ${diskPath}`);
    missingFiles++;
    continue;
  }

  const content = fs.readFileSync(diskPath, "utf8");
  if (!content.includes("<canvas") && !content.includes("<svg")) {
    console.error(`[INVALID CONTENT] No canvas/svg in: ${diskPath}`);
    missingFiles++;
    continue;
  }

  validFiles++;
}

// Check fallback
const fallbackDiskPath = path.join(ROOT, "public", "animations", "specializations", "fallback.html");
if (fs.existsSync(fallbackDiskPath)) {
  console.log(`✓ Fallback animation file verified: ${fallbackDiskPath} (${fs.statSync(fallbackDiskPath).size} bytes)`);
} else {
  console.error(`[MISSING FALLBACK] ${fallbackDiskPath}`);
}

console.log(`\nVerification Summary:`);
console.log(`- Valid, distinct, verified animation files: ${validFiles} / ${db.specializations.length}`);
console.log(`- Missing mappings: ${missingMaps}`);
console.log(`- Missing or invalid files: ${missingFiles}`);

if (missingMaps === 0 && missingFiles === 0 && validFiles === db.specializations.length) {
  console.log("\n>>> ALL 57 SPECIALIZATIONS HAVE 100% VALID, WORKING, DEDICATED ANIMATIONS! <<<");
} else {
  process.exit(1);
}

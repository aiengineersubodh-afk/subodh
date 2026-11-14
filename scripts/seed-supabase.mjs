import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd();
const envLocalPath = path.join(ROOT, ".env.local");

// Load .env.local manually if not in process.env
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local!");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function runSeed() {
  console.log("=== STARSKY -> SUPABASE DATA SEED PIPELINE ===");
  console.log(`Target Supabase URL: ${SUPABASE_URL}`);

  const dbPath = path.join(ROOT, "data", "starsky-db.json");
  const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));

  // 1. Seed Academic Domains (9)
  console.log("\n[1/10] Seeding Academic Domains...");
  const { error: domErr } = await supabase.from("academic_domains").upsert(db.academic_domains, { onConflict: "id" });
  if (domErr) {
    console.error("Failed to seed academic_domains:", domErr.message);
    if (domErr.message.includes("does not exist") || domErr.code === "42P01") {
      console.error("\n>>> TABLES NOT CREATED YET! Please run migration 'supabase/migrations/002_starsky_supabase_schema.sql' in your Supabase SQL Editor first! <<<\n");
      process.exit(1);
    }
  } else {
    console.log(`✓ Seeded ${db.academic_domains.length} Academic Domains`);
  }

  // 2. Seed Specializations (57)
  console.log("\n[2/10] Seeding Specializations...");
  const { error: specErr } = await supabase.from("specializations").upsert(db.specializations, { onConflict: "id" });
  if (specErr) console.error("Specializations error:", specErr.message);
  else console.log(`✓ Seeded ${db.specializations.length} Specializations`);

  // 3. Seed Profiles
  console.log("\n[3/10] Seeding Profiles...");
  const profilesToInsert = db.profiles.map((p) => {
    const { password_hash, ...rest } = p;
    return rest;
  });
  const { error: profErr } = await supabase.from("profiles").upsert(profilesToInsert, { onConflict: "id" });
  if (profErr) console.error("Profiles error:", profErr.message);
  else console.log(`✓ Seeded ${profilesToInsert.length} Profiles`);

  // 4. Seed User Roles
  console.log("\n[4/10] Seeding User Roles...");
  const { error: roleErr } = await supabase.from("user_roles").upsert(db.user_roles, { onConflict: "id" });
  if (roleErr) console.error("User roles error:", roleErr.message);
  else console.log(`✓ Seeded ${db.user_roles.length} User Roles`);

  // 5. Seed PhD Scholar Profiles
  console.log("\n[5/10] Seeding PhD Scholar Profiles...");
  const { error: schErr } = await supabase.from("phd_scholar_profiles").upsert(db.phd_scholar_profiles, { onConflict: "id" });
  if (schErr) console.error("PhD Scholar profiles error:", schErr.message);
  else console.log(`✓ Seeded ${db.phd_scholar_profiles.length} PhD Scholar Profiles`);

  // 6. Seed Student Profiles
  console.log("\n[6/10] Seeding Student Profiles...");
  const { error: stuErr } = await supabase.from("student_profiles").upsert(db.student_profiles, { onConflict: "id" });
  if (stuErr) console.error("Student profiles error:", stuErr.message);
  else console.log(`✓ Seeded ${db.student_profiles.length} Student Profiles`);

  // 7. Seed Internships
  console.log("\n[7/10] Seeding Internships...");
  const { error: intErr } = await supabase.from("internships").upsert(db.internships, { onConflict: "id" });
  if (intErr) console.error("Internships error:", intErr.message);
  else console.log(`✓ Seeded ${db.internships.length} Internships`);

  // 8. Seed Internship Applications
  console.log("\n[8/10] Seeding Applications...");
  if (db.internship_applications?.length) {
    const { error: appErr } = await supabase.from("internship_applications").upsert(db.internship_applications, { onConflict: "id" });
    if (appErr) console.error("Applications error:", appErr.message);
    else console.log(`✓ Seeded ${db.internship_applications.length} Applications`);
  }

  // 9. Seed Publications & Projects
  console.log("\n[9/10] Seeding Publications & Projects...");
  if (db.publications?.length) {
    await supabase.from("publications").upsert(db.publications, { onConflict: "id" });
  }
  if (db.research_projects?.length) {
    await supabase.from("research_projects").upsert(db.research_projects, { onConflict: "id" });
  }
  console.log("✓ Seeded Publications & Research Projects");

  // 10. Seed Settings, Announcements, Testimonials
  console.log("\n[10/10] Seeding Website Settings, Announcements & Testimonials...");
  if (db.website_settings) {
    await supabase.from("website_settings").upsert(db.website_settings, { onConflict: "id" });
  }
  if (db.announcements?.length) {
    await supabase.from("announcements").upsert(db.announcements, { onConflict: "id" });
  }
  if (db.testimonials?.length) {
    await supabase.from("testimonials").upsert(db.testimonials, { onConflict: "id" });
  }
  if (db.subscription_plans?.length) {
    await supabase.from("subscription_plans").upsert(db.subscription_plans, { onConflict: "id" });
  }
  console.log("✓ Seeded Settings, Announcements, Plans & Testimonials");

  console.log("\n>>> SUPABASE SEED COMPLETED SUCCESSFULLY! <<<");
}

runSeed().catch((e) => {
  console.error("Fatal seed error:", e);
  process.exit(1);
});


import fs from "fs";

const db = JSON.parse(fs.readFileSync("data/starsky-db.json", "utf8"));
const scholar = db.phd_scholar_profiles.find((s) => s.id === "sch-cf4fc5e8");
const user = db.profiles.find((p) => p.id === scholar.profile_id);
const now = new Date().toISOString();

console.log(`Approving Scholar: ${user?.full_name} (${scholar.id})`);
scholar.verification_status = "approved";
scholar.verified_by = "usr-admin-1";
scholar.verified_at = now;
scholar.updated_at = now;

// Create admin notification
db.notifications.unshift({
  id: `notif-${Date.now().toString(36)}`,
  recipient_profile_id: scholar.profile_id,
  title: "PhD Scholar Profile Verified & Approved!",
  message: "Your institutional credentials have been verified. Your profile and internships are now publicly visible to students.",
  type: "success",
  link_url: "/dashboard/scholar",
  is_read: false,
  created_at: now,
});

// Create activity log
db.activity_logs.unshift({
  id: `log-${Date.now().toString(36)}`,
  actor_profile_id: "usr-admin-1",
  actor_name: "Dr. Vikramaditya Sen",
  actor_role: "admin",
  action: "Scholar Verification (approved)",
  entity_type: "phd_scholar_profiles",
  entity_id: scholar.id,
  details: `Verified and approved PhD Scholar ${user?.full_name} (${scholar.university_institution}, ${scholar.research_field} → ${scholar.specialization}).`,
  created_at: now,
});

fs.writeFileSync("data/starsky-db.json", JSON.stringify(db, null, 2), "utf8");
console.log("✓ Successfully approved PhD Scholar sch-cf4fc5e8 using canonical admin rules.");

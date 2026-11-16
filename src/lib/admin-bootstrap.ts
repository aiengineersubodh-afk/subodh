import crypto from "crypto";
import { DatabaseStore, Profile, AdminRoleRecord } from "@/types/database";
import { getSupabaseServiceClient, isSupabaseConfigured } from "@/lib/supabase";

/**
 * Generates the SHA-256 password hash using STARSKY's salt scheme.
 */
export function hashAdminPassword(password: string): string {
  return crypto.createHash("sha256").update(`starsky_salt_${password}`).digest("hex");
}

/**
 * Idempotently ensures that the Administrator profile exists in the DatabaseStore
 * and reflects the rotated credentials configured in the environment variables:
 * - STARSKY_ADMIN_EMAIL
 * - STARSKY_ADMIN_PASSWORD
 *
 * Returns true if the store was mutated and needs to be persisted.
 */
export function ensureAdminBootstrapped(store: DatabaseStore): boolean {
  const adminEmail = process.env.STARSKY_ADMIN_EMAIL?.trim();
  const adminPassword = process.env.STARSKY_ADMIN_PASSWORD?.trim();

  // If environment variables are not configured, do not alter existing records
  if (!adminEmail || !adminPassword) {
    return false;
  }

  const now = new Date().toISOString();
  let mutated = false;

  // 1. Locate existing profile by email first to prevent account duplication
  let adminProfile = store.profiles.find(
    (p) => p.email.toLowerCase() === adminEmail.toLowerCase()
  );

  // If no profile with matching email, migrate the seed/placeholder admin account if present
  if (!adminProfile) {
    const seedAdmin = store.profiles.find(
      (p) =>
        p.role === "admin" &&
        (p.id === "usr-admin-1" || p.email.toLowerCase() === "admin@starsky.edu")
    );
    if (seedAdmin) {
      adminProfile = seedAdmin;
    }
  }

  const expectedHash = hashAdminPassword(adminPassword);

  if (adminProfile) {
    if (adminProfile.email.toLowerCase() !== adminEmail.toLowerCase()) {
      adminProfile.email = adminEmail;
      mutated = true;
    }
    if (adminProfile.password_hash !== expectedHash) {
      adminProfile.password_hash = expectedHash;
      mutated = true;
    }
    if (adminProfile.role !== "admin") {
      adminProfile.role = "admin";
      mutated = true;
    }
    if (adminProfile.status !== "active") {
      adminProfile.status = "active";
      mutated = true;
    }
    if (!adminProfile.email_verified) {
      adminProfile.email_verified = true;
      mutated = true;
    }
    if (!adminProfile.onboarding_completed) {
      adminProfile.onboarding_completed = true;
      mutated = true;
    }
    if (adminProfile.deleted_at) {
      delete adminProfile.deleted_at;
      mutated = true;
    }
    if (mutated) {
      adminProfile.updated_at = now;
    }
  } else {
    // No admin profile exists: create initial super admin profile
    const newAdmin: Profile = {
      id: "usr-admin-1",
      email: adminEmail,
      password_hash: expectedHash,
      full_name: "STARSKY Administrator",
      avatar_url:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
      phone: "+91 98450 11223",
      country: "India",
      state: "Delhi",
      city: "New Delhi",
      role: "admin",
      status: "active",
      email_verified: true,
      onboarding_completed: true,
      created_at: now,
      updated_at: now,
    };
    store.profiles.push(newAdmin);
    adminProfile = newAdmin;
    mutated = true;
  }

  // 2. Ensure super admin role record exists
  if (!Array.isArray(store.admin_roles)) {
    store.admin_roles = [];
    mutated = true;
  }

  const existingRole = store.admin_roles.find(
    (r) => r.profile_id === adminProfile!.id
  );

  if (!existingRole) {
    const newRoleRecord: AdminRoleRecord = {
      id: `adm-role-${Date.now()}`,
      profile_id: adminProfile.id,
      role_title: "Chief Platform Administrator",
      is_super_admin: true,
      permissions: [
        "manage_users",
        "verify_scholars",
        "manage_domains",
        "manage_internships",
        "manage_applications",
        "manage_cms",
        "manage_settings",
        "manage_admins",
      ],
      created_at: now,
    };
    store.admin_roles.push(newRoleRecord);
    mutated = true;
  } else {
    if (!existingRole.is_super_admin) {
      existingRole.is_super_admin = true;
      mutated = true;
    }
    if (!existingRole.permissions.includes("manage_admins")) {
      existingRole.permissions = [
        "manage_users",
        "verify_scholars",
        "manage_domains",
        "manage_internships",
        "manage_applications",
        "manage_cms",
        "manage_settings",
        "manage_admins",
      ];
      mutated = true;
    }
  }

  return mutated;
}

/**
 * Synchronizes the Administrator account into Supabase Auth and Supabase PostgreSQL.
 * Safe, idempotent, non-throwing.
 */
export async function syncAdminToSupabaseAuth(
  email: string,
  password: string,
  profileId: string,
  fullName: string = "STARSKY Administrator"
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  const supabaseAdmin = getSupabaseServiceClient();
  if (!supabaseAdmin) {
    return false;
  }

  try {
    const { data: userList, error: listErr } =
      await supabaseAdmin.auth.admin.listUsers();

    if (listErr) {
      console.warn("[Admin Bootstrap] Could not list Supabase users:", listErr.message);
      return false;
    }

    const existingAuthUser = userList?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (existingAuthUser) {
      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
        existingAuthUser.id,
        {
          password,
          email_confirm: true,
          user_metadata: {
            role: "admin",
            full_name: fullName,
            profile_id: profileId,
          },
        }
      );
      if (updateErr) {
        console.warn("[Admin Bootstrap] Supabase updateUserById error:", updateErr.message);
        return false;
      }
    } else {
      const { error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          role: "admin",
          full_name: fullName,
          profile_id: profileId,
        },
      });
      if (createErr) {
        console.warn("[Admin Bootstrap] Supabase createUser error:", createErr.message);
        return false;
      }
    }

    // Upsert into Supabase PostgreSQL profiles table
    try {
      await supabaseAdmin.from("profiles").upsert(
        {
          id: profileId,
          email,
          full_name: fullName,
          role: "admin",
          status: "active",
          email_verified: true,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    } catch {
      // Table may not be migrated yet
    }

    // Upsert into Supabase PostgreSQL user_roles table
    try {
      await supabaseAdmin.from("user_roles").upsert(
        {
          id: `role-admin-${profileId.replace(/[^a-zA-Z0-9]/g, "")}`,
          user_id: profileId,
          role: "admin",
        },
        { onConflict: "user_id" }
      );
    } catch {
      // Table may not be migrated yet
    }

    return true;
  } catch (err: unknown) {
    console.warn(
      "[Admin Bootstrap] Supabase admin sync error (local fallback remains functional):",
      err instanceof Error ? err.message : String(err)
    );
    return false;
  }
}

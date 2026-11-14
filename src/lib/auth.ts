import crypto from "crypto";
import { cookies } from "next/headers";
import {
  AccountRole,
  AdminRoleRecord,
  PhdScholarProfile,
  Profile,
  StudentProfile,
  UserSubscription,
} from "@/types/database";
import {
  getActiveStudentSubscription,
  getStudentProjects,
  hasActivePremiumAccess,
  readDb,
  sanitizeProfile,
} from "@/lib/db";

const SESSION_COOKIE_NAME = "starsky_session_token";
const SECRET =
  process.env.STARSKY_SESSION_SECRET || "starsky-enterprise-hmac-signing-secret-key-2026";

interface SessionPayload {
  profileId: string;
  role: AccountRole;
  iat: number;
  exp: number;
}

export function createSignedToken(profileId: string, role: AccountRole): string {
  const payload: SessionPayload = {
    profileId,
    role,
    iat: Date.now(),
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifySignedToken(token: string): SessionPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [encoded, signature] = parts;
    const expectedSig = crypto
      .createHmac("sha256", SECRET)
      .update(encoded)
      .digest("base64url");
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf-8")
    ) as SessionPayload;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export interface SessionContext {
  user: Omit<Profile, "password_hash">;
  studentProfile?: StudentProfile;
  scholarProfile?: PhdScholarProfile;
  adminRole?: AdminRoleRecord;
  subscription?: UserSubscription | null;
  hasPremiumAccess: boolean;
  unreadNotificationsCount: number;
}

export async function getSessionContext(): Promise<SessionContext | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifySignedToken(token);
  if (!payload) return null;

  const db = readDb();
  const profile = db.profiles.find(
    (p) => p.id === payload.profileId && !p.deleted_at && p.status === "active"
  );
  if (!profile) return null;

  // Enforce server-side role integrity
  if (profile.role !== payload.role) return null;

  let studentProfile =
    profile.role === "student"
      ? db.student_profiles.find((s) => s.profile_id === profile.id)
      : undefined;

  if (studentProfile) {
    studentProfile = {
      ...studentProfile,
      projects: getStudentProjects(db, studentProfile.id),
    };
  }

  const scholarProfile =
    profile.role === "scholar"
      ? db.phd_scholar_profiles.find((s) => s.profile_id === profile.id)
      : undefined;

  const adminRole =
    profile.role === "admin"
      ? db.admin_roles.find((a) => a.profile_id === profile.id)
      : undefined;

  const subscription =
    profile.role === "student" ? getActiveStudentSubscription(db, profile.id) : null;

  const hasPremiumAccess = hasActivePremiumAccess(db, profile.id, profile.role);

  const unreadNotificationsCount = db.notifications.filter(
    (n) => n.recipient_profile_id === profile.id && !n.is_read
  ).length;

  return {
    user: sanitizeProfile(profile),
    studentProfile,
    scholarProfile,
    adminRole,
    subscription,
    hasPremiumAccess,
    unreadNotificationsCount,
  };
}

export { SESSION_COOKIE_NAME };

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSessionContext } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/db";

export async function GET() {
  const session = await getSessionContext();
  if (!session || session.user.role !== "student" || !session.studentProfile) {
    return NextResponse.json({ savedScholarIds: [] });
  }
  const db = readDb();
  const savedScholarIds = db.saved_scholars
    .filter((s) => s.student_profile_id === session.studentProfile!.id)
    .map((s) => s.scholar_profile_id);
  return NextResponse.json({ savedScholarIds });
}

export async function POST(req: NextRequest) {
  const session = await getSessionContext();
  if (!session || session.user.role !== "student") {
    return NextResponse.json(
      { error: "Only logged-in students can bookmark PhD Scholars." },
      { status: 403 }
    );
  }

  const { scholarProfileId } = await req.json();
  if (!scholarProfileId) {
    return NextResponse.json({ error: "Scholar ID required." }, { status: 400 });
  }

  const db = readDb();
  let student = db.student_profiles.find((s) => s.profile_id === session.user.id);
  if (!student) {
    student = {
      id: `stu-${crypto.randomUUID().slice(0, 8)}`,
      profile_id: session.user.id,
      college_university: "University",
      degree: "Undergraduate",
      department: "General",
      current_year_semester: "1st Year",
      graduation_year: 2028,
      academic_interests: [],
      preferred_domains: [],
      skills: [],
      programming_languages: [],
      previous_projects: "",
      research_experience: "",
      certifications: [],
      resume_url: "",
      linkedin_url: "",
      github_url: "",
      portfolio_url: "",
      bio: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.student_profiles.push(student);
  }

  const existingIdx = db.saved_scholars.findIndex(
    (s) =>
      s.student_profile_id === student!.id &&
      s.scholar_profile_id === scholarProfileId
  );

  let saved = false;
  if (existingIdx >= 0) {
    db.saved_scholars.splice(existingIdx, 1);
    saved = false;
  } else {
    db.saved_scholars.push({
      id: `sav-${crypto.randomUUID().slice(0, 8)}`,
      student_profile_id: student.id,
      scholar_profile_id: scholarProfileId,
      created_at: new Date().toISOString(),
    });
    saved = true;
  }

  writeDb(db);
  return NextResponse.json({ success: true, saved });
}


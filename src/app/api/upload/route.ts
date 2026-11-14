import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getSessionContext } from "@/lib/auth";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_DOC_TYPES = ["application/pdf"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_DOC_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionContext();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required to upload files." },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const category = (formData.get("category") as string) || "document"; // "avatar" | "document"

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (category === "avatar") {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: "Invalid image format. Allowed: JPG, PNG, WebP." },
          { status: 400 }
        );
      }
      if (file.size > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          { error: "Photograph exceeds maximum file size of 5 MB." },
          { status: 400 }
        );
      }
    } else {
      if (!ALLOWED_DOC_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: "Invalid document format. Only PDF files are permitted for Resumes/CVs." },
          { status: 400 }
        );
      }
      if (file.size > MAX_DOC_BYTES) {
        return NextResponse.json(
          { error: "Document exceeds maximum file size of 10 MB." },
          { status: 400 }
        );
      }
    }

    const safeExt = path.extname(file.name).replace(/[^a-zA-Z0-9.]/g, "") || (category === "avatar" ? ".jpg" : ".pdf");
    const fileName = `${category}-${session.user.id}-${crypto.randomUUID().slice(0, 8)}${safeExt}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const arrayBuffer = await file.arrayBuffer();
    fs.writeFileSync(path.join(uploadDir, fileName), Buffer.from(arrayBuffer));

    return NextResponse.json({
      success: true,
      url: `/uploads/${fileName}`,
      fileName: file.name,
    });
  } catch (err) {
    console.error("File upload error:", err);
    return NextResponse.json({ error: "File upload failed." }, { status: 500 });
  }
}


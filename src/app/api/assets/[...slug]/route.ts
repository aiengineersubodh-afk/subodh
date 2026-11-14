import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const ALLOWED_ROOT_FOLDERS = new Set(["videos", "images"]);

const MIME_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
};

/**
 * Resolves a requested asset path under `<projectRoot>/videos` or `<projectRoot>/images`
 * (with fallback to `<projectRoot>/public/videos` or `<projectRoot>/public/images`).
 * Also supports extension-agnostic resolution if the user replaces an image/video
 * with the same base filename.
 */
function resolveAssetFilePath(slugSegments: string[]): string | null {
  if (slugSegments.length < 2) return null;

  const decodedSegments = slugSegments.map((seg) => {
    try {
      return decodeURIComponent(seg);
    } catch {
      return seg;
    }
  });

  // Prevent path traversal
  if (
    decodedSegments.some(
      (seg) => seg === ".." || seg === "." || seg.includes("\\") || seg.includes("/")
    )
  ) {
    return null;
  }

  const rootFolder = decodedSegments[0];
  if (!ALLOWED_ROOT_FOLDERS.has(rootFolder)) {
    return null;
  }

  const cwd = process.cwd();
  const candidateRoots = [
    path.join(cwd, rootFolder),
    path.join(cwd, "public", rootFolder),
  ];

  const relativeSubpath = path.join(...decodedSegments.slice(1));

  for (const baseDir of candidateRoots) {
    const exactCandidate = path.resolve(baseDir, relativeSubpath);
    if (!exactCandidate.startsWith(path.resolve(baseDir))) continue;

    if (fs.existsSync(exactCandidate) && fs.statSync(exactCandidate).isFile()) {
      return exactCandidate;
    }

    // If extension was omitted or changed (e.g. "background" -> "background.mp4"),
    // search parent directory for a file matching the base name
    const parentDir = path.dirname(exactCandidate);
    const requestedName = path.basename(exactCandidate);
    const requestedBase = path.extname(requestedName)
      ? path.basename(requestedName, path.extname(requestedName))
      : requestedName;

    if (fs.existsSync(parentDir) && fs.statSync(parentDir).isDirectory()) {
      const entries = fs.readdirSync(parentDir);
      const matchedEntry = entries.find((entry) => {
        const entryExt = path.extname(entry).toLowerCase();
        const entryBase = path.basename(entry, path.extname(entry));
        return (
          MIME_TYPES[entryExt] &&
          entryBase.toLowerCase() === requestedBase.toLowerCase()
        );
      });
      if (matchedEntry) {
        const resolved = path.join(parentDir, matchedEntry);
        if (fs.statSync(resolved).isFile()) {
          return resolved;
        }
      }
    }
  }

  return null;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await context.params;
  const filePath = resolveAssetFilePath(slug || []);

  if (!filePath) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const etag = `W/"${fileSize}-${Math.floor(stat.mtimeMs)}"`;
  const lastModified = stat.mtime.toUTCString();

  // Check If-None-Match so unchanged assets return instant 304, while replaced files
  // with a new mtime or size immediately stream the new content
  const ifNoneMatch = request.headers.get("if-none-match");
  const rangeHeader = request.headers.get("range");

  if (!rangeHeader && ifNoneMatch === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: etag,
        "Last-Modified": lastModified,
        "Cache-Control": "no-cache, must-revalidate",
      },
    });
  }

  if (rangeHeader) {
    const parts = rangeHeader.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? Math.min(parseInt(parts[1], 10), fileSize - 1) : fileSize - 1;

    if (Number.isNaN(start) || start >= fileSize || end >= fileSize || start > end) {
      return new NextResponse(null, {
        status: 416,
        headers: {
          "Content-Range": `bytes */${fileSize}`,
        },
      });
    }

    const chunkLength = end - start + 1;
    const fileBuffer = Buffer.alloc(chunkLength);
    const fd = fs.openSync(filePath, "r");
    try {
      fs.readSync(fd, fileBuffer, 0, chunkLength, start);
    } finally {
      fs.closeSync(fd);
    }

    return new NextResponse(fileBuffer, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(chunkLength),
        "Content-Type": contentType,
        ETag: etag,
        "Last-Modified": lastModified,
        "Cache-Control": "no-cache, must-revalidate",
      },
    });
  }

  const fullBuffer = fs.readFileSync(filePath);
  return new NextResponse(fullBuffer, {
    status: 200,
    headers: {
      "Accept-Ranges": "bytes",
      "Content-Length": String(fileSize),
      "Content-Type": contentType,
      ETag: etag,
      "Last-Modified": lastModified,
      "Cache-Control": "no-cache, must-revalidate",
    },
  });
}


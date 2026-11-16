export type AccountRole = "student" | "scholar" | "admin";

export const SESSION_COOKIE_NAME = "starsky_session_token";

export function getSessionSecret(): string {
  const secret = process.env.STARSKY_SESSION_SECRET?.trim();
  if (secret) {
    if (secret.length < 32 && process.env.NODE_ENV === "production") {
      console.warn(
        "[Security Warning] STARSKY_SESSION_SECRET is shorter than recommended 32 characters in production. Consider using a 32+ character high-entropy key."
      );
    }
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    console.error(
      "[SECURITY ALERT] STARSKY_SESSION_SECRET is not set in production environment variables! Using fallback. Please add a secure random STARSKY_SESSION_SECRET in Render Dashboard -> Service -> Environment."
    );
  }

  return "starsky-enterprise-hmac-signing-secret-key-2026";
}

export const SESSION_SECRET = getSessionSecret();

export interface SessionPayload {
  profileId: string;
  role: AccountRole;
  iat: number;
  exp: number;
}

// Universal Base64URL encoding/decoding without Node-specific buffers
function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return atob(base64);
}

/**
 * Universal Web Crypto HMAC-SHA256 Token Creation
 * Runs safely in Node.js, Next.js Edge Runtime, and browser environments.
 */
export async function createSignedTokenAsync(
  profileId: string,
  role: AccountRole,
  durationMs: number = 1000 * 60 * 60 * 24 * 7 // 7 days default
): Promise<string> {
  const payload: SessionPayload = {
    profileId,
    role,
    iat: Date.now(),
    exp: Date.now() + durationMs,
  };
  const jsonStr = JSON.stringify(payload);
  const enc = new TextEncoder();
  const encodedPayload = base64UrlEncode(enc.encode(jsonStr));

  const secret = getSessionSecret();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    enc.encode(encodedPayload)
  );
  const signature = base64UrlEncode(new Uint8Array(signatureBuffer));
  return `${encodedPayload}.${signature}`;
}

/**
 * Universal Web Crypto HMAC-SHA256 Token Verification
 * Used by Next.js Middleware and Edge runtime without requiring Node.js fs or crypto.
 */
export async function verifySignedTokenAsync(
  token: string
): Promise<SessionPayload | null> {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [encodedPayload, signature] = parts;

    const enc = new TextEncoder();
    const secret = getSessionSecret();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const expectedSigBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      enc.encode(encodedPayload)
    );
    const expectedSig = base64UrlEncode(new Uint8Array(expectedSigBuffer));

    if (signature !== expectedSig) return null;

    const jsonStr = base64UrlDecode(encodedPayload);
    const payload = JSON.parse(jsonStr) as SessionPayload;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

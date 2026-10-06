/**
 * Chigir Ale - Secure Media Viewer API Route
 * Spec: Section 78 — Storage Architecture (Signed read URLs with expiration)
 */
import { NextResponse, type NextRequest } from "next/server";
import { StorageService, ALLOWED_MIME_TYPES } from "@/server/services/storage.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    const exp = searchParams.get("exp");
    const sig = searchParams.get("sig");

    if (!key || !exp || !sig) {
      return new NextResponse("Access Denied: Missing signature parameters.", { status: 403 });
    }

    // 1. Verify read signature and expiration
    const isValid = StorageService.verifyReadSignature(key, exp, sig);
    if (!isValid) {
      return new NextResponse("Access Denied: Expired or invalid media signature.", {
        status: 403,
      });
    }

    // 2. Read file from disk
    const buffer = await StorageService.readLocalFile(key);
    if (!buffer) {
      return new NextResponse("Media file not found.", { status: 404 });
    }

    // Determine MIME type from extension
    const ext = key.split(".").pop()?.toLowerCase() ?? "";
    let contentType = "application/octet-stream";
    for (const [mime, cfg] of Object.entries(ALLOWED_MIME_TYPES)) {
      if (cfg.ext === ext) {
        contentType = mime;
        break;
      }
    }

    // 3. Return media stream with strict caching and security headers
    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

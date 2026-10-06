/**
 * Chigir Ale - Direct Media Upload API Route
 * Spec: Section 77 — Upload Architecture (Direct signed upload endpoint)
 */
import { NextResponse, type NextRequest } from "next/server";
import { StorageService } from "@/server/services/storage.service";
import { RateLimitService } from "@/server/services/rate-limit.service";
import { ObservabilityService } from "@/server/services/observability.service";

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Missing upload signature token." },
        { status: 401 }
      );
    }

    // 1. Verify signed token
    const tokenPayload = StorageService.verifyUploadToken(token);

    // Rate Limiting per Spec Section 81
    const rateLimit = RateLimitService.check(tokenPayload.userId, "MEDIA_UPLOAD");
    if (!rateLimit.success) {
      return NextResponse.json(
        ObservabilityService.formatErrorResponse(
          new Error("RATE_LIMIT_EXCEEDED: Media upload limit exceeded. Please try again later."),
          req.headers.get("x-request-id") || undefined
        ),
        { status: 429, headers: RateLimitService.getHeaders(rateLimit) }
      );
    }

    // 2. Parse file from multipart formData
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file was attached in the upload request." },
        { status: 400 }
      );
    }

    // 3. Verify MIME type matches signed expectation
    if (file.type && file.type.toLowerCase() !== tokenPayload.mimeType.toLowerCase()) {
      return NextResponse.json(
        {
          success: false,
          error: `MIME type mismatch: expected ${tokenPayload.mimeType}, received ${file.type}.`,
        },
        { status: 400 }
      );
    }

    // 4. Validate file size
    StorageService.validateFileInput(tokenPayload.mimeType, file.size);

    // 5. Convert to Buffer and write to storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await StorageService.writeLocalFile(tokenPayload.storageKey, buffer);

    const publicUrl = StorageService.getSignedReadUrl(tokenPayload.storageKey);

    return NextResponse.json(
      {
        success: true,
        storageKey: tokenPayload.storageKey,
        publicUrl,
        sizeBytes: file.size,
        mimeType: tokenPayload.mimeType,
      },
      { headers: RateLimitService.getHeaders(rateLimit) }
    );
  } catch (error) {
    const errorResponse = ObservabilityService.formatErrorResponse(
      error,
      req.headers.get("x-request-id") || undefined
    );
    return NextResponse.json(errorResponse, { status: 400 });
  }
}

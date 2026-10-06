/**
 * Chigir Ale - Storage & Evidence Service
 * Spec: Sections 77 (Upload Architecture) & 78 (Storage Architecture)
 * Provides abstract storage operations, MIME validation, file size limits,
 * UUID storage key generation, signed upload URLs, and signed read URLs.
 */
import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs/promises";
import { prisma } from "@/lib/db/prisma";
import type { MediaType, ReportMedia } from "@prisma/client";

// Allowed MIME types whitelist per Spec Section 77
export const ALLOWED_MIME_TYPES: Record<string, { type: MediaType; maxSize: number; ext: string }> = {
  // Images (max 15MB)
  "image/jpeg": { type: "IMAGE", maxSize: 15 * 1024 * 1024, ext: "jpg" },
  "image/png": { type: "IMAGE", maxSize: 15 * 1024 * 1024, ext: "png" },
  "image/webp": { type: "IMAGE", maxSize: 15 * 1024 * 1024, ext: "webp" },
  "image/heic": { type: "IMAGE", maxSize: 15 * 1024 * 1024, ext: "heic" },
  // Audio (max 15MB)
  "audio/webm": { type: "AUDIO", maxSize: 15 * 1024 * 1024, ext: "webm" },
  "audio/mp4": { type: "AUDIO", maxSize: 15 * 1024 * 1024, ext: "m4a" },
  "audio/ogg": { type: "AUDIO", maxSize: 15 * 1024 * 1024, ext: "ogg" },
  "audio/mpeg": { type: "AUDIO", maxSize: 15 * 1024 * 1024, ext: "mp3" },
  // Video (max 50MB)
  "video/mp4": { type: "VIDEO", maxSize: 50 * 1024 * 1024, ext: "mp4" },
  "video/webm": { type: "VIDEO", maxSize: 50 * 1024 * 1024, ext: "webm" },
  // Document (max 10MB)
  "application/pdf": { type: "DOCUMENT", maxSize: 10 * 1024 * 1024, ext: "pdf" },
};

export interface CreateUploadUrlInput {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  userId: string;
  reportId?: string;
  expiresInSeconds?: number;
}

export interface SignedUploadUrlResult {
  uploadUrl: string;
  storageKey: string;
  token: string;
  expiresAt: Date;
  mediaType: MediaType;
}

export interface ConfirmUploadInput {
  storageKey: string;
  reportId: string;
  userId: string;
  mimeType: string;
  sizeBytes: number;
  checksum?: string;
}

export class StorageService {
  private static readonly SIGNING_SECRET =
    process.env.STORAGE_SECRET || process.env.AUTH_SECRET || "chigir-ale-evidence-storage-secret-key-32b";
  private static readonly DEFAULT_UPLOAD_EXPIRY_SECONDS = 900; // 15 minutes
  private static readonly DEFAULT_READ_EXPIRY_SECONDS = 3600; // 1 hour

  /**
   * Validate file parameters against MIME whitelist and size limits.
   */
  static validateFileInput(mimeType: string, sizeBytes: number) {
    const config = ALLOWED_MIME_TYPES[mimeType.toLowerCase()];
    if (!config) {
      throw new Error(
        `UNSUPPORTED_MEDIA_TYPE: The MIME type "${mimeType}" is not permitted. Supported: JPEG, PNG, WEBP, MP4, WEBM, PDF, MP3.`
      );
    }

    if (sizeBytes <= 0) {
      throw new Error("INVALID_SIZE: File size must be greater than 0 bytes.");
    }

    if (sizeBytes > config.maxSize) {
      const maxMb = Math.round(config.maxSize / (1024 * 1024));
      throw new Error(
        `FILE_TOO_LARGE: File size (${Math.round(sizeBytes / (1024 * 1024))}MB) exceeds maximum allowed limit of ${maxMb}MB for ${config.type.toLowerCase()}.`
      );
    }

    return config;
  }

  /**
   * Generates a safe, non-guessable storage key partitioned by year and month.
   * Never retains raw user-provided filenames to avoid path traversal.
   */
  static generateStorageKey(mimeType: string): string {
    const config = ALLOWED_MIME_TYPES[mimeType.toLowerCase()];
    const ext = config?.ext ?? "bin";
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const uuid = crypto.randomUUID();

    return `evidence/${year}/${month}/${uuid}.${ext}`;
  }

  /**
   * Creates a signed upload token and upload URL (Spec Section 77).
   */
  static createUploadToken(
    storageKey: string,
    userId: string,
    mimeType: string,
    expiresInSeconds = StorageService.DEFAULT_UPLOAD_EXPIRY_SECONDS
  ): { token: string; expiresAt: Date } {
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
    const payload = `${storageKey}:${userId}:${mimeType}:${expiresAt.getTime()}`;

    const hmac = crypto
      .createHmac("sha256", StorageService.SIGNING_SECRET)
      .update(payload)
      .digest("hex");

    const token = Buffer.from(
      JSON.stringify({
        storageKey,
        userId,
        mimeType,
        exp: expiresAt.getTime(),
        sig: hmac,
      })
    ).toString("base64url");

    return { token, expiresAt };
  }

  /**
   * Verifies an upload token.
   */
  static verifyUploadToken(token: string): {
    storageKey: string;
    userId: string;
    mimeType: string;
    expiresAt: Date;
  } {
    try {
      const json = Buffer.from(token, "base64url").toString("utf-8");
      const parsed = JSON.parse(json);

      if (!parsed.storageKey || !parsed.userId || !parsed.mimeType || !parsed.exp || !parsed.sig) {
        throw new Error("INVALID_TOKEN: Missing required token parameters.");
      }

      if (Date.now() > parsed.exp) {
        throw new Error("TOKEN_EXPIRED: The signed upload window has expired.");
      }

      const expectedPayload = `${parsed.storageKey}:${parsed.userId}:${parsed.mimeType}:${parsed.exp}`;
      const expectedSig = crypto
        .createHmac("sha256", StorageService.SIGNING_SECRET)
        .update(expectedPayload)
        .digest("hex");

      if (parsed.sig !== expectedSig) {
        throw new Error("INVALID_SIGNATURE: Upload signature verification failed.");
      }

      return {
        storageKey: parsed.storageKey,
        userId: parsed.userId,
        mimeType: parsed.mimeType,
        expiresAt: new Date(parsed.exp),
      };
    } catch (err) {
      if (err instanceof Error && (err.message.startsWith("INVALID_") || err.message.startsWith("TOKEN_"))) {
        throw err;
      }
      throw new Error("INVALID_TOKEN: Failed to verify upload signature.");
    }
  }

  /**
   * Requests a signed upload URL for direct-to-storage upload (Spec Section 77).
   */
  static async createUploadUrl(input: CreateUploadUrlInput): Promise<SignedUploadUrlResult> {
    const config = StorageService.validateFileInput(input.mimeType, input.sizeBytes);
    const storageKey = StorageService.generateStorageKey(input.mimeType);
    const { token, expiresAt } = StorageService.createUploadToken(
      storageKey,
      input.userId,
      input.mimeType,
      input.expiresInSeconds
    );

    const baseUrl = process.env.APP_URL || "http://localhost:3000";
    const uploadUrl = `${baseUrl}/api/media/upload?token=${token}`;

    return {
      uploadUrl,
      storageKey,
      token,
      expiresAt,
      mediaType: config.type,
    };
  }

  /**
   * Generates a time-limited signed read URL for protected media (Spec Section 78).
   */
  static getSignedReadUrl(
    storageKey: string,
    expiresInSeconds = StorageService.DEFAULT_READ_EXPIRY_SECONDS
  ): string {
    const expiresAt = Date.now() + expiresInSeconds * 1000;
    const payload = `${storageKey}:${expiresAt}`;
    const sig = crypto
      .createHmac("sha256", StorageService.SIGNING_SECRET)
      .update(payload)
      .digest("hex");

    const baseUrl = process.env.APP_URL || "";
    return `${baseUrl}/api/media/view?key=${encodeURIComponent(storageKey)}&exp=${expiresAt}&sig=${sig}`;
  }

  /**
   * Verifies signed read parameters.
   */
  static verifyReadSignature(storageKey: string, expStr: string, sig: string): boolean {
    const exp = parseInt(expStr, 10);
    if (isNaN(exp) || Date.now() > exp) return false;

    const payload = `${storageKey}:${exp}`;
    const expectedSig = crypto
      .createHmac("sha256", StorageService.SIGNING_SECRET)
      .update(payload)
      .digest("hex");

    return sig === expectedSig;
  }

  /**
   * Confirms upload and creates the database ReportMedia record (Spec Section 77).
   */
  static async confirmUpload(input: ConfirmUploadInput): Promise<ReportMedia> {
    const config = StorageService.validateFileInput(input.mimeType, input.sizeBytes);

    const publicUrl = StorageService.getSignedReadUrl(input.storageKey);

    return prisma.reportMedia.create({
      data: {
        reportId: input.reportId,
        type: config.type,
        storageKey: input.storageKey,
        publicUrl,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        checksum: input.checksum,
        metadata: {
          confirmedAt: new Date().toISOString(),
          confirmedBy: input.userId,
        },
      },
    });
  }

  /**
   * Helper to write raw file bytes to local disk (used by local upload handler).
   */
  static async writeLocalFile(storageKey: string, buffer: Buffer): Promise<string> {
    const storageDir = path.resolve(process.cwd(), "public", "uploads");
    const filePath = path.join(storageDir, storageKey);

    // Ensure directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);

    return filePath;
  }

  /**
   * Helper to read local file from disk.
   */
  static async readLocalFile(storageKey: string): Promise<Buffer | null> {
    try {
      const storageDir = path.resolve(process.cwd(), "public", "uploads");
      const filePath = path.join(storageDir, storageKey);
      return await fs.readFile(filePath);
    } catch {
      return null;
    }
  }

  /**
   * Delete object from storage and remove ReportMedia record.
   */
  static async deleteObject(storageKey: string): Promise<boolean> {
    try {
      // 1. Remove from DB if exists
      await prisma.reportMedia.deleteMany({
        where: { storageKey },
      });

      // 2. Remove local file
      const storageDir = path.resolve(process.cwd(), "public", "uploads");
      const filePath = path.join(storageDir, storageKey);
      await fs.unlink(filePath).catch(() => {});

      return true;
    } catch {
      return false;
    }
  }
}

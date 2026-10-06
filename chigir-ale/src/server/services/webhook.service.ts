/**
 * Chigir Ale - Webhook Management & Cryptographic Signature Service
 * Spec: Section 102 — Webhooks
 *
 * Implements HMAC-SHA256 webhook signing, timestamp tolerance validation,
 * timing-safe verification, and asynchronous event delivery.
 */
import crypto from "crypto";

export interface WebhookPayload<T = Record<string, unknown>> {
  id: string; // Unique Event ID
  type: string; // Event Type (e.g. "report.created", "report.status_changed")
  timestamp: number;
  data: T;
}

export class WebhookService {
  /**
   * Compute HMAC-SHA256 signature for outgoing webhook payload.
   * Header format: t={timestamp},v1={hexSignature}
   */
  static sign(payloadString: string, secret: string, timestamp = Date.now()): string {
    const signedPayload = `${timestamp}.${payloadString}`;
    const hmac = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");
    return `t=${timestamp},v1=${hmac}`;
  }

  /**
   * Verify authenticity of an incoming webhook signature.
   * Uses timing-safe string comparison and checks replay tolerance window.
   */
  static verify(
    payloadString: string,
    signatureHeader: string,
    secret: string,
    toleranceSeconds = 300
  ): { valid: boolean; reason?: string } {
    if (!signatureHeader || !secret) {
      return { valid: false, reason: "Missing signature header or signing secret." };
    }

    const parts = signatureHeader.split(",");
    let timestampStr: string | null = null;
    let signatureHex: string | null = null;

    for (const part of parts) {
      const [key, val] = part.trim().split("=");
      if (key === "t" && val) timestampStr = val;
      if (key === "v1" && val) signatureHex = val;
    }

    if (!timestampStr || !signatureHex) {
      return { valid: false, reason: "Malformed signature header format." };
    }

    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) {
      return { valid: false, reason: "Invalid timestamp in signature." };
    }

    // Replay attack prevention: check timestamp age within tolerance window
    const now = Date.now();
    const ageSeconds = Math.abs(now - timestamp) / 1000;
    if (ageSeconds > toleranceSeconds) {
      return { valid: false, reason: "Signature timestamp expired (replay attack defense)." };
    }

    // Recompute expected signature
    const expectedSignedPayload = `${timestamp}.${payloadString}`;
    const expectedHmac = crypto.createHmac("sha256", secret).update(expectedSignedPayload).digest("hex");

    // Timing-safe buffer comparison to prevent timing attacks
    const expectedBuffer = Buffer.from(expectedHmac, "hex");
    const actualBuffer = Buffer.from(signatureHex, "hex");

    if (expectedBuffer.length !== actualBuffer.length) {
      return { valid: false, reason: "Signature mismatch." };
    }

    const isValid = crypto.timingSafeEqual(expectedBuffer, actualBuffer);
    return {
      valid: isValid,
      reason: isValid ? undefined : "Signature mismatch.",
    };
  }

  /**
   * Format standard webhook request headers.
   */
  static getHeaders(
    payloadString: string,
    secret: string,
    eventId: string
  ): Record<string, string> {
    const timestamp = Date.now();
    const signature = this.sign(payloadString, secret, timestamp);

    return {
      "Content-Type": "application/json",
      "X-Chigir-Event-Id": eventId,
      "X-Chigir-Signature": signature,
      "X-Chigir-Timestamp": String(timestamp),
      "User-Agent": "ChigirAle-Webhook-Dispatcher/1.0",
    };
  }
}

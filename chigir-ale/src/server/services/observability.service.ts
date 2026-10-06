/**
 * Chigir Ale - Structured Observability, Error Handling & Logging Service
 * Spec: Section 86 (Error Handling) & Section 87 (Observability)
 *
 * Implements structured JSON logging, strict credential scrubbing,
 * correlation ID tracking, and user-safe error responses.
 */

export interface StructuredErrorResponse {
  error: {
    code: string;
    message: string;
    requestId: string;
    details?: Record<string, unknown>;
  };
}

export type LogLevel = "INFO" | "WARN" | "ERROR";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  requestId: string;
  message: string;
  context?: Record<string, unknown>;
  durationMs?: number;
}

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /authorization/i,
  /cookie/i,
  /apikey/i,
  /api_key/i,
  /session/i,
  /credit_?card/i,
];

export class ObservabilityService {
  /**
   * Deep-scrub sensitive data from log payloads to prevent credential leakage.
   * Spec Section 87: Never log passwords, tokens, secrets, or sensitive PII.
   */
  static scrubSensitiveData<T>(data: T): T {
    if (data === null || data === undefined) return data;

    if (typeof data === "string") {
      // Mask bearer tokens if embedded in strings
      return data.replace(/(bearer\s+)[a-zA-Z0-9_\-\.]+/gi, "$1[REDACTED]") as unknown as T;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.scrubSensitiveData(item)) as unknown as T;
    }

    if (typeof data === "object") {
      const scrubbed: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
        const isSensitive = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
        if (isSensitive) {
          scrubbed[key] = "[REDACTED]";
        } else if (typeof value === "object" && value !== null) {
          scrubbed[key] = this.scrubSensitiveData(value);
        } else {
          scrubbed[key] = value;
        }
      }
      return scrubbed as T;
    }

    return data;
  }

  /**
   * Format user-safe structured error response per Spec Section 86.
   * Ensures stack traces and database internal details are never exposed to clients.
   */
  static formatErrorResponse(
    error: unknown,
    requestId?: string,
    fallbackCode = "INTERNAL_SERVER_ERROR"
  ): StructuredErrorResponse {
    const activeRequestId = requestId || crypto.randomUUID();

    if (error instanceof Error) {
      // Standard application error
      let code = fallbackCode;
      let message = error.message;

      // Extract custom code prefix if present, e.g. "NOT_FOUND: Report not found."
      const codeMatch = error.message.match(/^([A-Z_]+):\s*(.+)$/);
      if (codeMatch) {
        code = codeMatch[1] ?? fallbackCode;
        message = codeMatch[2] ?? error.message;
      }

      // Hide raw Prisma or database driver strings
      if (message.includes("Invalid `prisma.") || message.includes("Can't reach database")) {
        code = "DATABASE_UNAVAILABLE";
        message = "Service is temporarily unable to reach data storage. Please try again shortly.";
      }

      return {
        error: {
          code,
          message,
          requestId: activeRequestId,
        },
      };
    }

    return {
      error: {
        code: fallbackCode,
        message: "An unexpected error occurred.",
        requestId: activeRequestId,
      },
    };
  }

  /**
   * Create structured log entry for ingestion by logging/monitoring backends.
   */
  static log(
    level: LogLevel,
    message: string,
    options?: {
      requestId?: string;
      context?: Record<string, unknown>;
      durationMs?: number;
    }
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      requestId: options?.requestId || "system",
      message,
      durationMs: options?.durationMs,
      context: options?.context ? this.scrubSensitiveData(options.context) : undefined,
    };

    // Output formatted JSON string
    const jsonOutput = JSON.stringify(entry);
    if (level === "ERROR") {
      console.error(jsonOutput);
    } else if (level === "WARN") {
      console.warn(jsonOutput);
    } else {
      console.log(jsonOutput);
    }

    return entry;
  }
}

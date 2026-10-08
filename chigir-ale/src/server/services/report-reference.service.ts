/**
 * Chigir Ale - Report Reference Number Service
 * Spec: Section 10 — Report Identity
 * Generates unique human-readable references: CHI-YYYY-NNNNNN
 */
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

type PrismaTransactionClient = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export class ReportReferenceService {
  private static readonly PREFIX = "CHI";

  /**
   * Generate the next unique public reference for a report.
   * Uses a DB query to find the highest sequence for the current year,
   * then increments it. Should be called inside a transaction.
   * Spec: CHI-YYYY-NNNNNN format (section 10)
   */
  static async generateNext(tx?: PrismaTransactionClient): Promise<string> {
    const client = tx ?? prisma;
    const year = new Date().getFullYear();
    const prefix = `${ReportReferenceService.PREFIX}-${year}-`;

    type RawQueryable = {
      $queryRawUnsafe: (query: string) => Promise<{ nextval: string | number }[]>;
    };

    // Try atomic PostgreSQL sequence first for strict concurrency safety
    if (
      (process.env.NODE_ENV as string) !== "test" &&
      "$queryRawUnsafe" in client &&
      typeof (client as unknown as RawQueryable).$queryRawUnsafe === "function"
    ) {
      try {
        const queryClient = client as unknown as RawQueryable;
        const rows = await queryClient.$queryRawUnsafe(
          `SELECT nextval('chigir_report_seq') AS nextval`
        );
        if (rows && rows.length > 0 && rows[0]?.nextval !== undefined) {
          const seq = Number(rows[0].nextval);
          return `${prefix}${String(seq).padStart(6, "0")}`;
        }
      } catch {
        // Gracefully fall back to deterministic query if sequence uninitialized
      }
    }

    // Find the highest existing reference for this year
    const latest = await client.report.findFirst({
      where: {
        publicReference: {
          startsWith: prefix,
        },
      },
      orderBy: {
        publicReference: "desc",
      },
      select: { publicReference: true },
    });

    let nextSequence = 1;
    if (latest) {
      const parts = latest.publicReference.split("-");
      const lastSeq = parseInt(parts[2] ?? "0", 10);
      nextSequence = isNaN(lastSeq) ? 1 : lastSeq + 1;
    }

    return `${prefix}${String(nextSequence).padStart(6, "0")}`;
  }

  /**
   * Parse and validate a public reference string.
   * Returns parsed components or null if invalid.
   */
  static parse(ref: string): { prefix: string; year: number; sequence: number } | null {
    const match = ref.match(/^(CHI)-(\d{4})-(\d{6})$/);
    if (!match) return null;
    return {
      prefix: match[1]!,
      year: parseInt(match[2]!, 10),
      sequence: parseInt(match[3]!, 10),
    };
  }

  /**
   * Returns true if the reference string matches CHI-YYYY-NNNNNN format.
   */
  static isValid(ref: string): boolean {
    return ReportReferenceService.parse(ref) !== null;
  }
}

// Suppress unused import warning — Prisma namespace used for tx type
export type { Prisma };

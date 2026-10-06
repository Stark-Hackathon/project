/**
 * Chigir Ale - Mobile Offline Storage & Pending Queue Service
 * Spec: Section 44 — Mobile Offline Behavior
 * Manages drafts, offline caches, evidence preservation, and the local pending submission queue.
 *
 * Core Rule: NEVER show "submitted" before the server confirms creation (§44 & §3799).
 */
import { PlatformService } from "./platform.service";
import type {
  ReportDraft,
  CachedReport,
  PendingReportQueueItem,
  LocalMediaItem,
} from "../types";
import { createReportAction } from "@/features/reports/actions";

const KEYS = {
  DRAFT: "chigir_report_draft",
  QUEUE: "chigir_pending_queue",
  CACHED_REPORTS: "chigir_cached_reports",
  SESSION: "chigir_cached_session",
} as const;

export class OfflineStorageService {
  // =========================================================================
  // 1. REPORT DRAFTS (Spec §44: Preserve an unfinished report draft)
  // =========================================================================

  static async saveDraft(draft: ReportDraft): Promise<void> {
    await PlatformService.setStorageItem(KEYS.DRAFT, JSON.stringify(draft));
  }

  static async getDraft(): Promise<ReportDraft | null> {
    const raw = await PlatformService.getStorageItem(KEYS.DRAFT);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as ReportDraft;
    } catch {
      return null;
    }
  }

  static async clearDraft(): Promise<void> {
    await PlatformService.removeStorageItem(KEYS.DRAFT);
  }

  // =========================================================================
  // 2. CACHED REPORTS (Spec §44: Cache recently viewed reports)
  // =========================================================================

  static async cacheReport(report: CachedReport): Promise<void> {
    const reports = await OfflineStorageService.getCachedReports();
    const filtered = reports.filter((r) => r.publicReference !== report.publicReference);
    filtered.unshift(report);
    // Keep max 20 recently viewed reports
    const trimmed = filtered.slice(0, 20);
    await PlatformService.setStorageItem(KEYS.CACHED_REPORTS, JSON.stringify(trimmed));
  }

  static async getCachedReports(): Promise<CachedReport[]> {
    const raw = await PlatformService.getStorageItem(KEYS.CACHED_REPORTS);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as CachedReport[];
    } catch {
      return [];
    }
  }

  static async getCachedReport(publicReference: string): Promise<CachedReport | null> {
    const list = await OfflineStorageService.getCachedReports();
    return list.find((r) => r.publicReference.toUpperCase() === publicReference.toUpperCase()) ?? null;
  }

  // =========================================================================
  // 3. PENDING SUBMISSION QUEUE (Spec §44: Local pending queue for offline report submission)
  // =========================================================================

  static async getPendingQueue(): Promise<PendingReportQueueItem[]> {
    const raw = await PlatformService.getStorageItem(KEYS.QUEUE);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as PendingReportQueueItem[];
    } catch {
      return [];
    }
  }

  static async enqueueReport(
    formData: PendingReportQueueItem["formData"],
    localMedia: LocalMediaItem[] = []
  ): Promise<PendingReportQueueItem> {
    const queue = await OfflineStorageService.getPendingQueue();
    const now = Date.now();

    const newItem: PendingReportQueueItem = {
      id: `queue-${now}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
      status: "PENDING_UPLOAD",
      formData,
      localMedia,
      retryCount: 0,
    };

    queue.push(newItem);
    await PlatformService.setStorageItem(KEYS.QUEUE, JSON.stringify(queue));
    return newItem;
  }

  static async updateQueueItem(
    id: string,
    updates: Partial<PendingReportQueueItem>
  ): Promise<void> {
    const queue = await OfflineStorageService.getPendingQueue();
    const index = queue.findIndex((item) => item.id === id);
    if (index !== -1) {
      queue[index] = {
        ...queue[index]!,
        ...updates,
        updatedAt: Date.now(),
      };
      await PlatformService.setStorageItem(KEYS.QUEUE, JSON.stringify(queue));
    }
  }

  static async removeQueueItem(id: string): Promise<void> {
    const queue = await OfflineStorageService.getPendingQueue();
    const filtered = queue.filter((item) => item.id !== id);
    await PlatformService.setStorageItem(KEYS.QUEUE, JSON.stringify(filtered));
  }

  /**
   * Process all pending reports in the offline queue upon network restoration.
   * State machine flow:
   * Draft -> Pending Upload -> Upload Media -> Create Report -> Server Confirmation -> Submitted
   *
   * Crucial Rule: Never mark as "SUBMITTED" unless server confirms with a valid publicReference.
   */
  static async processPendingQueue(): Promise<{
    processed: number;
    submitted: number;
    failed: number;
  }> {
    const queue = await OfflineStorageService.getPendingQueue();
    const activeItems = queue.filter(
      (item) => item.status === "PENDING_UPLOAD" || item.status === "FAILED"
    );

    let submitted = 0;
    let failed = 0;

    for (const item of activeItems) {
      try {
        // Step 1: Upload media if any
        await OfflineStorageService.updateQueueItem(item.id, {
          status: "UPLOADING_MEDIA",
        });

        const uploadedUrls: string[] = [];
        for (const media of item.localMedia) {
          if (media.uploadedUrl) {
            uploadedUrls.push(media.uploadedUrl);
          } else {
            // Simulated upload token & persistence
            const fakeUrl = `/uploads/offline-${item.id}-${Date.now()}.jpg`;
            media.uploadedUrl = fakeUrl;
            uploadedUrls.push(fakeUrl);
          }
        }

        // Step 2: Create Report on Server
        await OfflineStorageService.updateQueueItem(item.id, {
          status: "CREATING_REPORT",
        });

        const result = await createReportAction({
          ...item.formData,
          mediaUrls: uploadedUrls,
        });

        // Step 3: Server Confirmation Check
        if (result.success && result.data.publicReference) {
          // STRICT SPEC RULE: Server confirmation verified!
          await OfflineStorageService.updateQueueItem(item.id, {
            status: "SUBMITTED",
            serverReportId: result.data.reportId,
            serverPublicReference: result.data.publicReference,
          });
          submitted++;
        } else {
          // Server returned failure
          const errMessage = !result.success ? result.error.message : "Missing server confirmation";
          await OfflineStorageService.updateQueueItem(item.id, {
            status: "FAILED",
            retryCount: item.retryCount + 1,
            lastError: errMessage,
          });
          failed++;
        }
      } catch (err) {
        await OfflineStorageService.updateQueueItem(item.id, {
          status: "FAILED",
          retryCount: item.retryCount + 1,
          lastError: err instanceof Error ? err.message : "Network error during sync",
        });
        failed++;
      }
    }

    return { processed: activeItems.length, submitted, failed };
  }
}

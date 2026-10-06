"use client";

/**
 * Chigir Ale - Client Report Cacher for Offline Viewing
 * Spec: Section 44 — Mobile Offline Behavior (Cache recently viewed reports)
 */
import { useEffect } from "react";
import { OfflineStorageService } from "../services/offline-storage.service";
import type { CachedReport } from "../types";

export function OfflineReportCacher({
  report,
}: {
  report: Omit<CachedReport, "cachedAt">;
}) {
  useEffect(() => {
    void OfflineStorageService.cacheReport({
      ...report,
      cachedAt: Date.now(),
    });
  }, [report]);

  return null;
}

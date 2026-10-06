"use client";

/**
 * Chigir Ale - Offline & Sync Status Banner
 * Spec: Section 44 — Mobile Offline Behavior (Show offline state & pending queue sync)
 */
import React, { useState, useEffect, useCallback, useTransition } from "react";
import { WifiOff, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { PlatformService } from "../services/platform.service";
import { OfflineStorageService } from "../services/offline-storage.service";
import type { PendingReportQueueItem } from "../types";

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingQueue, setPendingQueue] = useState<PendingReportQueueItem[]>([]);
  const [isPending, startTransition] = useTransition();
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const refreshQueue = useCallback(async () => {
    const queue = await OfflineStorageService.getPendingQueue();
    setPendingQueue(queue.filter((q) => q.status !== "SUBMITTED"));
  }, []);

  const handleSync = useCallback(() => {
    startTransition(async () => {
      setSyncFeedback(null);
      const res = await OfflineStorageService.processPendingQueue();
      await refreshQueue();

      if (res.submitted > 0) {
        setSyncFeedback(`Successfully synced ${res.submitted} queued report(s).`);
      } else if (res.failed > 0) {
        setSyncFeedback(`Sync failed for ${res.failed} report(s). Will retry.`);
      }
    });
  }, [refreshQueue]);

  useEffect(() => {
    let active = true;
    // Initial check
    void PlatformService.getNetworkStatus().then((status) => {
      if (active) setIsOnline(status.connected);
    });

    void OfflineStorageService.getPendingQueue().then((queue) => {
      if (active) {
        setPendingQueue(queue.filter((q) => q.status !== "SUBMITTED"));
      }
    });

    // Listen to network transitions
    const unsubscribe = PlatformService.onNetworkChange((status) => {
      setIsOnline(status.connected);
      if (status.connected) {
        // Automatically process pending queue when connection restores!
        handleSync();
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [handleSync]);

  // If online and nothing is queued, keep UI clean
  if (isOnline && pendingQueue.length === 0 && !syncFeedback) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-amber-500 dark:bg-amber-600 text-slate-950 font-medium text-xs px-4 py-2.5 shadow-sm transition-all animate-in slide-in-from-top flex items-center justify-between"
    >
      <div className="flex items-center gap-2 max-w-xl">
        {!isOnline ? (
          <>
            <WifiOff className="w-4 h-4 text-slate-950 shrink-0" />
            <span>
              <strong>Offline Mode:</strong> No active internet connection. Any submitted reports will be saved locally on your device.
            </span>
          </>
        ) : (
          <>
            <AlertCircle className="w-4 h-4 text-slate-950 shrink-0" />
            <span>
              <strong>Pending Submissions:</strong> You have {pendingQueue.length} report(s) waiting to be uploaded to the server.
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-4">
        {syncFeedback && (
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-slate-950">
            <CheckCircle2 className="w-3.5 h-3.5" /> {syncFeedback}
          </span>
        )}

        {isOnline && pendingQueue.length > 0 && (
          <button
            type="button"
            onClick={handleSync}
            disabled={isPending}
            className="px-3 py-1 bg-slate-950 hover:bg-slate-900 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
            Sync Now ({pendingQueue.length})
          </button>
        )}
      </div>
    </div>
  );
}

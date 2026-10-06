"use client";

/**
 * Chigir Ale - Offline Draft Recovery Banner
 * Spec: Section 44 — Mobile Offline Behavior (Preserve an unfinished report draft)
 */
import React, { useState, useEffect } from "react";
import { FileEdit, Check, Trash2 } from "lucide-react";
import { OfflineStorageService } from "../services/offline-storage.service";
import type { ReportDraft } from "../types";

interface OfflineDraftBannerProps {
  onRestore: (draft: ReportDraft) => void;
}

export function OfflineDraftBanner({ onRestore }: OfflineDraftBannerProps) {
  const [draft, setDraft] = useState<ReportDraft | null>(null);
  const [timeLabel, setTimeLabel] = useState<string>("");

  useEffect(() => {
    void OfflineStorageService.getDraft().then((d) => {
      // Show draft banner if draft has title or category or description
      if (d && (d.formData.title || d.formData.description || d.formData.categoryId)) {
        setDraft(d);
        const minutesAgo = Math.max(1, Math.round((Date.now() - d.lastUpdated) / 60000));
        setTimeLabel(minutesAgo < 60 ? `${minutesAgo}m ago` : `${Math.round(minutesAgo / 60)}h ago`);
      }
    });
  }, []);

  if (!draft) return null;

  function handleRestore() {
    if (!draft) return;
    onRestore(draft);
    setDraft(null);
  }

  async function handleDiscard() {
    await OfflineStorageService.clearDraft();
    setDraft(null);
  }

  return (
    <div className="p-3 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/40 rounded-2xl flex items-center justify-between text-xs animate-in fade-in">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
          <FileEdit className="w-4 h-4" />
        </div>
        <div>
          <span className="font-bold text-indigo-950 dark:text-indigo-200">
            Unsaved Draft Restorable ({timeLabel})
          </span>
          <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
            {draft.formData.title || "Untitled incident draft"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 ml-3">
        <button
          type="button"
          onClick={handleRestore}
          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1 shadow-sm"
        >
          <Check className="w-3.5 h-3.5" /> Restore
        </button>
        <button
          type="button"
          onClick={handleDiscard}
          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
          title="Discard draft"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

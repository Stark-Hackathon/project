"use client";

import React, { useState, useTransition } from "react";
import {
  ShieldAlert,
  X,
  Check,
} from "lucide-react";
import { moderateReportAction } from "@/features/moderation/actions";
import type { ModerationClassification } from "@/server/services/moderation.service";

interface ReportModerationModalProps {
  reportId: string;
  publicReference: string;
  currentCategoryId: string;
  categories?: Array<{ id: string; name: string }>;
  onSuccess?: () => void;
}

export function ReportModerationModal({
  reportId,
  publicReference,
  currentCategoryId,
  categories = [],
  onSuccess,
}: ReportModerationModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [action, setAction] = useState<"REJECT" | "FLAG_ABUSIVE" | "MARK_DUPLICATE" | "REQUEST_INFO" | "RECLASSIFY">("REJECT");
  const [classification, setClassification] = useState<ModerationClassification>("INVALID");
  const [reason, setReason] = useState("");
  const [canonicalReference, setCanonicalReference] = useState("");
  const [newCategoryId, setNewCategoryId] = useState(currentCategoryId);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleActionChange = (newAction: typeof action) => {
    setAction(newAction);
    setError(null);
    if (newAction === "FLAG_ABUSIVE") setClassification("ABUSIVE");
    else if (newAction === "MARK_DUPLICATE") setClassification("DUPLICATE");
    else if (newAction === "REQUEST_INFO") setClassification("MISSING_INFORMATION");
    else if (newAction === "RECLASSIFY") setClassification("MISCLASSIFIED");
    else setClassification("INVALID");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (reason.trim().length < 5) {
      setError("Please provide a moderation justification of at least 5 characters.");
      return;
    }

    if (action === "MARK_DUPLICATE" && !canonicalReference.trim()) {
      setError("Please specify the original canonical report reference number (e.g. CHI-2026-000001).");
      return;
    }

    startTransition(async () => {
      const res = await moderateReportAction({
        reportId,
        action,
        classification,
        reason: reason.trim(),
        canonicalReportReference: action === "MARK_DUPLICATE" ? canonicalReference.trim() : undefined,
        newCategoryId: action === "RECLASSIFY" ? newCategoryId : undefined,
      });

      if (res.success) {
        setSuccessMsg("Moderation decision recorded and citizen notified.");
        setTimeout(() => {
          setIsOpen(false);
          if (onSuccess) onSuccess();
        }, 1200);
      } else {
        setError(res.error.message);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-colors inline-flex items-center gap-1.5"
      >
        <ShieldAlert className="w-3.5 h-3.5" /> Moderate Report
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Content Moderation: #{publicReference}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 font-semibold">
                <Check className="w-4 h-4" /> {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Action selection */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Moderation Action (Spec §122)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleActionChange("REJECT")}
                    className={`p-2 rounded-xl text-left font-semibold border transition-all ${
                      action === "REJECT"
                        ? "bg-rose-50 dark:bg-rose-950 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    Reject Issue
                  </button>

                  <button
                    type="button"
                    onClick={() => handleActionChange("FLAG_ABUSIVE")}
                    className={`p-2 rounded-xl text-left font-semibold border transition-all ${
                      action === "FLAG_ABUSIVE"
                        ? "bg-rose-50 dark:bg-rose-950 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    Spam / Abusive
                  </button>

                  <button
                    type="button"
                    onClick={() => handleActionChange("MARK_DUPLICATE")}
                    className={`p-2 rounded-xl text-left font-semibold border transition-all ${
                      action === "MARK_DUPLICATE"
                        ? "bg-purple-50 dark:bg-purple-950 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    Merge Duplicate
                  </button>

                  <button
                    type="button"
                    onClick={() => handleActionChange("REQUEST_INFO")}
                    className={`p-2 rounded-xl text-left font-semibold border transition-all ${
                      action === "REQUEST_INFO"
                        ? "bg-amber-50 dark:bg-amber-950 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    Request Info
                  </button>

                  <button
                    type="button"
                    onClick={() => handleActionChange("RECLASSIFY")}
                    className={`p-2 rounded-xl text-left font-semibold border transition-all ${
                      action === "RECLASSIFY"
                        ? "bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    Reclassify
                  </button>
                </div>
              </div>

              {/* Conditional Canonical Reference */}
              {action === "MARK_DUPLICATE" && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Canonical Report Reference (Target)
                  </label>
                  <input
                    type="text"
                    value={canonicalReference}
                    onChange={(e) => setCanonicalReference(e.target.value)}
                    placeholder="e.g. CHI-2026-000012"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    This report will be marked as duplicate and linked to the canonical incident.
                  </p>
                </div>
              )}

              {/* Conditional Category Reclassification */}
              {action === "RECLASSIFY" && categories.length > 0 && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    New Category
                  </label>
                  <select
                    value={newCategoryId}
                    onChange={(e) => setNewCategoryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Reason / Explanation */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Justification / Citizen Explanation *
                </label>
                <textarea
                  rows={3}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide a specific rationale. This is logged to the append-only AuditLog and dispatched to the reporting citizen."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 shadow-sm"
                >
                  {isPending ? "Applying Decision…" : "Confirm Moderation Decision"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  Sparkles,
  Bot,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Building,
  ShieldAlert,
  X,
  Sliders,
} from "lucide-react";
import type { SmartRecommendation } from "@/server/services/ai/types";
import {
  runReportAIAnalysisAction,
  overrideAISuggestionAction,
  retryAIJobAction,
} from "@/features/ai/actions";

interface SmartRecommendationsCardProps {
  reportId: string;
  currentCategory: { id: string; name: string };
  currentSeverity: string;
  initialRecommendation?: SmartRecommendation | null;
  jobs?: Array<{
    id: string;
    type: string;
    status: string;
    attempts: number;
    error?: string | null;
  }>;
  availableCategories?: Array<{ id: string; name: string }>;
  onUpdate?: () => void;
}

export function SmartRecommendationsCard({
  reportId,
  currentCategory,
  currentSeverity,
  initialRecommendation,
  jobs = [],
  availableCategories = [],
  onUpdate,
}: SmartRecommendationsCardProps) {
  const [recommendation, setRecommendation] = useState<SmartRecommendation | null>(
    initialRecommendation || null
  );
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Override modal state
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideType, setOverrideType] = useState<"CATEGORY" | "SEVERITY">("CATEGORY");
  const [overrideValue, setOverrideValue] = useState("");
  const [overrideReason, setOverrideReason] = useState("");

  function handleGenerate() {
    setErrorMsg(null);
    setSuccessMsg(null);
    startTransition(async () => {
      const res = await runReportAIAnalysisAction(reportId);
      if (!res.success) {
        setErrorMsg(res.error.message);
      } else {
        setRecommendation(res.data);
        setSuccessMsg("AI recommendations refreshed.");
        onUpdate?.();
      }
    });
  }

  function handleAcceptCategory() {
    if (!recommendation?.suggestedCategory) return;
    setErrorMsg(null);
    startTransition(async () => {
      const res = await overrideAISuggestionAction({
        reportId,
        overrideType: "CATEGORY",
        originalValue: currentCategory.name,
        overriddenValue: recommendation.suggestedCategory!.id,
        reason: `Authority accepted AI recommendation: ${recommendation.suggestedCategory!.reason}`,
        applyChange: true,
      });

      if (!res.success) {
        setErrorMsg(res.error.message);
      } else {
        setSuccessMsg("Category updated to AI suggestion.");
        onUpdate?.();
      }
    });
  }

  function handleAcceptSeverity() {
    if (!recommendation?.suggestedSeverity) return;
    setErrorMsg(null);
    startTransition(async () => {
      const res = await overrideAISuggestionAction({
        reportId,
        overrideType: "SEVERITY",
        originalValue: currentSeverity,
        overriddenValue: recommendation.suggestedSeverity!.severity,
        reason: `Authority accepted AI severity recommendation: ${recommendation.suggestedSeverity!.reason}`,
        applyChange: true,
      });

      if (!res.success) {
        setErrorMsg(res.error.message);
      } else {
        setSuccessMsg("Severity updated to AI suggestion.");
        onUpdate?.();
      }
    });
  }

  function handleOverrideSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!overrideReason.trim() || overrideReason.trim().length < 5) {
      setErrorMsg("A justification of at least 5 characters is required.");
      return;
    }

    startTransition(async () => {
      const original =
        overrideType === "CATEGORY"
          ? recommendation?.suggestedCategory?.name || currentCategory.name
          : recommendation?.suggestedSeverity?.severity || currentSeverity;

      const res = await overrideAISuggestionAction({
        reportId,
        overrideType,
        originalValue: original,
        overriddenValue: overrideValue,
        reason: overrideReason,
        applyChange: true,
      });

      if (!res.success) {
        setErrorMsg(res.error.message);
      } else {
        setSuccessMsg(`AI ${overrideType.toLowerCase()} overridden successfully.`);
        setOverrideModalOpen(false);
        setOverrideReason("");
        onUpdate?.();
      }
    });
  }

  function handleRetryJob(jobId: string) {
    startTransition(async () => {
      const res = await retryAIJobAction(jobId);
      if (res.success) {
        setSuccessMsg("AI background job queued for retry.");
        onUpdate?.();
      }
    });
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-950/60 rounded-2xl p-6 shadow-sm space-y-5 relative overflow-hidden">
      {/* Top Banner Accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              AI Decision Support
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                Assistive
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {recommendation ? `${recommendation.provider} • ${recommendation.model}` : "Intelligent incident triage assistance"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={isPending}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
          {recommendation ? "Refresh" : "Analyze"}
        </button>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Human Control Guarantee Note (Spec §136, §138) */}
      <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
        <Bot className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
        <span>
          <strong>Decision Support Only:</strong> AI recommendations never make automated administrative changes. Authority review and justification are required.
        </span>
      </div>

      {recommendation ? (
        <div className="space-y-4 text-xs">
          {/* Executive Summary */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1.5 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              AI Summary &amp; Key Insight
            </span>
            <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
              {recommendation.summary}
            </p>
          </div>

          {/* Category Recommendation */}
          {recommendation.suggestedCategory && (
            <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100/60 dark:border-indigo-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                  Category Recommendation
                </span>
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                  {(recommendation.suggestedCategory.confidence * 100).toFixed(0)}% confidence
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-800 dark:text-slate-200">
                <div>
                  <div className="font-bold text-sm text-indigo-950 dark:text-indigo-200">
                    {recommendation.suggestedCategory.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {recommendation.suggestedCategory.reason}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-3">
                  {currentCategory.id !== recommendation.suggestedCategory.id ? (
                    <>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={handleAcceptCategory}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-[11px] transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOverrideType("CATEGORY");
                          setOverrideValue(currentCategory.id);
                          setOverrideModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-lg text-[11px] transition-colors"
                      >
                        Override
                      </button>
                    </>
                  ) : (
                    <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Matches Current
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Severity & Department Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Suggested Severity */}
            {recommendation.suggestedSeverity && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Suggested Severity
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {recommendation.suggestedSeverity.severity}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  {recommendation.suggestedSeverity.reason}
                </p>
                {currentSeverity !== recommendation.suggestedSeverity.severity && (
                  <div className="pt-1 flex gap-1.5">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={handleAcceptSeverity}
                      className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Apply Severity
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setOverrideType("SEVERITY");
                        setOverrideValue(currentSeverity);
                        setOverrideModalOpen(true);
                      }}
                      className="text-[10px] font-semibold text-slate-500 hover:underline"
                    >
                      Override
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Suggested Department */}
            {recommendation.suggestedDepartment && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <Building className="w-3 h-3 text-slate-400" /> Suggested Department
                </div>
                <div className="font-bold text-slate-800 dark:text-slate-200">
                  {recommendation.suggestedDepartment.name}
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  {recommendation.suggestedDepartment.reason}
                </p>
              </div>
            )}
          </div>

          {/* Duplicate Recommendations Alert */}
          {recommendation.possibleDuplicates && recommendation.possibleDuplicates.length > 0 && (
            <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <Copy className="w-3.5 h-3.5 text-amber-600" /> Potential Duplicate Incidents ({recommendation.possibleDuplicates.length})
                </span>
                <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                  Review &amp; Link
                </span>
              </div>

              <div className="space-y-1.5 divide-y divide-amber-100 dark:divide-amber-900/30">
                {recommendation.possibleDuplicates.map((dup) => (
                  <div key={dup.reportId} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Link
                          href={`/authority/reports/${dup.publicReference}`}
                          className="text-amber-800 dark:text-amber-300 hover:underline font-mono"
                          target="_blank"
                        >
                          {dup.publicReference}
                        </Link>
                        <span className="text-slate-600 dark:text-slate-300 line-clamp-1">
                          - {dup.title}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {dup.similarityReason}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-amber-700 shrink-0 ml-2">
                      {(dup.confidence * 100).toFixed(0)}% match
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6 px-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
          <Bot className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            No AI triage analysis generated yet
          </p>
          <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
            Click &ldquo;Analyze&rdquo; to execute category classification, executive summarization, and duplicate candidate checks.
          </p>
        </div>
      )}

      {/* AI Jobs Status Pipeline */}
      {jobs.length > 0 && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px]">
          <div className="flex items-center justify-between text-slate-400 mb-2 font-semibold">
            <span>Background AI Pipeline Status</span>
            <span>{jobs.filter((j) => j.status === "COMPLETED").length} / {jobs.length} completed</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {jobs.map((job) => (
              <div
                key={job.id}
                className={`px-2 py-1 rounded-md text-[10px] font-semibold flex items-center gap-1.5 border ${
                  job.status === "COMPLETED"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/40"
                    : job.status === "FAILED"
                    ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/40"
                    : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                }`}
              >
                <span>{job.type.replace(/_/g, " ").toLowerCase()}</span>
                {job.status === "FAILED" && (
                  <button
                    type="button"
                    onClick={() => handleRetryJob(job.id)}
                    className="hover:text-rose-900 underline font-bold"
                  >
                    Retry
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Human Override Modal (Spec §137) */}
      {overrideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                Override AI Suggestion ({overrideType})
              </h4>
              <button
                type="button"
                onClick={() => setOverrideModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleOverrideSubmit} className="space-y-4 text-xs">
              {overrideType === "CATEGORY" ? (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Correct Category
                  </label>
                  <select
                    value={overrideValue}
                    onChange={(e) => setOverrideValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    required
                  >
                    <option value="">Choose category...</option>
                    {availableCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Correct Severity
                  </label>
                  <select
                    value={overrideValue}
                    onChange={(e) => setOverrideValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    required
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Operational Justification (Required for Audit &amp; Model Learning)
                </label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g., On-site visual inspection confirmed drainage overflow rather than water mains..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  required
                  minLength={5}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOverrideModalOpen(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-colors flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5" /> Confirm Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

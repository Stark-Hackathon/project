import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReportRepository } from "@/server/repositories/report.repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, SeverityBadge } from "@/components/ui/badge";
import { CommunityInteractions } from "@/features/community/components/community-interactions";
import { getCommunityInteractionState } from "@/features/community/actions";
import { OfflineReportCacher } from "@/features/mobile/components/offline-report-cacher";

interface ReportDetailPageProps {
  params: Promise<{
    reference: string;
  }>;
}

const LIFECYCLE_STEPS = [
  { key: "SUBMITTED", label: "Submitted" },
  { key: "UNDER_REVIEW", label: "Under Review" },
  { key: "VERIFIED", label: "Verified" },
  { key: "ASSIGNED", label: "Assigned" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "RESOLVED", label: "Resolved" },
  { key: "CLOSED", label: "Closed" },
];

export async function generateMetadata({ params }: ReportDetailPageProps) {
  const { reference } = await params;
  return {
    title: `Report ${reference} — Chigir Ale`,
    description: `Public status tracking for civic infrastructure report ${reference}`,
  };
}

export default async function ReportDetailPage({ params }: ReportDetailPageProps) {
  const { reference } = await params;
  const report = await ReportRepository.findPublicByReference(reference);

  if (!report) {
    notFound();
  }

  const interactionStateRes = await getCommunityInteractionState(report.id);
  const interactionState = interactionStateRes.success
    ? interactionStateRes.data
    : { hasUpvoted: false, hasConfirmed: false };

  // Determine current lifecycle step index
  const currentStepIndex = LIFECYCLE_STEPS.findIndex(
    (step) => step.key === report.status
  );

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 sm:px-6">
      <OfflineReportCacher
        report={{
          id: report.id,
          publicReference: report.publicReference,
          title: report.title,
          description: report.description,
          status: report.status,
          severity: report.severity,
          formattedAddress: report.formattedAddress || undefined,
          categoryName: report.category.name,
        }}
      />
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation back */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-emerald-600 transition-colors inline-flex items-center gap-1"
          >
            ← Back to Home
          </Link>
          <span className="text-xs text-slate-400 font-mono">
            Chigir Ale Civic Tracker
          </span>
        </div>

        {/* Header Card */}
        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs font-mono font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">
                  {report.publicReference}
                </span>
                <CardTitle className="mt-1 text-xl sm:text-2xl font-bold">
                  {report.title}
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={report.status} />
                <SeverityBadge severity={report.severity} />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Reported on {new Date(report.reportedAt).toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </CardHeader>

          <CardContent className="space-y-6 pt-2">
            {/* Status Stepper */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-4">
                Resolution Progress
              </span>
              <ol className="flex items-center justify-between w-full overflow-x-auto pb-2">
                {LIFECYCLE_STEPS.map((step, idx) => {
                  const isDone = currentStepIndex >= idx;
                  const isCurrent = currentStepIndex === idx;

                  return (
                    <li key={step.key} className="flex flex-col items-center flex-1 min-w-[70px] text-center">
                      <div
                        className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 transition-colors ${
                          isCurrent
                            ? "bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-950"
                            : isDone
                            ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                        }`}
                      >
                        {isDone ? "✓" : idx + 1}
                      </div>
                      <span
                        className={`text-[11px] font-medium leading-tight ${
                          isCurrent
                            ? "text-emerald-700 dark:text-emerald-400 font-bold"
                            : isDone
                            ? "text-slate-700 dark:text-slate-300"
                            : "text-slate-400"
                        }`}
                      >
                        {step.label}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Community Interactions: Upvotes, Confirmations & Resolution Feedback */}
            <CommunityInteractions
              reportId={report.id}
              initialUpvoteCount={report.upvoteCount}
              initialConfirmationCount={report.confirmationCount}
              initialHasUpvoted={interactionState.hasUpvoted}
              initialHasConfirmed={interactionState.hasConfirmed}
              status={report.status}
            />

            {/* Category & Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                <span className="text-xs text-slate-400">Infrastructure Category</span>
                <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span>{report.category.icon ?? "📁"}</span>
                  <span>{report.category.name}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                <span className="text-xs text-slate-400">Location Area</span>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  {report.formattedAddress || report.administrativeArea || "Civic reporting area"}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                Problem Description
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                {report.description}
              </p>
            </div>

            {/* Evidence Media if present */}
            {report.media && report.media.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Attached Photo Evidence
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {report.media.map((item) => (
                    <div
                      key={item.id}
                      className="aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.publicUrl || "/placeholder-evidence.png"}
                        alt="Report evidence"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Public Timeline Events (Strictly public, no internal notes) */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                Public Timeline Updates
              </h4>
              {report.events.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No public status events recorded yet.</p>
              ) : (
                <ol className="relative border-l border-slate-200 dark:border-slate-800 ml-3 space-y-4">
                  {report.events.map((evt) => (
                    <li key={evt.id} className="ml-4">
                      <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-white dark:border-slate-900 bg-emerald-600" />
                      <time className="text-[11px] font-normal leading-none text-slate-400">
                        {new Date(evt.createdAt).toLocaleString()}
                      </time>
                      <h5 className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5">
                        {evt.eventType.replace(/_/g, " ")}
                      </h5>
                      {evt.message && (
                        <p className="text-xs font-normal text-slate-600 dark:text-slate-400 mt-1">
                          {evt.message}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

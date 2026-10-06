"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShieldAlert,
  Clock,
  CheckCircle2,
  MapPin,
  Sparkles,
  RefreshCw,
  Layers,
  History,
  AlertTriangle,
} from "lucide-react";
import type { Severity, ReportStatus } from "@prisma/client";
import {
  transitionReportStatusAction,
  assignReportAction,
  recalculatePriorityAction,
} from "@/features/authority/actions";
import { ReportModerationModal } from "@/features/moderation/components/report-moderation-modal";
import { SmartRecommendationsCard } from "@/features/ai/components/smart-recommendations-card";
import type { SmartRecommendation } from "@/server/services/ai/types";

interface ReportDetailProps {
  report: {
    id: string;
    publicReference: string;
    title: string;
    description: string;
    severity: Severity;
    status: ReportStatus;
    latitude: number | null;
    longitude: number | null;
    formattedAddress: string | null;
    administrativeArea: string | null;
    reportedAt: Date | string;
    verifiedAt: Date | string | null;
    resolvedAt: Date | string | null;
    closedAt: Date | string | null;
    expectedResolutionAt: Date | string | null;
    priorityScore: number | null;
    priorityVersion: number;
    confirmationCount: number;
    upvoteCount: number;
    category: { id: string; name: string; slug: string; icon: string | null };
    reporter: { id: string; name: string; email: string; phone: string | null; createdAt: Date | string };
    organization: { id: string; name: string; slug: string } | null;
    media: Array<{ id: string; publicUrl: string | null; type: string }>;
    events: Array<{
      id: string;
      eventType: string;
      fromStatus: ReportStatus | null;
      toStatus: ReportStatus | null;
      message: string | null;
      createdAt: Date | string;
      visibility: string;
      actorUser: { id: string; name: string; email: string } | null;
    }>;
    assignments: Array<{
      id: string;
      assignedAt: Date | string;
      unassignedAt: Date | string | null;
      reason: string | null;
      department: { id: string; name: string; slug: string };
      team: { id: string; name: string; slug: string } | null;
      assignee: { id: string; name: string; email: string } | null;
      assignedBy: { id: string; name: string; email: string };
    }>;
    priorityCalculations: Array<{
      id: string;
      version: number;
      score: number;
      factors: unknown;
      createdAt: Date | string;
    }>;
    sourceDuplicates: Array<{
      id: string;
      confidence: number;
      status: string;
      candidateReport: {
        id: string;
        publicReference: string;
        title: string;
        status: ReportStatus;
        severity: Severity;
        createdAt: Date | string;
      };
    }>;
    incidentReports: Array<{
      id: string;
      incident: {
        id: string;
        title: string;
        status: ReportStatus;
        severity: Severity;
      };
    }>;
    activeAssignment: {
      id: string;
      department: { id: string; name: string; slug: string };
      team: { id: string; name: string; slug: string } | null;
      assignee: { id: string; name: string; email: string } | null;
    } | null;
    sla: {
      reviewDeadline: Date;
      resolutionDeadline: Date;
      reviewStatus: string;
      resolutionStatus: string;
      escalationLevel: string;
      reviewElapsedMinutes: number;
      resolutionElapsedMinutes: number;
      isReviewBreached: boolean;
      isResolutionBreached: boolean;
      overallStatus: string;
    };
  };
  departments: Array<{
    id: string;
    name: string;
    slug: string;
    teams: Array<{ id: string; name: string; slug: string }>;
  }>;
  staff: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
  currentOrganizationId: string;
  categories?: Array<{ id: string; name: string }>;
  aiRecommendation?: SmartRecommendation | null;
  aiJobs?: Array<{
    id: string;
    type: string;
    status: string;
    attempts: number;
    error?: string | null;
  }>;
}

export function AuthorityReportDetailView({
  report,
  departments,
  staff,
  currentOrganizationId,
  categories = [],
  aiRecommendation,
  aiJobs = [],
}: ReportDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Transition modal state
  const [activeModal, setActiveModal] = useState<ReportStatus | null>(null);
  const [modalReason, setModalReason] = useState("");
  const [modalNotes, setModalNotes] = useState("");
  const [modalSeverity, setModalSeverity] = useState<Severity>(report.severity);

  // Assignment form state
  const [selectedDeptId, setSelectedDeptId] = useState(
    report.activeAssignment?.department.id ?? (departments[0]?.id || "")
  );
  const selectedDept = departments.find((d) => d.id === selectedDeptId);
  const [selectedTeamId, setSelectedTeamId] = useState(
    report.activeAssignment?.team?.id ?? ""
  );
  const [selectedAssigneeId, setSelectedAssigneeId] = useState(
    report.activeAssignment?.assignee?.id ?? ""
  );
  const [assignmentReason, setAssignmentReason] = useState("");
  const [expectedDate, setExpectedDate] = useState(
    report.expectedResolutionAt
      ? new Date(report.expectedResolutionAt).toISOString().split("T")[0]
      : ""
  );

  // Priority calculation factors parsed
  const latestPriorityCalc = report.priorityCalculations[0];
  const factorsData = latestPriorityCalc?.factors as
    | { explanations?: string[]; severityScore?: number; confirmationScore?: number; upvoteScore?: number; recurrenceScore?: number; agingScore?: number }
    | undefined;

  function clearAlerts() {
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  function handleTransitionSubmit(targetStatus: ReportStatus) {
    clearAlerts();
    startTransition(async () => {
      const result = await transitionReportStatusAction({
        reportId: report.id,
        targetStatus,
        reason: modalReason,
        notes: modalNotes,
        severity: modalSeverity,
      });

      if (!result.success) {
        setErrorMessage(result.error.message);
      } else {
        setSuccessMessage(`Report status changed to ${targetStatus}`);
        setActiveModal(null);
        setModalReason("");
        setModalNotes("");
        router.refresh();
      }
    });
  }

  function handleAssignSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearAlerts();

    if (!selectedDeptId) {
      setErrorMessage("Please select a department.");
      return;
    }

    startTransition(async () => {
      const result = await assignReportAction({
        reportId: report.id,
        organizationId: currentOrganizationId,
        departmentId: selectedDeptId,
        teamId: selectedTeamId || undefined,
        assigneeId: selectedAssigneeId || undefined,
        reason: assignmentReason || undefined,
        expectedResolutionAt: expectedDate ? new Date(expectedDate).toISOString() : undefined,
      });

      if (!result.success) {
        setErrorMessage(result.error.message);
      } else {
        setSuccessMessage("Report assigned successfully.");
        setAssignmentReason("");
        router.refresh();
      }
    });
  }

  function handleRecalculatePriority() {
    clearAlerts();
    startTransition(async () => {
      const result = await recalculatePriorityAction(report.id);
      if (!result.success) {
        setErrorMessage(result.error.message);
      } else {
        setSuccessMessage(`Priority score updated to ${result.data.score}`);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/authority/reports"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Reports Management
        </Link>
        <span className="text-xs text-slate-400 font-mono">ID: {report.id}</span>
      </div>

      {/* Alert Banners */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-sm flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 font-bold ml-2">
            ×
          </button>
        </div>
      )}
      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-emerald-700 dark:text-emerald-300 text-sm flex items-center justify-between">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 font-bold ml-2">
            ×
          </button>
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
                {report.publicReference}
              </span>

              {/* Status Badge */}
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  report.status === "SUBMITTED"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                    : report.status === "UNDER_REVIEW"
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    : report.status === "VERIFIED"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : report.status === "ASSIGNED"
                    ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                    : report.status === "IN_PROGRESS"
                    ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                    : report.status === "RESOLVED"
                    ? "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300"
                    : report.status === "CLOSED"
                    ? "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                    : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                }`}
              >
                {report.status.replace("_", " ")}
              </span>

              {/* Severity Badge */}
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${
                  report.severity === "CRITICAL"
                    ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                    : report.severity === "HIGH"
                    ? "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300"
                    : report.severity === "MEDIUM"
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {report.severity === "CRITICAL" && <ShieldAlert className="w-3.5 h-3.5" />}
                {report.severity}
              </span>

              {/* SLA Status Indicator */}
              {report.sla.overallStatus === "BREACHED" && (
                <span className="text-xs font-bold bg-rose-600 text-white px-2.5 py-1 rounded-full animate-pulse flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> SLA BREACHED ({report.sla.escalationLevel})
                </span>
              )}
              {report.sla.overallStatus === "WARNING" && (
                <span className="text-xs font-semibold bg-amber-500 text-white px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> SLA WARNING
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{report.title}</h1>

            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
              <span>Category: {report.category.name}</span>
              {report.administrativeArea && <span>• Area: {report.administrativeArea}</span>}
              <span>• Reported: {new Date(report.reportedAt).toLocaleString()}</span>
            </p>
          </div>

          {/* Quick Decision / Triage Buttons */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
            {report.status === "SUBMITTED" && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleTransitionSubmit("UNDER_REVIEW")}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
              >
                Begin Review
              </button>
            )}

            {report.status === "UNDER_REVIEW" && (
              <>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setActiveModal("VERIFIED")}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Verify Report
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setActiveModal("NEEDS_INFORMATION")}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors"
                >
                  Request Info
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setActiveModal("REJECTED")}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-semibold rounded-xl transition-colors"
                >
                  Reject
                </button>
              </>
            )}

            {report.status === "ASSIGNED" && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleTransitionSubmit("IN_PROGRESS")}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
              >
                Start Operational Work
              </button>
            )}

            {report.status === "IN_PROGRESS" && (
              <>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setActiveModal("RESOLVED")}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Mark Resolved
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setActiveModal("BLOCKED")}
                  className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 text-xs font-semibold rounded-xl transition-colors"
                >
                  Mark Blocked
                </button>
              </>
            )}

            {report.status === "BLOCKED" && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleTransitionSubmit("IN_PROGRESS")}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                Unblock &amp; Resume Work
              </button>
            )}

            {report.status === "RESOLVED" && (
              <>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleTransitionSubmit("CLOSED")}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold rounded-xl transition-colors"
                >
                  Close Report
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setActiveModal("REOPENED")}
                  className="px-3.5 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 text-xs font-semibold rounded-xl transition-colors"
                >
                  Reopen
                </button>
              </>
            )}

            {["CLOSED", "REJECTED"].includes(report.status) && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => setActiveModal("REOPENED")}
                className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                Reopen
              </button>
            )}

            {/* Moderation Tooling (Spec §122) */}
            <ReportModerationModal
              reportId={report.id}
              publicReference={report.publicReference}
              currentCategoryId={report.category.id}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Issue Info, Assignment, Evidence, and Audit Trail */}
        <div className="lg:col-span-2 space-y-8">
          {/* Issue Details & Reporter Information */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Issue Information</h2>

            <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              {report.description}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 block font-semibold">Location / Address</span>
                <span className="text-slate-800 dark:text-slate-200 flex items-center gap-1.5 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {report.formattedAddress || "Coordinates provided"}
                </span>
                {report.latitude && report.longitude && (
                  <span className="text-slate-400 font-mono block text-[11px]">
                    Lat: {report.latitude.toFixed(5)}, Lng: {report.longitude.toFixed(5)}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 block font-semibold">Reporter Details</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">
                  {report.reporter.name} ({report.reporter.email})
                </span>
                {report.reporter.phone && (
                  <span className="text-slate-500 block">Phone: {report.reporter.phone}</span>
                )}
              </div>
            </div>
          </div>

          {/* Department & Operational Assignment Panel (Spec Section 33) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Operational Assignment
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Route to responsible department, technical team, and designated staff member.
                </p>
              </div>

              {report.activeAssignment ? (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                  Currently Assigned
                </span>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Unassigned
                </span>
              )}
            </div>

            {/* Active Assignment Card if present */}
            {report.activeAssignment && (
              <div className="bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 rounded-xl p-4 text-xs space-y-2">
                <div className="flex justify-between font-semibold text-purple-900 dark:text-purple-300">
                  <span>Assigned Department: {report.activeAssignment.department.name}</span>
                  {report.activeAssignment.team && (
                    <span>Team: {report.activeAssignment.team.name}</span>
                  )}
                </div>
                {report.activeAssignment.assignee && (
                  <div className="text-purple-800 dark:text-purple-400">
                    Lead Staff Member: {report.activeAssignment.assignee.name} (
                    {report.activeAssignment.assignee.email})
                  </div>
                )}
              </div>
            )}

            {/* Assignment / Reassignment Form */}
            <form onSubmit={handleAssignSubmit} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Department Dropdown */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Department *
                  </label>
                  <select
                    value={selectedDeptId}
                    onChange={(e) => {
                      setSelectedDeptId(e.target.value);
                      setSelectedTeamId("");
                    }}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Team Dropdown */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Team (Optional)
                  </label>
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    disabled={!selectedDept || selectedDept.teams.length === 0}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                  >
                    <option value="">No specific team</option>
                    {selectedDept?.teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Staff Member Dropdown */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Assignee (Staff)
                  </label>
                  <select
                    value={selectedAssigneeId}
                    onChange={(e) => setSelectedAssigneeId(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Unassigned staff</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Expected Resolution Target
                  </label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Assignment Reason / Directives
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Assigned to crew for rapid pavement patching"
                    value={assignmentReason}
                    onChange={(e) => setAssignmentReason(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
              >
                {report.activeAssignment ? "Reassign Report" : "Assign to Department"}
              </button>
            </form>
          </div>

          {/* Timeline & Full Audit History (Spec Section 31) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-slate-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Audit Timeline &amp; Events
              </h2>
            </div>

            <div className="space-y-4 border-l-2 border-slate-100 dark:border-slate-800 ml-3 pl-4">
              {report.events.map((event) => (
                <div key={event.id} className="relative space-y-1 text-xs">
                  <div className="absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-600 ring-4 ring-white dark:ring-slate-900" />
                  <div className="flex items-center gap-2 flex-wrap font-semibold text-slate-800 dark:text-slate-200">
                    <span>{event.eventType.replace("_", " ")}</span>
                    {event.fromStatus && event.toStatus && (
                      <span className="text-slate-500">
                        ({event.fromStatus} → {event.toStatus})
                      </span>
                    )}
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded">
                      {event.visibility}
                    </span>
                  </div>
                  {event.message && (
                    <p className="text-slate-600 dark:text-slate-300">{event.message}</p>
                  )}
                  <p className="text-[11px] text-slate-400">
                    By {event.actorUser?.name ?? "System"} •{" "}
                    {new Date(event.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Priority Engine & SLA Target Card */}
        <div className="space-y-8">
          {/* Smart Decision Support Card (Spec §35, §136, §137) */}
          <SmartRecommendationsCard
            reportId={report.id}
            currentCategory={{ id: report.category.id, name: report.category.name }}
            currentSeverity={report.severity}
            initialRecommendation={aiRecommendation}
            jobs={aiJobs}
            availableCategories={categories}
            onUpdate={() => router.refresh()}
          />

          {/* Priority Decision-Support Card (Spec Section 34) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Priority Score
                </h3>
              </div>
              <button
                type="button"
                onClick={handleRecalculatePriority}
                disabled={isPending}
                title="Recalculate priority based on latest data"
                className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Recalculate
              </button>
            </div>

            <div className="bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-purple-700 dark:text-purple-300 block font-medium">
                  Decision Recommendation
                </span>
                <span className="text-2xl font-black text-purple-900 dark:text-purple-100 font-mono">
                  {report.priorityScore !== null ? report.priorityScore : "N/A"}{" "}
                  <span className="text-xs font-normal text-purple-500">/ 100</span>
                </span>
              </div>
              <span className="text-[10px] font-mono bg-purple-200/80 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                v{report.priorityVersion}
              </span>
            </div>

            {/* Transparent Factor Breakdown (Spec Section 34) */}
            <div className="space-y-2 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                Decision Factors Breakdown:
              </span>
              <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
                {factorsData?.explanations && factorsData.explanations.length > 0 ? (
                  factorsData.explanations.map((exp, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-purple-500 font-bold">•</span>
                      <span>{exp}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-400 italic">
                    Score generated based on severity ({report.severity}) and community validation (
                    {report.confirmationCount} confirmations).
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* SLA & Escalation Tracker (Spec Section 119 & 120) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                SLA &amp; Escalation Tracker
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-500">Review SLA Target:</span>
                  <span
                    className={
                      report.sla.reviewStatus === "BREACHED"
                        ? "text-rose-600 font-bold"
                        : report.sla.reviewStatus === "WARNING"
                        ? "text-amber-600 font-bold"
                        : "text-emerald-600"
                    }
                  >
                    {report.sla.reviewStatus}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Deadline: {new Date(report.sla.reviewDeadline).toLocaleString()}
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-500">Resolution SLA Target:</span>
                  <span
                    className={
                      report.sla.resolutionStatus === "BREACHED"
                        ? "text-rose-600 font-bold"
                        : report.sla.resolutionStatus === "WARNING"
                        ? "text-amber-600 font-bold"
                        : "text-emerald-600"
                    }
                  >
                    {report.sla.resolutionStatus}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Target: {new Date(report.sla.resolutionDeadline).toLocaleString()}
                </div>
              </div>

              {report.sla.escalationLevel !== "NONE" && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-800 dark:text-rose-300">
                  <span className="font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Escalated To:
                  </span>
                  <span className="font-mono text-[11px] font-semibold block mt-0.5">
                    {report.sla.escalationLevel.replace("_", " ")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Duplicate Candidates Card if any (Spec Section 64) */}
          {report.sourceDuplicates.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Duplicate Candidates
                </h3>
              </div>

              <div className="space-y-2 text-xs">
                {report.sourceDuplicates.map((dup) => (
                  <div
                    key={dup.id}
                    className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl space-y-1"
                  >
                    <div className="flex justify-between font-semibold">
                      <Link
                        href={`/authority/reports/${dup.candidateReport.publicReference}`}
                        className="text-amber-900 dark:text-amber-200 hover:underline"
                      >
                        {dup.candidateReport.publicReference}
                      </Link>
                      <span className="text-amber-700 dark:text-amber-400">
                        {Math.round(dup.confidence * 100)}% Match
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 truncate">
                      {dup.candidateReport.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Dialog for Transitions requiring input */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {activeModal === "VERIFIED" && "Verify & Triage Report"}
              {activeModal === "REJECTED" && "Reject Report"}
              {activeModal === "NEEDS_INFORMATION" && "Request Additional Information"}
              {activeModal === "RESOLVED" && "Confirm Operational Resolution"}
              {activeModal === "BLOCKED" && "Mark Report as Blocked"}
              {activeModal === "REOPENED" && "Reopen Report"}
            </h3>

            {activeModal === "VERIFIED" && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Confirmed Severity Level:
                  </label>
                  <select
                    value={modalSeverity}
                    onChange={(e) => setModalSeverity(e.target.value as Severity)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Verification Notes (Optional):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Field verification confirmed pothole depth >10cm"
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>
            )}

            {activeModal === "REJECTED" && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Rejection Reason * (Mandatory):
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide clear legal or operational reason for rejection..."
                  value={modalReason}
                  onChange={(e) => setModalReason(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            )}

            {activeModal === "NEEDS_INFORMATION" && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Information Requested from Citizen * (Mandatory):
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Specify what additional photos or location clarification is needed..."
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            )}

            {activeModal === "RESOLVED" && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Resolution Notes * (Mandatory):
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the completed repair or maintenance action..."
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            )}

            {activeModal === "BLOCKED" && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Blockage Reason * (Mandatory):
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Specify material shortage, access restriction, or awaiting utility clearance..."
                  value={modalReason}
                  onChange={(e) => setModalReason(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            )}

            {activeModal === "REOPENED" && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Reopening Justification * (Mandatory):
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain why this issue is being reopened for further work..."
                  value={modalReason}
                  onChange={(e) => setModalReason(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  setModalReason("");
                  setModalNotes("");
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleTransitionSubmit(activeModal)}
                className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-colors"
              >
                Confirm Transition
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

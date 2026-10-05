"use client";

import React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  FolderOpen,
  UserCheck,
} from "lucide-react";
import type { Severity, ReportStatus } from "@prisma/client";

interface UrgentReport {
  id: string;
  publicReference: string;
  title: string;
  severity: Severity;
  status: ReportStatus;
  createdAt: Date | string;
  priorityScore: number | null;
  confirmationCount: number;
  category: { name: string; slug: string; icon: string | null };
  reporter: { name: string; email: string };
  sla: {
    overallStatus: "MET" | "WITHIN_TARGET" | "WARNING" | "BREACHED";
    escalationLevel: "NONE" | "SLA_WARNING" | "DEPARTMENT_MANAGER" | "ORG_ADMIN";
    isReviewBreached: boolean;
    isResolutionBreached: boolean;
  };
}

interface DashboardMetrics {
  total: number;
  open: number;
  new: number;
  underReview: number;
  verified: number;
  assigned: number;
  inProgress: number;
  blocked: number;
  resolved: number;
  reopened: number;
  closed: number;
  critical: number;
  avgResolutionHours: number;
  categoryStats: Array<{
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    count: number;
  }>;
  urgentQueue: UrgentReport[];
}

export function AuthorityDashboard({ metrics }: { metrics: DashboardMetrics }) {
  const cards = [
    {
      label: "Total Reports",
      value: metrics.total,
      color: "text-slate-900 dark:text-white",
      bg: "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800",
      href: "/authority/reports",
      icon: FileText,
    },
    {
      label: "New (Submitted)",
      value: metrics.new,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900",
      href: "/authority/reports?status=SUBMITTED",
      icon: FolderOpen,
    },
    {
      label: "Under Review",
      value: metrics.underReview,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900",
      href: "/authority/reports?status=UNDER_REVIEW",
      icon: Clock,
    },
    {
      label: "Verified",
      value: metrics.verified,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900",
      href: "/authority/reports?status=VERIFIED",
      icon: CheckCircle2,
    },
    {
      label: "Assigned",
      value: metrics.assigned,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900",
      href: "/authority/reports?status=ASSIGNED",
      icon: UserCheck,
    },
    {
      label: "In Progress",
      value: metrics.inProgress,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900",
      href: "/authority/reports?status=IN_PROGRESS",
      icon: TrendingUp,
    },
    {
      label: "Resolved",
      value: metrics.resolved,
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-50/50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900",
      href: "/authority/reports?status=RESOLVED",
      icon: CheckCircle2,
    },
    {
      label: "Reopened",
      value: metrics.reopened,
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900",
      href: "/authority/reports?status=REOPENED",
      icon: RefreshCw,
    },
    {
      label: "Critical Priority",
      value: metrics.critical,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900",
      href: "/authority/reports?severity=CRITICAL",
      icon: ShieldAlert,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner / KPIs */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-sm">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
            Operational Authority Cockpit
          </span>
          <h1 className="text-2xl font-bold">Municipality Incident Command</h1>
          <p className="text-sm text-slate-300 mt-1">
            Real-time monitoring, triage, assignments, and resolution performance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="bg-slate-800/80 border border-slate-700 px-4 py-2.5 rounded-xl">
            <span className="text-slate-400 block">Open Incidents</span>
            <span className="text-lg font-bold text-white">{metrics.open}</span>
          </div>
          <div className="bg-slate-800/80 border border-slate-700 px-4 py-2.5 rounded-xl">
            <span className="text-slate-400 block">Avg Resolution Time</span>
            <span className="text-lg font-bold text-emerald-400">
              {metrics.avgResolutionHours} hrs
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Key Status Cards (Spec Section 29) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className={`p-5 rounded-xl border transition-all hover:shadow-md hover:scale-[1.01] ${card.bg}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {card.label}
                </span>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <p className={`text-2xl font-bold mt-2 ${card.color}`}>{card.value}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Urgent Action Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Urgent Action Queue
              </h2>
            </div>
            <Link
              href="/authority/reports"
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
            {metrics.urgentQueue.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
                <p className="font-medium">No urgent items in queue</p>
                <p className="text-xs text-slate-400 mt-1">All high-priority reports have been processed.</p>
              </div>
            ) : (
              metrics.urgentQueue.map((report) => (
                <div
                  key={report.id}
                  className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300">
                        {report.publicReference}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          report.severity === "CRITICAL"
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                            : report.severity === "HIGH"
                            ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        }`}
                      >
                        {report.severity}
                      </span>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                        {report.status}
                      </span>
                      {report.sla.overallStatus === "BREACHED" && (
                        <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                          SLA BREACH
                        </span>
                      )}
                      {report.sla.overallStatus === "WARNING" && (
                        <span className="text-[10px] font-semibold bg-amber-500 text-white px-2 py-0.5 rounded-full">
                          SLA WARN
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/authority/reports/${report.publicReference}`}
                      className="font-semibold text-slate-900 dark:text-white hover:text-emerald-600 block text-sm"
                    >
                      {report.title}
                    </Link>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Category: {report.category.name} • {report.confirmationCount} confirmations
                      {report.priorityScore !== null && (
                        <span className="ml-2 font-mono font-semibold text-purple-600 dark:text-purple-400">
                          Priority Score: {report.priorityScore}
                        </span>
                      )}
                    </p>
                  </div>

                  <Link
                    href={`/authority/reports/${report.publicReference}`}
                    className="shrink-0 text-xs bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Triage &amp; Assign
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Category Breakdown & Operations Analytics */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Reports by Category
            </h2>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            {metrics.categoryStats.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No report category data available</p>
            ) : (
              metrics.categoryStats.map((cat) => {
                const percentage =
                  metrics.total > 0 ? Math.round((cat.count / metrics.total) * 100) : 0;
                return (
                  <div key={cat.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        {cat.icon && <span>{cat.icon}</span>}
                        {cat.name}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 font-mono">
                        {cat.count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.max(5, percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-2">
              <div className="flex justify-between">
                <span>Total Registered</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {metrics.total}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Active Work in Progress</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {metrics.inProgress + metrics.assigned}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Resolution Rate</span>
                <span className="font-semibold text-teal-600 dark:text-teal-400">
                  {metrics.total > 0
                    ? `${Math.round(((metrics.resolved + metrics.closed) / metrics.total) * 100)}%`
                    : "0%"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

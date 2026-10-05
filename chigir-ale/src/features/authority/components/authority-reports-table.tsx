"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Clock,
  Eye,
  Building,
  User,
} from "lucide-react";
import type { Severity, ReportStatus } from "@prisma/client";

interface EnrichedReport {
  id: string;
  publicReference: string;
  title: string;
  severity: Severity;
  status: ReportStatus;
  formattedAddress: string | null;
  administrativeArea: string | null;
  priorityScore: number | null;
  confirmationCount: number;
  upvoteCount: number;
  createdAt: Date | string;
  category: { id: string; name: string; slug: string; icon: string | null; colorToken: string | null };
  reporter: { id: string; name: string; email: string };
  activeAssignment: {
    department: { id: string; name: string; slug: string };
    team: { id: string; name: string } | null;
    assignee: { id: string; name: string; email: string } | null;
  } | null;
  sla: {
    overallStatus: "MET" | "WITHIN_TARGET" | "WARNING" | "BREACHED";
    escalationLevel: "NONE" | "SLA_WARNING" | "DEPARTMENT_MANAGER" | "ORG_ADMIN";
  };
}

interface PaginationData {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface FilterOptions {
  categories: Array<{ id: string; name: string; slug: string }>;
  departments: Array<{ id: string; name: string; slug: string }>;
}

export function AuthorityReportsTable({
  reports,
  pagination,
  filterOptions,
}: {
  reports: EnrichedReport[];
  pagination: PaginationData;
  filterOptions: FilterOptions;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentSearch = searchParams.get("search") ?? "";
  const currentStatus = searchParams.get("status") ?? "ALL";
  const currentSeverity = searchParams.get("severity") ?? "ALL";
  const currentCategory = searchParams.get("category") ?? "ALL";
  const currentDepartment = searchParams.get("department") ?? "ALL";
  const currentSort = searchParams.get("sort") ?? "priority_desc";

  const [searchInput, setSearchInput] = useState(currentSearch);

  function updateQuery(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === "" || val === "ALL") {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });
    // Reset to page 1 on filter changes unless changing page
    if (!updates.page) {
      params.delete("page");
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateQuery({ search: searchInput.trim() });
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar (Spec Section 30) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by reference (e.g. CHI-2026-000001), title, or location..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold mr-1">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </div>

          {/* Status Filter */}
          <select
            value={currentStatus}
            onChange={(e) => updateQuery({ status: e.target.value })}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Status: All</option>
            <option value="SUBMITTED">Submitted (New)</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="VERIFIED">Verified</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="BLOCKED">Blocked</option>
            <option value="RESOLVED">Resolved</option>
            <option value="REOPENED">Reopened</option>
            <option value="CLOSED">Closed</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {/* Severity Filter */}
          <select
            value={currentSeverity}
            onChange={(e) => updateQuery({ severity: e.target.value })}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Severity: All</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Category Filter */}
          <select
            value={currentCategory}
            onChange={(e) => updateQuery({ category: e.target.value })}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Category: All</option>
            {filterOptions.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Department Filter */}
          <select
            value={currentDepartment}
            onChange={(e) => updateQuery({ department: e.target.value })}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Department: All</option>
            {filterOptions.departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Sort Selector */}
          <div className="ml-auto flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={currentSort}
              onChange={(e) => updateQuery({ sort: e.target.value })}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="priority_desc">Highest Priority</option>
              <option value="created_desc">Newest First</option>
              <option value="severity_desc">Highest Severity</option>
              <option value="confirmations_desc">Most Confirmations</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table (Spec Section 30) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Issue &amp; Category</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Department &amp; Assignee</th>
                <th className="py-3 px-4">SLA / Priority</th>
                <th className="py-3 px-4">Reported</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No reports match the selected filters or search query.
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Reference */}
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                      {report.publicReference}
                    </td>

                    {/* Issue & Category */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <Link
                        href={`/authority/reports/${report.publicReference}`}
                        className="font-semibold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 block truncate"
                        title={report.title}
                      >
                        {report.title}
                      </Link>
                      <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        {report.category.icon && <span>{report.category.icon}</span>}
                        {report.category.name}
                        {report.administrativeArea && <span>• {report.administrativeArea}</span>}
                      </span>
                    </td>

                    {/* Severity Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          report.severity === "CRITICAL"
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                            : report.severity === "HIGH"
                            ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
                            : report.severity === "MEDIUM"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {report.severity === "CRITICAL" && <ShieldAlert className="w-3 h-3" />}
                        {report.severity}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                          report.status === "SUBMITTED"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                            : report.status === "UNDER_REVIEW"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                            : report.status === "VERIFIED"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : report.status === "ASSIGNED"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                            : report.status === "IN_PROGRESS"
                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                            : report.status === "RESOLVED"
                            ? "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
                            : report.status === "CLOSED"
                            ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                        }`}
                      >
                        {report.status.replace("_", " ")}
                      </span>
                    </td>

                    {/* Department & Assignee */}
                    <td className="py-3.5 px-4 text-xs">
                      {report.activeAssignment ? (
                        <div className="space-y-0.5">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            <Building className="w-3 h-3 text-slate-400" />
                            {report.activeAssignment.department.name}
                          </span>
                          {report.activeAssignment.assignee && (
                            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" />
                              {report.activeAssignment.assignee.name}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="italic text-slate-400">Unassigned</span>
                      )}
                    </td>

                    {/* SLA / Priority */}
                    <td className="py-3.5 px-4 text-xs">
                      <div className="space-y-1">
                        {report.priorityScore !== null && (
                          <div className="font-mono font-bold text-slate-900 dark:text-white">
                            Score: {report.priorityScore}
                          </div>
                        )}
                        <div>
                          {report.sla.overallStatus === "BREACHED" && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-rose-500 text-white px-1.5 py-0.5 rounded">
                              <Clock className="w-2.5 h-2.5" /> BREACHED
                            </span>
                          )}
                          {report.sla.overallStatus === "WARNING" && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-amber-500 text-white px-1.5 py-0.5 rounded">
                              <Clock className="w-2.5 h-2.5" /> WARN
                            </span>
                          )}
                          {report.sla.overallStatus === "WITHIN_TARGET" && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                              On Track
                            </span>
                          )}
                          {report.sla.overallStatus === "MET" && (
                            <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                              SLA Met
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Reported Date */}
                    <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/authority/reports/${report.publicReference}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Triage
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div>
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} reports)
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => updateQuery({ page: String(pagination.page - 1) })}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => updateQuery({ page: String(pagination.page + 1) })}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

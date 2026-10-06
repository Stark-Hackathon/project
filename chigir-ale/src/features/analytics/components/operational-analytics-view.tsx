"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  BarChart3,
  AlertTriangle,
  Building,
  Flame,
  Calendar,
} from "lucide-react";
import type { OperationalAnalytics } from "@/server/services/analytics.service";
import type { InfrastructureHotspot } from "@/server/services/hotspot.service";
import { getOperationalAnalyticsAction, getHotspotsAction } from "@/features/analytics/actions";

interface OperationalAnalyticsViewProps {
  initialAnalytics: OperationalAnalytics;
  initialHotspots: InfrastructureHotspot[];
}

export function OperationalAnalyticsView({
  initialAnalytics,
  initialHotspots,
}: OperationalAnalyticsViewProps) {
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [hotspots, setHotspots] = useState(initialHotspots);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(initialAnalytics.periodDays);
  const [isPending, startTransition] = useTransition();

  const handlePeriodChange = (days: number) => {
    setSelectedPeriod(days);
    startTransition(async () => {
      const [resAnalytics, resHotspots] = await Promise.all([
        getOperationalAnalyticsAction(days),
        getHotspotsAction({ days, minCount: 2 }),
      ]);

      if (resAnalytics.success) {
        setAnalytics(resAnalytics.data);
      }
      if (resHotspots.success) {
        setHotspots(resHotspots.data);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with period toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-500" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Operational Analytics &amp; Infrastructure Intelligence
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Department workloads, SLA resolution velocity, recurrence, and hotspot clustering.
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
          <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              type="button"
              disabled={isPending}
              onClick={() => handlePeriodChange(days)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                selectedPeriod === days
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {days} Days
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-semibold text-slate-400 uppercase block">Total Volume</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {analytics.totalReports}
          </div>
          <span className="text-[10px] text-slate-500">In {selectedPeriod}d window</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-semibold text-slate-400 uppercase block">Active Pipeline</span>
          <div className="text-2xl font-black text-amber-500 mt-1">
            {analytics.activeReports}
          </div>
          <span className="text-[10px] text-slate-500">In review / assigned</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-semibold text-slate-400 uppercase block">Resolution Rate</span>
          <div className="text-2xl font-black text-emerald-500 mt-1">
            {analytics.resolutionRate}%
          </div>
          <span className="text-[10px] text-slate-500">{analytics.resolvedReports + analytics.closedReports} closed</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-semibold text-slate-400 uppercase block">Median Fix Time</span>
          <div className="text-2xl font-black text-blue-500 mt-1">
            {analytics.medianResolutionHours}h
          </div>
          <span className="text-[10px] text-slate-500">Avg {analytics.avgResolutionHours}h</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-semibold text-slate-400 uppercase block">Reopened Rate</span>
          <div className="text-2xl font-black text-orange-500 mt-1">
            {analytics.reopenedRate}%
          </div>
          <span className="text-[10px] text-slate-500">Citizen feedback</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-semibold text-slate-400 uppercase block">Duplicate Rate</span>
          <div className="text-2xl font-black text-purple-500 mt-1">
            {analytics.duplicateRate}%
          </div>
          <span className="text-[10px] text-slate-500">Clustered issues</span>
        </div>
      </div>

      {/* Department Workloads & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Workloads */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-purple-500" /> Department Workloads
            </h3>
            <span className="text-xs text-slate-400">Active Queue</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-2.5 font-semibold">Department</th>
                  <th className="p-2.5 text-center font-semibold">Active</th>
                  <th className="p-2.5 text-center font-semibold">In Progress</th>
                  <th className="p-2.5 text-center font-semibold">Resolved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {analytics.departmentWorkloads.map((dw) => (
                  <tr key={dw.departmentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200">
                      {dw.departmentName}
                    </td>
                    <td className="p-2.5 text-center font-bold text-amber-600">
                      {dw.activeCount}
                    </td>
                    <td className="p-2.5 text-center font-bold text-blue-600">
                      {dw.inProgressCount}
                    </td>
                    <td className="p-2.5 text-center font-bold text-emerald-600">
                      {dw.resolvedCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Severity & Category Split */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" /> Severity Breakdown
            </h3>
            <span className="text-xs text-slate-400">Triage Priority</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {analytics.bySeverity.map((sev) => {
              const color =
                sev.severity === "CRITICAL"
                  ? "bg-rose-500"
                  : sev.severity === "HIGH"
                  ? "bg-orange-500"
                  : sev.severity === "MEDIUM"
                  ? "bg-amber-400"
                  : "bg-blue-400";

              return (
                <div key={sev.severity} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${color}`} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {sev.severity}
                      </span>
                    </div>
                    <div className="text-lg font-black text-slate-900 dark:text-white">
                      {sev.count}
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">{sev.percentage}%</span>
                </div>
              );
            })}
          </div>

          {/* Top Subcities */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
              Subcity Incidents
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {analytics.byArea.slice(0, 6).map((a) => (
                <span
                  key={a.area}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                >
                  {a.area}: <strong>{a.count}</strong> ({a.percentage}%)
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Operational Hotspots Grid (Spec §95) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Operational Failure Hotspots
            </h3>
          </div>
          <Link
            href="/authority/map"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
          >
            Inspect on Grid Map →
          </Link>
        </div>

        {hotspots.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            No active hotspot clusters identified in this period.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hotspots.map((h) => (
              <div
                key={h.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {h.area}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        h.trend === "INCREASING"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                          : h.trend === "DECREASING"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {h.trend}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                    {h.categoryName}
                  </p>

                  <div className="flex items-center gap-3 text-xs mt-3 text-slate-600 dark:text-slate-300">
                    <span>
                      <strong>{h.reportCount}</strong> reports
                    </span>
                    <span>•</span>
                    <span className="text-rose-600 dark:text-rose-400">
                      <strong>{h.criticalCount + h.highCount}</strong> urgent
                    </span>
                    <span>•</span>
                    <span>Score: <strong>{h.severityScore}</strong></span>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-2 line-clamp-2">
                    {h.calculationExplanation}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <Link
                    href={`/authority/reports?categoryId=${h.categoryId}`}
                    className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                  >
                    View Reports →
                  </Link>
                  <Link
                    href={`/authority/map`}
                    className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    Locate
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

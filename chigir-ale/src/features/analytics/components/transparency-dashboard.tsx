"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Clock,
  ThumbsUp,
  Layers,
  ArrowUpRight,
  BarChart3,
  Flame,
  Search,
} from "lucide-react";
import type { PublicTransparencyMetrics } from "@/server/services/analytics.service";
import type { InfrastructureHotspot } from "@/server/services/hotspot.service";

interface TransparencyDashboardProps {
  initialMetrics: PublicTransparencyMetrics;
  initialHotspots: InfrastructureHotspot[];
}

export function TransparencyDashboard({
  initialMetrics,
  initialHotspots,
}: TransparencyDashboardProps) {
  const [metrics] = useState(initialMetrics);
  const [hotspots] = useState(initialHotspots);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border border-emerald-900/40 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-3">
            <BarChart3 className="w-3.5 h-3.5" /> Civic Data Transparency (Spec §121)
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Addis Ababa Infrastructure Transparency
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Open civic data showing verified community reporting, municipal resolution performance, and public infrastructure velocity across subcities.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 relative z-10">
          <Link
            href="/citizen/report/new"
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-sm"
          >
            Report an Issue <ArrowUpRight className="w-4 h-4" />
          </Link>
          <Link
            href="/map"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            View Live Map
          </Link>
          <Link
            href="/search"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors inline-flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" /> Search Issues
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Reports */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Reports</span>
            <Layers className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {metrics.totalCityReports.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Recorded civic incidents</p>
        </div>

        {/* Resolution Rate */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Resolution Rate</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {metrics.overallResolutionRate}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {metrics.totalResolvedIssues} issues confirmed resolved
          </p>
        </div>

        {/* Median Fix Time */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Median Fix Time</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {metrics.medianResolutionDays} <span className="text-sm font-semibold">days</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">From verification to completion</p>
        </div>

        {/* Community Confirmations */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Community Validation</span>
            <ThumbsUp className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {metrics.communityConfirmations.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Citizen confirmations &amp; upvotes</p>
        </div>
      </div>

      {/* Two-Column Analytics Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Issues by Infrastructure Category
            </h3>
            <span className="text-xs text-slate-400">Addis Ababa</span>
          </div>

          <div className="space-y-3 pt-2">
            {metrics.topCategories.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No category data yet.</p>
            ) : (
              metrics.topCategories.map((c) => (
                <div key={c.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {c.name}
                    </span>
                    <span className="text-slate-400">
                      {c.count} ({c.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(4, c.percentage)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Current Resolution Pipeline
            </h3>
            <span className="text-xs text-slate-400">Status Overview</span>
          </div>

          <div className="space-y-4 pt-2">
            {metrics.statusOverview.map((s) => (
              <div key={s.label} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {s.label}
                  </h4>
                  <p className="text-[11px] text-slate-400">{s.count} incidents</p>
                </div>
                <div className="text-right">
                  <span className="text-base font-extrabold text-slate-900 dark:text-white">
                    {s.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Subcity Highlights */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              Top Subcity Activity
            </h4>
            <div className="flex flex-wrap gap-2">
              {metrics.areaOverview.map((a) => (
                <span
                  key={a.area}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                >
                  {a.area}: <strong>{a.count}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Infrastructure Hotspots Radar (Spec §95) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Identified Infrastructure Hotspots (Spec §95)
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Algorithmic 30-day clustering &amp; severity density analysis
          </span>
        </div>

        {hotspots.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-xl">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No concentrated infrastructure failure clusters detected in the current window.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3 font-semibold">Subcity / Area</th>
                  <th className="p-3 font-semibold">Category</th>
                  <th className="p-3 font-semibold text-center">Incidents</th>
                  <th className="p-3 font-semibold text-center">High / Critical</th>
                  <th className="p-3 font-semibold text-center">Trend</th>
                  <th className="p-3 font-semibold">Algorithmic Explanation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {hotspots.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">
                      {h.area}
                    </td>
                    <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">
                      {h.categoryName}
                    </td>
                    <td className="p-3 text-center font-extrabold text-slate-900 dark:text-white">
                      {h.reportCount}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                        {h.criticalCount + h.highCount}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                          h.trend === "INCREASING"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200"
                            : h.trend === "DECREASING"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                            : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {h.trend}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 dark:text-slate-400 text-[11px] max-w-xs">
                      {h.calculationExplanation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

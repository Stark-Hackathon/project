"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Flame,
  TrendingUp,
  AlertTriangle,
  Trash2,
  Droplet,
  Zap,
  ShieldAlert,
  ChevronRight,
  MapPin,
  Users,
  Search,
  Filter,
} from "lucide-react";

interface ScreenTrendingIssuesProps {
  onBack?: () => void;
  onSelectIssue?: (issueId: string) => void;
  onNavigateHome?: () => void;
  onNavigateReport?: () => void;
  onNavigateMap?: () => void;
  onNavigateProfile?: () => void;
}

export function ScreenTrendingIssues({
  onBack,
  onSelectIssue,
  onNavigateHome,
}: ScreenTrendingIssuesProps) {
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const trendingList = [
    {
      rank: 1,
      id: "CHI-2026-000001",
      title: "Road damage",
      category: "Roads",
      categoryKey: "roads",
      location: "Bole Road near Edna Mall",
      reportsCount: 14,
      trendDelta: "+5 today",
      deltaDirection: "up",
      color: "bg-red-500",
      icon: AlertTriangle,
      iconBg: "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400",
      description: "Severe pothole causing rim damage and vehicle swerving on main lane.",
    },
    {
      rank: 2,
      id: "CHI-2026-000012",
      title: "Water pipe leakage",
      category: "Utilities",
      categoryKey: "utilities",
      location: "Africa Ave, Kirkos",
      reportsCount: 12,
      trendDelta: "+4 today",
      deltaDirection: "up",
      color: "bg-blue-500",
      icon: Droplet,
      iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
      description: "High pressure burst pipe flooding road near intersection.",
    },
    {
      rank: 3,
      id: "CHI-2026-000004",
      title: "Garbage overflow",
      category: "Sanitation",
      categoryKey: "sanitation",
      location: "Olympia Roundabout",
      reportsCount: 8,
      trendDelta: "+2 today",
      deltaDirection: "up",
      color: "bg-amber-500",
      icon: Trash2,
      iconBg: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
      description: "Municipal dumpsters overflowing onto pedestrian sidewalk.",
    },
    {
      rank: 4,
      id: "CHI-2026-000018",
      title: "Transformer fault / Outage",
      category: "Electricity",
      categoryKey: "utilities",
      location: "Gerji near Unity University",
      reportsCount: 7,
      trendDelta: "+3 today",
      deltaDirection: "up",
      color: "bg-yellow-500",
      icon: Zap,
      iconBg: "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/50 dark:text-yellow-400",
      description: "Local sub-transformer sparking during heavy rain, power cut.",
    },
    {
      rank: 5,
      id: "CHI-2026-000015",
      title: "Open manhole hazard",
      category: "Safety",
      categoryKey: "safety",
      location: "Meskel Square Walkway",
      reportsCount: 6,
      trendDelta: "+1 today",
      deltaDirection: "up",
      color: "bg-purple-500",
      icon: ShieldAlert,
      iconBg: "bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400",
      description: "Missing iron cover on walking path, deep fall hazard at night.",
    },
    {
      rank: 6,
      id: "CHI-2026-000021",
      title: "Streetlight outage cluster",
      category: "Electricity",
      categoryKey: "utilities",
      location: "CMC Michael Junction",
      reportsCount: 5,
      trendDelta: "+2 today",
      deltaDirection: "up",
      color: "bg-yellow-500",
      icon: Zap,
      iconBg: "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/50 dark:text-yellow-400",
      description: "Continuous stretch of 8 streetlights dark for 4 consecutive nights.",
    },
  ];

  const filteredList = trendingList.filter((item) => {
    const matchesCategory =
      filterCategory === "all" || item.categoryKey === filterCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const topThree = trendingList.slice(0, 3);

  return (
    <div className="w-full space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack || onNavigateHome}
              className="w-10 h-10 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex-shrink-0"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Flame className="w-6 h-6 text-orange-500 fill-orange-500" />
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                  Trending Community Issues
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 text-xs font-bold">
                  Live Heatmap
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Hyperlocal issues receiving the highest cluster spikes and multi-citizen confirmations this week
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search trending issues..."
              className="w-full pl-9 pr-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="pt-4 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 flex-shrink-0 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </span>
          {[
            { id: "all", label: "All Categories" },
            { id: "roads", label: "Roads & Infrastructure" },
            { id: "utilities", label: "Utilities & Leaks" },
            { id: "sanitation", label: "Sanitation & Waste" },
            { id: "safety", label: "Safety Hazards" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                filterCategory === cat.id
                  ? "bg-[#0e3e2c] text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Podium: Top 3 Hotspots (Desktop 3 Columns, Mobile 1 Column) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>Top Incident Hotspots (Priority Dispatch)</span>
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            Updated live from cluster queue
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topThree.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => onSelectIssue?.(item.id)}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border-2 border-slate-200/80 dark:border-slate-800 hover:border-emerald-600 dark:hover:border-emerald-500 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Accent top gradient stripe */}
                <div
                  className={`absolute top-0 inset-x-0 h-1.5 ${
                    item.rank === 1
                      ? "bg-amber-500"
                      : item.rank === 2
                      ? "bg-blue-500"
                      : "bg-amber-600"
                  }`}
                />

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black text-white shadow-sm ${
                          item.rank === 1
                            ? "bg-amber-500"
                            : item.rank === 2
                            ? "bg-slate-500"
                            : "bg-amber-700"
                        }`}
                      >
                        #{item.rank}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold">
                        {item.category}
                      </span>
                    </div>

                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>{item.trendDelta}</span>
                    </span>
                  </div>

                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${item.iconBg}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{item.location}</span>
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2 mb-3">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{item.reportsCount} citizen reports</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    <span>Inspect</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full Leaderboard Grid: Responsive 2-Columns on Tablet/Desktop */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
              All Ranked Incident Trends
            </h3>
            <p className="text-xs text-slate-500">
              Showing {filteredList.length} hotspots ordered by report velocity
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredList.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => onSelectIssue?.(item.id)}
                className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 hover:border-emerald-600 dark:hover:border-emerald-500 hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-3.5 group shadow-sm"
              >
                {/* Rank Badge */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${
                    item.rank === 1
                      ? "bg-amber-500 text-white shadow-sm"
                      : item.rank === 2
                      ? "bg-slate-500 text-white"
                      : item.rank === 3
                      ? "bg-amber-700 text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  #{item.rank}
                </div>

                {/* Category Icon */}
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${item.iconBg}`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition truncate">
                      {item.title}
                    </h4>
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-0.5 flex-shrink-0">
                      <TrendingUp className="w-3 h-3" />
                      <span>{item.trendDelta}</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    <span>{item.location}</span>
                  </p>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-[10px] font-semibold border border-slate-200 dark:border-slate-800">
                      {item.category}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{item.reportsCount} reports</span>
                    </span>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition flex-shrink-0" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

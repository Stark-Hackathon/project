"use client";

import React, { useState } from "react";
import {
  Search,
  Filter,
  MapPin,
  AlertTriangle,
  Trash2,
  Lightbulb,
  Droplet,
  ShieldAlert,
  Users,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";

interface ScreenNearbyIssuesProps {
  onBack?: () => void;
  onSelectIssue?: (issueId: string) => void;
}

export function ScreenNearbyIssues({
  onBack,
  onSelectIssue,
}: ScreenNearbyIssuesProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = [
    { id: "all", label: "All Categories" },
    { id: "roads", label: "Roads & Potholes" },
    { id: "garbage", label: "Garbage & Waste" },
    { id: "lighting", label: "Street Lighting" },
    { id: "water", label: "Clean Water Leaks" },
    { id: "other", label: "Public Hazards" },
  ];

  const issues = [
    {
      id: "CHI-2026-000001",
      title: "Road damage",
      category: "Roads",
      categoryKey: "roads",
      location: "Near Bole Road, Addis Ababa",
      distance: "300m away",
      reportsCount: 14,
      timeAgo: "2 hours ago",
      color: "bg-red-500",
      icon: AlertTriangle,
      iconBg: "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400",
    },
    {
      id: "CHI-2026-000004",
      title: "Garbage overflow",
      category: "Garbage",
      categoryKey: "garbage",
      location: "Olympia roundabout, Bole",
      distance: "650m away",
      reportsCount: 8,
      timeAgo: "4 hours ago",
      color: "bg-amber-500",
      icon: Trash2,
      iconBg: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
    },
    {
      id: "CHI-2026-000007",
      title: "Broken streetlight",
      category: "Lighting",
      categoryKey: "lighting",
      location: "Cameroon St near Medhanialem",
      distance: "1.2 km away",
      reportsCount: 5,
      timeAgo: "1 day ago",
      color: "bg-yellow-500",
      icon: Lightbulb,
      iconBg: "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/50 dark:text-yellow-400",
    },
    {
      id: "CHI-2026-000012",
      title: "Water pipe leakage",
      category: "Water",
      categoryKey: "water",
      location: "Africa Avenue opposite Edna Mall",
      distance: "1.8 km away",
      reportsCount: 19,
      timeAgo: "2 days ago",
      color: "bg-blue-500",
      icon: Droplet,
      iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
    },
    {
      id: "CHI-2026-000015",
      title: "Open manhole hazard",
      category: "Other",
      categoryKey: "other",
      location: "Meskel Square pedestrian walkway",
      distance: "2.4 km away",
      reportsCount: 11,
      timeAgo: "3 days ago",
      color: "bg-purple-500",
      icon: ShieldAlert,
      iconBg: "bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400",
    },
  ];

  const filteredIssues = issues.filter((issue) => {
    const matchesCategory =
      activeCategory === "all" || issue.categoryKey === activeCategory;
    const matchesSearch =
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full space-y-6">
      {/* Top Header & Filter Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="w-10 h-10 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                Nearby Community Issues
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Incidents detected and reported by citizens in your current vicinity
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
              Radius: Within 5 km
            </span>
          </div>
        </div>

        {/* Search Bar & Filter Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by keyword, street name, or infrastructure type..."
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
          <button
            type="button"
            className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition"
          >
            <Filter className="w-4 h-4 text-slate-500" />
            <span>More Filters</span>
          </button>
        </div>

        {/* Category Filter Pills (Horizontal scroll) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                activeCategory === cat.id
                  ? "bg-[#0e3e2c] text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Responsive Grid of Cards (3 cols on desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredIssues.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-500">No issues found matching criteria</p>
          </div>
        ) : (
          filteredIssues.map((issue) => {
            const Icon = issue.icon;
            return (
              <div
                key={issue.id}
                onClick={() => onSelectIssue?.(issue.id)}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-emerald-600 transition cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center ${issue.iconBg}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                      {issue.timeAgo}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-1 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                    {issue.title}
                  </h3>

                  <p className="text-xs text-slate-500 truncate mb-4 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{issue.location}</span>
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold">
                      {issue.distance}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-extrabold flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{issue.reportsCount}</span>
                    </span>
                  </div>

                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <span>Inspect</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

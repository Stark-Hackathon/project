"use client";

import React, { useState } from "react";
import {
  MapPin,
  Search,
  Plus,
  Minus,
  Flame,
  AlertTriangle,
  Trash2,
  Lightbulb,
  Droplet,
  ShieldAlert,
  Users,
  ChevronRight,
  TrendingUp,
  Mic,
} from "lucide-react";

interface ScreenHomeMapProps {
  onSelectIssue?: (issueId: string) => void;
  onOpenReport?: () => void;
  onOpenTrending?: () => void;
  onOpenProfile?: () => void;
  onOpenNearby?: () => void;
}

export function ScreenHomeMap({
  onSelectIssue,
  onOpenReport,
  onOpenTrending,
  onOpenNearby,
}: ScreenHomeMapProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = [
    { id: "all", label: "All Categories" },
    { id: "roads", label: "Roads & Potholes" },
    { id: "water", label: "Water & Leaks" },
    { id: "waste", label: "Garbage & Waste" },
    { id: "electricity", label: "Power & Lighting" },
  ];

  const trendingIssues = [
    {
      id: "CHI-2026-000001",
      title: "Road damage",
      category: "Roads",
      location: "Near Bole Road, Addis Ababa",
      reportsCount: 14,
      trendVelocity: "+5 today",
      color: "bg-red-500",
      textColor: "text-red-700 dark:text-red-300",
      bgColor: "bg-red-50 dark:bg-red-950/40",
      icon: AlertTriangle,
    },
    {
      id: "CHI-2026-000012",
      title: "Water pipe leakage",
      category: "Water",
      location: "Africa Ave opposite Edna Mall",
      reportsCount: 12,
      trendVelocity: "+4 today",
      color: "bg-blue-500",
      textColor: "text-blue-700 dark:text-blue-300",
      bgColor: "bg-blue-50 dark:bg-blue-950/40",
      icon: Droplet,
    },
    {
      id: "CHI-2026-000004",
      title: "Garbage overflow",
      category: "Waste",
      location: "Olympia Roundabout, Bole",
      reportsCount: 8,
      trendVelocity: "+2 today",
      color: "bg-amber-500",
      textColor: "text-amber-700 dark:text-amber-300",
      bgColor: "bg-amber-50 dark:bg-amber-950/40",
      icon: Trash2,
    },
    {
      id: "CHI-2026-000007",
      title: "Broken streetlight",
      category: "Lighting",
      location: "Cameroon St near Medhanialem",
      reportsCount: 5,
      trendVelocity: "+1 today",
      color: "bg-yellow-500",
      textColor: "text-yellow-700 dark:text-yellow-300",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/40",
      icon: Lightbulb,
    },
    {
      id: "CHI-2026-000015",
      title: "Open manhole hazard",
      category: "Safety",
      location: "Meskel Square walkway",
      reportsCount: 11,
      trendVelocity: "+3 today",
      color: "bg-purple-500",
      textColor: "text-purple-700 dark:text-purple-300",
      bgColor: "bg-purple-50 dark:bg-purple-950/40",
      icon: ShieldAlert,
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              Hyperlocal Civic Map
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
              Addis Ababa
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time incident clustering, trending hotspots, and Vixovide voice reporting
          </p>
        </div>

        {/* Search Bar & Voice CTA */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by street or keyword..."
              className="w-full pl-9 pr-4 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <button
            type="button"
            onClick={onOpenReport}
            className="px-4 py-2.5 rounded-2xl bg-[#0e3e2c] hover:bg-[#15533c] text-white text-xs font-extrabold shadow-md transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Mic className="w-4 h-4 text-emerald-400" />
            <span>Report Issue (Voice)</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Responsive 12-Column Dashboard on Desktop, Vertical Reflow on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Trending Issues Feed & Nearby list (5 cols on desktop) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  activeCategory === cat.id
                    ? "bg-[#0e3e2c] text-white shadow-sm"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Trending Hotspots Section */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Trending Hotspots
                </h3>
              </div>
              <button
                type="button"
                onClick={onOpenTrending}
                className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                View all →
              </button>
            </div>

            <div className="space-y-3">
              {trendingIssues.slice(0, 4).map((issue, idx) => {
                const Icon = issue.icon;
                return (
                  <div
                    key={issue.id}
                    onClick={() => onSelectIssue?.(issue.id)}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 hover:border-emerald-600 transition cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${issue.bgColor}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {issue.title}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span>{issue.location}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">
                          {issue.reportsCount} reports
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center justify-end gap-0.5">
                          <TrendingUp className="w-3 h-3" />
                          <span>{issue.trendVelocity}</span>
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Nearby Callout */}
          <div className="p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#0e3e2c] text-white flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-emerald-950 dark:text-emerald-200">
                  5 nearby reports within 5 km
                </p>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                  Road damage, garbage overflow, and water leaks
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenNearby}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 text-xs font-bold text-emerald-900 dark:text-emerald-300 shadow-sm hover:bg-emerald-100 transition"
            >
              Inspect
            </button>
          </div>
        </div>

        {/* Right Side: Large Interactive Addis Ababa Vector Map (7 cols on desktop) */}
        <div className="lg:col-span-7">
          <div className="relative w-full h-[540px] sm:h-[620px] rounded-3xl bg-[#eef3ee] dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md overflow-hidden flex items-center justify-center">
            {/* Stylized Street Grid Background */}
            <svg
              className="absolute inset-0 w-full h-full object-cover opacity-80 transition-transform duration-300"
              style={{ transform: `scale(${zoomLevel})` }}
              viewBox="0 0 400 450"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Main Ring Roads & Arterials */}
              <path d="M-20 80 Q140 100 220 70 T420 90" stroke="#d5e2d6" strokeWidth="12" />
              <path d="M40 -20 Q70 180 50 470" stroke="#d5e2d6" strokeWidth="10" />
              <path d="M360 -20 Q320 200 350 470" stroke="#d5e2d6" strokeWidth="10" />
              <path d="M-20 280 C120 260 260 300 420 270" stroke="#d5e2d6" strokeWidth="14" />
              <path d="M200 -20 L200 470" stroke="#ffffff" strokeWidth="6" />
              <path d="M-20 200 L420 200" stroke="#ffffff" strokeWidth="6" />

              {/* Secondary streets */}
              <line x1="80" y1="0" x2="80" y2="450" stroke="#e2ece2" strokeWidth="3" />
              <line x1="140" y1="0" x2="140" y2="450" stroke="#e2ece2" strokeWidth="3" />
              <line x1="260" y1="0" x2="260" y2="450" stroke="#e2ece2" strokeWidth="3" />
              <line x1="320" y1="0" x2="320" y2="450" stroke="#e2ece2" strokeWidth="3" />
              <line x1="0" y1="120" x2="400" y2="120" stroke="#e2ece2" strokeWidth="3" />
              <line x1="0" y1="340" x2="400" y2="340" stroke="#e2ece2" strokeWidth="3" />

              {/* Green Parks */}
              <rect x="150" y="90" width="40" height="40" rx="8" fill="#cbe2ce" opacity="0.7" />
              <rect x="220" y="270" width="60" height="40" rx="8" fill="#cbe2ce" opacity="0.7" />
            </svg>

            {/* City Label */}
            <div className="absolute top-6 left-6 font-extrabold text-slate-700 dark:text-slate-300 text-sm tracking-wider uppercase pointer-events-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200/60 dark:border-slate-800">
              Addis Ababa Cluster Map
            </div>

            {/* Sub-city text markers */}
            <span className="absolute left-10 top-36 text-xs font-bold text-slate-400">Merkato</span>
            <span className="absolute right-16 top-48 text-xs font-bold text-slate-400">Bole</span>
            <span className="absolute left-36 bottom-36 text-xs font-bold text-slate-400">Kazanchis</span>
            <span className="absolute right-32 bottom-24 text-xs font-bold text-slate-400">Gerji</span>

            {/* Interactive Cluster Bubbles matching design */}
            {/* Cluster 1: Red 12 (Critical hotspot) */}
            <button
              type="button"
              onClick={() => setSelectedCluster("12")}
              className="absolute top-28 right-36 transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
            >
              <span className="relative flex items-center justify-center w-10 h-10 rounded-full bg-red-500 text-white font-black text-xs shadow-xl shadow-red-500/40 ring-4 ring-red-200/80 dark:ring-red-950 group-hover:scale-110 transition-transform">
                12
              </span>
            </button>

            {/* Cluster 2: Orange 3 */}
            <button
              type="button"
              onClick={() => setSelectedCluster("3")}
              className="absolute top-44 right-20 transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
            >
              <span className="relative flex items-center justify-center w-9 h-9 rounded-full bg-amber-500 text-white font-black text-xs shadow-md shadow-amber-500/40 ring-4 ring-amber-200/80 group-hover:scale-110 transition-transform">
                3
              </span>
            </button>

            {/* Cluster 3: Green 7 */}
            <button
              type="button"
              onClick={() => setSelectedCluster("7")}
              className="absolute top-64 right-32 transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
            >
              <span className="relative flex items-center justify-center w-9 h-9 rounded-full bg-emerald-600 text-white font-black text-xs shadow-md shadow-emerald-600/40 ring-4 ring-emerald-200/80 group-hover:scale-110 transition-transform">
                7
              </span>
            </button>

            {/* Cluster 4: Blue 5 */}
            <button
              type="button"
              onClick={() => setSelectedCluster("5")}
              className="absolute bottom-40 left-32 transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
            >
              <span className="relative flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white font-bold text-xs shadow-md ring-4 ring-blue-200/80 group-hover:scale-110 transition-transform">
                5
              </span>
            </button>

            {/* Map Zoom Controls */}
            <div className="absolute right-6 top-6 flex flex-col gap-1.5 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200/80 dark:border-slate-700 p-1.5">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.3))}
                className="w-8 h-8 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-sm font-bold"
                aria-label="Zoom in"
              >
                <Plus className="w-4 h-4" />
              </button>
              <div className="h-px bg-slate-200 dark:bg-slate-700 mx-1" />
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.3))}
                className="w-8 h-8 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-sm font-bold"
                aria-label="Zoom out"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>

            {/* Selected Cluster Tooltip Popover */}
            {selectedCluster && (
              <div className="absolute bottom-6 inset-x-6 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
                <div>
                  <span className="text-xs font-extrabold text-emerald-900 dark:text-emerald-300 block">
                    Active Hotspot Cluster: {selectedCluster} Reports
                  </span>
                  <span className="text-xs text-slate-500">
                    Bole Road &amp; Cameroon Street Corridor (Potholes &amp; Road damage)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectIssue?.("CHI-2026-000001")}
                    className="px-4 py-2 rounded-xl bg-[#0e3e2c] text-white text-xs font-bold hover:bg-[#15533c] transition shadow cursor-pointer"
                  >
                    View Report Details
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCluster(null)}
                    className="p-1.5 text-xs text-slate-400 hover:text-slate-700"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

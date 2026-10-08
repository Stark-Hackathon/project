"use client";

import React from "react";
import {
  Shield,
  TrendingUp,
  Users,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Clock,
  Building2,
  Mic,
  Map,
} from "lucide-react";

interface ScreenImpactProps {
  onBack?: () => void;
  onStartReporting?: () => void;
  onExploreMap?: () => void;
}

export function ScreenImpact({
  onBack,
  onStartReporting,
  onExploreMap,
}: ScreenImpactProps) {
  const impactCards = [
    {
      icon: Shield,
      title: "Report anonymously",
      description: "Your identity stays protected at all times without exposure.",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      border: "border-emerald-200/80 dark:border-emerald-800/60",
      iconColor: "text-emerald-700 dark:text-emerald-300",
    },
    {
      icon: TrendingUp,
      title: "See trending issues",
      description: "Discover what matters most in your neighborhood in real-time.",
      bg: "bg-orange-50 dark:bg-orange-950/40",
      border: "border-orange-200/80 dark:border-orange-800/60",
      iconColor: "text-orange-600 dark:text-orange-300",
    },
    {
      icon: Users,
      title: "Help your community",
      description: "Support and confirm reports submitted by other fellow citizens.",
      bg: "bg-blue-50 dark:bg-blue-950/40",
      border: "border-blue-200/80 dark:border-blue-800/60",
      iconColor: "text-blue-600 dark:text-blue-300",
    },
    {
      icon: CheckCircle2,
      title: "Make a difference",
      description: "Direct dispatch to municipal and utility response teams.",
      bg: "bg-purple-50 dark:bg-purple-950/40",
      border: "border-purple-200/80 dark:border-purple-800/60",
      iconColor: "text-purple-600 dark:text-purple-300",
    },
  ];

  const civicMetrics = [
    { value: "1,420+", label: "Issues Reported", icon: Mic },
    { value: "89%", label: "Dispatch Response", icon: CheckCircle2 },
    { value: "3.2 Days", label: "Median Resolution", icon: Clock },
    { value: "10", label: "Sub-Cities Connected", icon: Building2 },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
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
              Our Community Mission & Impact
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Transforming citizen observations into real civic infrastructure solutions
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
          STARK 2026
        </span>
      </div>

      {/* Hero Banner with Civic Skyline Accent */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#f2f8f4] via-[#e8f3ec] to-[#d6ebd9] dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/40 border border-slate-200/80 dark:border-slate-800 p-8 sm:p-12 text-center shadow-sm">
        <div className="max-w-2xl mx-auto z-10 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700 text-white text-xs font-bold mb-4 shadow-sm">
            <Shield className="w-3.5 h-3.5" />
            <span>Civic Tech That Works for Everyone</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-[#0e3e2c] dark:text-white tracking-tight mb-4">
            Real Issues. Real Impact.
          </h2>

          <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed max-w-lg mx-auto">
            Together, we make our streets safer, cleaner, and better for everyone in Addis Ababa through transparent, AI-assisted civic reporting.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onStartReporting}
              className="px-6 py-3.5 rounded-2xl bg-[#0e3e2c] hover:bg-[#15533c] text-white font-extrabold text-sm shadow-xl shadow-emerald-950/20 transition flex items-center gap-2 cursor-pointer group"
            >
              <Mic className="w-4 h-4 text-emerald-400" />
              <span>Start Voice Reporting</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={onExploreMap}
              className="px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-extrabold text-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Map className="w-4 h-4 text-emerald-600" />
              <span>Explore Community Map</span>
            </button>
          </div>
        </div>

        {/* Skyline Art Banner in Background */}
        <div className="mt-8 relative w-full h-32 flex flex-col justify-end pointer-events-none opacity-85">
          <svg
            className="w-full h-full object-cover"
            viewBox="0 0 600 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <path
              d="M0 80 C120 50, 240 70, 360 45 C480 30, 540 65, 600 50 L600 120 L0 120 Z"
              fill="#9bc5a4"
              opacity="0.5"
            />
            <rect x="60" y="40" width="28" height="50" rx="2" fill="#cbd5e1" opacity="0.9" />
            <rect x="110" y="25" width="34" height="65" rx="2" fill="#94a3b8" opacity="0.9" />
            <rect x="180" y="50" width="40" height="40" rx="2" fill="#cbd5e1" opacity="0.9" />
            <rect x="340" y="30" width="36" height="60" rx="2" fill="#94a3b8" opacity="0.9" />
            <rect x="420" y="55" width="45" height="35" rx="2" fill="#cbd5e1" opacity="0.9" />
            <rect x="500" y="20" width="32" height="70" rx="2" fill="#64748b" opacity="0.9" />
            <path
              d="M0 120 C90 90, 210 105, 330 95 C450 85, 520 100, 600 90 L600 120 Z"
              fill="#1b4332"
            />
          </svg>
        </div>
      </div>

      {/* 4 Pillars Matrix (Desktop 4 Columns, Tablet 2 Columns, Mobile 1 Column) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {impactCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`p-6 rounded-3xl ${card.bg} border ${card.border} shadow-sm flex flex-col justify-between`}
            >
              <div
                className={`w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center ${card.iconColor} shadow-sm mb-4`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-1.5">
                  {card.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {card.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Civic Performance Metrics Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-4 text-center">
          Real Impact Numbers Across Addis Ababa
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {civicMetrics.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center flex flex-col items-center"
              >
                <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-2" />
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  {metric.value}
                </span>
                <span className="text-xs font-semibold text-slate-500 mt-1">
                  {metric.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import {
  Activity,
  CheckCircle2,
  Clock,
  Shield,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

export function CityPulseTicker() {
  const { isAmharic, t } = useLanguage();

  const stats = [
    {
      label: t.stats.resolvedTitle,
      value: "1,420+",
      change: t.stats.resolvedDelta,
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: t.stats.accuracyTitle,
      value: "98.4%",
      change: t.stats.accuracyDelta,
      icon: Activity,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      label: t.stats.responseTitle,
      value: "< 3.2 hrs",
      change: t.stats.responseDelta,
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
    },
    {
      label: t.stats.privacyTitle,
      value: "100%",
      change: t.stats.privacyDelta,
      icon: Shield,
      color: "text-purple-600 dark:text-purple-400",
    },
  ];

  const subCities = [
    { name: isAmharic ? "ቦሌ" : "Bole", count: `312 ${t.stats.reportsUnit}`, active: true },
    { name: isAmharic ? "ቂርቆስ" : "Kirkos", count: `245 ${t.stats.reportsUnit}`, active: true },
    { name: isAmharic ? "አራዳ" : "Arada", count: `189 ${t.stats.reportsUnit}`, active: true },
    { name: isAmharic ? "የካ" : "Yeka", count: `210 ${t.stats.reportsUnit}`, active: true },
    { name: isAmharic ? "ልደታ" : "Lideta", count: `128 ${t.stats.reportsUnit}`, active: true },
    { name: isAmharic ? "ንፋስ ስልክ" : "Nifas Silk", count: `176 ${t.stats.reportsUnit}`, active: true },
    { name: isAmharic ? "ኮልፌ" : "Kolfe", count: `98 ${t.stats.reportsUnit}`, active: true },
    { name: isAmharic ? "ጉለሌ" : "Gullele", count: `114 ${t.stats.reportsUnit}`, active: true },
  ];

  return (
    <div className="w-full space-y-4">
      {/* 4 Core Vital Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-emerald-600/40 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {stat.label}
                </span>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                {stat.value}
              </div>
              <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>{stat.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sub-City Active Strip */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap pl-1 pr-2 flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-emerald-600" />
          <span>{t.stats.activeSubCities}</span>
        </span>
        {subCities.map((sub, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap font-medium"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <strong className="font-semibold">{sub.name}</strong>
            <span className="text-slate-400 text-[11px]">({sub.count})</span>
          </span>
        ))}
      </div>
    </div>
  );
}

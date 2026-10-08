"use client";

import React from "react";
import Link from "next/link";
import { Mic, MapPin } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

export function MapHeader() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-2">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          <span>{t.mapPage.badge}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950 dark:text-white">
          {t.mapPage.title}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
          {t.mapPage.subtitle}
        </p>
      </div>

      <Link
        href="/report"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0f3d2e] hover:bg-[#134e3a] text-white font-extrabold text-xs shadow-md transition-all hover:scale-[1.02] cursor-pointer"
      >
        <Mic className="w-3.5 h-3.5 text-emerald-400" />
        <span>{t.mapPage.reportAtLocation}</span>
      </Link>
    </div>
  );
}

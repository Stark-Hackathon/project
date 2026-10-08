"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Droplet,
  MapPin,
  Clock,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

export function BeforeAfterResolution() {
  const { isAmharic, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"before" | "after">("after");

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-10 shadow-xl overflow-hidden relative">
      {/* Top Header Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.impact.caseBadge}</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight">
            {t.impact.caseTitle}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t.impact.caseRef} <strong className="font-mono text-emerald-700 dark:text-emerald-400">CHI-2026-003914</strong> • {t.impact.caseLocation}
          </p>
        </div>

        {/* Before / After Switcher Pill */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab("before")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "before"
                ? "bg-amber-500 text-white shadow-md font-black"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{t.impact.initialHazard}</span>
          </button>
          <button
            onClick={() => setActiveTab("after")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "after"
                ? "bg-[#0f3d2e] text-white shadow-md shadow-emerald-950/20 font-black"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.impact.verifiedFix}</span>
          </button>
        </div>
      </div>

      {/* Main Comparative Presentation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-8">
        {/* Left 7 cols: Visual Card Simulation */}
        <div className="lg:col-span-7 relative">
          {activeTab === "before" ? (
            <div className="p-6 sm:p-8 rounded-3xl bg-amber-50/60 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-800/60 space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-bold text-xs flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{isAmharic ? "የቀረበ አደጋ" : "REPORTED HAZARD"}</span>
                </span>
                <span className="text-xs font-mono text-amber-800 dark:text-amber-400 font-semibold">
                  {isAmharic ? "የተመዘገበው በ07:42 ጠዋት" : "Logged at 07:42 AM"}
                </span>
              </div>

              {/* Problem Graphic Simulation */}
              <div className="relative h-48 sm:h-56 rounded-2xl bg-amber-950/10 dark:bg-slate-950 border border-amber-200 dark:border-amber-900/40 p-4 flex flex-col justify-between overflow-hidden">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
                    <Droplet className="w-4 h-4 text-blue-500" />
                    <span>{isAmharic ? "የፈነዳ የውሃ ቧንቧ እና ጥልቅ የመንገድ ጉድጓድ" : "Clean Water Rupture & Deep Asphalt Cavity"}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    &ldquo;{isAmharic ? "ኤድና ሞል ፊት ለፊት ጎዳናውን በውሃ አጥለቅልቆታል፣ ሁለት መኪኖች ጎማ ተበላሽተዋል።" : "Water gushing onto the avenue opposite Edna Mall, two vehicles already damaged tires."}&rdquo;
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-amber-600" />
                    <span>{isAmharic ? "ቦሌ ክፍለ ከተማ • አፍሪካ ጎዳና" : "Bole Sub-City • Africa Ave"}</span>
                  </span>
                  <span className="font-bold text-amber-700 dark:text-amber-400">
                    {isAmharic ? "19 የዜጎች ማረጋገጫዎች" : "19 Citizen Confirmations"}
                  </span>
                </div>
              </div>

              <p className="text-xs text-amber-900 dark:text-amber-300 leading-relaxed font-medium">
                {isAmharic
                  ? "በአማርኛ ድምፅ በ12 ሰከንዶች ውስጥ ቀረበ። የአደጋው ስጋት ከፍ ያለ በመሆኑ በቅድሚያ ተመደበ።"
                  : "Reported by voice in Amharic in under 12 seconds. Priority algorithm elevated status to Urgent due to vehicle hazard."}
              </p>
            </div>
          ) : (
            <div className="p-6 sm:p-8 rounded-3xl bg-emerald-50/60 dark:bg-emerald-950/20 border-2 border-emerald-400 dark:border-emerald-800/80 space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center gap-1.5 shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isAmharic ? "በማዘጋጃ ቤት ተፈቷል" : "MUNICIPALLY RESOLVED"}</span>
                </span>
                <span className="text-xs font-mono text-emerald-800 dark:text-emerald-400 font-bold">
                  {isAmharic ? "በ4.2 ሰዓታት ውስጥ ተጠናቋል" : "Completed in 4.2 Hours"}
                </span>
              </div>

              {/* Resolved Graphic Simulation */}
              <div className="relative h-48 sm:h-56 rounded-2xl bg-emerald-950/10 dark:bg-slate-950 border border-emerald-200 dark:border-emerald-900/40 p-4 flex flex-col justify-between overflow-hidden">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{isAmharic ? "ቧንቧው ተቀይሮ መንገዱ በአስፋልት ተጠግኗል" : "Pipe Replaced & Roadway Asphalt Resealed"}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {isAmharic
                      ? "የአዲስ አበባ ውሃ እና ፍሳሽ የድንገተኛ ጥገና ቡድን በ09:15 ጠዋት ደርሶ ቧንቧውን ቀይሮ መንገዱን ጠግኖታል።"
                      : "AAWSA emergency repair crew arrived at 09:15 AM. Pipe welded, asphalt tamped, water pressure restored."}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isAmharic ? "መፍትሔው የተረጋገጠው በ12:00 ቀትር" : "Verified Resolved at 12:00 PM"}</span>
                  </span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                    Ref: CHI-2026-003914
                  </span>
                </div>
              </div>

              <p className="text-xs text-emerald-900 dark:text-emerald-300 leading-relaxed font-medium">
                {isAmharic
                  ? "በማዘጋጃ ቤቱ የመስክ ተቆጣጣሪ ተረጋግጧል። የትራፊክ ፍሰት ያለ ምንም እክል ቀጥሏል።"
                  : "Inspected and verified by municipal field team. Public feedback confirmed traffic flow restored with 0 further complaints."}
              </p>
            </div>
          )}
        </div>

        {/* Right 5 cols: Timeline & Performance Metrics */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-3">
            <h4 className="text-lg font-black text-slate-900 dark:text-white">
              {isAmharic ? "ግልጽነት ለምን ፈጣን መፍትሔ ያመጣል?" : "Why visibility delivers fast repairs"}
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {isAmharic
                ? "ችግሮች ተነጣጥለው ሲቀሩ መፍትሔ ለማግኘት ሳምንታት ይወስዳሉ። በርካታ ነዋሪዎች አንድ አይነት ቦታ ላይ ያለውን ችግር በጋራ ሲያመለክቱ ማዘጋጃ ቤቱ ወዲያውኑ እርምጃ ይወስዳል።"
                : "When issues are isolated, they take weeks to get scheduled. When multiple residents confirm the same geo-located report on Chigr Ale, municipal agencies have the data they need to act immediately."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 font-medium block">{t.impact.responseSpeed}</span>
              <span className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
                4.2 hrs
              </span>
              <span className="text-[11px] text-slate-500 block">{t.impact.fromReportToFix}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 font-medium block">{t.impact.citizenValidations}</span>
              <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                19 {isAmharic ? "ድምጾች" : "votes"}
              </span>
              <span className="text-[11px] text-slate-500 block">{t.impact.nearbyResidents}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 font-medium block">{t.impact.responsibleBody}</span>
              <span className="text-sm font-extrabold text-slate-900 dark:text-white block truncate">
                {isAmharic ? "የውሃ እና ፍሳሽ (AAWSA)" : "AAWSA Addis"}
              </span>
              <span className="text-[11px] text-slate-500 block">{t.impact.directRouting}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 font-medium block">{t.impact.auditTrail}</span>
              <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 block">
                100% {isAmharic ? "ይፋዊ" : "Public"}
              </span>
              <span className="text-[11px] text-slate-500 block">{t.impact.immutableRecord}</span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-600"
            >
              <span>{t.impact.exploreResolved}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

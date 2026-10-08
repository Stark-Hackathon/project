"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Mic,
  MapPin,
  ArrowRight,
  Shield,
  CheckCircle2,
  Droplet,
  Zap,
  AlertTriangle,
  Trash2,
  Wifi,
  Car,
  TrendingUp,
  Users,
  Eye,
  Sparkles,
  Play,
} from "lucide-react";
import { LiveVoiceRecorder } from "@/features/voice/components/live-voice-recorder";
import { LiveReportingDemo } from "@/features/demo/components/live-reporting-demo";
import { BeforeAfterResolution } from "@/features/impact/components/before-after-resolution";
import { VoiceSamplePlayer } from "@/features/voice/components/voice-sample-player";
import { CityPulseTicker } from "@/features/stats/components/city-pulse-ticker";
import { useLanguage } from "@/lib/i18n/language-context";

export default function HomePage() {
  const { t, isAmharic } = useLanguage();
  const [activeCategory, setActiveCategory] = useState("all");
  const [voiceSubmittedReport, setVoiceSubmittedReport] = useState<{
    title: string;
    description: string;
    category?: string;
  } | null>(null);

  const categories = useMemo(
    () => [
      { id: "water", name: t.categories.water, icon: Droplet, count: 28, color: "text-blue-500", bg: "bg-blue-50" },
      { id: "electricity", name: t.categories.electricity, icon: Zap, count: 21, color: "text-yellow-500", bg: "bg-yellow-50" },
      { id: "roads", name: t.categories.roads, icon: AlertTriangle, count: 35, color: "text-amber-500", bg: "bg-amber-50" },
      { id: "waste", name: t.categories.waste, icon: Trash2, count: 18, color: "text-emerald-500", bg: "bg-emerald-50" },
      { id: "traffic", name: t.categories.traffic, icon: Car, count: 12, color: "text-red-500", bg: "bg-red-50" },
      { id: "network", name: t.categories.network, icon: Wifi, count: 9, color: "text-purple-500", bg: "bg-purple-50" },
    ],
    [t]
  );

  const communityProblems = useMemo(
    () => [
      {
        id: "CHI-2026-000012",
        title: isAmharic
          ? "ኤድና ሞል ፊት ለፊት የተሰበረ የውሃ ቧንቧ መንገዱን አጥለቀለቀው"
          : "Clean water pipe rupture flooding roadway",
        category: "water",
        categoryName: t.categories.water,
        location: isAmharic
          ? "አፍሪካ ጎዳና፣ ኤድና ሞል ፊት ለፊት፣ ቦሌ"
          : "Africa Ave, opposite Edna Mall, Bole",
        reports: 19,
        trendDelta: isAmharic ? "+4 ዛሬ" : "+4 today",
        status: t.statuses.inProgress,
        statusColor: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
        timeAgo: isAmharic ? "ከ2 ሰዓት በፊት" : "2 hours ago",
        icon: Droplet,
        iconColor: "text-blue-600 bg-blue-50 dark:bg-blue-950/50",
      },
      {
        id: "CHI-2026-000001",
        title: isAmharic
          ? "የተሽከርካሪ ጎማ የሚያበላሽ ከባድ የአስፋልት ጉድጓድ"
          : "Severe asphalt crater damaging vehicle rims",
        category: "roads",
        categoryName: t.categories.roads,
        location: isAmharic
          ? "ቦሌ መድኃኔዓለም አደባባይ አጠገብ"
          : "Near Bole Medhanialem Roundabout",
        reports: 14,
        trendDelta: isAmharic ? "+5 ዛሬ" : "+5 today",
        status: t.statuses.verified,
        statusColor: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
        timeAgo: isAmharic ? "ከ4 ሰዓት በፊት" : "4 hours ago",
        icon: AlertTriangle,
        iconColor: "text-amber-600 bg-amber-50 dark:bg-amber-950/50",
      },
      {
        id: "CHI-2026-000004",
        title: isAmharic
          ? "የማዘጋጃ ቤት ቆሻሻ ገንዳ ሞልቶ የእግረኛ መንገድ ዘግቷል"
          : "Overflowing municipal dumpster blocking walkway",
        category: "waste",
        categoryName: t.categories.waste,
        location: isAmharic
          ? "ኦሎምፒያ አደባባይ፣ ቂርቆስ ክፍለ ከተማ"
          : "Olympia Roundabout, Kirkos Sub-City",
        reports: 8,
        trendDelta: isAmharic ? "+2 ዛሬ" : "+2 today",
        status: t.statuses.assigned,
        statusColor: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300",
        timeAgo: isAmharic ? "ከ6 ሰዓት በፊት" : "6 hours ago",
        icon: Trash2,
        iconColor: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50",
      },
      {
        id: "CHI-2026-000018",
        title: isAmharic
          ? "በዝናብ ወቅት የሚንቦገቦግ ትራንስፎርመር፣ ሰፈሩ ጨልሟል"
          : "Transformer sparking during rain, neighborhood dark",
        category: "electricity",
        categoryName: t.categories.electricity,
        location: isAmharic
          ? "ገርጂ፣ ዩኒቲ ዩኒቨርሲቲ አጠገብ"
          : "Gerji, near Unity University",
        reports: 7,
        trendDelta: isAmharic ? "+3 ዛሬ" : "+3 today",
        status: t.statuses.underReview,
        statusColor: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300",
        timeAgo: isAmharic ? "ከ1 ቀን በፊት" : "1 day ago",
        icon: Zap,
        iconColor: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/50",
      },
      {
        id: "CHI-2026-000022",
        title: isAmharic
          ? "የተበጠሰ የኢንተርኔት ኬብል በእግረኛ አንገት ከፍታ ተንጠልጥሏል"
          : "Downed optical internet cable hanging at head height",
        category: "network",
        categoryName: t.categories.network,
        location: isAmharic
          ? "ካዛንቺስ፣ ጊኒ ኮናክሪ ጎዳና"
          : "Kazanchis, Guinea Conakry St",
        reports: 6,
        trendDelta: isAmharic ? "+1 ዛሬ" : "+1 today",
        status: t.statuses.verified,
        statusColor: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
        timeAgo: isAmharic ? "ከ1 ቀን በፊት" : "1 day ago",
        icon: Wifi,
        iconColor: "text-purple-600 bg-purple-50 dark:bg-purple-950/50",
      },
      {
        id: "CHI-2026-000015",
        title: isAmharic
          ? "በተጨናነቀ መሻገሪያ ላይ የተበላሸ የእግረኛ ትራፊክ መብራት"
          : "Broken pedestrian traffic signal at crowded crossing",
        category: "traffic",
        categoryName: t.categories.traffic,
        location: isAmharic
          ? "መስቀል አደባባይ፣ የከተማው መሻገሪያ"
          : "Meskel Square, Sub-city crossing",
        reports: 5,
        trendDelta: isAmharic ? "+2 ዛሬ" : "+2 today",
        status: t.statuses.resolved,
        statusColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
        timeAgo: isAmharic ? "ከ3 ሰዓት በፊት ተፈታ" : "Fixed 3h ago",
        icon: Car,
        iconColor: "text-red-600 bg-red-50 dark:bg-red-950/50",
      },
    ],
    [t, isAmharic]
  );

  const filteredProblems =
    activeCategory === "all"
      ? communityProblems
      : communityProblems.filter((p) => p.category === activeCategory);

  return (
    <div className="w-full bg-white dark:bg-slate-950 selection:bg-emerald-500/20">
      {/* =========================================================================
          SECTION 1: HERO (Editorial, Storytelling, Visual Hierarchy)
         ========================================================================= */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-32 bg-gradient-to-b from-[#f4f8f5] via-[#fafcfb] to-white dark:from-slate-900/60 dark:via-slate-950 dark:to-slate-950 border-b border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column (7 cols): Editorial Typography & Direct CTAs */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{t.hero.liveBadge}</span>
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-950 dark:text-white leading-[1.08]">
                {t.hero.titleLine1} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0f3d2e] via-emerald-700 to-emerald-500 dark:from-emerald-400 dark:to-teal-300">
                  {t.hero.titleLine2}
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-normal">
                {t.hero.subtitle}
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  href="/report"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-[#0f3d2e] hover:bg-[#134e3a] text-white font-extrabold text-base shadow-xl shadow-emerald-950/20 hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <Mic className="w-5 h-5 text-emerald-400" />
                  <span>{t.hero.ctaReport}</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>

                <Link
                  href="/map"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-800 dark:text-slate-200 font-bold text-base border-2 border-slate-200 dark:border-slate-800 hover:border-emerald-600/60 dark:hover:border-emerald-500/60 transition-all shadow-sm cursor-pointer"
                >
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  <span>{t.hero.ctaMap}</span>
                </Link>

                <a
                  href="#demo"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-900 dark:text-emerald-300 font-bold text-base border border-emerald-300/80 dark:border-emerald-800 transition-all shadow-sm cursor-pointer"
                >
                  <Play className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                  <span>{t.hero.ctaDemo}</span>
                </a>
              </div>

              {/* Civic Trust Proof Points */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold">{t.hero.proofAnonymous}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold">{t.hero.proofVoice}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold">{t.hero.proofRouting}</span>
                </div>
              </div>
            </div>

            {/* Right Column (5 cols): Interactive Addis Ababa Community Canvas */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl p-6 overflow-hidden">
                {/* Decorative subtle map background graphic */}
                <div className="absolute inset-0 opacity-15 pointer-events-none">
                  <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                        <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="1" className="text-emerald-900 dark:text-emerald-400" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>

                {/* Floating Live Issue Notification Badge */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 relative z-10">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                      {t.hero.feedBadge}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 font-mono">
                    {t.hero.activeCount}
                  </span>
                </div>

                {/* Simulated Interactive Map Markers with Floating Cards */}
                <div className="py-6 space-y-4 relative z-10">
                  {/* Card 1: Water Pipe burst */}
                  <div className="p-4 rounded-2xl bg-[#f8faf8] dark:bg-slate-850 border border-emerald-900/10 dark:border-emerald-500/20 shadow-sm hover:border-emerald-600/50 transition flex items-start gap-3.5 group">
                    <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                      <Droplet className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {t.hero.cardWaterTitle}
                        </h4>
                        <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full flex-shrink-0">
                          {t.hero.trendBadge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{t.hero.cardWaterSub}</span>
                      </p>
                    </div>
                  </div>

                  {/* Card 2: Road Pothole */}
                  <div className="p-4 rounded-2xl bg-[#f8faf8] dark:bg-slate-850 border border-emerald-900/10 dark:border-emerald-500/20 shadow-sm hover:border-emerald-600/50 transition flex items-start gap-3.5 group">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {t.hero.cardRoadTitle}
                        </h4>
                        <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-full flex-shrink-0">
                          {t.hero.verifiedBadge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{t.hero.cardRoadSub}</span>
                      </p>
                    </div>
                  </div>

                  {/* Card 3: Municipal Fix Resolution */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <span className="font-bold text-emerald-950 dark:text-emerald-200 block">
                        {t.hero.cardResolvedTitle}
                      </span>
                      <span className="text-emerald-800 dark:text-emerald-400 text-[11px]">
                        {t.hero.cardResolvedSub}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Quick Action Strip */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between relative z-10">
                  <span className="text-xs font-semibold text-slate-500">
                    {isAmharic ? "የአዲስ አበባን ካርታ ያስሱ" : "Explore Addis Ababa clusters"}
                  </span>
                  <Link
                    href="/map"
                    className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-600 flex items-center gap-1"
                  >
                    <span>{t.hero.mapLink}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 1B: LIVE ADDIS ABABA PULSE TICKER
         ========================================================================= */}
      <section className="py-8 bg-slate-50/70 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <CityPulseTicker />
        </div>
      </section>

      {/* =========================================================================
          SECTION 1C: LIVE DEMO VIDEO OF REPORTING (Interactive Simulation & Video)
         ========================================================================= */}
      <section id="demo" className="py-20 sm:py-28 bg-gradient-to-b from-white via-[#fafcfb] to-white dark:from-slate-950 dark:via-slate-900/30 dark:to-slate-950 border-b border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.demo.badge}</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950 dark:text-white">
              {t.demo.title}
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              {t.demo.subtitle}
            </p>
          </div>

          {/* Interactive Live Demo Player with Simulation & Video Capabilities */}
          <LiveReportingDemo />
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: "WHAT IS CHIGR ALE?" (Visual Storytelling, Odoo Style)
         ========================================================================= */}
      <section className="py-20 sm:py-28 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              {t.story.badge}
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950 dark:text-white">
              {t.story.title}
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              {t.story.subtitle}
            </p>
          </div>

          {/* 6 Visual Storytelling Tiles */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Droplet,
                title: t.story.waterTitle,
                desc: t.story.waterDesc,
                color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-100",
              },
              {
                icon: Zap,
                title: t.story.powerTitle,
                desc: t.story.powerDesc,
                color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/40 border-yellow-100",
              },
              {
                icon: AlertTriangle,
                title: t.story.roadsTitle,
                desc: t.story.roadsDesc,
                color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-100",
              },
              {
                icon: Trash2,
                title: t.story.wasteTitle,
                desc: t.story.wasteDesc,
                color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100",
              },
              {
                icon: Car,
                title: t.story.trafficTitle,
                desc: t.story.trafficDesc,
                color: "text-red-600 bg-red-50 dark:bg-red-950/40 border-red-100",
              },
              {
                icon: Wifi,
                title: t.story.networkTitle,
                desc: t.story.networkDesc,
                color: "text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-100",
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-8 rounded-3xl bg-[#fafbf9] dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-600/60 dark:hover:border-emerald-500/60 transition-all hover:shadow-lg space-y-4 group"
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.color} shadow-sm group-hover:scale-105 transition-transform`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: HOW IT WORKS (4 Editorial Steps, No Generic Cards)
         ========================================================================= */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-[#f8faf8] dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              {t.howItWorks.badge}
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950 dark:text-white">
              {t.howItWorks.title}
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              {t.howItWorks.subtitle}
            </p>
          </div>

          {/* 4 Clean Steps Grid with Distinct Visual Numbering */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {[
              {
                number: t.howItWorks.step1Num,
                title: t.howItWorks.step1Title,
                summary: t.howItWorks.step1Summary,
                detail: t.howItWorks.step1Detail,
              },
              {
                number: t.howItWorks.step2Num,
                title: t.howItWorks.step2Title,
                summary: t.howItWorks.step2Summary,
                detail: t.howItWorks.step2Detail,
              },
              {
                number: t.howItWorks.step3Num,
                title: t.howItWorks.step3Title,
                summary: t.howItWorks.step3Summary,
                detail: t.howItWorks.step3Detail,
              },
              {
                number: t.howItWorks.step4Num,
                title: t.howItWorks.step4Title,
                summary: t.howItWorks.step4Summary,
                detail: t.howItWorks.step4Detail,
              },
            ].map((step, idx) => (
              <div
                key={idx}
                className="relative flex flex-col justify-between p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="text-4xl sm:text-5xl font-black text-emerald-700/20 dark:text-emerald-400/20 mb-4 font-mono">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 leading-snug">
                    {step.summary}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {step.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: VOICE REPORTING HERO FEATURE (Live Vixovide Integration)
         ========================================================================= */}
      <section className="py-20 sm:py-28 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column (5 cols): Editorial Voice Pitch */}
            <div className="lg:col-span-5 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                <Mic className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.voice.badge}</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950 dark:text-white leading-[1.12]">
                {t.voice.title}
              </h2>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                {t.voice.subtitle}
              </p>

              <div className="space-y-3 pt-2 text-left">
                <div className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>{t.voice.featAmharic}</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>{t.voice.featAudio}</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>{t.voice.featDraft}</span>
                </div>
              </div>
            </div>

            {/* Right Column (7 cols): Real LiveVoiceRecorder Embedded Component */}
            <div className="lg:col-span-7">
              <div className="rounded-3xl bg-[#fafbf9] dark:bg-slate-900 border-2 border-emerald-950/10 dark:border-emerald-500/20 p-6 sm:p-8 shadow-xl">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <Mic className="w-5 h-5 text-emerald-600" />
                      <span>{t.voice.studioTitle}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t.voice.studioSub}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                    {t.voice.studioReady}
                  </span>
                </div>

                {/* The Real, Working LiveVoiceRecorder (Untouched Logic) */}
                <LiveVoiceRecorder
                  autoAnalyze={true}
                  onRecordingComplete={(res) => {
                    setVoiceSubmittedReport({
                      title: res.suggestedTitle,
                      description: res.text,
                      category: res.suggestedCategory,
                    });
                  }}
                />

                {/* Successful Draft Feedback Card */}
                {voiceSubmittedReport && (
                  <div className="mt-6 p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm mb-1">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>{t.voice.draftReady}</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                      &ldquo;{voiceSubmittedReport.title}&rdquo; — {voiceSubmittedReport.description}
                    </p>
                    <div className="mt-3 flex gap-3">
                      <Link
                        href={`/report?draft=${encodeURIComponent(voiceSubmittedReport.description)}`}
                        className="px-4 py-2 rounded-xl bg-[#0f3d2e] text-white text-xs font-bold hover:bg-[#134e3a] transition flex items-center gap-1.5"
                      >
                        <span>{t.voice.continueSubmit}</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4B: VOICE SAMPLE SHOWCASE ("Hear How Citizens Report")
         ========================================================================= */}
      <section className="py-20 sm:py-24 bg-slate-50/70 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <VoiceSamplePlayer />
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: EXPLORE ISSUES & CATEGORIES
         ========================================================================= */}
      <section className="py-20 sm:py-28 bg-[#f8faf8] dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                {t.explore.badge}
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950 dark:text-white mt-2">
                {t.explore.title}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-2 max-w-xl">
                {t.explore.subtitle}
              </p>
            </div>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-emerald-600 text-slate-800 dark:text-slate-200 font-bold text-sm transition"
            >
              <span>{t.explore.viewAll} ({communityProblems.length})</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Interactive Category Filter Pills */}
          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-3 mb-8">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                activeCategory === "all"
                  ? "bg-[#0f3d2e] text-white shadow-md shadow-emerald-950/20"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {t.explore.allCategories}
            </button>
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? "bg-[#0f3d2e] text-white shadow-md shadow-emerald-950/20"
                      : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-emerald-300" : cat.color}`} />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Community Issues Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProblems.map((issue) => {
              const Icon = issue.icon;
              return (
                <Link
                  key={issue.id}
                  href={`/reports/${issue.id}`}
                  className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-600/70 dark:hover:border-emerald-500/70 transition-all hover:shadow-lg flex flex-col justify-between group cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${issue.statusColor}`}>
                        {issue.status}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-0.5">
                        <TrendingUp className="w-3 h-3" />
                        <span>{issue.trendDelta}</span>
                      </span>
                    </div>

                    <div className="flex items-start gap-3.5 mb-4">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${issue.iconColor}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition leading-snug line-clamp-2">
                          {issue.title}
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{issue.location}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{issue.reports} {t.explore.citizenReports}</span>
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      {issue.timeAgo}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: INTERACTIVE MAP SPOTLIGHT ("What's Happening Around You?")
         ========================================================================= */}
      <section className="py-20 sm:py-28 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-[#0f3d2e] to-[#0a271e] text-white p-8 sm:p-14 overflow-hidden relative shadow-2xl">
            {/* Background city topography artwork */}
            <div className="absolute right-0 bottom-0 top-0 w-1/2 opacity-10 pointer-events-none hidden md:block">
              <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
                <circle cx="200" cy="200" r="180" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                <circle cx="200" cy="200" r="120" stroke="currentColor" strokeWidth="2" />
                <circle cx="200" cy="200" r="60" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>

            <div className="max-w-2xl relative z-10 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                <MapPin className="w-3.5 h-3.5" />
                <span>{t.mapSection.badge}</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.15]">
                {t.mapSection.title}
              </h2>

              <p className="text-base sm:text-lg text-emerald-100/90 leading-relaxed font-normal">
                {t.mapSection.subtitle}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link
                  href="/map"
                  className="px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-xl transition-all hover:scale-[1.02] cursor-pointer"
                >
                  {t.mapSection.openMap}
                </Link>
                <Link
                  href="/explore"
                  className="px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-emerald-500/30 transition-colors"
                >
                  {t.mapSection.browseList}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: IMPACT FLOW (Individual → Patterns → Visibility → Action)
         ========================================================================= */}
      <section className="py-20 sm:py-28 bg-[#fafbf9] dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              {t.impact.badge}
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950 dark:text-white">
              {t.impact.title}
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              {t.impact.subtitle}
            </p>
          </div>

          {/* 4 Flow Stages */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {[
              {
                step: t.impact.stage1Tag,
                title: t.impact.stage1Title,
                desc: t.impact.stage1Desc,
                icon: Mic,
              },
              {
                step: t.impact.stage2Tag,
                title: t.impact.stage2Title,
                desc: t.impact.stage2Desc,
                icon: Users,
              },
              {
                step: t.impact.stage3Tag,
                title: t.impact.stage3Title,
                desc: t.impact.stage3Desc,
                icon: Eye,
              },
              {
                step: t.impact.stage4Tag,
                title: t.impact.stage4Title,
                desc: t.impact.stage4Desc,
                icon: CheckCircle2,
              },
            ].map((stage, idx) => {
              const Icon = stage.icon;
              return (
                <div
                  key={idx}
                  className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block mb-3 font-mono">
                      {stage.step}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-700 dark:text-emerald-300 mb-4">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                      {stage.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {stage.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Before & After Municipal Resolution Showcase */}
          <div className="pt-14">
            <BeforeAfterResolution />
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 8: FINAL HERO CTA
         ========================================================================= */}
      <section className="py-20 sm:py-28 bg-white dark:bg-slate-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="w-16 h-16 rounded-3xl bg-[#0f3d2e] text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-950/20 text-2xl font-black">
            ች
          </div>

          <h2 className="text-3xl sm:text-6xl font-black tracking-tight text-slate-950 dark:text-white">
            {t.cta.titleLine1} <br />
            <span className="text-emerald-700 dark:text-emerald-400">
              {t.cta.titleLine2}
            </span>
          </h2>

          <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-normal">
            {t.cta.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/report"
              className="w-full sm:w-auto px-9 py-4 rounded-2xl bg-[#0f3d2e] hover:bg-[#134e3a] text-white font-extrabold text-base shadow-xl shadow-emerald-950/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              {t.cta.reportBtn}
            </Link>
            <Link
              href="/map"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold text-base transition-colors"
            >
              {t.cta.exploreBtn}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

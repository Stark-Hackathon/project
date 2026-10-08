"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  Mic,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

export default function HowItWorksPage() {
  const { t } = useLanguage();

  const steps = useMemo(
    () => [
      {
        step: "01",
        title: t.howItWorksPage.step1Title,
        subtitle: t.howItWorksPage.step1Subtitle,
        desc: t.howItWorksPage.step1Desc,
        highlights: [
          t.howItWorksPage.step1H1,
          t.howItWorksPage.step1H2,
          t.howItWorksPage.step1H3,
        ],
      },
      {
        step: "02",
        title: t.howItWorksPage.step2Title,
        subtitle: t.howItWorksPage.step2Subtitle,
        desc: t.howItWorksPage.step2Desc,
        highlights: [
          t.howItWorksPage.step2H1,
          t.howItWorksPage.step2H2,
          t.howItWorksPage.step2H3,
        ],
      },
      {
        step: "03",
        title: t.howItWorksPage.step3Title,
        subtitle: t.howItWorksPage.step3Subtitle,
        desc: t.howItWorksPage.step3Desc,
        highlights: [
          t.howItWorksPage.step3H1,
          t.howItWorksPage.step3H2,
          t.howItWorksPage.step3H3,
        ],
      },
      {
        step: "04",
        title: t.howItWorksPage.step4Title,
        subtitle: t.howItWorksPage.step4Subtitle,
        desc: t.howItWorksPage.step4Desc,
        highlights: [
          t.howItWorksPage.step4H1,
          t.howItWorksPage.step4H2,
          t.howItWorksPage.step4H3,
        ],
      },
    ],
    [t]
  );

  return (
    <main className="min-h-screen bg-[#fafcfb] dark:bg-slate-950 py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.howItWorksPage.badge}</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-950 dark:text-white">
            {t.howItWorksPage.title}
          </h1>
          <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            {t.howItWorksPage.subtitle}
          </p>
        </div>

        {/* 4 Detailed Process Steps */}
        <div className="space-y-12">
          {steps.map((item, idx) => (
            <div
              key={idx}
              className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-8 items-start"
            >
              <div className="md:col-span-3">
                <span className="text-5xl sm:text-7xl font-black text-emerald-700/20 dark:text-emerald-400/20 font-mono block">
                  {item.step}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2 block">
                  {item.title}
                </h2>
              </div>

              <div className="md:col-span-9 space-y-4">
                <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-300">
                  {item.subtitle}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  {item.desc}
                </p>

                <div className="pt-2 flex flex-wrap gap-2">
                  {item.highlights.map((h, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{h}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Voice Tech Callout Box */}
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#0f3d2e] to-[#0a271e] text-white shadow-xl space-y-6">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 uppercase tracking-wider">
            <Mic className="w-4 h-4" />
            <span>{t.howItWorksPage.voiceTechBadge}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
            {t.howItWorksPage.voiceTechTitle}
          </h2>

          <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-2xl font-normal">
            {t.howItWorksPage.voiceTechDesc}
          </p>

          <div className="pt-2 flex flex-wrap gap-4">
            <Link
              href="/report"
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
            >
              {t.howItWorksPage.tryVoiceBtn}
            </Link>
            <Link
              href="/explore"
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-emerald-500/30 transition"
            >
              {t.howItWorksPage.browseActiveBtn}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

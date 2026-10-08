"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  Shield,
  Heart,
  Users,
  CheckCircle2,
  Mic,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

export default function AboutPage() {
  const { t, isAmharic } = useLanguage();

  const values = useMemo(
    () => [
      {
        title: t.aboutPage.p1Title,
        desc: t.aboutPage.p1Desc,
        icon: Mic,
      },
      {
        title: t.aboutPage.p2Title,
        desc: t.aboutPage.p2Desc,
        icon: Shield,
      },
      {
        title: t.aboutPage.p3Title,
        desc: t.aboutPage.p3Desc,
        icon: Users,
      },
      {
        title: t.aboutPage.p4Title,
        desc: t.aboutPage.p4Desc,
        icon: CheckCircle2,
      },
    ],
    [t]
  );

  return (
    <main className="min-h-screen bg-[#fafcfb] dark:bg-slate-950 py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
            <Heart className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.aboutPage.badge}</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-950 dark:text-white">
            {t.aboutPage.title}
          </h1>
          <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            {isAmharic ? (
              <span>
                «<strong className="text-emerald-800 dark:text-emerald-300">ችግር አለ</strong>» የሚለውን የሁልጊዜ ቃል ወደ ተጨባጭና ተጠያቂነት ያለው ይፋዊ መፍትሔ መቀየር።
              </span>
            ) : (
              <span>
                Turning the universal phrase{" "}
                <em className="font-semibold text-emerald-800 dark:text-emerald-300">
                  &ldquo;ችግር አለ&rdquo; (There is a problem)
                </em>{" "}
                into real, accountable public solutions.
              </span>
            )}
          </p>
        </div>

        {/* The Story Box */}
        <div className="p-8 sm:p-14 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {t.aboutPage.storyTitle}
          </h2>

          <div className="space-y-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            <p>{t.aboutPage.storyP1}</p>
            <p>{t.aboutPage.storyP2}</p>
            <p>{t.aboutPage.storyP3}</p>
          </div>
        </div>

        {/* 4 Core Pillars */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {t.aboutPage.pillarsTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <div
                  key={i}
                  className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {v.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {v.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Call to action */}
        <div className="text-center p-10 rounded-3xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 space-y-5">
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {t.aboutPage.ctaTitle}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            {t.aboutPage.ctaSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/report"
              className="px-7 py-3.5 rounded-2xl bg-[#0f3d2e] hover:bg-[#134e3a] text-white font-extrabold text-sm transition shadow-lg cursor-pointer"
            >
              {t.aboutPage.ctaReport}
            </Link>
            <Link
              href="/map"
              className="px-7 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold text-sm hover:bg-slate-50 transition cursor-pointer"
            >
              {t.aboutPage.ctaMap}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

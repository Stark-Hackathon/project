"use client";

import React from "react";
import Link from "next/link";
import { Users, ArrowRight } from "lucide-react";

interface ScreenWelcomeProps {
  onGetStarted?: () => void;
  onSignIn?: () => void;
}

export function ScreenWelcome({ onGetStarted, onSignIn }: ScreenWelcomeProps) {
  return (
    <div className="relative w-full max-w-4xl mx-auto flex flex-col justify-between bg-gradient-to-b from-[#f2f8f4] via-[#e8f3ec] to-[#d6ebd9] dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/40 rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 dark:border-slate-800 my-4">
      {/* Top Branding Section */}
      <div className="pt-12 sm:pt-16 px-6 sm:px-12 text-center flex flex-col items-center">
        {/* Community Watch Emblem */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#0e3e2c] flex items-center justify-center text-white shadow-xl shadow-emerald-900/20 mb-6">
          <Users className="w-10 h-10 sm:w-12 sm:h-12 stroke-[2.2]" />
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0e3e2c] dark:text-white mb-3">
          Chigr Ale
        </h1>

        <p className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
          See it. Report it. Improve it.
        </p>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg mx-auto">
          Anonymous hyperlocal reporting for infrastructure disruptions and neighborhood needs in Addis Ababa,
          featuring Vixovide voice interaction, smart map clustering, and direct municipal response.
        </p>
      </div>

      {/* Scenic City & Trees Landscape Artwork */}
      <div className="relative w-full h-64 sm:h-80 flex flex-col justify-end mt-6">
        {/* City Skyline SVG Graphic */}
        <div className="absolute inset-x-0 bottom-0 h-64 overflow-hidden pointer-events-none opacity-90">
          <svg
            className="w-full h-full object-cover"
            viewBox="0 0 400 240"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            {/* Distant Hills */}
            <path
              d="M0 160 C80 120, 160 140, 240 110 C320 80, 360 130, 400 120 L400 240 L0 240 Z"
              fill="#9bc5a4"
              opacity="0.4"
            />
            {/* Midground Buildings */}
            <rect x="30" y="90" width="28" height="80" rx="3" fill="#cbd5e1" opacity="0.8" />
            <rect x="65" y="70" width="34" height="100" rx="3" fill="#94a3b8" opacity="0.8" />
            <rect x="110" y="100" width="40" height="70" rx="3" fill="#cbd5e1" opacity="0.8" />
            <rect x="220" y="80" width="36" height="90" rx="3" fill="#94a3b8" opacity="0.8" />
            <rect x="265" y="110" width="45" height="60" rx="3" fill="#cbd5e1" opacity="0.8" />
            <rect x="320" y="60" width="32" height="110" rx="3" fill="#64748b" opacity="0.8" />

            {/* Tree Canopy Foreground */}
            <path
              d="M-20 240 C30 160, 90 190, 150 170 C220 150, 280 190, 350 170 C390 160, 420 190, 440 240 Z"
              fill="#2d6a4f"
            />
            <path
              d="M0 240 C50 180, 120 210, 190 190 C260 170, 330 210, 400 190 L400 240 Z"
              fill="#1b4332"
            />
          </svg>
        </div>
      </div>

      {/* Action Buttons at Bottom */}
      <div className="p-6 sm:p-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 z-10">
        <div className="text-xs text-slate-500">
          STARK Civic Incident Intelligence Platform
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {onSignIn ? (
            <button
              type="button"
              onClick={onSignIn}
              className="py-3 px-5 rounded-2xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-center"
            >
              Sign In
            </button>
          ) : (
            <Link
              href="/auth/sign-in"
              className="py-3 px-5 rounded-2xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-center"
            >
              Sign In
            </Link>
          )}

          <button
            type="button"
            onClick={onGetStarted}
            className="flex-1 sm:flex-none py-3.5 px-8 rounded-2xl bg-[#0e3e2c] hover:bg-[#15533c] text-white font-extrabold text-sm shadow-xl shadow-emerald-950/25 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}

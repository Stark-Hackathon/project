"use client";

import React, { useState } from "react";
import {
  User,
  Shield,
  FileText,
  HelpCircle,
  ChevronRight,
  Globe,
  CheckCircle,
  Lock,
  Award,
  ArrowLeft,
} from "lucide-react";

interface ScreenProfileSettingsProps {
  onBack?: () => void;
  onNavigateHome?: () => void;
  onNavigateReport?: () => void;
  onNavigateMap?: () => void;
  onNavigateNearby?: () => void;
  onNavigateImpact?: () => void;
}

export function ScreenProfileSettings({
  onBack,
  onNavigateNearby,
  onNavigateImpact,
}: ScreenProfileSettingsProps) {
  const [anonymousMode, setAnonymousMode] = useState(true);
  const [voicePlayback, setVoicePlayback] = useState(true);
  const [notifyOnStatusChange, setNotifyOnStatusChange] = useState(true);
  const [language, setLanguage] = useState<"en" | "am" | "om">("en");

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
              Profile & Settings
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Manage your civic identity, privacy controls, and language preferences
            </p>
          </div>
        </div>
      </div>

      {/* Responsive Grid: 2 Columns on Desktop, 1 Column on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Citizen Profile Summary & Stats */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-[#0e3e2c] text-white flex items-center justify-center text-3xl font-bold shadow-lg shadow-emerald-950/20 mb-4 relative">
              <User className="w-12 h-12 stroke-[1.8]" />
              <div className="w-7 h-7 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 absolute bottom-0 right-0 flex items-center justify-center shadow">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            </div>

            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
              Community Member
            </h2>

            <div className="mt-1.5 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
              <Lock className="w-3.5 h-3.5" />
              <span>Anonymous Reporter (Active)</span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-xs">
              Your identity is protected by default. Submissions are cryptographically signed without exposing personal identifiers.
            </p>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-3 w-full mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-center">
                <span className="block text-xl font-black text-slate-900 dark:text-white">7</span>
                <span className="block text-[11px] font-semibold text-slate-500 mt-0.5">Submitted</span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-center">
                <span className="block text-xl font-black text-emerald-700 dark:text-emerald-400">4</span>
                <span className="block text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 mt-0.5">Verified</span>
              </div>
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-center">
                <span className="block text-xl font-black text-blue-600 dark:text-blue-400">3</span>
                <span className="block text-[11px] font-semibold text-blue-800 dark:text-blue-300 mt-0.5">Resolved</span>
              </div>
            </div>

            {/* Citizen Trust Badge */}
            <div className="w-full mt-4 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 flex items-center justify-between text-left">
              <div className="flex items-center gap-2.5">
                <Award className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-xs font-extrabold text-amber-900 dark:text-amber-200">
                    Trusted Reporter Tier 1
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300">
                    94% verification accuracy rate
                  </p>
                </div>
              </div>
              <span className="text-xs font-black text-amber-800 dark:text-amber-200">
                +45 pts
              </span>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Settings Panels */}
        <div className="lg:col-span-7 space-y-4">
          {/* My Reports Quick Action */}
          <button
            type="button"
            onClick={onNavigateNearby}
            className="w-full p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-left hover:border-emerald-600 transition shadow-sm cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition">
                  My Incident Reports
                </p>
                <p className="text-xs text-slate-500">
                  Track progress, municipal dispatch notes, and citizen confirmations
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                7 active
              </span>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          {/* Privacy & Safety Settings */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Shield className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Privacy & Data Security
              </h3>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Anonymous Reporting Mode
                </p>
                <p className="text-xs text-slate-500">
                  Hide your name and contact info from public community maps and feeds
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAnonymousMode(!anonymousMode)}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                  anonymousMode ? "bg-[#0e3e2c]" : "bg-slate-300 dark:bg-slate-700"
                }`}
                aria-label="Toggle anonymous mode"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform ${
                    anonymousMode ? "right-0.5" : "left-0.5"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Status Notifications
                </p>
                <p className="text-xs text-slate-500">
                  Receive alerts when your reported incidents change status (Verified, Assigned, Resolved)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNotifyOnStatusChange(!notifyOnStatusChange)}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                  notifyOnStatusChange ? "bg-[#0e3e2c]" : "bg-slate-300 dark:bg-slate-700"
                }`}
                aria-label="Toggle status alerts"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform ${
                    notifyOnStatusChange ? "right-0.5" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Language & Voice Preferences */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Globe className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Language & Voice Engine
              </h3>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Interface Language
                </p>
                <p className="text-xs text-slate-500">
                  Primary language for application screens and municipal notifications
                </p>
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as "en" | "am" | "om")}
                className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
              >
                <option value="en">English (US)</option>
                <option value="am">አማርኛ (Amharic)</option>
                <option value="om">Afaan Oromoo</option>
              </select>
            </div>

            <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Audio Review Playback
                </p>
                <p className="text-xs text-slate-500">
                  Enable playback of recorded Vixovide voice clips before report dispatch
                </p>
              </div>
              <button
                type="button"
                onClick={() => setVoicePlayback(!voicePlayback)}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                  voicePlayback ? "bg-[#0e3e2c]" : "bg-slate-300 dark:bg-slate-700"
                }`}
                aria-label="Toggle voice playback"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform ${
                    voicePlayback ? "right-0.5" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Civic Mission & Impact */}
          <button
            type="button"
            onClick={onNavigateImpact}
            className="w-full p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-left hover:border-emerald-600 transition shadow-sm cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-700 dark:text-amber-300">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition">
                  Community Impact & Mission
                </p>
                <p className="text-xs text-slate-500">
                  How community reports convert into municipal work orders across Addis Ababa
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}

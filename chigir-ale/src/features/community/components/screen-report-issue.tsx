"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Camera,
  Mic,
  FileText,
  MapPin,
  ChevronRight,
  Shield,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react";
import { LiveVoiceRecorder } from "@/features/voice/components/live-voice-recorder";

interface ScreenReportIssueProps {
  onBack?: () => void;
  onSubmitSuccess?: (reportData: {
    title: string;
    description: string;
    category: string;
    location: string;
    method: "voice" | "photo" | "text";
    imageUrl?: string;
  }) => void;
}

export function ScreenReportIssue({
  onBack,
  onSubmitSuccess,
}: ScreenReportIssueProps) {
  const [activeTab, setActiveTab] = useState<"voice" | "photo" | "text">("voice");
  const [photoSelected, setPhotoSelected] = useState<string | null>(null);
  const [textTitle, setTextTitle] = useState("");
  const [textDescription, setTextDescription] = useState("");
  const [textCategory, setTextCategory] = useState("roads");
  const [locationAddress, setLocationAddress] = useState("Near Bole Road, Addis Ababa");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVoiceCompleted = (result: {
    text: string;
    suggestedTitle: string;
    suggestedCategory?: string;
    detectedLanguage: "en" | "am" | "om";
    durationSeconds: number;
  }) => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      if (onSubmitSuccess) {
        onSubmitSuccess({
          title: result.suggestedTitle || "Road or Community Damage",
          description: result.text,
          category: result.suggestedCategory || "infrastructure",
          location: locationAddress,
          method: "voice",
          imageUrl: photoSelected || undefined,
        });
      }
    }, 400);
  };

  const handleManualSubmit = (method: "photo" | "text") => {
    setIsSubmitting(true);
    let title = "Civic Incident Report";
    let description = "Reported by citizen";
    let category = "roads";

    if (method === "photo") {
      title = "Damage photo capture";
      description = "Citizen uploaded photo evidence of street disruption.";
      category = "roads";
    } else {
      title = textTitle || "Road damage";
      description = textDescription || "Citizen reported infrastructure damage.";
      category = textCategory;
    }

    setTimeout(() => {
      setIsSubmitting(false);
      if (onSubmitSuccess) {
        onSubmitSuccess({
          title,
          description,
          category,
          location: locationAddress,
          method,
          imageUrl: photoSelected || undefined,
        });
      }
    }, 400);
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              Report a Community Problem
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Voice-first, evidence-supported incident submission powered by Vixovide
            </p>
          </div>
        </div>

        {/* Method Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab("voice")}
            className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-bold transition ${
              activeTab === "voice"
                ? "bg-[#0e3e2c] text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Voice</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("photo")}
            className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-bold transition ${
              activeTab === "photo"
                ? "bg-[#0e3e2c] text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Photo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("text")}
            className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-bold transition ${
              activeTab === "text"
                ? "bg-[#0e3e2c] text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Text</span>
          </button>
        </div>
      </div>

      {/* Responsive 2-Column Content on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left/Main Column: Active Reporting Interface (8 cols on desktop) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          {/* VOICE TAB */}
          {activeTab === "voice" && (
            <div className="space-y-6">
              <div className="text-center max-w-md mx-auto mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-3 py-1 rounded-full">
                  Vixovide Voice Recognition
                </span>
                <p className="text-xs text-slate-500 mt-2">
                  Select your language preference below, press the microphone, and speak naturally.
                </p>
              </div>

              {/* Vixovide Voice Recorder Component */}
              <LiveVoiceRecorder
                onRecordingComplete={handleVoiceCompleted}
                onCancel={onBack}
                autoAnalyze={true}
              />

              {/* Optional Photo Attachment Link */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  <span>GPS Location: <strong className="text-slate-800 dark:text-slate-200">{locationAddress}</strong></span>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab("photo")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold transition"
                >
                  <Camera className="w-3.5 h-3.5 text-emerald-700" />
                  <span>📷 Also attach a photo</span>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </button>
              </div>
            </div>
          )}

          {/* PHOTO TAB */}
          {activeTab === "photo" && (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-8 text-center bg-slate-50 dark:bg-slate-800/40">
                {photoSelected ? (
                  <div className="space-y-4">
                    <div className="h-64 rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800 flex items-center justify-center relative">
                      <ImageIcon className="w-16 h-16 text-slate-400" />
                      <span className="absolute bottom-3 right-3 text-xs bg-black/60 text-white px-2.5 py-1 rounded-full">
                        Photo attached
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPhotoSelected(null)}
                      className="text-xs font-bold text-red-600 hover:underline"
                    >
                      Remove photo
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-4">
                      <Camera className="w-10 h-10" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                      Snap or upload incident photo
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mb-6">
                      Clear photos of potholes, ruptured pipes, illegal dumps, or damaged utility poles assist rapid response teams.
                    </p>
                    <button
                      type="button"
                      onClick={() => setPhotoSelected("sample-damage.jpg")}
                      className="px-6 py-3 rounded-2xl bg-[#0e3e2c] text-white text-xs font-bold hover:bg-[#15533c] transition shadow cursor-pointer"
                    >
                      Select Photo
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
                <MapPin className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span className="font-semibold">Detected Location:</span>
                <span className="truncate">{locationAddress}</span>
              </div>

              <button
                type="button"
                onClick={() => handleManualSubmit("photo")}
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-[#0e3e2c] text-white font-extrabold text-sm shadow-lg hover:bg-[#15533c] transition disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? "Submitting..." : "Submit Photo Evidence →"}
              </button>
            </div>
          )}

          {/* TEXT TAB */}
          {activeTab === "text" && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Issue Title
                </label>
                <input
                  type="text"
                  value={textTitle}
                  onChange={(e) => setTextTitle(e.target.value)}
                  placeholder="e.g. Broken water pipe leaking on main road"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Category
                </label>
                <select
                  value={textCategory}
                  onChange={(e) => setTextCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="roads">Roads &amp; Potholes</option>
                  <option value="water">Water &amp; Leakages</option>
                  <option value="electricity">Electricity &amp; Power Lines</option>
                  <option value="waste-management">Garbage &amp; Sanitation</option>
                  <option value="drainage">Drainage &amp; Flooding</option>
                  <option value="other-community">Other Infrastructure</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={textDescription}
                  onChange={(e) => setTextDescription(e.target.value)}
                  placeholder="Provide landmarks, extent of damage, and potential hazards..."
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none font-sans"
                />
              </div>

              <div className="flex items-center gap-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
                <MapPin className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span className="font-semibold">Location:</span>
                <input
                  type="text"
                  value={locationAddress}
                  onChange={(e) => setLocationAddress(e.target.value)}
                  className="flex-1 bg-transparent border-none text-xs focus:outline-none text-slate-800 dark:text-slate-100"
                />
              </div>

              <button
                type="button"
                onClick={() => handleManualSubmit("text")}
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-[#0e3e2c] text-white font-extrabold text-sm shadow-lg hover:bg-[#15533c] transition disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? "Submitting..." : "Submit Incident Report →"}
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Guidance Panel & System Overview (4 cols on desktop) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Vixovide Speech Capabilities Card */}
          <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-[#0e3e2c] text-white flex items-center justify-center">
                <Mic className="w-5 h-5 text-emerald-400" />
              </span>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Vixovide Voice Engine
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Designed for local civic infrastructure in Addis Ababa. Records real audio and transcribes spoken speech into actionable tickets.
            </p>

            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong>አማርኛ (Amharic)</strong> native recognition using Ethiopic script.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong>English &amp; Mixed Speech</strong> preserved without forced translation.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong>Editable Review:</strong> Review and tweak your transcript draft before confirming.</span>
              </li>
            </ul>
          </div>

          {/* Privacy & Safety Note */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Hyperlocal Anonymous Reporting</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your name and phone number remain confidential. Coordinates are clustered on the municipal dashboard to prevent personal tracking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

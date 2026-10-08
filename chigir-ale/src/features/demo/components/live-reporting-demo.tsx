"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Mic,
  MapPin,
  CheckCircle2,
  Droplet,
  ArrowRight,
  Maximize2,
  Minimize2,
  Sparkles,
  Shield,
  Film,
  Radio,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

interface StepData {
  id: number;
  time: string;
  tag: string;
  title: string;
  description: string;
}

const FULL_AMHARIC_TEXT =
  "ቦሌ መድኃኔዓለም ፊት ለፊት የውሃ ቧንቧ ፈንድቶ መንገዱ ሙሉ በሙሉ በውሃ ተሞልቷል፤ መኪኖች ማለፍ አልቻሉም።";
const FULL_ENGLISH_TRANSLATION =
  "Water pipe ruptured in front of Bole Medhanialem, road completely flooded, vehicles unable to pass.";

export function LiveReportingDemo() {
  const { isAmharic, t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [audioMuted, setAudioMuted] = useState(true);
  const [speed, setSpeed] = useState<1 | 1.5>(1);
  const [playbackMode, setPlaybackMode] = useState<"interactive" | "video">("interactive");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [typedChars, setTypedChars] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const steps: StepData[] = [
    {
      id: 1,
      time: "0:00",
      tag: t.demo.step1Tag,
      title: t.demo.step1Title,
      description: t.demo.step1Desc,
    },
    {
      id: 2,
      time: "0:08",
      tag: t.demo.step2Tag,
      title: t.demo.step2Title,
      description: t.demo.step2Desc,
    },
    {
      id: 3,
      time: "0:16",
      tag: t.demo.step3Tag,
      title: t.demo.step3Title,
      description: t.demo.step3Desc,
    },
    {
      id: 4,
      time: "0:22",
      tag: t.demo.step4Tag,
      title: t.demo.step4Title,
      description: t.demo.step4Desc,
    },
  ];

  // Helper sound synthesizers for authentic audio demo (if unmuted)
  const playSoundEffect = useCallback((type: "mic" | "beep" | "success") => {
    if (audioMuted || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "mic") {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === "beep") {
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.05);
      } else if (type === "success") {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch {
      // AudioContext not allowed or unsupported
    }
  }, [audioMuted]);

  // Main interactive simulation progression timer
  useEffect(() => {
    if (!isPlaying || playbackMode !== "interactive") return;

    const totalSeconds = 28;
    const intervalMs = 100 / speed;

    const timer = setInterval(() => {
      setProgressPercent((prev) => {
        const next = prev + (100 / (totalSeconds * (1000 / intervalMs)));
        if (next >= 100) {
          // Loop seamlessly
          setCurrentStepIndex(0);
          setTypedChars(0);
          return 0;
        }

        // Map progress to steps
        const stepNum = next < 28 ? 0 : next < 55 ? 1 : next < 80 ? 2 : 3;
        setCurrentStepIndex((currentIdx) => {
          if (currentIdx !== stepNum) {
            if (stepNum === 1) playSoundEffect("mic");
            if (stepNum === 3) playSoundEffect("success");
            return stepNum;
          }
          return currentIdx;
        });

        // Typing progress during step 1 & 2
        if (next >= 28 && next < 80) {
          const typingProgress = (next - 28) / 45;
          const chars = Math.min(
            FULL_AMHARIC_TEXT.length,
            Math.floor(typingProgress * FULL_AMHARIC_TEXT.length)
          );
          setTypedChars(chars);
        } else if (next >= 80) {
          setTypedChars(FULL_AMHARIC_TEXT.length);
        } else {
          setTypedChars(0);
        }

        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, speed, playbackMode, playSoundEffect]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const jumpToStep = (index: number) => {
    const percentages = [0, 30, 58, 82];
    setProgressPercent(percentages[index] ?? 0);
    setCurrentStepIndex(index);
    if (index === 0) setTypedChars(0);
    else if (index >= 2) setTypedChars(FULL_AMHARIC_TEXT.length);
    else setTypedChars(Math.floor(FULL_AMHARIC_TEXT.length / 2));
    setIsPlaying(true);
  };

  const restartDemo = () => {
    setProgressPercent(0);
    setCurrentStepIndex(0);
    setTypedChars(0);
    setIsPlaying(true);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-3xl bg-slate-950 text-white shadow-2xl border border-emerald-950/40 overflow-hidden transition-all ${
        isFullscreen ? "p-4 sm:p-8 flex flex-col justify-between" : ""
      }`}
    >
      {/* Background Ambient Glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-600/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

      {/* TOP BAR: Controls & Mode Switcher */}
      <div className="relative z-10 px-5 sm:px-8 pt-5 sm:pt-6 pb-4 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4 bg-slate-950/70 backdrop-blur-md">
        {/* Left: Live Status Pill & Chapter title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>{t.demo.simLiveBadge}</span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 font-medium">
            <span className="text-slate-600">•</span>
            <span>{t.demo.stepIndicator} {currentStepIndex + 1} {t.demo.of} 4:</span>
            <strong className="text-white font-semibold">
              {steps[currentStepIndex]?.title}
            </strong>
          </div>
        </div>

        {/* Right: Mode Switcher & Resolution Badge */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-bold">
            <button
              onClick={() => setPlaybackMode("interactive")}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                playbackMode === "interactive"
                  ? "bg-[#0f3d2e] text-emerald-300 shadow-sm font-black"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.demo.interactiveTab}</span>
            </button>
            <button
              onClick={() => setPlaybackMode("video")}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                playbackMode === "video"
                  ? "bg-[#0f3d2e] text-emerald-300 shadow-sm font-black"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>{t.demo.videoTab}</span>
            </button>
          </div>

          <span className="hidden sm:inline-block px-2.5 py-1 rounded-lg bg-slate-900 text-[11px] font-mono text-emerald-400 border border-slate-800">
            {t.demo.quality}
          </span>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition border border-slate-800 cursor-pointer"
            title="Toggle Fullscreen"
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* STAGE SCREEN AREA */}
      <div className="relative z-10 w-full min-h-[380px] sm:min-h-[460px] lg:min-h-[500px] flex items-center justify-center p-4 sm:p-8 bg-gradient-to-b from-slate-950 via-slate-900/60 to-slate-950">
        {playbackMode === "video" ? (
          /* =====================================================================
             VIDEO PLAYER MODE: Clean HTML5 Video Frame with Fallback Demo Video
             ===================================================================== */
          <div className="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 relative group flex items-center justify-center">
            <video
              className="w-full h-full object-cover"
              controls
              playsInline
              poster="/demo-poster.jpg"
              title="Chigr Ale Live Reporting Video"
            >
              <source src="/demo-video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {/* Video overlay placeholder notice if video file is not present */}
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-4 pointer-events-none group-hover:opacity-100 transition-opacity">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Play className="w-8 h-8 ml-1" />
              </div>
              <div className="max-w-md space-y-1">
                <h4 className="text-lg font-black text-white">{t.demo.videoNoticeTitle}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {t.demo.videoNoticeDesc}
                </p>
              </div>
              <button
                onClick={() => setPlaybackMode("interactive")}
                className="pointer-events-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition cursor-pointer"
              >
                {t.demo.videoSwitchBtn}
              </button>
            </div>
          </div>
        ) : (
          /* =====================================================================
             INTERACTIVE FLOW SIMULATOR: Real-time animated 4-stage walkthrough
             ===================================================================== */
          <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left 7 cols: Main Animated Viewport */}
            <div className="lg:col-span-7 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 sm:p-7 shadow-xl relative overflow-hidden space-y-5">
              {/* Dynamic Stage Indicator */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {t.demo.stage} 0{currentStepIndex + 1}
                  </span>
                  <span className="text-xs text-slate-400">/ 04</span>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {steps[currentStepIndex]?.time} • {t.demo.cityTag}
                </span>
              </div>

              {/* STAGE 1: Discovery Map Screen */}
              {currentStepIndex === 0 && (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="relative h-48 sm:h-56 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
                    {/* Simulated Map Grid */}
                    <div className="absolute inset-0 opacity-20">
                      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <pattern id="demogrid" width="24" height="24" patternUnits="userSpaceOnUse">
                            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-emerald-500" />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#demogrid)" />
                      </svg>
                    </div>

                    {/* Addis Ababa Street Marker */}
                    <div className="relative z-10 text-center space-y-2">
                      <div className="relative inline-flex items-center justify-center">
                        <span className="w-12 h-12 rounded-full bg-red-500/20 animate-ping absolute" />
                        <span className="w-9 h-9 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg relative">
                          <Droplet className="w-5 h-5" />
                        </span>
                      </div>
                      <div className="bg-slate-900/95 border border-slate-700 px-3 py-1.5 rounded-lg shadow-xl text-xs">
                        <p className="font-bold text-white">
                          {isAmharic ? "የፈነዳ የውሃ ቧንቧ ታይቷል" : "Water Main Leak Spotted"}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {isAmharic ? "አፍሪካ ጎዳና፣ ቦሌ ክፍለ ከተማ" : "Africa Avenue, Bole Sub-City"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{t.demo.gpsAccuracy}</span>
                    </span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <span>{t.demo.tappingMic}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              )}

              {/* STAGE 2: Live Voice Capture & Amharic Speech */}
              {currentStepIndex === 1 && (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="h-48 sm:h-56 rounded-xl bg-slate-950 border border-slate-800 p-4 flex flex-col justify-between relative overflow-hidden">
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1.5 font-bold">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        <span>{t.demo.recordingAudio}</span>
                      </span>
                      <span className="font-mono text-xs text-slate-400">{t.demo.speechEngine}</span>
                    </div>

                    {/* Animated Audio Equalizer Waveform */}
                    <div className="flex items-center justify-center gap-1.5 h-16 my-2">
                      {[40, 75, 95, 60, 85, 100, 70, 90, 50, 80, 100, 65, 85, 45, 90].map((h, i) => (
                        <div
                          key={i}
                          className="w-1.5 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-full transition-all duration-150"
                          style={{
                            height: isPlaying ? `${Math.max(15, (h * ((i % 3) + 1)) % 100)}%` : "20%",
                          }}
                        />
                      ))}
                    </div>

                    {/* Streaming Spoken Text */}
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">
                        {t.demo.liveStreamLabel}
                      </span>
                      <p className="text-sm font-medium text-white leading-relaxed font-sans">
                        &ldquo;{FULL_AMHARIC_TEXT.slice(0, typedChars)}
                        <span className="inline-block w-2 h-4 bg-emerald-400 ml-1 animate-pulse" />
                        &rdquo;
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{t.demo.langDetected}</span>
                    <span className="text-emerald-400 font-bold">{t.demo.confidence}</span>
                  </div>
                </div>
              )}

              {/* STAGE 3: AI Categorization & Coordinate Precision */}
              {currentStepIndex === 2 && (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="h-48 sm:h-56 rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-3 overflow-hidden flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300">{t.demo.normalizedDraft}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold">
                          💧 {isAmharic ? "የውሃ መቋረጥ እና ፍሳሽ" : "Water & Sanitation"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 bg-slate-900 p-2.5 rounded-lg border border-slate-800 leading-relaxed">
                        {isAmharic ? FULL_AMHARIC_TEXT : FULL_ENGLISH_TRANSLATION}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 block">{t.demo.gpsCoords}</span>
                        <span className="font-mono font-bold text-emerald-400">9.0124° N, 38.7631° E</span>
                      </div>
                      <div className="p-2 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 block">{t.demo.urgency}</span>
                        <span className="font-bold text-amber-400">{t.demo.urgencyHigh}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center gap-2.5 text-xs">
                    <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-emerald-200">
                      {t.demo.privacyGuaranteed}
                    </span>
                  </div>
                </div>
              )}

              {/* STAGE 4: Generated Ticket & Municipal Dispatch */}
              {currentStepIndex === 3 && (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="h-48 sm:h-56 rounded-xl bg-gradient-to-br from-emerald-950/60 via-slate-950 to-slate-950 border border-emerald-800/80 p-5 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-emerald-400 tracking-wider uppercase font-bold">
                          {t.demo.officialDispatched}
                        </span>
                        <h4 className="text-xl sm:text-2xl font-black text-white mt-0.5 font-mono">
                          CHI-2026-004812
                        </h4>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-xs shadow-md">
                        {t.demo.verified}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-400">{t.demo.targetAgency}</span>
                        <span className="font-bold text-slate-200">
                          {isAmharic ? "አዲስ አበባ ውሃ እና ፍሳሽ (AAWSA)" : "AAWSA (Water & Sewerage)"}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-400">{t.demo.estResponse}</span>
                        <span className="font-bold text-emerald-400">&lt; 3.5 Hours</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">{t.demo.citizenTracking}</span>
                        <span className="text-slate-300 font-mono">{t.demo.publicTracking} /reports/CHI-2026-004812</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{isAmharic ? "በይፋዊ የከተማ ካርታ ላይ ቀጥታ ይታያል" : "Live on public transparency map"}</span>
                    </span>
                    <Link
                      href="/explore"
                      className="text-emerald-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <span>{t.demo.browseTickets}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Right 5 cols: Step Explanations & Quick Chapter Jump */}
            <div className="lg:col-span-5 space-y-3.5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {t.demo.seqTitle}
              </h4>

              <div className="space-y-2.5">
                {steps.map((s, idx) => {
                  const isActive = currentStepIndex === idx;
                  return (
                    <button
                      key={s.id}
                      onClick={() => jumpToStep(idx)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isActive
                          ? "bg-slate-900 border-emerald-500/70 shadow-lg shadow-emerald-950/30 scale-[1.01]"
                          : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-[11px] font-bold uppercase tracking-wider ${
                            isActive ? "text-emerald-400" : "text-slate-500"
                          }`}
                        >
                          {s.tag}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          {s.time}
                        </span>
                      </div>
                      <h5
                        className={`text-sm font-bold ${
                          isActive ? "text-white" : "text-slate-300"
                        }`}
                      >
                        {s.title}
                      </h5>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                        {s.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Action Callout Button */}
              <div className="pt-2">
                <Link
                  href="/report"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow-lg cursor-pointer"
                >
                  <Mic className="w-4 h-4 text-slate-950" />
                  <span>{t.demo.tryItCTA}</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM CONTROLLER BAR: Timeline Scrubber & Media Controls */}
      <div className="relative z-10 px-5 sm:px-8 py-4 border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-md space-y-3">
        {/* Progress Bar / Scrubber */}
        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            setProgressPercent(Math.max(0, Math.min(100, clickPos * 100)));
          }}
          className="relative w-full h-2 rounded-full bg-slate-800 cursor-pointer overflow-hidden group"
          title="Click to scrub demo timeline"
        >
          <div
            className="h-full bg-gradient-to-r from-[#0f3d2e] via-emerald-500 to-teal-400 rounded-full transition-all duration-100 relative"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Action Controls & Timers */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          {/* Left Controls: Play/Pause, Restart, Timecode */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition shadow-md cursor-pointer"
              aria-label={isPlaying ? "Pause simulation" : "Play simulation"}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            <button
              onClick={restartDemo}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition border border-slate-800 cursor-pointer"
              title="Restart Simulation"
              aria-label="Restart Simulation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <span className="font-mono text-slate-400 font-semibold text-xs">
              00:{String(Math.floor((progressPercent / 100) * 28)).padStart(2, "0")} / 00:28
            </span>
          </div>

          {/* Right Controls: Audio Mute, Speed toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const nextMuted = !audioMuted;
                setAudioMuted(nextMuted);
                if (!nextMuted) playSoundEffect("beep");
              }}
              className={`p-2 rounded-xl transition border cursor-pointer flex items-center gap-1.5 ${
                !audioMuted
                  ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-400"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
              }`}
              title={audioMuted ? "Unmute audio effects" : "Mute audio effects"}
            >
              {!audioMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="text-[11px] font-bold hidden sm:inline">
                {!audioMuted ? t.demo.audioOn : t.demo.muted}
              </span>
            </button>

            <button
              onClick={() => setSpeed(speed === 1 ? 1.5 : 1)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono font-bold text-xs border border-slate-800 transition cursor-pointer"
              title="Toggle Playback Speed"
            >
              {speed}x
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

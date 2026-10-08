"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Play,
  Square,
  Droplet,
  Zap,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

interface VoiceSample {
  id: string;
  language: string;
  category: string;
  categoryIcon: React.ElementType;
  categoryBg: string;
  amharicText: string;
  englishTranslation: string;
  location: string;
  confidence: string;
  duration: number; // in seconds
}

export function VoiceSamplePlayer() {
  const { t, isAmharic } = useLanguage();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const voiceSamples: VoiceSample[] = useMemo(
    () => [
      {
        id: "sample-water",
        language: isAmharic ? "አማርኛ" : "Amharic (አማርኛ)",
        category: t.categories.water,
        categoryIcon: Droplet,
        categoryBg: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        amharicText: "ቦሌ መድኃኔዓለም አካባቢ የውሃ ቧንቧ ፈንድቶ መንገዱ ሙሉ በሙሉ ተዘግቷል፤ ቶሎ ድረስ።",
        englishTranslation: isAmharic
          ? "ቦሌ መድኃኔዓለም አካባቢ የፈነዳ የውሃ ቧንቧ መንገዱን ዘግቷል።"
          : "Water pipe ruptured near Bole Medhanialem, road completely blocked; please dispatch quickly.",
        location: isAmharic ? "ቦሌ መድኃኔዓለም፣ አፍሪካ ጎዳና" : "Bole Medhanialem, Africa Ave",
        confidence: "99.4%",
        duration: 5,
      },
      {
        id: "sample-power",
        language: isAmharic ? "አማርኛ" : "Amharic (አማርኛ)",
        category: t.categories.electricity,
        categoryIcon: Zap,
        categoryBg: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        amharicText: "ፒያሳ መብራት ከጠፋ ሁለት ቀን ሆነን፣ የትራፊክ መብራቱም አይሰራም፤ አደጋ እየደረሰ ነው።",
        englishTranslation: isAmharic
          ? "ፒያሳ መብራትና የትራፊክ መብራት በመጥፋቱ አደጋ እየደረሰ ነው።"
          : "Power has been out in Piazza for two days, traffic signals are down; accidents are occurring.",
        location: isAmharic ? "ፒያሳ፣ አራዳ ክፍለ ከተማ" : "Piazza, Arada Sub-City",
        confidence: "98.9%",
        duration: 6,
      },
      {
        id: "sample-road",
        language: isAmharic ? "እንግሊዝኛ / አማርኛ ቅይጥ" : "English / Amharic Mixed",
        category: t.categories.roads,
        categoryIcon: AlertTriangle,
        categoryBg: "bg-amber-500/20 text-amber-400 border-amber-500/30",
        amharicText: "ሳርቤት ራውንድአባውት ጋር ትልቅ ጉድጓድ ተፈጥሯል፣ መኪኖች ጎማ እየፈነዳ ነው፤ fix it urgently.",
        englishTranslation: isAmharic
          ? "ሳርቤት አደባባይ ጋር የመኪና ጎማ የሚያበላሽ ትልቅ ጉድጓድ አለ፤ በአስቸኳይ ይጠገን።"
          : "Huge pothole formed near Sarbet roundabout, vehicles bursting tires; fix it urgently.",
        location: isAmharic ? "ሳርቤት አደባባይ፣ ቂርቆስ" : "Sarbet Roundabout, Kirkos",
        confidence: "99.1%",
        duration: 5,
      },
    ],
    [t, isAmharic]
  );

  // Synthesize realistic speech pitch variation via Web Audio API if browser permits
  const playSampleAudio = (durationSec: number) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.connect(gain);
      gain.connect(ctx.destination);

      // Create melodic cadence simulating human conversational pitch
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(280, now + 0.3);
      osc.frequency.linearRampToValueAtTime(240, now + 0.7);
      osc.frequency.linearRampToValueAtTime(320, now + 1.2);
      osc.frequency.linearRampToValueAtTime(210, now + durationSec);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

      osc.start(now);
      osc.stop(now + durationSec);
    } catch {
      // AudioContext unavailable
    }
  };

  useEffect(() => {
    if (!playingId) return;

    const sample = voiceSamples.find((s) => s.id === playingId);
    if (!sample) return;

    playSampleAudio(sample.duration);

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = Math.min(100, (elapsed / sample.duration) * 100);
      setPlaybackProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        setPlayingId(null);
        setPlaybackProgress(0);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [playingId, voiceSamples]);

  const toggleSample = (id: string) => {
    if (playingId === id) {
      setPlayingId(null);
      setPlaybackProgress(0);
    } else {
      setPlayingId(id);
      setPlaybackProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>{t.voiceSamples.badge}</span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight">
          {t.voiceSamples.title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
          {t.voiceSamples.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {voiceSamples.map((sample) => {
          const isCurrent = playingId === sample.id;
          const CategoryIcon = sample.categoryIcon;

          return (
            <div
              key={sample.id}
              className={`p-6 rounded-3xl border transition-all flex flex-col justify-between ${
                isCurrent
                  ? "bg-slate-900 border-emerald-500 shadow-xl shadow-emerald-950/20 text-white scale-[1.02]"
                  : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white hover:border-emerald-600/50"
              }`}
            >
              <div>
                {/* Header: Language & Category */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${sample.categoryBg}`}>
                    <CategoryIcon className="w-3 h-3" />
                    <span>{sample.category}</span>
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 font-mono">
                    {sample.language}
                  </span>
                </div>

                {/* Spoken Amharic Text */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 mb-3 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block font-mono">
                    {isAmharic ? "የቀጥታ ንግግር ቅኝት" : "Spoken Audio Transcription"}
                  </span>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                    &ldquo;{sample.amharicText}&rdquo;
                  </p>
                </div>

                {/* English / Translated Meaning */}
                <p className="text-xs text-slate-500 dark:text-slate-400 italic mb-4 leading-relaxed">
                  &ldquo;{sample.englishTranslation}&rdquo;
                </p>
              </div>

              <div>
                {/* Audio Waveform Equalizer when Playing */}
                {isCurrent && (
                  <div className="mb-4 space-y-1.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-center gap-1 h-8">
                      {[35, 75, 100, 60, 85, 45, 90, 70, 50, 95, 65, 80].map((h, idx) => (
                        <div
                          key={idx}
                          className="w-1.5 bg-emerald-400 rounded-full transition-all duration-150 animate-pulse"
                          style={{ height: `${Math.max(20, (h * ((idx % 3) + 1)) % 100)}%` }}
                        />
                      ))}
                    </div>
                    {/* Tiny Progress Bar */}
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 transition-all duration-100"
                        style={{ width: `${playbackProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Control Button Strip */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => toggleSample(sample.id)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      isCurrent
                        ? "bg-red-500 hover:bg-red-600 text-white shadow-md"
                        : "bg-[#0f3d2e] hover:bg-[#134e3a] text-white shadow-sm"
                    }`}
                  >
                    {isCurrent ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>{t.voiceSamples.stop}</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{t.voiceSamples.listen} ({sample.duration}s)</span>
                      </>
                    )}
                  </button>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {t.voiceSamples.confidence}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {sample.confidence}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import React, { useState, useTransition } from "react";
import {
  Mic,
  Square,
  Volume2,
  Check,
  X,
  Languages,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { transcribeVoiceAction, translateTextAction } from "@/features/ai/actions";
import type { TranscriptionResult } from "@/server/services/voice/voice.service";

const DEMO_AMHARIC_PROMPTS: string[] = [
  "በቦሌ መንገድ ላይ ትልቅ የውሃ ቧንቧ ፈንድቶ መንገዱ ሙሉ በሙሉ በውሃ ተጥለቅልቋል",
  "በመገናኛ አደባባይ አቅራቢያ የመንገድ መብራት ባለመስራቱ ምክንያት ከፍተኛ የትራፊክ መጨናነቅ አለ",
];

const DEMO_ENGLISH_PROMPTS: string[] = [
  "Major water pipe burst near Bole Medhanialem flooding the main roadway",
  "Deep pothole on the ring road damaging vehicles during night commute",
];

interface VoiceRecorderAssistantProps {
  onTranscriptionComplete: (data: {
    title: string;
    description: string;
    suggestedCategorySlug?: string;
  }) => void;
}

export function VoiceRecorderAssistant({
  onTranscriptionComplete,
}: VoiceRecorderAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  const [languageHint, setLanguageHint] = useState<"auto" | "en" | "am">("auto");
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);
  const [editableText, setEditableText] = useState("");
  const [editableTitle, setEditableTitle] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedSnippet, setTranslatedSnippet] = useState<string | null>(null);

  const [, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function startRecording() {
    setErrorMsg(null);
    setIsRecording(true);
    setRecordingSeconds(0);
    setTranscriptionResult(null);
    setTranslatedSnippet(null);

    const interval = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
    setTimerInterval(interval);
  }

  function stopRecording(simulatedInput?: string) {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setIsRecording(false);

    const textToProcess = simulatedInput?.trim() || "";
    if (!textToProcess) {
      setErrorMsg("No audible speech was provided. Please speak into your microphone and try again.");
      return;
    }

    startTransition(async () => {
      const res = await transcribeVoiceAction({
        simulatedText: textToProcess,
        languageHint,
      });

      if (!res.success) {
        setErrorMsg(res.error.message);
      } else {
        setTranscriptionResult(res.data);
        setEditableText(res.data.normalizedText);
        setEditableTitle(res.data.suggestedTitle);
      }
    });
  }

  function handleTranslateToggle() {
    if (!editableText) return;
    setIsTranslating(true);
    startTransition(async () => {
      const fromLang = transcriptionResult?.detectedLanguage || "en";
      const toLang = fromLang === "am" ? "en" : "am";

      const res = await translateTextAction(editableText, fromLang, toLang);
      setIsTranslating(false);
      if (res.success) {
        setTranslatedSnippet(res.data.translatedText);
      }
    });
  }

  function handleApply() {
    if (!editableText) return;
    onTranscriptionComplete({
      title: editableTitle || "Incident reported via voice",
      description: editableText,
      suggestedCategorySlug: transcriptionResult?.suggestedCategorySlug,
    });
    setIsOpen(false);
  }

  return (
    <div>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition-colors border border-indigo-200/60 dark:border-indigo-800/40"
      >
        <Mic className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        <span>Voice Assist / በድምፅ ይናገሩ</span>
      </button>

      {/* Voice Assistant Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Civic Voice Assistant
                  </h3>
                  <p className="text-xs text-slate-400">
                    Speak in Amharic (አማርኛ) or English to describe the issue
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (isRecording) stopRecording();
                  setIsOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Language Selector */}
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 ml-2">
                <Languages className="w-4 h-4 text-slate-400" />
                Language
              </span>

              <div className="flex gap-1">
                {(["auto", "en", "am"] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguageHint(lang)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
                      languageHint === lang
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {lang === "auto" ? "Auto" : lang === "en" ? "English" : "አማርኛ"}
                  </button>
                ))}
              </div>
            </div>

            {/* Recording Controls */}
            <div className="text-center py-6 px-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
              {!isRecording ? (
                <div>
                  <button
                    type="button"
                    onClick={startRecording}
                    className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center mx-auto shadow-lg shadow-rose-600/30 transition-transform active:scale-95"
                  >
                    <Mic className="w-8 h-8" />
                  </button>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-3">
                    Click to Start Speaking
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Describe what happened, location, and hazard level
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                    <span className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping" />
                    <button
                      type="button"
                      onClick={() => stopRecording()}
                      className="relative w-14 h-14 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
                    >
                      <Square className="w-6 h-6 fill-current" />
                    </button>
                  </div>
                  <div className="text-sm font-bold text-rose-600 animate-pulse">
                    Recording: {recordingSeconds}s
                  </div>
                  <button
                    type="button"
                    onClick={() => stopRecording()}
                    className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:underline"
                  >
                    Click to Finish &amp; Transcribe
                  </button>
                </div>
              )}

              {/* Sample Prompts */}
              {!isRecording && !transcriptionResult && (
                <div className="pt-2 text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Or click a sample voice scenario:
                  </span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {(languageHint === "am" ? DEMO_AMHARIC_PROMPTS : DEMO_ENGLISH_PROMPTS).slice(0, 2).map((sample: string, i: number) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => stopRecording(sample)}
                        className="text-left p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-[11px] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 transition-colors line-clamp-1 cursor-pointer"
                      >
                        🗣️ &ldquo;{sample}&rdquo;
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Citizen Review Card (Spec §38: The user must be able to review the transcription before submission) */}
            {transcriptionResult && (
              <div className="p-4 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-950 dark:text-indigo-200">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    Review Transcription / ያረጋግጡ
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 uppercase">
                    {transcriptionResult.detectedLanguage === "am" ? "አማርኛ (Amharic)" : "English"}
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Suggested Title
                    </label>
                    <input
                      type="text"
                      value={editableTitle}
                      onChange={(e) => setEditableTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Transcribed Description (Normalized)
                    </label>
                    <textarea
                      rows={3}
                      value={editableText}
                      onChange={(e) => setEditableText(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white leading-relaxed"
                    />
                  </div>
                </div>

                {/* Translation Option */}
                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <button
                    type="button"
                    onClick={handleTranslateToggle}
                    disabled={isTranslating}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1"
                  >
                    <Languages className="w-3.5 h-3.5" />
                    {transcriptionResult.detectedLanguage === "am"
                      ? "Translate to English"
                      : "ወደ አማርኛ ተርጉም"}
                  </button>

                  <span className="text-slate-400">
                    {(transcriptionResult.confidence * 100).toFixed(0)}% speech accuracy
                  </span>
                </div>

                {translatedSnippet && (
                  <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-indigo-100 dark:border-indigo-900/60 text-xs text-slate-700 dark:text-slate-300 italic">
                    <span className="font-bold not-italic block text-[10px] text-indigo-600 uppercase mb-0.5">
                      Translation Preview:
                    </span>
                    &ldquo;{translatedSnippet}&rdquo;
                  </div>
                )}

                {/* Apply Button */}
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTranscriptionResult(null);
                      setTranslatedSnippet(null);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                  >
                    Re-record
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                  >
                    <Check className="w-4 h-4" /> Use This in Report / ተጠቀም
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

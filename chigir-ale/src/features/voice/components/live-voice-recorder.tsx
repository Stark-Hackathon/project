"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  Square,
  Play,
  Pause,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Check,
} from "lucide-react";

interface BrowserSpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal?: boolean;
    };
  };
}

interface BrowserSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface LiveVoiceRecorderProps {
  onRecordingComplete?: (result: {
    text: string;
    suggestedTitle: string;
    suggestedCategory?: string;
    detectedLanguage: "en" | "am" | "om";
    audioBlob?: Blob;
    durationSeconds: number;
  }) => void;
  onCancel?: () => void;
  autoAnalyze?: boolean;
}

export function LiveVoiceRecorder({
  onRecordingComplete,
  onCancel,
  autoAnalyze = true,
}: LiveVoiceRecorderProps) {
  // Language configuration: [ አማርኛ ] [ English ]
  const [selectedLanguage, setSelectedLanguage] = useState<"am" | "en">("am");

  // Distinct recording & transcription states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>([14, 28, 20, 36, 18, 24]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Transcript state starts strictly EMPTY - never hardcoded
  const [transcribedText, setTranscribedText] = useState("");
  const [editableTitle, setEditableTitle] = useState("");
  const [analysisResult, setAnalysisResult] = useState<{
    suggestedTitle?: string;
    suggestedCategory?: string;
    detectedLanguage?: "en" | "am" | "om";
  } | null>(null);

  // Audio recording storage
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasCompletedTranscript, setHasCompletedTranscript] = useState(false);

  // Internal refs for hardware & recording streams
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechTranscriptRef = useRef<string>("");
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const speechRecognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Initialize or reconfigure speech recognition when language changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const win = window as unknown as {
      SpeechRecognition?: new () => BrowserSpeechRecognition;
      webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
    };
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      try {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = true;

        // Set recognition language based on user selection:
        // 'am' -> am-ET (Amharic - Ethiopia)
        // 'en' -> en-US (English)
        if (selectedLanguage === "en") {
          recognition.lang = "en-US";
        } else {
          recognition.lang = "am-ET";
        }

        recognition.onresult = (event: BrowserSpeechRecognitionEvent) => {
          let accumulated = "";
          for (let i = 0; i < event.results.length; i++) {
            accumulated += event.results[i][0].transcript;
          }
          if (accumulated.trim()) {
            speechTranscriptRef.current = accumulated.trim();
            // Show real-time streaming preview
            setTranscribedText(accumulated.trim());
          }
        };

        recognition.onerror = (e) => {
          console.warn("Speech recognition notice:", e);
        };

        speechRecognitionRef.current = recognition;
      } catch (err) {
        console.warn("Speech recognition initialization error:", err);
      }
    }
  }, [selectedLanguage]);

  /**
   * START RECORDING
   * Completely resets old state, old audio, old chunks, and old transcript.
   */
  async function startRecording() {
    // 1. Reset all state from previous recordings (Recording 2 must never reuse Recording 1)
    setErrorMsg(null);
    setAudioUrl(null);
    setAudioBlob(null);
    setHasCompletedTranscript(false);
    setTranscribedText("");
    setEditableTitle("");
    setAnalysisResult(null);
    audioChunksRef.current = [];
    speechTranscriptRef.current = "";

    try {
      // 2. Request actual microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // 3. Setup Web Audio API Analyser for live waveform visualization
      const win = window as unknown as {
        AudioContext?: typeof AudioContext;
        webkitAudioContext?: typeof AudioContext;
      };
      const AudioCtx = win.AudioContext || win.webkitAudioContext;
      if (AudioCtx) {
        try {
          const audioCtx = new AudioCtx();
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 32;
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          audioContextRef.current = audioCtx;
          analyserRef.current = analyser;

          // Start visualizer loop reading real frequency data
          const updateVisualizer = () => {
            if (!analyserRef.current) return;
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);

            const levels = [
              Math.max(8, Math.round((dataArray[1] || 10) / 4)),
              Math.max(14, Math.round((dataArray[3] || 25) / 3)),
              Math.max(8, Math.round((dataArray[5] || 18) / 3.5)),
              Math.max(16, Math.round((dataArray[2] || 28) / 2.8)),
              Math.max(10, Math.round((dataArray[4] || 20) / 4)),
              Math.max(8, Math.round((dataArray[6] || 15) / 4.5)),
            ];
            setAudioLevels(levels);
            animFrameRef.current = requestAnimationFrame(updateVisualizer);
          };
          updateVisualizer();
        } catch (e) {
          console.warn("Web Audio API visualizer warning:", e);
        }
      }

      // 4. Setup MediaRecorder to capture actual audio chunks
      let mimeType = "audio/webm";
      if (!MediaRecorder.isTypeSupported("audio/webm")) {
        if (MediaRecorder.isTypeSupported("audio/mp4")) mimeType = "audio/mp4";
        else mimeType = "";
      }

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const finalBlob = new Blob(audioChunksRef.current, {
          type: mimeType || "audio/webm",
        });
        setAudioBlob(finalBlob);
        const url = URL.createObjectURL(finalBlob);
        setAudioUrl(url);

        // Send this CURRENT audioBlob and captured speech to Vixovide
        if (autoAnalyze) {
          await processVoiceWithVixovide(finalBlob);
        }
      };

      recorder.start(200);
      mediaRecorderRef.current = recorder;

      // 5. Start browser speech recognition with fresh instance per session
      if (typeof window !== "undefined") {
        const win = window as unknown as {
          SpeechRecognition?: new () => BrowserSpeechRecognition;
          webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
        };
        const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

        if (SpeechRecognitionClass) {
          try {
            if (speechRecognitionRef.current) {
              try {
                speechRecognitionRef.current.stop();
              } catch {}
            }
            const recognition = new SpeechRecognitionClass();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = selectedLanguage === "en" ? "en-US" : "am-ET";

            recognition.onresult = (event: BrowserSpeechRecognitionEvent) => {
              let accumulated = "";
              for (let i = 0; i < event.results.length; i++) {
                accumulated += event.results[i][0].transcript;
              }
              if (accumulated.trim()) {
                speechTranscriptRef.current = accumulated.trim();
                setTranscribedText(accumulated.trim());
              }
            };

            recognition.onerror = (e) => {
              console.warn("Speech recognition notice:", e);
            };

            recognition.start();
            speechRecognitionRef.current = recognition;
          } catch (e) {
            console.warn("Speech recognition start warning:", e);
          }
        }
      }

      // 6. Start live recording timer
      setRecordingSeconds(0);
      setIsRecording(true);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      console.warn("Microphone access error:", err);
      setIsRecording(false);
      setErrorMsg(
        "Microphone permission was denied or not found. Please allow microphone access in your browser settings to record your voice."
      );
    }
  }

  /**
   * STOP RECORDING
   */
  function stopRecording() {
    setIsRecording(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
      speechRecognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }

    // Reset visualizer bars to idle state
    setAudioLevels([14, 28, 20, 36, 18, 24]);
  }

  /**
   * Convert Blob to Base64
   */
  async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * PROCESS VOICE WITH VIXOVIDE
   * Sends the actual recorded audio and speech to the Vixovide Engine.
   * If Vixovide fails or detects no speech, displays an honest error.
   * NEVER fabricates a fake default transcript!
   */
  async function processVoiceWithVixovide(currentBlob: Blob, explicitText?: string) {
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const base64Audio = currentBlob.size > 0 ? await blobToBase64(currentBlob) : undefined;
      const speechToSend = (explicitText || speechTranscriptRef.current || transcribedText).trim();

      const res = await fetch("/api/ai/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base64Audio,
          mimeType: currentBlob.type,
          speechTranscript: speechToSend,
          languageHint: selectedLanguage,
        }),
      });

      const data = await res.json();

      if (data.success && data.transcription) {
        const trans = data.transcription;
        // Set actual returned Vixovide transcription
        setTranscribedText(trans.normalizedText);
        setEditableTitle(trans.suggestedTitle);
        setAnalysisResult({
          suggestedTitle: trans.suggestedTitle,
          suggestedCategory: trans.suggestedCategorySlug,
          detectedLanguage: trans.detectedLanguage,
        });
        setHasCompletedTranscript(true);
      } else {
        // Honest error - NO fake default string
        throw new Error(
          data.error ||
            "Unable to transcribe your recording. No clear speech was detected. Please speak clearly into your microphone and try again."
        );
      }
    } catch (err: unknown) {
      console.error("Vixovide transcription error:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Unable to transcribe your recording. Please try again.";
      setErrorMsg(message);
      setHasCompletedTranscript(false);
    } finally {
      setIsProcessing(false);
    }
  }

  /**
   * Confirm and submit the editable transcript draft
   */
  function handleConfirmDraft() {
    if (!transcribedText.trim()) return;

    if (onRecordingComplete) {
      onRecordingComplete({
        text: transcribedText.trim(),
        suggestedTitle: editableTitle.trim() || transcribedText.slice(0, 40),
        suggestedCategory: analysisResult?.suggestedCategory || "other-community",
        detectedLanguage: analysisResult?.detectedLanguage || (selectedLanguage === "am" ? "am" : "en"),
        audioBlob: audioBlob || undefined,
        durationSeconds: recordingSeconds || 5,
      });
    }
  }

  function handleTogglePlay() {
    if (!audioPlayerRef.current || !audioUrl) return;
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  }

  function formatTime(totalSeconds: number) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  return (
    <div className="w-full flex flex-col items-center">
      {/* Hidden audio player for reviewing user recording */}
      {audioUrl && (
        <audio
          ref={audioPlayerRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}

      {/* Language Selector Segmented Bar (አማርኛ / English) */}
      <div className="mb-6 flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <button
          type="button"
          onClick={() => setSelectedLanguage("am")}
          disabled={isRecording || isProcessing}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
            selectedLanguage === "am"
              ? "bg-[#0e3e2c] text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          አማርኛ (Amharic)
        </button>

        <button
          type="button"
          onClick={() => setSelectedLanguage("en")}
          disabled={isRecording || isProcessing}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
            selectedLanguage === "en"
              ? "bg-[#0e3e2c] text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          English
        </button>
      </div>

      {/* STATE 1: IDLE / RECORDING / PROCESSING - Microphone Interface */}
      {!hasCompletedTranscript && (
        <div className="w-full flex flex-col items-center text-center">
          {/* Large Circular Microphone Action Button */}
          <div className="relative mb-6">
            {/* Radiating wave animation when active */}
            {isRecording && (
              <>
                <div className="absolute inset-0 rounded-full bg-emerald-500/25 animate-ping" />
                <div className="absolute -inset-4 rounded-full bg-emerald-500/15 animate-pulse" />
              </>
            )}

            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              aria-label={isRecording ? "Stop recording voice" : "Start recording voice"}
              className={`relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
                isRecording
                  ? "bg-red-600 hover:bg-red-700 text-white ring-8 ring-red-100 dark:ring-red-950 scale-105"
                  : "bg-[#0e3e2c] hover:bg-[#15533c] text-white ring-8 ring-emerald-50 dark:ring-emerald-950 hover:scale-105"
              } disabled:opacity-50`}
            >
              {isRecording ? (
                <Square className="w-10 h-10 fill-white" />
              ) : (
                <Mic className="w-12 h-12 stroke-[2.2]" />
              )}
            </button>
          </div>

          {/* Dynamic Waveform Visualizer Bars (Active during recording) */}
          <div className="h-10 flex items-center justify-center gap-1.5 mb-3" aria-hidden="true">
            {audioLevels.map((lvl, idx) => (
              <span
                key={idx}
                style={{ height: `${lvl}px` }}
                className={`w-1.5 rounded-full transition-all duration-150 ${
                  isRecording
                    ? "bg-emerald-600 dark:bg-emerald-400"
                    : "bg-slate-300 dark:bg-slate-700"
                }`}
              />
            ))}
          </div>

          {/* Recording Status / Instruction Label */}
          <div className="space-y-1 mb-4">
            {isProcessing ? (
              <div className="flex items-center justify-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-300">
                <span className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <span>Transcribing with Vixovide Voice Engine...</span>
              </div>
            ) : isRecording ? (
              <>
                <p className="text-sm font-bold text-red-600 animate-pulse">
                  Listening... Speak clearly into your microphone
                </p>
                <p className="text-lg font-mono font-bold text-slate-800 dark:text-slate-100">
                  {formatTime(recordingSeconds)}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Tap microphone to report a problem
                </p>
                <p className="text-xs text-slate-500">
                  Speak in English, Amharic (አማርኛ), or mixed language
                </p>
              </>
            )}
          </div>

          {/* Action Button: Stop or Cancel */}
          {isRecording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition flex items-center gap-2"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>Stop &amp; Transcribe</span>
            </button>
          ) : (
            onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
              >
                Cancel
              </button>
            )
          )}

          {/* Honest Error Message Box (When mic is silent or permission denied) */}
          {errorMsg && (
            <div
              role="alert"
              className="w-full max-w-md mt-5 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-left flex items-start gap-3 animate-in fade-in"
            >
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-bold text-red-900 dark:text-red-300 mb-1">
                  Transcription Notice
                </p>
                <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">
                  {errorMsg}
                </p>
                <button
                  type="button"
                  onClick={startRecording}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STATE 2: SUCCESS - EDITABLE REPORT DRAFT (Spec §38 & Part 16) */}
      {hasCompletedTranscript && (
        <div className="w-full max-w-xl p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
          {/* Header Row */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>Voice Report Draft</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    Vixovide
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Review and edit your transcript before submitting
                </p>
              </div>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2">
              {analysisResult?.detectedLanguage && (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {analysisResult.detectedLanguage === "am"
                    ? "አማርኛ (Amharic)"
                    : analysisResult.detectedLanguage === "en"
                    ? "English"
                    : "Afaan Oromoo"}
                </span>
              )}
              {analysisResult?.suggestedCategory && (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#0e3e2c] text-white">
                  {analysisResult.suggestedCategory}
                </span>
              )}
            </div>
          </div>

          {/* Audio Review Player */}
          {audioUrl && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="w-8 h-8 rounded-full bg-[#0e3e2c] text-white flex items-center justify-center hover:bg-[#15533c] transition shadow"
                  aria-label={isPlaying ? "Pause audio playback" : "Play recorded audio"}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Recorded Audio
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {formatTime(recordingSeconds)} duration
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono text-slate-400">Audio ready</span>
            </div>
          )}

          {/* Editable Title Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Incident Title</span>
              <span className="text-[10px] text-slate-400 font-normal">Editable</span>
            </label>
            <input
              type="text"
              value={editableTitle}
              onChange={(e) => setEditableTitle(e.target.value)}
              placeholder="Brief title for this issue"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Editable Transcript Textarea (Amharic / English LTR text) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Transcribed Report Description</span>
              <span className="text-[10px] text-slate-400 font-normal">
                Ethiopic / English text
              </span>
            </label>
            <textarea
              rows={4}
              value={transcribedText}
              onChange={(e) => setTranscribedText(e.target.value)}
              placeholder="Voice transcription will appear here..."
              className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm leading-relaxed text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none font-sans"
            />
          </div>

          {/* Action Buttons: Record Again vs Confirm & Submit */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={startRecording}
              className="w-full sm:w-auto flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs transition flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span>Record Again</span>
            </button>

            <button
              type="button"
              onClick={handleConfirmDraft}
              className="w-full sm:w-auto flex-[2] py-3.5 px-6 rounded-xl bg-[#0e3e2c] hover:bg-[#15533c] text-white font-extrabold text-xs shadow-lg shadow-emerald-950/20 transition flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Confirm &amp; Proceed to Report →</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

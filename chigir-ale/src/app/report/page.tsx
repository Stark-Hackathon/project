"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Mic,
  FileText,
  Camera,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Shield,
  AlertTriangle,
  Droplet,
  Zap,
  Trash2,
  Car,
  Wifi,
  Lock,
} from "lucide-react";
import { LiveVoiceRecorder } from "@/features/voice/components/live-voice-recorder";
import { useLanguage } from "@/lib/i18n/language-context";

export default function ReportPage() {
  const { t, isAmharic } = useLanguage();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [method, setMethod] = useState<"voice" | "type" | "photo">("voice");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("roads");
  const [hasVoiceAudio, setHasVoiceAudio] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Location State
  const [selectedSubCity, setSelectedSubCity] = useState("Bole Sub-City");
  const [streetAddress, setStreetAddress] = useState("Near Bole Medhanialem, Africa Ave");
  const [landmark, setLandmark] = useState("Opposite Edna Mall");

  // Anonymity State
  const [isAnonymous, setIsAnonymous] = useState(true);

  // Submission State
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  const categories = useMemo(
    () => [
      { id: "roads", label: t.categories.roads, icon: AlertTriangle },
      { id: "water", label: t.categories.water, icon: Droplet },
      { id: "electricity", label: t.categories.electricity, icon: Zap },
      { id: "waste", label: t.categories.waste, icon: Trash2 },
      { id: "traffic", label: t.categories.traffic, icon: Car },
      { id: "network", label: t.categories.network, icon: Wifi },
    ],
    [t]
  );

  const subCities = useMemo(
    () => [
      { id: "Bole Sub-City", label: t.subCities.bole },
      { id: "Kirkos Sub-City", label: t.subCities.kirkos },
      { id: "Yeka Sub-City", label: t.subCities.yeka },
      { id: "Arada Sub-City", label: t.subCities.arada },
      { id: "Lideta Sub-City", label: t.subCities.lideta },
      { id: "Nifas Silk-Lafto", label: t.subCities.nifasSilk },
      { id: "Kolfe Keranio", label: t.subCities.kolfeKeranio },
      { id: "Gullele Sub-City", label: t.subCities.gullele },
      { id: "Addis Ketema", label: t.subCities.addisKetema },
      { id: "Akaki Kality", label: t.subCities.akakiKality },
    ],
    [t]
  );

  const handleVoiceCompleted = (result: {
    text: string;
    suggestedTitle: string;
    suggestedCategory?: string;
  }) => {
    setTitle(result.suggestedTitle);
    setDescription(result.text);
    if (result.suggestedCategory && categories.some((c) => c.id === result.suggestedCategory)) {
      setCategory(result.suggestedCategory);
    }
    setHasVoiceAudio(true);
    // Proceed to Location step
    setStep(2);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
      if (!title) {
        setTitle(isAmharic ? "የመንገድ ብልሽት የፎቶ ማስረጃ" : "Photo Evidence of Road Disruption");
      }
      if (!description) {
        setDescription(
          isAmharic
            ? "በዜጋው የተያያዘ የቀጥታ የፎቶ ማስረጃ።"
            : "Citizen attached visual evidence of public hazard."
        );
      }
    }
  };

  const handleSubmitFinal = () => {
    const randomSeq = Math.floor(100000 + Math.random() * 900000);
    const ref = `CHI-2026-${randomSeq}`;
    setSubmittedRef(ref);
    setStep(4);
  };

  const selectedCategoryLabel = useMemo(() => {
    const found = categories.find((c) => c.id === category);
    return found ? found.label : category;
  }, [categories, category]);

  const selectedSubCityLabel = useMemo(() => {
    const found = subCities.find((s) => s.id === selectedSubCity);
    return found ? found.label : selectedSubCity;
  }, [subCities, selectedSubCity]);

  return (
    <main className="min-h-screen bg-[#fafcfb] dark:bg-slate-950 py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Step Indicator Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isAmharic ? "ማንነት ያልተገለጠበት የዜግነት ሪፖርት • አዲስ አበባ" : "Anonymous Civic Action • Addis Ababa"}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950 dark:text-white">
            {t.reportPage.title}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
            {step === 1 && (isAmharic ? "ምን አጋጠመዎት? በድምፅ ይናገሩ፣ በጽሑፍ ይጻፉ፣ ወይም ፎቶ ያያይዙ።" : "What happened? Speak, type, or attach a photo.")}
            {step === 2 && (isAmharic ? "ችግሩ የት ነው የሚገኘው?" : "Where is the problem located?")}
            {step === 3 && (isAmharic ? "ሪፖርቱን ወደ ማዘጋጃ ቤት ከመላክዎ በፊት ይገምግሙት።" : "Review your report before sending it to municipal teams.")}
            {step === 4 && (isAmharic ? "ሪፖርትዎ በተሳካ ሁኔታ ተልኳል።" : "Report submitted successfully.")}
          </p>

          {/* Clean Stepper */}
          {step < 4 && (
            <div className="pt-4 flex items-center justify-center gap-2 sm:gap-3 text-xs font-bold">
              {[
                { s: 1, label: t.reportPage.step1 },
                { s: 2, label: t.reportPage.step2 },
                { s: 3, label: t.reportPage.step3 },
              ].map((item) => (
                <div key={item.s} className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1.5 rounded-xl transition-colors ${
                      step === item.s
                        ? "bg-[#0f3d2e] text-white shadow-sm"
                        : step > item.s
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-400 dark:bg-slate-900 dark:text-slate-600"
                    }`}
                  >
                    {item.label}
                  </span>
                  {item.s < 3 && <span className="text-slate-300 dark:text-slate-700">/</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* =========================================================================
            STEP 1: DESCRIBE (Voice, Type, Photo)
           ========================================================================= */}
        {step === 1 && (
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-10 shadow-lg space-y-6">
            {/* Method Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 dark:bg-slate-850 rounded-2xl">
              <button
                type="button"
                onClick={() => setMethod("voice")}
                className={`py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  method === "voice"
                    ? "bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Mic className="w-4 h-4 text-emerald-600" />
                <span>{t.reportPage.modeVoice}</span>
              </button>
              <button
                type="button"
                onClick={() => setMethod("type")}
                className={`py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  method === "type"
                    ? "bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <FileText className="w-4 h-4 text-blue-600" />
                <span>{t.reportPage.modeText}</span>
              </button>
              <button
                type="button"
                onClick={() => setMethod("photo")}
                className={`py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  method === "photo"
                    ? "bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Camera className="w-4 h-4 text-amber-600" />
                <span>{t.reportPage.modePhoto}</span>
              </button>
            </div>

            {/* TAB 1: VOICE (Prominent Vixovide Recording Engine) */}
            {method === "voice" && (
              <div className="space-y-4">
                <div className="text-center pb-2">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {isAmharic ? "ማይክሮፎንዎን ተጭነው በተፈጥሮአዊ መንገድ ይናገሩ" : "Speak naturally into your microphone"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {isAmharic
                      ? "ቪክሶቪድ ንግግርዎን በአማርኛ ወይም በእንግሊዝኛ ቀድቶ ረቂቁን በራሱ ያዘጋጃል።"
                      : "Vixovide transcribes your speech in Amharic (አማርኛ) or English and auto-fills your draft."}
                  </p>
                </div>

                {/* Untouched, Protected LiveVoiceRecorder */}
                <div className="p-4 rounded-2xl bg-[#fafbf9] dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
                  <LiveVoiceRecorder
                    autoAnalyze={true}
                    onRecordingComplete={handleVoiceCompleted}
                  />
                </div>
              </div>
            )}

            {/* TAB 2: TYPE TEXT */}
            {method === "type" && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    {t.reportPage.textTitleLabel}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t.reportPage.textTitlePlaceholder}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    {t.reportPage.selectCategory}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {categories.map((c) => {
                      const Icon = c.icon;
                      const selected = category === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setCategory(c.id)}
                          className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition ${
                            selected
                              ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-600 text-emerald-900 dark:text-emerald-200"
                              : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <Icon className="w-4 h-4 text-emerald-600" />
                          <span>{c.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    {t.reportPage.textDescLabel}
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t.reportPage.textDescPlaceholder}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    disabled={!title.trim() || !description.trim()}
                    onClick={() => setStep(2)}
                    className="px-6 py-3 rounded-xl bg-[#0f3d2e] hover:bg-[#134e3a] disabled:opacity-40 text-white font-bold text-sm transition flex items-center gap-2 cursor-pointer"
                  >
                    <span>{t.reportPage.nextBtn}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: PHOTO EVIDENCE */}
            {method === "photo" && (
              <div className="space-y-5">
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-8 text-center space-y-4 hover:border-emerald-500 transition">
                  <Camera className="w-12 h-12 text-slate-400 mx-auto" />
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {isAmharic ? "የችግሩን ፎቶ ያንሱ ወይም ያስገቡ" : "Upload or capture a photo of the problem"}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isAmharic ? "ጥራት ያለው ፎቶ የማዘጋጃ ቤቱን ማረጋገጫ በ80% ያፋጥናል" : "Clear photos speed up municipal verification by 80%"}
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0f3d2e] hover:bg-[#134e3a] text-white text-xs font-bold cursor-pointer transition shadow">
                    <span>{isAmharic ? "ፎቶ ይምረጡ" : "Choose Photo"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {photoPreview && (
                  <div className="space-y-4">
                    <div className="relative rounded-2xl overflow-hidden max-h-60 border border-slate-200 dark:border-slate-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photoPreview}
                        alt="Evidence preview"
                        className="w-full h-auto object-cover"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                        {isAmharic ? "ለፎቶው አጭር ርዕስ ይስጡ" : "Add a quick title for this photo"}
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={t.reportPage.textTitlePlaceholder}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="px-6 py-3 rounded-xl bg-[#0f3d2e] hover:bg-[#134e3a] text-white font-bold text-sm transition flex items-center gap-2 cursor-pointer"
                      >
                        <span>{t.reportPage.nextBtn}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            STEP 2: LOCATION ("Where is it located?")
           ========================================================================= */}
        {step === 2 && (
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-10 shadow-lg space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                {t.reportPage.subCityLabel}
              </label>
              <select
                value={selectedSubCity}
                onChange={(e) => setSelectedSubCity(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
              >
                {subCities.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                {t.reportPage.addressLabel}
              </label>
              <input
                type="text"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder={t.reportPage.addressPlaceholder}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                {isAmharic ? "የአቅራቢያ መለያ ምልክት (አማራጭ)" : "Nearest Landmark (Optional)"}
              </label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder={isAmharic ? "ምሳሌ፡ ባንክ ፊት ለፊት፣ ከፋርማሲ 20 ሜትር ርቆ" : "e.g. In front of commercial bank branch, 20m from pharmacy"}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t.reportPage.backBtn}</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-3 rounded-xl bg-[#0f3d2e] hover:bg-[#134e3a] text-white font-bold text-sm transition flex items-center gap-2 cursor-pointer shadow-md"
              >
                <span>{t.reportPage.nextBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 3: REVIEW ("Review your report")
           ========================================================================= */}
        {step === 3 && (
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-10 shadow-lg space-y-6">
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-[#f8faf8] dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold uppercase">
                    {selectedCategoryLabel}
                  </span>
                  {hasVoiceAudio && (
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <Mic className="w-3.5 h-3.5" />
                      <span>{isAmharic ? "የድምፅ ቅጂ ተያይዟል" : "Audio attached"}</span>
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {title || (isAmharic ? "የዜግነት ሪፖርት" : "Civic Incident Report")}
                </h3>

                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {description || (isAmharic ? "መግለጫ አልተሰጠም።" : "No description provided.")}
                </p>

                <div className="pt-2 border-t border-slate-200/70 dark:border-slate-750 flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>
                    {streetAddress}, {selectedSubCityLabel} {landmark && `(${landmark})`}
                  </span>
                </div>
              </div>

              {/* Anonymity Switch */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {t.reportPage.anonymousLabel}
                    </p>
                    <p className="text-xs text-slate-500">
                      {t.reportPage.anonymousHint}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAnonymous(!isAnonymous)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    isAnonymous ? "bg-[#0f3d2e]" : "bg-slate-300"
                  }`}
                  aria-label="Toggle anonymous"
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform ${
                      isAnonymous ? "right-0.5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t.reportPage.backBtn}</span>
              </button>

              <button
                type="button"
                onClick={handleSubmitFinal}
                className="px-8 py-3.5 rounded-2xl bg-[#0f3d2e] hover:bg-[#134e3a] text-white font-extrabold text-sm transition flex items-center gap-2 cursor-pointer shadow-xl shadow-emerald-950/20 hover:scale-[1.02]"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{t.reportPage.submitBtn}</span>
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 4: SUBMITTED SUCCESS
           ========================================================================= */}
        {step === 4 && (
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-8 sm:p-12 text-center shadow-xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 font-mono">
                {t.reportPage.trackRef} {submittedRef}
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">
                {t.reportPage.successTitle}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                {t.reportPage.successSub}
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/map"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#0f3d2e] hover:bg-[#134e3a] text-white font-bold text-xs transition"
              >
                {isAmharic ? "በማህበረሰብ ካርታ ላይ ይመልከቱ" : "View on Community Map"}
              </Link>
              <button
                type="button"
                onClick={() => {
                  setTitle("");
                  setDescription("");
                  setHasVoiceAudio(false);
                  setPhotoPreview(null);
                  setStep(1);
                }}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs transition"
              >
                {t.reportPage.reportAnotherBtn}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

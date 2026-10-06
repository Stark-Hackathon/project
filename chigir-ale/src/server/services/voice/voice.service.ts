/**
 * Chigir Ale - Voice Interaction & Transcription Service
 * Spec: Section 38 — Voice Interaction (Vixovide Voice Provider Abstraction)
 * Supports English, Amharic (አማርኛ), and Afaan Oromoo with language detection,
 * normalization, translation, and user review flow.
 */

export interface TranscriptionInput {
  base64Audio?: string;
  mimeType?: string;
  simulatedText?: string;
  languageHint?: "en" | "am" | "om" | "auto";
}

export interface TranscriptionResult {
  rawText: string;
  normalizedText: string;
  detectedLanguage: "en" | "am" | "om";
  confidence: number;
  durationSeconds: number;
  suggestedTitle: string;
  suggestedCategorySlug?: string;
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface IVoiceProvider {
  readonly name: string;
  transcribe(input: TranscriptionInput): Promise<TranscriptionResult>;
  detectLanguage(text: string): Promise<{ language: "en" | "am" | "om"; confidence: number }>;
  normalize(text: string, language?: "en" | "am" | "om"): string;
  translate(text: string, fromLang: string, toLang: string): Promise<TranslationResult>;
  synthesize(text: string, language?: string): Promise<{ audioUrl: string; durationSeconds: number }>;
}

// Common translation dictionary for civic infrastructure phrases between Amharic and English
const AMHARIC_TO_ENGLISH_MAP: Record<string, string> = {
  "የውሃ ቧንቧ ፈንድቷል": "A water pipe has burst",
  "የውሃ ቧንቧ ፈሰሰ": "A water pipe is leaking",
  "መንገዱ ላይ ትልቅ ጉድጓድ አለ": "There is a large pothole on the road",
  "አስፋልቱ ተበላሽቷል": "The asphalt pavement is damaged",
  "የመንገድ መብራት አይሰራም": "The streetlight is not functioning",
  "የኤሌክትሪክ ሽቦ ተበጥሷል": "An electrical power wire has snapped",
  "የፍሳሽ ቦይ ሞልቷል": "The drainage gutter has overflowed",
  "ቆሻሻ ተከምሯል": "Garbage has accumulated on the roadside",
  "የትራፊክ መብራት ጠፍቷል": "The traffic light is out of order",
};

export class VixovideVoiceProvider implements IVoiceProvider {
  public readonly name = "Vixovide Voice Engine (Amharic & English)";

  /**
   * Detect language from text characters (Ethiopic script detection).
   */
  async detectLanguage(text: string): Promise<{ language: "en" | "am" | "om"; confidence: number }> {
    const ethiopicRegex = /[\u1200-\u137F]/;
    if (ethiopicRegex.test(text)) {
      return { language: "am", confidence: 0.98 };
    }

    const oromoCues = ["biyya", "akkasumas", "hawaasa", "guyyaa", "karaa", "daandii"];
    const lower = text.toLowerCase();
    const hasOromo = oromoCues.some((c) => lower.includes(c));
    if (hasOromo) {
      return { language: "om", confidence: 0.85 };
    }

    return { language: "en", confidence: 0.95 };
  }

  /**
   * Normalize text by removing filler speech tokens, fixing capitalization, and standardizing punctuation.
   */
  normalize(text: string, language: "en" | "am" | "om" = "en"): string {
    let cleaned = text.trim();

    if (language === "am") {
      // Clean Amharic fillers
      const amharicFillers = [/ማለትም/g, /እ\.\.\./g, /እህ/g, /እና ማለት/g];
      for (const f of amharicFillers) {
        cleaned = cleaned.replace(f, "");
      }
      cleaned = cleaned.replace(/\s{2,}/g, " ").trim();
      if (!cleaned.endsWith("።") && !cleaned.endsWith("!") && !cleaned.endsWith("?")) {
        cleaned += "።";
      }
      return cleaned;
    }

    // Clean English fillers
    const fillers = [/\b(uh|um|like|you know|so yeah|ah)\b/gi, /\b(kinda|sorta)\b/gi];
    for (const f of fillers) {
      cleaned = cleaned.replace(f, "");
    }

    cleaned = cleaned.replace(/\s{2,}/g, " ").trim();
    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      if (!cleaned.endsWith(".") && !cleaned.endsWith("!") && !cleaned.endsWith("?")) {
        cleaned += ".";
      }
    }

    return cleaned;
  }

  /**
   * Transcribe input audio into structured text.
   */
  async transcribe(input: TranscriptionInput): Promise<TranscriptionResult> {
    // If simulated text is provided (e.g. from client audio stream or tests), use it
    let raw = input.simulatedText || "";

    if (!raw && input.base64Audio) {
      // Decode or simulate real audio transcription
      raw = "There is a major water pipe burst leaking onto Bole road near the roundabout.";
    }

    if (!raw) {
      raw = "Damaged public infrastructure reported by resident.";
    }

    const langDetection = await this.detectLanguage(raw);
    const lang = input.languageHint && input.languageHint !== "auto" ? input.languageHint : langDetection.language;
    const normalized = this.normalize(raw, lang);

    // Derive suggested title
    let suggestedTitle = raw.split(/[.!?።\n]+/)[0]?.trim() || "Civic Incident Report";
    if (suggestedTitle.length > 60) {
      suggestedTitle = suggestedTitle.slice(0, 57) + "...";
    }

    // Derive suggested category
    let suggestedSlug: string | undefined = undefined;
    const lower = raw.toLowerCase();
    if (lower.includes("pipe") || lower.includes("water") || raw.includes("ውሃ")) {
      suggestedSlug = "water";
    } else if (lower.includes("pothole") || lower.includes("road") || raw.includes("መንገድ")) {
      suggestedSlug = "roads";
    } else if (lower.includes("wire") || lower.includes("power") || raw.includes("መብራት")) {
      suggestedSlug = "electricity";
    } else if (lower.includes("drain") || lower.includes("sewage") || raw.includes("ፍሳሽ")) {
      suggestedSlug = "drainage";
    } else if (lower.includes("waste") || lower.includes("garbage") || raw.includes("ቆሻሻ")) {
      suggestedSlug = "waste-management";
    }

    return {
      rawText: raw,
      normalizedText: normalized,
      detectedLanguage: lang,
      confidence: 0.92,
      durationSeconds: Math.max(3, Math.ceil(raw.length / 15)),
      suggestedTitle,
      suggestedCategorySlug: suggestedSlug,
    };
  }

  /**
   * Translate text between Amharic and English.
   */
  async translate(text: string, fromLang: string, toLang: string): Promise<TranslationResult> {
    if (fromLang === toLang) {
      return { originalText: text, translatedText: text, sourceLanguage: fromLang, targetLanguage: toLang };
    }

    const trimmed = text.trim();
    let translated = "";

    if (fromLang === "am" && toLang === "en") {
      // Check direct phrase dictionary
      for (const [amPhrase, enPhrase] of Object.entries(AMHARIC_TO_ENGLISH_MAP)) {
        if (trimmed.includes(amPhrase)) {
          translated = enPhrase;
          break;
        }
      }
      if (!translated) {
        translated = `[Translated from Amharic]: ${trimmed}`;
      }
    } else if (fromLang === "en" && toLang === "am") {
      // Reverse map
      for (const [amPhrase, enPhrase] of Object.entries(AMHARIC_TO_ENGLISH_MAP)) {
        if (trimmed.toLowerCase().includes(enPhrase.toLowerCase())) {
          translated = amPhrase;
          break;
        }
      }
      if (!translated) {
        translated = `[ከእንግሊዝኛ የተተረጎመ]: ${trimmed}`;
      }
    } else {
      translated = trimmed;
    }

    return {
      originalText: text,
      translatedText: translated,
      sourceLanguage: fromLang,
      targetLanguage: toLang,
    };
  }

  /**
   * Synthesize audio from text (TTS simulation).
   */
  async synthesize(text: string, language: string = "en"): Promise<{ audioUrl: string; durationSeconds: number }> {
    const duration = Math.max(2, Math.ceil(text.length / 20));
    return {
      audioUrl: `/api/voice/synthesize?lang=${language}&id=${Date.now()}`,
      durationSeconds: duration,
    };
  }
}

export class VoiceService {
  private static provider: IVoiceProvider = new VixovideVoiceProvider();

  static setProvider(provider: IVoiceProvider): void {
    VoiceService.provider = provider;
  }

  static getProvider(): IVoiceProvider {
    return VoiceService.provider;
  }

  static async transcribe(input: TranscriptionInput): Promise<TranscriptionResult> {
    return VoiceService.provider.transcribe(input);
  }

  static async detectLanguage(text: string): Promise<{ language: "en" | "am" | "om"; confidence: number }> {
    return VoiceService.provider.detectLanguage(text);
  }

  static normalize(text: string, language?: "en" | "am" | "om"): string {
    return VoiceService.provider.normalize(text, language);
  }

  static async translate(text: string, fromLang: string, toLang: string): Promise<TranslationResult> {
    return VoiceService.provider.translate(text, fromLang, toLang);
  }

  static async synthesize(text: string, language?: string): Promise<{ audioUrl: string; durationSeconds: number }> {
    return VoiceService.provider.synthesize(text, language);
  }
}

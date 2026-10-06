/**
 * Chigir Ale - Voice Transcription API
 * Spec: Section 38 (Voice Interaction)
 */
import { NextResponse } from "next/server";
import { VoiceService } from "@/server/services/voice/voice.service";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { base64Audio, simulatedText, languageHint } = body;

    const result = await VoiceService.transcribe({
      base64Audio,
      simulatedText,
      languageHint,
    });

    return NextResponse.json({
      success: true,
      transcription: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Transcription failed",
      },
      { status: 500 }
    );
  }
}

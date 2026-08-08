import { NextResponse } from "next/server";
import {
  parsePartText,
  AiParseError,
  type ParsePartInput,
} from "@/lib/ai/part-parser";

/**
 * AI smart-paste for parts: turn raw pasted supplier text into structured parts.
 * Provider routing lives in `lib/ai/llm.ts` — Groq primary (GROQ_API_KEY),
 * Claude Haiku 4.5 fallback on rate-limit (CLAUDE_API_KEY), both server-only.
 * Called by the parts bulk-upload view.
 */
export async function POST(req: Request) {
  try {
    const input = (await req.json()) as ParsePartInput;
    if (!input?.rawText?.trim()) {
      return NextResponse.json(
        { error: "No text provided to parse" },
        { status: 400 },
      );
    }
    const result = await parsePartText(input);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AiParseError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Parts AI Parse Route Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

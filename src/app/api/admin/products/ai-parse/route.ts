import { NextResponse } from "next/server";
import {
  parseProductText,
  AiParseError,
  type ParseProductInput,
} from "@/lib/ai/product-parser";

/**
 * AI smart-paste: turn raw pasted product text into structured products.
 * Provider routing lives in `lib/ai/llm.ts` — Groq primary (GROQ_API_KEY),
 * Claude Haiku 4.5 fallback on rate-limit (CLAUDE_API_KEY), both server-only.
 * Called by the bulk-upload view and the single-product create/edit form.
 */
export async function POST(req: Request) {
  try {
    const input = (await req.json()) as ParseProductInput;
    if (!input?.rawText?.trim()) {
      return NextResponse.json(
        { error: "No text provided to parse" },
        { status: 400 },
      );
    }
    const result = await parseProductText(input);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AiParseError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("AI Parse Route Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

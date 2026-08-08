import type { AiParsedPart } from "@/lib/ai/part-parser";
import type { Brand, Category, PartType } from "../types/parts";

/**
 * Client helper that calls the parts AI parse route. Assembles the matching
 * taxonomy (categories + brands + part types) the model picks IDs from, so the
 * request shape lives in one place. Shared by the bulk paste panel.
 */
export async function parsePartsViaAi(params: {
  rawText: string;
  categories: Category[];
  brands: Brand[];
  partTypes: PartType[];
}): Promise<AiParsedPart[]> {
  const res = await fetch("/api/admin/parts/ai-parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      rawText: params.rawText,
      categories: params.categories.map((c) => ({ id: c.id, name: c.name })),
      brands: params.brands.map((b) => ({ id: b.id, name: b.name })),
      partTypes: params.partTypes.map((t) => ({ id: t.id, name: t.name })),
    }),
  });
  const data: { parts?: AiParsedPart[]; error?: string } = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to parse text");
  return data.parts ?? [];
}

export type { AiParsedPart };

import {
  RESEARCH_EXCLUDED_DOMAINS,
  RESEARCH_MODEL_CONFIG,
} from "@/lib/domain/proposal/constants";
import type {
  ClientCostItem,
  ConfidenceLevel,
  ProposalEvidence,
  ProposalSectionId,
  ProposalSource,
} from "@/lib/domain/proposal/schema";
import type { PricingContext } from "./prompt";
import { z } from "zod";

const trimmedStr = z.string().transform((s) => s.trim());

const nonEmptyStr = trimmedStr.refine((s) => s.length > 0, {
  message: "must not be empty",
});

const nullableTrimmed = z
  .union([z.string(), z.null()])
  .nullable()
  .transform((v) => (v == null || v.trim() === "" ? null : v.trim()));

const ResearchEvidenceSchema = z.object({
  claim: nonEmptyStr,
  section: z.enum([
    "overview",
    "scope",
    "deliverables",
    "timeline",
    "pricing",
    "clientCosts",
    "techStack",
    "boundaries",
    "risks",
    "assumptions",
    "nextSteps",
  ]),
  sourceUrl: nonEmptyStr,
  sourceRationale: nonEmptyStr,
});

const ResearchVendorCostSchema = z.object({
  item: nonEmptyStr,
  category: nonEmptyStr,
  estimatedCost: nonEmptyStr,
  mandatory: z.boolean(),
  notes: nullableTrimmed,
  confidence: z.enum(["high", "medium", "low"]),
  sourceUrl: nullableTrimmed,
  sourceRationale: nullableTrimmed,
});

const ResearchPacketSchema = z.object({
  summary: nonEmptyStr,
  dataQuality: z.enum(["high", "medium", "low"]),
  caveat: nonEmptyStr,
  evidence: z.array(ResearchEvidenceSchema).default([]),
  vendorCosts: z.array(ResearchVendorCostSchema).default([]),
  openQuestions: z
    .array(trimmedStr)
    .default([])
    .transform((items) => items.filter((item) => item.length > 0)),
});

interface RawResearchEvidence {
  claim: string;
  section: ProposalSectionId | "overview";
  sourceUrl: string;
  sourceRationale: string;
}

interface RawResearchVendorCost {
  item: string;
  category: string;
  estimatedCost: string;
  mandatory: boolean;
  notes: string | null;
  confidence: ConfidenceLevel;
  sourceUrl: string | null;
  sourceRationale: string | null;
}

export interface ResearchPacket {
  summary: string;
  dataQuality: ConfidenceLevel;
  caveat: string;
  evidence: ProposalEvidence[];
  vendorCosts: ClientCostItem[];
  openQuestions: string[];
  sources: ProposalSource[];
}

interface GroqSearchResult {
  title?: unknown;
  url?: unknown;
  content?: unknown;
  score?: unknown;
}

function buildResearchSystemPrompt(): string {
  return `You are a research analyst preparing factual inputs for a software project proposal.
Use current web results when relevant. Prefer official pricing pages, official product docs,
platform documentation, and primary vendor sources over blogs or social posts.

Return ONLY a raw JSON object with this exact shape:
{
  "summary": string,
  "dataQuality": "high" | "medium" | "low",
  "caveat": string,
  "evidence": [
    {
      "claim": string,
      "section": "overview" | "scope" | "deliverables" | "timeline" | "pricing" | "clientCosts" | "techStack" | "boundaries" | "risks" | "assumptions" | "nextSteps",
      "sourceUrl": string,
      "sourceRationale": string
    }
  ],
  "vendorCosts": [
    {
      "item": string,
      "category": string,
      "estimatedCost": string,
      "mandatory": boolean,
      "notes": string | null,
      "confidence": "high" | "medium" | "low",
      "sourceUrl": string | null,
      "sourceRationale": string | null
    }
  ],
  "openQuestions": string[]
}

Rules:
- Focus only on factual claims that matter for this requirement: direct client-borne tools,
  vendor pricing, platform constraints, integration prerequisites, and region-specific service choices.
- Do NOT estimate freelancer pricing, development days, or scope. Those are not facts.
- Keep evidence concise, current, and directly relevant to the requirement.
- For any numeric vendor price, provide sourceUrl and sourceRationale from the exact page you relied on.
- If pricing depends on usage or the source is unclear, set estimatedCost to "Varies - verify current vendor pricing."
  and leave sourceUrl/sourceRationale null.
- Set dataQuality to "high" only when the most important claims are supported by current primary sources.
- If evidence is weak, be explicit in caveat and openQuestions instead of pretending certainty.
- Prefer official vendor URLs over summaries, reviews, or comparison articles.
- Do not include markdown or citations inside the JSON strings.`;
}

function buildResearchUserMessage(
  requirement: string,
  pricingCtx: PricingContext
): string {
  const location =
    pricingCtx.clientType === "domestic" ? "India" : "International";

  return `Project requirement:

${requirement}

Client market context: ${location}
Currency context: ${pricingCtx.currency}

Research goals:
- Identify source-backed facts that materially affect scope, feasibility, or client costs.
- Identify direct client-borne services and price them only when a credible current source exists.
- Highlight missing information that blocks honest estimates.
- Ignore generic software-development advice.`;
}

function stripMarkdownFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function extractJsonObject(raw: string): string {
  const stripped = stripMarkdownFences(raw);
  const first = stripped.indexOf("{");
  const last = stripped.lastIndexOf("}");

  if (first >= 0 && last > first) {
    return stripped.slice(first, last + 1);
  }

  return stripped;
}

function dedupeStrings(items: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const item of items) {
    const trimmed = item.trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) continue;
    seen.add(key);
    output.push(trimmed);
  }

  return output;
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url.trim());
    parsed.hash = "";
    if (parsed.pathname.endsWith("/") && parsed.pathname !== "/") {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }
    return parsed.toString();
  } catch {
    return url.trim();
  }
}

function clipSnippet(text: string | null, maxLength = 180): string | null {
  if (!text) return null;
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3).trim()}...`;
}

function buildSourceLookup(payload: unknown): Map<string, { title: string; snippet: string | null; score: number }> {
  const toolChoices =
    (payload as {
      choices?: Array<{
        message?: {
          executed_tools?: Array<{ search_results?: { results?: GroqSearchResult[] } }>;
        };
      }>;
    })?.choices ?? [];

  const rawResults = toolChoices.flatMap((choice) =>
    choice.message?.executed_tools?.flatMap(
      (tool) => tool.search_results?.results ?? []
    ) ?? []
  );

  const lookup = new Map<string, { title: string; snippet: string | null; score: number }>();

  for (const result of rawResults) {
    const title = typeof result.title === "string" ? result.title.trim() : "";
    const url = typeof result.url === "string" ? normalizeUrl(result.url) : "";
    const snippet =
      typeof result.content === "string" && result.content.trim().length > 0
        ? clipSnippet(result.content.trim())
        : null;
    const score =
      typeof result.score === "number" && Number.isFinite(result.score)
        ? result.score
        : 0;

    if (!title || !url) continue;

    const existing = lookup.get(url);
    if (!existing || score > existing.score) {
      lookup.set(url, { title, snippet, score });
    }
  }

  return lookup;
}

function normalizeEvidence(
  items: RawResearchEvidence[],
  sourceLookup: Map<string, { title: string; snippet: string | null; score: number }>
): ProposalEvidence[] {
  const seen = new Set<string>();
  const output: ProposalEvidence[] = [];

  for (const item of items) {
    const sourceUrl = normalizeUrl(item.sourceUrl);
    const source = sourceLookup.get(sourceUrl);
    if (!source) continue;

    const key = `${item.section}::${item.claim}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    output.push({
      claim: item.claim.trim(),
      section: item.section,
      sourceTitle: source.title,
      sourceUrl,
      sourceRationale: item.sourceRationale.trim(),
    });
  }

  return output.slice(0, 8);
}

function normalizeVendorCosts(
  items: RawResearchVendorCost[],
  sourceLookup: Map<string, { title: string; snippet: string | null; score: number }>
): ClientCostItem[] {
  const seen = new Set<string>();
  const output: ClientCostItem[] = [];

  for (const item of items) {
    const key = `${item.category}::${item.item}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const normalizedSourceUrl = item.sourceUrl ? normalizeUrl(item.sourceUrl) : null;
    const source = normalizedSourceUrl ? sourceLookup.get(normalizedSourceUrl) : null;

    output.push({
      item: item.item.trim(),
      category: item.category.trim(),
      estimatedCost: item.estimatedCost.trim(),
      mandatory: item.mandatory,
      notes: item.notes,
      sourceTitle: source?.title ?? null,
      sourceUrl: source ? normalizedSourceUrl : null,
      sourceRationale: source ? item.sourceRationale?.trim() ?? null : null,
      confidence: item.confidence,
    });
  }

  return output.slice(0, 6);
}

function deriveSources(
  evidence: ProposalEvidence[],
  vendorCosts: ClientCostItem[],
  sourceLookup: Map<string, { title: string; snippet: string | null; score: number }>
): ProposalSource[] {
  const refs = new Map<string, ProposalSource>();

  for (const item of evidence) {
    refs.set(item.sourceUrl, {
      title: item.sourceTitle,
      url: item.sourceUrl,
      snippet: clipSnippet(item.sourceRationale),
    });
  }

  for (const item of vendorCosts) {
    if (!item.sourceUrl || !item.sourceTitle || !item.sourceRationale) continue;
    refs.set(item.sourceUrl, {
      title: item.sourceTitle,
      url: item.sourceUrl,
      snippet: clipSnippet(item.sourceRationale),
    });
  }

  if (refs.size > 0) {
    return Array.from(refs.values()).slice(0, 6);
  }

  return Array.from(sourceLookup.entries())
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 4)
    .map(([url, source]) => ({
      title: source.title,
      url,
      snippet: source.snippet,
    }));
}

export async function researchRequirement(
  requirement: string,
  pricingCtx: PricingContext
): Promise<ResearchPacket> {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: RESEARCH_MODEL_CONFIG.model,
      temperature: RESEARCH_MODEL_CONFIG.temperature,
      max_completion_tokens: RESEARCH_MODEL_CONFIG.maxTokens,
      messages: [
        { role: "system", content: buildResearchSystemPrompt() },
        { role: "user", content: buildResearchUserMessage(requirement, pricingCtx) },
      ],
      search_settings: {
        country:
          pricingCtx.clientType === "domestic" ? "india" : "united states",
        exclude_domains: RESEARCH_EXCLUDED_DOMAINS,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`research request failed (${response.status}): ${text}`);
  }

  const payload = (await response.json()) as unknown;
  const rawText =
    (payload as { choices?: Array<{ message?: { content?: string } }> })?.choices?.[0]
      ?.message?.content ?? "";

  const parsed = ResearchPacketSchema.parse(JSON.parse(extractJsonObject(rawText)));
  const sourceLookup = buildSourceLookup(payload);
  const evidence = normalizeEvidence(parsed.evidence as RawResearchEvidence[], sourceLookup);
  const vendorCosts = normalizeVendorCosts(
    parsed.vendorCosts as RawResearchVendorCost[],
    sourceLookup
  );

  return {
    summary: parsed.summary,
    dataQuality: parsed.dataQuality,
    caveat: parsed.caveat,
    evidence,
    vendorCosts,
    openQuestions: dedupeStrings(parsed.openQuestions).slice(0, 4),
    sources: deriveSources(evidence, vendorCosts, sourceLookup),
  };
}

// Runtime schema for model output validation and normalization.
// Single source of validation truth: structural, type-level, and semantic rules
// all live here. Callers receive a clean Proposal with no further processing.

import { z } from "zod";
import { PRICING_GUARDRAILS, TIMELINE_GUARDRAILS } from "./constants";

const NUMERIC_COST_PATTERN = /\d|%/;

// --- Reusable field primitives -----------------------------------------------

const trimmedStr = z.string().transform((s) => s.trim());

const nonEmptyStr = z
  .string()
  .transform((s) => s.trim())
  .refine((s) => s.length > 0, { message: "must not be empty" });

const nullableTrimmed = z
  .union([z.string(), z.null()])
  .nullable()
  .transform((v) => (v == null || v.trim() === "" ? null : v.trim()));

const strArray = z
  .array(z.string())
  .default([])
  .transform((arr) => arr.map((s) => s.trim()).filter((s) => s.length > 0));

function clampedInt(min: number, max: number) {
  return z
    .number()
    .transform((n) => Math.round(Math.min(Math.max(n, min), max)));
}

// --- Nested schemas ----------------------------------------------------------

const TimelinePhaseSchema = z.object({
  name: nonEmptyStr,
  days: clampedInt(
    TIMELINE_GUARDRAILS.minDaysPerPhase,
    TIMELINE_GUARDRAILS.maxDaysPerPhase
  ),
  notes: nullableTrimmed,
});

const PricingModuleSchema = z.object({
  module: nonEmptyStr,
  rationale: nonEmptyStr,
  cost: nonEmptyStr,
});

const ClientCostItemSchema = z
  .object({
    item: nonEmptyStr,
    category: nonEmptyStr,
    estimatedCost: nonEmptyStr,
    mandatory: z.boolean(),
    notes: nullableTrimmed.optional().default(null),
    sourceTitle: nullableTrimmed.optional().default(null),
    sourceUrl: nullableTrimmed.optional().default(null),
    sourceRationale: nullableTrimmed.optional().default(null),
    confidence: z.enum(["high", "medium", "low"]).default("low"),
  })
  .superRefine((cost, ctx) => {
    const hasNumericCost = NUMERIC_COST_PATTERN.test(cost.estimatedCost);
    const hasSourceMeta =
      !!cost.sourceTitle && !!cost.sourceUrl && !!cost.sourceRationale;

    if (hasNumericCost && !hasSourceMeta) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "numeric client costs require sourceTitle, sourceUrl, and sourceRationale",
      });
    }
  });

const ProposalSourceSchema = z.object({
  title: nonEmptyStr,
  url: nonEmptyStr,
  snippet: nullableTrimmed,
});

const ProposalEvidenceSchema = z.object({
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
  sourceTitle: nonEmptyStr,
  sourceUrl: nonEmptyStr,
  sourceRationale: nonEmptyStr,
});

const UnsupportedClaimSchema = z.object({
  claim: nonEmptyStr,
  reason: nonEmptyStr,
});

const SectionConfidenceSchema = z.object({
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
  level: z.enum(["high", "medium", "low"]),
  reason: nonEmptyStr,
});

const ProposalConfidenceSchema = z.object({
  overall: z.enum(["high", "medium", "low"]).default("low"),
  note: nonEmptyStr.default("This draft contains estimates and should be reviewed."),
  sections: z.array(SectionConfidenceSchema).default([]),
});

const TechChoiceSchema = z.object({
  layer: nonEmptyStr,
  choice: nonEmptyStr,
  reason: nonEmptyStr,
});

// --- Root schema -------------------------------------------------------------

export const ProposalSchema = z
  .object({
    overview: z
      .object({
        summary: nonEmptyStr,
        outcome: nonEmptyStr,
        feasibility: z.enum(["green", "amber", "orange", "red"]),
        feasibilityNote: nullableTrimmed,
      })
      .refine(
        (ov) =>
          !(
            (ov.feasibility === "orange" || ov.feasibility === "red") &&
            !ov.feasibilityNote
          ),
        {
          message:
            "feasibilityNote is required when feasibility is orange or red",
          path: ["feasibilityNote"],
        }
      ),
    scope: z.object({
      core: strArray.refine((arr) => arr.length >= 1, {
        message: "scope.core must contain at least one item",
      }),
      extended: strArray,
    }),
    deliverables: strArray,
    timeline: z
      .object({
        phases: z
          .array(TimelinePhaseSchema)
          .min(1, "timeline must have at least one phase"),
        totalDays: z.number().optional(),
        dependencies: strArray,
      })
      .transform((tl) => {
        const derivedTotal = tl.phases.reduce((sum, ph) => sum + ph.days, 0);
        return {
          phases: tl.phases,
          totalDays: Math.min(
            Math.max(derivedTotal, TIMELINE_GUARDRAILS.minTotalDays),
            TIMELINE_GUARDRAILS.maxTotalDays
          ),
          dependencies: tl.dependencies,
        };
      }),
    pricing: z
      .object({
        totalMin: clampedInt(
          PRICING_GUARDRAILS.minUSD,
          PRICING_GUARDRAILS.maxUSD
        ),
        totalMax: clampedInt(
          PRICING_GUARDRAILS.minUSD,
          PRICING_GUARDRAILS.maxUSD
        ),
        currency: trimmedStr.default("USD"),
        modules: z
          .array(PricingModuleSchema)
          .min(1, "pricing must have at least 1 module"),
        rationale: z.string().trim().refine((s) => s.length >= 30, {
          message:
            "pricing.rationale must be at least 30 characters (not a placeholder)",
        }),
        valueJustification: nonEmptyStr,
        variabilityNote: nonEmptyStr,
      })
      .refine((pr) => pr.totalMax >= pr.totalMin, {
        message: "pricing.totalMax must be >= totalMin",
        path: ["totalMax"],
      }),
    clientCosts: z.array(ClientCostItemSchema).default([]),
    techStack: z.array(TechChoiceSchema).default([]),
    boundaries: strArray,
    risks: strArray,
    assumptions: strArray,
    nextSteps: strArray,
    confidence: ProposalConfidenceSchema.default({
      overall: "low",
      note: "This draft contains estimates and should be reviewed.",
      sections: [],
    }),
    evidence: z.array(ProposalEvidenceSchema).default([]),
    unsupportedClaims: z.array(UnsupportedClaimSchema).default([]),
    sources: z.array(ProposalSourceSchema).default([]),
  })
  .superRefine((proposal, ctx) => {
    if (proposal.confidence.overall !== "high" && proposal.assumptions.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["assumptions"],
        message: "assumptions are required when confidence is not high",
      });
    }
  });

export type ParsedProposal = z.output<typeof ProposalSchema>;

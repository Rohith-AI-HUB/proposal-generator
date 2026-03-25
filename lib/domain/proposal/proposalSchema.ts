// Runtime schema for model output validation and normalization.
// Single source of validation truth: structural, type-level, and semantic rules
// all live here. The handwritten validator.ts is replaced by this.
//
// Transforms are applied during parse so the output is already normalized:
// strings trimmed, blank items filtered, numbers clamped, totalDays derived
// from phase sums. Callers receive a clean Proposal with no further processing.

import { z } from "zod";
import { PRICING_GUARDRAILS, TIMELINE_GUARDRAILS } from "./constants";

// --- Reusable field primitives -----------------------------------------------

// Trims whitespace. Does not enforce non-empty (use nonEmptyStr where needed).
const trimmedStr = z.string().transform((s) => s.trim());

// Trims and rejects empty strings.
const nonEmptyStr = z
  .string()
  .transform((s) => s.trim())
  .refine((s) => s.length > 0, { message: "must not be empty" });

// Array of strings: trims each item, filters out blank strings.
const strArray = z
  .array(z.string())
  .transform((arr) => arr.map((s) => s.trim()).filter((s) => s.length > 0));

// Integer within [min, max]. Rounds floats. Clamps out-of-range values.
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
  notes: z
    .union([z.string(), z.null()])
    .nullable()
    .transform((v) => (v == null || v.trim() === "" ? null : v.trim())),
});

const PricingModuleSchema = z.object({
  module: nonEmptyStr,
  rationale: nonEmptyStr,
  cost: nonEmptyStr,
});

const ClientCostItemSchema = z.object({
  item: nonEmptyStr,
  category: nonEmptyStr,
  estimatedCost: nonEmptyStr,
  mandatory: z.boolean(),
  notes: z
    .union([z.string(), z.null()])
    .nullable()
    .transform((v) => (v == null || v.trim() === "" ? null : v.trim())),
});

const TechChoiceSchema = z.object({
  layer: nonEmptyStr,
  choice: nonEmptyStr,
  reason: nonEmptyStr,
});

// --- Root schema -------------------------------------------------------------

export const ProposalSchema = z
  .object({
    // Overview ----------------------------------------------------------------
    overview: z
      .object({
        summary: nonEmptyStr,
        outcome: nonEmptyStr,
        feasibility: z.enum(["green", "amber", "orange", "red"]),
        feasibilityNote: z
          .union([z.string(), z.null()])
          .nullable()
          .transform((v) => (v == null || v.trim() === "" ? null : v.trim())),
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

    // Scope -------------------------------------------------------------------
    scope: z.object({
      core: strArray.refine((arr) => arr.length >= 1, {
        message: "scope.core must contain at least one item",
      }),
      extended: strArray,
    }),

    // Deliverables ------------------------------------------------------------
    deliverables: strArray,

    // Timeline ----------------------------------------------------------------
    // totalDays from the model is IGNORED and re-derived from phase sums.
    // This prevents the model from reporting a total that contradicts its phases.
    timeline: z
      .object({
        phases: z
          .array(TimelinePhaseSchema)
          .min(1, "timeline must have at least one phase"),
        totalDays: z.number().optional(), // accepted but overwritten below
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

    // Pricing -----------------------------------------------------------------
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
        rationale: z
          .string()
          .trim()
          .refine((s) => s.length >= 30, {
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

    // Flat arrays -------------------------------------------------------------
    clientCosts: z.array(ClientCostItemSchema).default([]),
    techStack: z.array(TechChoiceSchema),
    boundaries: strArray,
    risks: strArray,
    assumptions: strArray,
    nextSteps: strArray,
  });

// Inferred output type. Compatible with the Proposal interface in schema.ts.
export type ParsedProposal = z.output<typeof ProposalSchema>;

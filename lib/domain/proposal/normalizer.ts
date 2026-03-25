// Sanitizes a validated Proposal before it reaches the UI or renderer.
// Assumes validateProposal() has already confirmed structural shape.
// Clamps numbers to guardrails, trims strings, ensures arrays are never null.

import type { Proposal } from "./schema";
import { PRICING_GUARDRAILS, TIMELINE_GUARDRAILS } from "./constants";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function trimStr(s: unknown): string {
  return typeof s === "string" ? s.trim() : "";
}

function safeArray<T>(arr: unknown): T[] {
  return Array.isArray(arr) ? arr : [];
}

export function normalizeProposal(p: Proposal): Proposal {
  return {
    overview: {
      summary: trimStr(p.overview.summary),
      outcome: trimStr(p.overview.outcome),
      feasibility: p.overview.feasibility,
      feasibilityNote: p.overview.feasibilityNote
        ? trimStr(p.overview.feasibilityNote)
        : null,
    },
    scope: {
      core: safeArray<string>(p.scope.core).map(trimStr),
      extended: safeArray<string>(p.scope.extended).map(trimStr),
    },
    deliverables: safeArray<string>(p.deliverables).map(trimStr),
    timeline: {
      phases: safeArray(p.timeline.phases).map((ph) => ({
        name: trimStr((ph as { name: unknown }).name),
        days: clamp(
          Number((ph as { days: unknown }).days) || 1,
          TIMELINE_GUARDRAILS.minDaysPerPhase,
          TIMELINE_GUARDRAILS.maxDaysPerPhase
        ),
        notes: (ph as { notes: unknown }).notes
          ? trimStr((ph as { notes: unknown }).notes)
          : null,
      })),
      totalDays: clamp(
        Number(p.timeline.totalDays) || 1,
        TIMELINE_GUARDRAILS.minTotalDays,
        TIMELINE_GUARDRAILS.maxTotalDays
      ),
      dependencies: safeArray<string>(p.timeline.dependencies).map(trimStr),
    },
    pricing: {
      totalMin: clamp(
        Number(p.pricing.totalMin) || PRICING_GUARDRAILS.minUSD,
        PRICING_GUARDRAILS.minUSD,
        PRICING_GUARDRAILS.maxUSD
      ),
      totalMax: clamp(
        Number(p.pricing.totalMax) || PRICING_GUARDRAILS.minUSD,
        PRICING_GUARDRAILS.minUSD,
        PRICING_GUARDRAILS.maxUSD
      ),
      currency: trimStr(p.pricing.currency) || "USD",
      modules: safeArray(p.pricing.modules).map((m) => ({
        module: trimStr((m as { module: unknown }).module),
        rationale: trimStr((m as { rationale: unknown }).rationale),
        cost: trimStr((m as { cost: unknown }).cost),
      })),
      rationale: trimStr(p.pricing.rationale),
      valueJustification: trimStr(p.pricing.valueJustification),
      variabilityNote: trimStr(p.pricing.variabilityNote),
    },
    clientCosts: safeArray(p.clientCosts).map((c) => ({
      item: trimStr((c as { item: unknown }).item),
      category: trimStr((c as { category: unknown }).category),
      estimatedCost: trimStr((c as { estimatedCost: unknown }).estimatedCost),
      mandatory: Boolean((c as { mandatory: unknown }).mandatory),
      notes: (c as { notes: unknown }).notes
        ? trimStr((c as { notes: unknown }).notes)
        : null,
    })),
    techStack: safeArray(p.techStack).map((t) => ({
      layer: trimStr((t as { layer: unknown }).layer),
      choice: trimStr((t as { choice: unknown }).choice),
      reason: trimStr((t as { reason: unknown }).reason),
    })),
    boundaries: safeArray<string>(p.boundaries).map(trimStr),
    risks: safeArray<string>(p.risks).map(trimStr),
    assumptions: safeArray<string>(p.assumptions).map(trimStr),
    nextSteps: safeArray<string>(p.nextSteps).map(trimStr),
  };
}

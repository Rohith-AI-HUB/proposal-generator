// Structural shape validation. Does not do semantic checks — that's the normalizer.
// Returns a type predicate so callers get the typed Proposal on success.

import type { Proposal } from "@/lib/domain/proposal/schema";

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function isStringArray(v: unknown): boolean {
  return Array.isArray(v) && v.every((i) => typeof i === "string");
}

export function validateProposal(p: unknown): p is Proposal {
  if (!isRecord(p)) return false;

  // overview
  if (!isRecord(p.overview)) return false;
  const ov = p.overview;
  if (typeof ov.summary !== "string") return false;
  if (typeof ov.outcome !== "string") return false;
  if (!["green", "amber", "orange", "red"].includes(ov.feasibility as string)) return false;

  // scope
  if (!isRecord(p.scope)) return false;
  if (!Array.isArray((p.scope as Record<string, unknown>).core)) return false;
  if (!Array.isArray((p.scope as Record<string, unknown>).extended)) return false;

  // deliverables
  if (!Array.isArray(p.deliverables)) return false;

  // timeline
  if (!isRecord(p.timeline)) return false;
  const tl = p.timeline;
  if (!Array.isArray(tl.phases)) return false;
  if (typeof tl.totalDays !== "number") return false;
  if (!Array.isArray(tl.dependencies)) return false;

  // pricing
  if (!isRecord(p.pricing)) return false;
  const pr = p.pricing;
  if (typeof pr.totalMin !== "number") return false;
  if (typeof pr.totalMax !== "number") return false;
  if (!Array.isArray(pr.modules)) return false;
  if (typeof pr.rationale !== "string") return false;
  if (typeof pr.valueJustification !== "string") return false;
  if (typeof pr.variabilityNote !== "string") return false;

  // arrays
  if (!Array.isArray(p.techStack)) return false;
  if (!isStringArray(p.boundaries)) return false;
  if (!Array.isArray(p.risks)) return false;
  if (!Array.isArray(p.assumptions)) return false;
  if (!Array.isArray(p.nextSteps)) return false;

  return true;
}

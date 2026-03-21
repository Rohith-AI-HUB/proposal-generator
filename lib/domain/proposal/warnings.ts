// Client-side warning layer. Runs debounced as the user types.
// Signal detection is imported from signals.ts -- the single source of truth
// shared with the server preprocessor. Patterns cannot drift between sides.
//
// Warnings do NOT block generation. They surface information gaps so the user
// can choose to add detail or proceed knowingly.

import {
  analyzeRequirement,
  SPECIFICITY_MARKERS,
} from "./signals";

export type WarningSeverity = "info" | "caution" | "conflict";

export interface InputWarning {
  id: string;
  severity: WarningSeverity;
  label: string;
  detail: string;
}

export function computeWarnings(requirement: string): InputWarning[] {
  const trimmed = requirement.trim();
  if (trimmed.length < 10) return [];

  const signals = analyzeRequirement(trimmed);
  const hasSpecifics = SPECIFICITY_MARKERS.some((p) => p.test(trimmed));
  const warnings: InputWarning[] = [];

  if (!signals.hasBudget) {
    warnings.push({
      id: "missing-budget",
      severity: "info",
      label: "No budget mentioned",
      detail:
        "Without a budget, pricing will be estimated. The proposal will note this as an assumption.",
    });
  }

  if (!signals.hasDeadline) {
    warnings.push({
      id: "missing-deadline",
      severity: "info",
      label: "No timeline or deadline mentioned",
      detail:
        "The proposal will suggest a realistic schedule. Add a deadline if one exists.",
    });
  }

  if (signals.wordCount < 25 && !hasSpecifics) {
    warnings.push({
      id: "vague-scope",
      severity: "caution",
      label: "Scope too vague for fixed pricing",
      detail:
        "The requirement is short and lacks specific features. The proposal will stay minimal and flag this as an open assumption.",
    });
  }

  if (signals.hasBudgetTimelineConflict) {
    warnings.push({
      id: "scope-deadline-conflict",
      severity: "conflict",
      label: "Budget/timeline conflict likely",
      detail:
        "The requirement describes a large scope with a tight deadline. Expect a feasibility warning in the output.",
    });
  }

  return warnings;
}

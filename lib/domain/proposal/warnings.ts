// Client-side warning layer. Runs debounced as the user types.
// Signal detection is imported from signals.ts -- the single source of truth
// shared with the server preprocessor. Patterns cannot drift between sides.
//
// Warnings do NOT block generation. They surface information gaps so the user
// can choose to add detail or proceed knowingly.

import {
  buildClarificationContext,
  hasClarificationAnswer,
  type ClarificationAnswers,
} from "./clarifications";
import { analyzeRequirement, SPECIFICITY_MARKERS } from "./signals";

export type WarningSeverity = "info" | "caution" | "conflict";

export interface InputWarning {
  id: string;
  severity: WarningSeverity;
  label: string;
  detail: string;
}

const SCOPE_CLARIFICATION_IDS = [
  "user_scope",
  "operating_region",
  "payment_flow",
  "notification_volume",
  "compliance_constraints",
] as const;

export function computeWarnings(
  requirement: string,
  clarificationAnswers: ClarificationAnswers = {}
): InputWarning[] {
  const trimmedRequirement = requirement.trim();
  if (trimmedRequirement.length < 10) return [];

  const analysisInput = buildClarificationContext(trimmedRequirement, clarificationAnswers);
  const signals = analyzeRequirement(analysisInput);
  const hasSpecifics = SPECIFICITY_MARKERS.some((pattern) => pattern.test(analysisInput));
  const hasScopedClarification = SCOPE_CLARIFICATION_IDS.some((id) =>
    hasClarificationAnswer(clarificationAnswers, id)
  );
  const warnings: InputWarning[] = [];

  if (!signals.hasBudget && !hasClarificationAnswer(clarificationAnswers, "budget")) {
    warnings.push({
      id: "missing-budget",
      severity: "info",
      label: "No budget mentioned",
      detail:
        "Without a budget, pricing confidence stays weak and the app will ask follow-up questions before drafting.",
    });
  }

  if (!signals.hasDeadline && !hasClarificationAnswer(clarificationAnswers, "deadline")) {
    warnings.push({
      id: "missing-deadline",
      severity: "info",
      label: "No timeline or deadline mentioned",
      detail:
        "The app can draft a schedule, but it will treat the timeline as an estimate until you clarify this.",
    });
  }

  if (signals.wordCount < 25 && !hasSpecifics && !hasScopedClarification) {
    warnings.push({
      id: "vague-scope",
      severity: "caution",
      label: "Scope too vague for fixed pricing",
      detail:
        "The requirement is short and lacks specific features. Expect clarification questions before any draft is generated.",
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

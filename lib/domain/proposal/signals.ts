// Shared requirement-signal module.
// Imported by BOTH the server preprocessor and the client warnings layer.
// Zero framework imports — pure regex + computation. Safe in any bundle context.
//
// Single source of truth: adding a pattern here updates both the server prompt
// hints and the client UI warnings simultaneously.

export interface RequirementSignals {
  hasBudget: boolean;
  hasDeadline: boolean;
  isVague: boolean;
  wordCount: number;
  hasBudgetTimelineConflict: boolean;
  extractedBudget: string | null;
  extractedDeadline: string | null;
  specificity: "low" | "medium" | "high";
}

// --- Patterns ----------------------------------------------------------------
// Exported so callers can extend or test them individually.

export const BUDGET_PATTERNS: RegExp[] = [
  /\$[\d,]+(?:k|m|K|M)?/,
  /\b\d[\d,]*\s*(?:k|K|usd|USD|dollars?|budget)/,
  /\b(?:budget|total cost|fixed price|spend|afford|max(?:imum)?\s*(?:cost|budget))\b/i,
  /\bnot (?:more|over|above) than\b/i,
  /\bwithin budget\b/i,
];

export const DEADLINE_PATTERNS: RegExp[] = [
  /\bin\s+\d+\s+(?:day|week|month|hour)/i,
  /\bby\s+(?:end of|next|this|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d)/i,
  /\bdeadline\b/i,
  /\blaunch(?:ing)?\s+(?:date|by|in|this|next)\b/i,
  /\bgo(?:-|\s)?live\b/i,
  /\bASAP\b/,
  /\bend of (?:month|quarter|year|week)\b/i,
  /\bQ[1-4]\b/,
  /\bwithin\s+\d+\s+(?:day|week|month)/i,
  /\b\d+\s*(?:day|week|month)s?\s+(?:to|timeline|deadline|window)\b/i,
];

// Words that indicate concrete, specific scope (raises specificity score).
export const SPECIFICITY_MARKERS: RegExp[] = [
  /\b(?:login|auth(?:entication)?|dashboard|api|integration|payment|stripe|webhook|database|admin|role|upload|export|pdf|email|notification|search|filter|map|chart|graph|real.?time|websocket)\b/i,
  /\b(?:user|client|admin|manager|owner)\s+(?:can|should|must|needs? to)\b/i,
];

// Large-scope vocabulary -- raises conflict risk when combined with a tight deadline.
export const LARGE_SCOPE_MARKERS: RegExp[] = [
  /\b(?:platform|marketplace|full.?stack|complete app|entire system|end.?to.?end|saas)\b/i,
  /\bmulti(?:ple)?\s*(?:user|role|tenant|language|platform|device)\b/i,
];

export const TIGHT_DEADLINE =
  /\bin\s+[1-2]\s+weeks?\b|\bASAP\b|\bin\s+\d+\s+days?\b|\bend of (?:week|month)\b/i;

// --- Helpers -----------------------------------------------------------------

export function patternMatches(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

export function extractFirst(text: string, patterns: RegExp[]): string | null {
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[0];
  }
  return null;
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function computeSpecificity(text: string, wc: number): "low" | "medium" | "high" {
  const hits = SPECIFICITY_MARKERS.filter((p) => p.test(text)).length;
  if (wc < 25 && hits === 0) return "low";
  if (hits >= 3 || wc > 80) return "high";
  return "medium";
}

// --- Main --------------------------------------------------------------------

export function analyzeRequirement(requirement: string): RequirementSignals {
  const wc = countWords(requirement);
  const hasBudget = patternMatches(requirement, BUDGET_PATTERNS);
  const hasDeadline = patternMatches(requirement, DEADLINE_PATTERNS);
  const specificity = computeSpecificity(requirement, wc);

  return {
    hasBudget,
    hasDeadline,
    isVague: specificity === "low" || wc < 20,
    wordCount: wc,
    hasBudgetTimelineConflict:
      patternMatches(requirement, LARGE_SCOPE_MARKERS) &&
      TIGHT_DEADLINE.test(requirement),
    extractedBudget: extractFirst(requirement, BUDGET_PATTERNS),
    extractedDeadline: extractFirst(requirement, DEADLINE_PATTERNS),
    specificity,
  };
}

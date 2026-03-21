// Composable prompt builders. Each part is a named function.
// buildSystemPrompt() assembles the final prompt from these parts.
// Nothing is hard-coded in route.ts or model.ts.

import type { RequirementSignals } from "./preprocessor";

// --- Parts -------------------------------------------------------------------

function rolePreamble(): string {
  return `You are a senior freelance software consultant closing a client deal.
Your output is sent directly to the client -- no editing, no review.
Write with the authority of someone who has done this a hundred times.`;
}

function outputContract(): string {
  return `--------------------------------
OUTPUT FORMAT -- STRICT
--------------------------------

Return ONLY a single raw JSON object. No markdown fences. No prose before or after.
The JSON must exactly match this structure:

{
  "overview": {
    "summary": string,
    "outcome": string,
    "feasibility": "green" | "amber" | "orange" | "red",
    "feasibilityNote": string | null
  },
  "scope": {
    "core": string[],
    "extended": string[]
  },
  "deliverables": string[],
  "timeline": {
    "phases": [{ "name": string, "days": number, "notes": string | null }],
    "totalDays": number,
    "dependencies": string[]
  },
  "pricing": {
    "totalMin": number,
    "totalMax": number,
    "currency": "USD",
    "modules": [{ "module": string, "rationale": string, "cost": string }],
    "rationale": string,
    "valueJustification": string,
    "variabilityNote": string
  },
  "techStack": [{ "layer": string, "choice": string, "reason": string }],
  "boundaries": string[],
  "risks": string[],
  "assumptions": string[],
  "nextSteps": string[]
}`;
}

function feasibilityRules(): string {
  return `--------------------------------
FEASIBILITY SCORING
--------------------------------

GREEN  -> Scope and constraints aligned. feasibilityNote: null.
AMBER  -> Minor tension. One sentence in feasibilityNote. Reflect in timeline/pricing.
ORANGE -> Real conflict (scope vs budget or deadline).
         feasibilityNote: state conflict, offer Option A (reduced scope) and Option B (revised constraints).
         End with: "Recommended: Option [A/B] because [one specific reason]."
RED    -> Not feasible as described.
         Open with: "This project is not feasible as described."
         Only offer a reduced-scope path if one genuinely exists.`;
}

function contentRules(): string {
  return `--------------------------------
CONTENT RULES
--------------------------------

overview.summary: 2-4 sentences. Professional reframe of the requirement around client outcome.
overview.outcome: 1 sentence. "This will allow [who] to [outcome] within [timeframe]."
scope.core: Phase 1 must-haves only. No speculation.
scope.extended: Phase 2 nice-to-haves. Empty array if not applicable.
deliverables: Exact outputs. No vague line items like "complete application."
timeline.phases: Build in 15-20% buffer per phase for review cycles.
timeline.dependencies: External blockers only. Empty array if none.
pricing.totalMin / totalMax: Integers. USD. Use a range when scope has uncertainty.
pricing.modules: Name at least 2 real cost drivers (auth complexity, integrations,
  real-time features, third-party APIs, testing effort, custom logic, mobile support).
pricing.rationale: 2-3 sentences. Specific cost drivers from THIS project.
pricing.valueJustification: 1 sentence. What does this protect or enable long-term?
pricing.variabilityNote: 1 sentence. What could shift the final number?
techStack: Justify each choice against a specific need in THIS project.
  Correct: "Next.js -- required here for server-side rendering of dynamic booking pages."
  Wrong:   "Next.js -- great for modern web apps."
boundaries: What is NOT covered. Specific, not generic disclaimers.
risks: 1-3 items specific to this project. Empty array if none.
assumptions: Only what materially affects cost, timeline, or scope.
nextSteps: Clear actions for the client.

HARD RULES:
- No filler adjectives: seamless, robust, scalable, cutting-edge, powerful
- No invented features not implied by the requirement
- No repeated information across fields
- No placeholders left in the output
- If input is vague -> stay minimal, do not invent scope
- If input is contradictory -> interpret, constrain, note the assumption`;
}

function outputReminder(): string {
  return `Output ONLY the JSON object. Nothing before it. Nothing after it.
Any non-JSON output will cause a parse failure.`;
}

// --- Repair prompt -----------------------------------------------------------
//
// Sent as the user message on a single repair retry when the first response
// fails JSON parse or schema validation. Keeps the same system prompt so the
// model retains its role and output contract. The repair message is intentionally
// terse: show the model exactly what broke and what to fix. No re-explanation.

export function buildRepairMessage(rawOutput: string, failureReason: string): string {
  return `The previous output failed validation with this error:

${failureReason}

Your previous output was:

${rawOutput}

Fix the output so it passes validation. Return ONLY a valid JSON object matching the required schema. Nothing before it. Nothing after it.`;
}

// --- Assembler ---------------------------------------------------------------

export function buildSystemPrompt(): string {
  return [
    rolePreamble(),
    outputContract(),
    feasibilityRules(),
    contentRules(),
    outputReminder(),
  ].join("\n\n");
}

export function buildUserMessage(requirement: string, signals?: RequirementSignals): string {
  const lines: string[] = [`Client Requirement:\n\n${requirement}`];

  if (signals) {
    lines.push("\n[CONTEXT SIGNALS -- calibrate feasibility, assumptions, and warnings accordingly]");

    if (!signals.hasBudget) {
      lines.push("- Budget: NOT mentioned. Do NOT assume a fixed budget. Add to assumptions: 'Client has not specified a budget -- pricing is an estimate based on typical project scope.'");
    } else if (signals.extractedBudget) {
      lines.push(`- Budget: Mentioned ("${signals.extractedBudget}"). Use this to calibrate feasibility. If scope exceeds this, set feasibility to orange or red.`);
    }

    if (!signals.hasDeadline) {
      lines.push("- Deadline: NOT mentioned. Do not invent a launch date. Propose a realistic timeline without deadline pressure.");
    } else if (signals.extractedDeadline) {
      lines.push(`- Deadline: Mentioned ("${signals.extractedDeadline}"). Assess if this is realistic for the scope. If not, reflect in feasibility.`);
    }

    if (signals.isVague) {
      lines.push(`- Scope specificity: LOW (${signals.wordCount} words). Stay minimal. Do not invent features. Add to assumptions: 'Exact feature scope requires client confirmation before development begins.'`);
    } else {
      lines.push(`- Scope specificity: ${signals.specificity.toUpperCase()} (${signals.wordCount} words).`);
    }

    if (signals.hasBudgetTimelineConflict) {
      lines.push("- Conflict detected: Large scope vocabulary combined with a tight deadline. Set feasibility to orange or red. Explain the tension explicitly in feasibilityNote.");
    }
  }

  return lines.join("\n");
}

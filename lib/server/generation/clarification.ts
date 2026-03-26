import { analyzeRequirement, type RequirementSignals } from "@/lib/domain/proposal/signals";
import type { ClarificationQuestion } from "@/lib/domain/proposal/schema";

export interface ClarificationDecision {
  needsClarification: boolean;
  summary: string;
  questions: ClarificationQuestion[];
  missingIds: string[];
  enrichedRequirement: string;
  signals: RequirementSignals;
}

type AnswerMap = Record<string, string>;

const TEAM_SIZE_PATTERNS = [
  /\b\d+\s+(?:users?|staff|employees?|agents?|admins?|clinicians?|teachers?|managers?)\b/i,
  /\b(?:team size|staff size|user count|seat count|number of users)\b/i,
  /\b(?:single admin|single user|small team|multi-user|multi role|multiple roles)\b/i,
];

const REGION_PATTERNS = [
  /\b(?:india|indian|usa|us|united states|uk|united kingdom|europe|eu|uae|middle east|singapore|australia|canada)\b/i,
  /\b(?:global|worldwide|international|domestic|local market)\b/i,
];

const PAYMENT_PATTERNS = [
  /\b(?:payment|checkout|stripe|razorpay|invoice|subscription|deposit|charge|gateway|billing)\b/i,
];

const NOTIFICATION_PATTERNS = [
  /\b(?:sms|whatsapp|email|notification|reminder|otp|push)\b/i,
];

const VOLUME_PATTERNS = [
  /\b\d+\s+(?:messages?|notifications?|emails?|sms|whatsapp)\s+(?:per|\/)\s+(?:day|week|month)\b/i,
  /\b(?:message volume|notification volume|daily reminders|monthly reminders)\b/i,
];

const REGULATED_DOMAIN_PATTERNS = [
  /\b(?:clinic|patient|medical|healthcare|doctor|hospital|therapy|physio|physiotherapy)\b/i,
  /\b(?:bank|loan|insurance|fintech|trading|kyc|payment data)\b/i,
  /\b(?:legal|law firm|case management|attorney|compliance)\b/i,
];

const COMPLIANCE_PATTERNS = [
  /\b(?:hipaa|gdpr|pci|soc ?2|iso ?27001|pii|phi|compliance)\b/i,
];

const QUESTION_LIBRARY: Record<string, ClarificationQuestion> = {
  budget: {
    id: "budget",
    label: "Budget",
    question: "What budget range should this proposal respect?",
    placeholder: "Example: $3k-$5k, under ₹1.5 lakh, or no fixed budget yet",
    reason: "Pricing confidence stays weak without a budget anchor.",
  },
  deadline: {
    id: "deadline",
    label: "Deadline",
    question: "What deadline or launch window matters here?",
    placeholder: "Example: launch in 6 weeks, before July, or flexible",
    reason: "Timeline confidence is low without a real deadline.",
  },
  user_scope: {
    id: "user_scope",
    label: "Users",
    question: "How many staff, admins, or end users need access in the first version?",
    placeholder: "Example: 1 admin + 4 staff, or 500 customer accounts",
    reason: "Seats, permissions, and vendor costs depend on user scope.",
  },
  operating_region: {
    id: "operating_region",
    label: "Region",
    question: "Which country or region will this product operate in first?",
    placeholder: "Example: India only, US clinic, UK + EU, or global",
    reason: "Region changes vendor pricing, payment options, and compliance risk.",
  },
  payment_flow: {
    id: "payment_flow",
    label: "Payments",
    question: "Does the product need to collect payments, and if so what kind?",
    placeholder: "Example: no payments, one-time booking fee, subscriptions, invoices only",
    reason: "Payment requirements materially change integrations and client costs.",
  },
  notification_volume: {
    id: "notification_volume",
    label: "Notification Volume",
    question: "What reminder or notification volume do you expect at launch?",
    placeholder: "Example: ~200 WhatsApp reminders/month or low volume initially",
    reason: "Messaging costs are usage-based and cannot be priced honestly without volume.",
  },
  compliance_constraints: {
    id: "compliance_constraints",
    label: "Compliance",
    question: "Are there any compliance or privacy requirements we must plan for?",
    placeholder: "Example: HIPAA, GDPR, PCI, or none known",
    reason: "Regulated domains can change architecture, timeline, and feasibility.",
  },
};

const QUESTION_PRIORITY = [
  "compliance_constraints",
  "notification_volume",
  "budget",
  "deadline",
  "user_scope",
  "operating_region",
  "payment_flow",
] as const;

function hasPattern(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function hasAnswer(answers: AnswerMap, id: string): boolean {
  return typeof answers[id] === "string" && answers[id].trim().length > 0;
}

function appendClarificationContext(requirement: string, answers: AnswerMap): string {
  const entries = Object.entries(answers)
    .map(([key, value]) => [key.trim(), value.trim()] as const)
    .filter(([, value]) => value.length > 0);

  if (entries.length === 0) return requirement.trim();

  const lines = entries.map(([key, value]) => `- ${key}: ${value}`);
  return `${requirement.trim()}\n\nClarification Answers:\n${lines.join("\n")}`;
}

function prioritizeMissingIds(missingIds: string[]): string[] {
  const priorityIndex = new Map<string, number>(
    QUESTION_PRIORITY.map((id, index) => [id, index] as const)
  );

  return Array.from(new Set(missingIds)).sort((left, right) => {
    const leftIndex = priorityIndex.get(left) ?? Number.MAX_SAFE_INTEGER;
    const rightIndex = priorityIndex.get(right) ?? Number.MAX_SAFE_INTEGER;
    return leftIndex - rightIndex;
  });
}

export function evaluateClarifications(
  requirement: string,
  clarificationAnswers: AnswerMap = {}
): ClarificationDecision {
  const enrichedRequirement = appendClarificationContext(requirement, clarificationAnswers);
  const signals = analyzeRequirement(enrichedRequirement);

  const mentionsNotifications = hasPattern(enrichedRequirement, NOTIFICATION_PATTERNS);
  const requiresComplianceCheck = hasPattern(enrichedRequirement, REGULATED_DOMAIN_PATTERNS);

  const missingIds: string[] = [];

  if (!signals.hasBudget && !hasAnswer(clarificationAnswers, "budget")) {
    missingIds.push("budget");
  }
  if (!signals.hasDeadline && !hasAnswer(clarificationAnswers, "deadline")) {
    missingIds.push("deadline");
  }
  if (!hasPattern(enrichedRequirement, TEAM_SIZE_PATTERNS) && !hasAnswer(clarificationAnswers, "user_scope")) {
    missingIds.push("user_scope");
  }
  if (!hasPattern(enrichedRequirement, REGION_PATTERNS) && !hasAnswer(clarificationAnswers, "operating_region")) {
    missingIds.push("operating_region");
  }
  if (!hasPattern(enrichedRequirement, PAYMENT_PATTERNS) && !hasAnswer(clarificationAnswers, "payment_flow")) {
    missingIds.push("payment_flow");
  }
  if (
    mentionsNotifications &&
    !hasPattern(enrichedRequirement, VOLUME_PATTERNS) &&
    !hasAnswer(clarificationAnswers, "notification_volume")
  ) {
    missingIds.push("notification_volume");
  }
  if (
    requiresComplianceCheck &&
    !hasPattern(enrichedRequirement, COMPLIANCE_PATTERNS) &&
      !hasAnswer(clarificationAnswers, "compliance_constraints")
  ) {
    missingIds.push("compliance_constraints");
  }

  const prioritizedIds = prioritizeMissingIds(missingIds).slice(0, 5);
  const questions = prioritizedIds.map((id) => QUESTION_LIBRARY[id]);

  const needsClarification =
    signals.isVague ||
    missingIds.length >= 2 ||
    missingIds.includes("compliance_constraints") ||
    missingIds.includes("notification_volume");

  const summary = needsClarification
    ? "The brief is too incomplete to produce a trustworthy draft. Answer the missing items below first."
    : "The brief is specific enough to generate a trust-first draft.";

  return {
    needsClarification,
    summary,
    questions,
    missingIds: prioritizedIds,
    enrichedRequirement,
    signals,
  };
}

// Every magic value lives here. Nothing is hardcoded in business logic.

// ─── Input constraints ────────────────────────────────────────────────────────
export const MIN_REQUIREMENT_LENGTH = 10;
export const MAX_REQUIREMENT_LENGTH = 8_000;

// ─── Model config ─────────────────────────────────────────────────────────────
export const MODEL_CONFIG = {
  model: "llama-3.3-70b-versatile",
  maxTokens: 3000,
  temperature: 0.3, // Lower = more deterministic JSON structure
} as const;

// ─── Validation guardrails ────────────────────────────────────────────────────
// Values are currency-neutral integers — they cover both USD and INR ranges.
// INR projects can reach ₹50,00,000+ for large scopes; max is set accordingly.
export const PRICING_GUARDRAILS = {
  minUSD: 100,
  maxUSD: 10_000_000, // Covers INR projects up to ~₹1 Cr and USD up to $10M
} as const;

export const TIMELINE_GUARDRAILS = {
  minDaysPerPhase: 1,
  maxDaysPerPhase: 365,
  minTotalDays: 1,
  maxTotalDays: 730,
} as const;

// ─── Section display order ────────────────────────────────────────────────────
// Governs the order ProposalView renders sections.
export const SECTION_ORDER = [
  "overview",
  "feasibility",
  "scope",
  "deliverables",
  "timeline",
  "pricing",
  "techStack",
  "boundaries",
  "risks",
  "assumptions",
  "nextSteps",
] as const;

export type SectionKey = (typeof SECTION_ORDER)[number];

// ─── Feasibility display config ───────────────────────────────────────────────
export const FEASIBILITY_CONFIG = {
  green:  { label: "Green",  color: "#22c55e" },
  amber:  { label: "Amber",  color: "#f59e0b" },
  orange: { label: "Orange", color: "#f97316" },
  red:    { label: "Red",    color: "#ef4444" },
} as const;

// --- Rate limit config -------------------------------------------------------
// Mirrors the values in lib/server/ratelimit.ts.
// Kept here so error messages can reference the window without importing server code.
export const RATE_LIMIT_CONFIG = {
  maxRequests:    5,
  windowMinutes:  15,
} as const;

// --- Error messages ----------------------------------------------------------
export const ERROR_MESSAGES = {
  CONFIG_ERROR:     "Server is missing GROQ_API_KEY.",
  INVALID_BODY:     "Invalid request body.",
  INPUT_TOO_SHORT:  "Requirement too short. Add more detail.",
  INPUT_TOO_LONG:   `Requirement too long. Keep it under ${MAX_REQUIREMENT_LENGTH.toLocaleString()} characters.`,
  RATE_LIMITED:     `Too many requests. Try again in ${RATE_LIMIT_CONFIG.windowMinutes} minutes.`,
  MODEL_ERROR:      "Model call failed. Try again.",
  PARSE_ERROR:      "Model returned malformed JSON. Try regenerating.",
  VALIDATION_ERROR: "Model returned an incomplete proposal. Try regenerating.",
  REPAIR_FAILED:    "Model could not produce a valid proposal after repair. Try regenerating.",
} as const;

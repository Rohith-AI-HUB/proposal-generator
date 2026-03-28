export const MIN_REQUIREMENT_LENGTH = 10;
export const MAX_REQUIREMENT_LENGTH = 8_000;

export const MODEL_CONFIG = {
  model: "llama-3.3-70b-versatile",
  maxTokens: 1200,
  temperature: 0.35,
} as const;

export const RATE_LIMIT_CONFIG = {
  maxRequests: 5,
  windowMinutes: 15,
} as const;

export const ERROR_MESSAGES = {
  CONFIG_ERROR: "Server is missing GROQ_API_KEY.",
  INVALID_BODY: "Invalid request body.",
  INPUT_TOO_SHORT: "Job post too short. Paste the full Upwork job post.",
  INPUT_TOO_LONG: `Job post too long. Keep it under ${MAX_REQUIREMENT_LENGTH.toLocaleString()} characters.`,
  RATE_LIMITED: `Too many requests. Try again in ${RATE_LIMIT_CONFIG.windowMinutes} minutes.`,
  MODEL_ERROR: "Model call failed. Try again.",
  PARSE_ERROR: "Model returned malformed JSON. Try regenerating.",
  VALIDATION_ERROR: "Model returned an invalid reply draft. Try regenerating.",
  REPAIR_FAILED:
    "Model could not produce a valid reply draft after repair. Try regenerating.",
} as const;

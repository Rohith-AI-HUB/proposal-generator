import { NextRequest, NextResponse } from "next/server";
import { generateProposal, GenerationError } from "@/lib/server/generation";
import { checkRateLimit } from "@/lib/server/ratelimit";
import { createRequestLog, emitLog } from "@/lib/server/logger";
import {
  MIN_REQUIREMENT_LENGTH,
  MAX_REQUIREMENT_LENGTH,
  ERROR_MESSAGES,
} from "@/lib/domain/proposal/constants";
import type {
  GenerateResponse,
  GenerateErrorResponse,
  ErrorCode,
} from "@/lib/domain/proposal/schema";

// --- HTTP status mapping -----------------------------------------------------
//
// 400  malformed or too-short request (client fault, do not retry)
// 413  request body too large (client fault, do not retry)
// 429  rate limit exceeded (client fault, retry after window resets)
// 500  server misconfiguration or unexpected crash
// 502  upstream model / parse / validation failure (retryable by the client)

const STATUS_MAP: Record<ErrorCode, number> = {
  INVALID_BODY:      400,
  INPUT_TOO_SHORT:   400,
  INPUT_TOO_LONG:    413,
  RATE_LIMITED:      429,
  CONFIG_ERROR:      500,
  MODEL_ERROR:       502,
  PARSE_ERROR:       502,
  VALIDATION_ERROR:  502,
  REPAIR_FAILED:     502,
};

// --- Helpers -----------------------------------------------------------------

// Prefer the leftmost value in x-forwarded-for (the original client IP).
// Fall back to x-real-ip, then "unknown" if neither header is present.
function extractIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function errorResponse(message: string, code: ErrorCode): NextResponse {
  const body: GenerateErrorResponse = { error: message, code };
  return NextResponse.json(body, { status: STATUS_MAP[code] ?? 500 });
}

// --- Handler -----------------------------------------------------------------

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const ip        = extractIp(req);
  const log       = createRequestLog(requestId, ip);
  const wallStart = Date.now();

  // Config guard -- fail fast before any async work
  if (!process.env.GROQ_API_KEY) {
    log.status       = 500;
    log.failureClass = "CONFIG_ERROR";
    log.latencyMs    = Date.now() - wallStart;
    emitLog(log);
    return errorResponse(ERROR_MESSAGES.CONFIG_ERROR, "CONFIG_ERROR");
  }

  // Rate limit check
  const rl = await checkRateLimit(ip);
  if (!rl.allowed) {
    log.status       = 429;
    log.failureClass = "RATE_LIMITED";
    log.latencyMs    = Date.now() - wallStart;
    emitLog(log);
    return errorResponse(ERROR_MESSAGES.RATE_LIMITED, "RATE_LIMITED");
  }

  // Parse request body
  let requirement: string;
  try {
    const body = await req.json();
    requirement =
      typeof body?.requirement === "string" ? body.requirement.trim() : "";
  } catch {
    log.status       = 400;
    log.failureClass = "INVALID_BODY";
    log.latencyMs    = Date.now() - wallStart;
    emitLog(log);
    return errorResponse(ERROR_MESSAGES.INVALID_BODY, "INVALID_BODY");
  }

  // Input length validation
  if (requirement.length < MIN_REQUIREMENT_LENGTH) {
    log.status       = 400;
    log.failureClass = "INPUT_TOO_SHORT";
    log.latencyMs    = Date.now() - wallStart;
    emitLog(log);
    return errorResponse(ERROR_MESSAGES.INPUT_TOO_SHORT, "INPUT_TOO_SHORT");
  }
  if (requirement.length > MAX_REQUIREMENT_LENGTH) {
    log.status       = 413;
    log.failureClass = "INPUT_TOO_LONG";
    log.latencyMs    = Date.now() - wallStart;
    emitLog(log);
    return errorResponse(ERROR_MESSAGES.INPUT_TOO_LONG, "INPUT_TOO_LONG");
  }

  // Generate
  try {
    const { proposal, renderedText, meta } = await generateProposal(requirement);

    // Populate log from generation meta.
    // latencyMs here is model-only time; wallStart covers the full request.
    // We log model latency because that is what we can diagnose. Full wall time
    // is available via the platform (Vercel, etc.) access logs.
    log.status       = 200;
    log.latencyMs    = meta.latencyMs;
    log.inputTokens  = meta.inputTokens;
    log.outputTokens = meta.outputTokens;
    log.repairUsed   = meta.repairUsed;
    // If repair succeeded, record the first-attempt failure reason for analysis
    if (meta.repairUsed && meta.firstFailReason) {
      log.validationFailReason = meta.firstFailReason;
    }
    emitLog(log);

    const body: GenerateResponse = { proposal, renderedText };
    return NextResponse.json(body);

  } catch (err) {
    log.latencyMs = Date.now() - wallStart;

    if (err instanceof GenerationError) {
      log.status       = STATUS_MAP[err.code] ?? 500;
      log.failureClass = err.code;

      // Map the error to the most useful server-side detail field.
      // User-facing messages stay generic (err.message is the human string,
      // not the Zod reason -- those are captured inside generation/index.ts).
      if (err.code === "PARSE_ERROR")      log.parseFailReason      = err.message;
      if (err.code === "VALIDATION_ERROR") log.validationFailReason = err.message;
      if (err.code === "REPAIR_FAILED")    log.repairFailReason     = err.message;

      emitLog(log);
      return errorResponse(err.message, err.code);
    }

    // Truly unexpected -- not a GenerationError we threw
    console.error("[POST /api/generate] unexpected error:", err);
    log.status       = 500;
    log.failureClass = "MODEL_ERROR";
    emitLog(log);
    return errorResponse(ERROR_MESSAGES.MODEL_ERROR, "MODEL_ERROR");
  }
}

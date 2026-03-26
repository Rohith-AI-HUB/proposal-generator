// Structured server logger.
//
// Emits one JSON line per request to stdout.
// Compatible with any log aggregator that parses JSON lines (Axiom, Datadog, etc).
//
// Fields always present:
//   requestId    -- UUID generated per request
//   timestamp    -- ISO 8601 at log creation time
//   ip           -- client IP (x-forwarded-for or x-real-ip)
//   model        -- model name from MODEL_CONFIG
//   latencyMs    -- wall-clock ms from request receipt to response (null on early exit)
//   inputTokens  -- prompt tokens consumed (null if model was never called)
//   outputTokens -- completion tokens consumed (null if model was never called)
//   repairUsed   -- true if the repair retry was invoked
//   failureClass -- ErrorCode on failure, null on success
//   status       -- HTTP status code of the response
//
// Detail fields (server-only, never sent to client):
//   parseFailReason      -- raw parse error message
//   validationFailReason -- Zod error summary from first attempt
//   repairFailReason     -- Zod error summary from repair attempt

import { MODEL_CONFIG } from "@/lib/domain/proposal/constants";
import type { ErrorCode } from "@/lib/domain/proposal/schema";

export interface RequestLog {
  requestId:             string;
  timestamp:             string;
  ip:                    string;
  model:                 string;
  latencyMs:             number | null;
  inputTokens:           number | null;
  outputTokens:          number | null;
  repairUsed:            boolean;
  failureClass:          ErrorCode | "RATE_LIMITED" | null;
  status:                number;
  clarificationIssued?:  boolean;
  clarificationCount?:   number;
  sourceCount?:          number;
  unsupportedClaimCount?: number;
  sourceDomainQuality?:  "strong" | "mixed" | "weak" | null;
  parseFailReason?:      string;
  validationFailReason?: string;
  repairFailReason?:     string;
}

export function createRequestLog(requestId: string, ip: string): RequestLog {
  return {
    requestId,
    timestamp:    new Date().toISOString(),
    ip,
    model:        MODEL_CONFIG.model,
    latencyMs:    null,
    inputTokens:  null,
    outputTokens: null,
    repairUsed:   false,
    failureClass: null,
    status:       200,
  };
}

export function emitLog(log: RequestLog): void {
  console.log(JSON.stringify(log));
}

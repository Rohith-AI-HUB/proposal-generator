import { MODEL_CONFIG } from "@/lib/domain/proposal/constants";
import type { ErrorCode } from "@/lib/domain/proposal/schema";

export interface RequestLog {
  requestId: string;
  timestamp: string;
  ip: string;
  model: string;
  latencyMs: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  repairUsed: boolean;
  failureClass: ErrorCode | "RATE_LIMITED" | null;
  status: number;
  hookCount?: number;
  parseFailReason?: string;
  validationFailReason?: string;
  repairFailReason?: string;
}

export function createRequestLog(requestId: string, ip: string): RequestLog {
  return {
    requestId,
    timestamp: new Date().toISOString(),
    ip,
    model: MODEL_CONFIG.model,
    latencyMs: null,
    inputTokens: null,
    outputTokens: null,
    repairUsed: false,
    failureClass: null,
    status: 200,
  };
}

export function emitLog(log: RequestLog): void {
  console.log(JSON.stringify(log));
}

import { NextRequest, NextResponse } from "next/server";
import { generateProposal, GenerationError } from "@/lib/server/generation";
import {
  MIN_REQUIREMENT_LENGTH,
  MAX_REQUIREMENT_LENGTH,
  ERROR_MESSAGES,
} from "@/lib/domain/proposal/constants";
import type { GenerateResponse, GenerateErrorResponse } from "@/lib/domain/proposal/schema";

function errorResponse(message: string, code: GenerateErrorResponse["code"], status: number) {
  const body: GenerateErrorResponse = { error: message, code };
  return NextResponse.json(body, { status });
}

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return errorResponse(ERROR_MESSAGES.CONFIG_ERROR, "CONFIG_ERROR", 500);
  }

  let requirement: string;
  try {
    const body = await req.json();
    requirement = typeof body?.requirement === "string" ? body.requirement.trim() : "";
  } catch {
    return errorResponse(ERROR_MESSAGES.INVALID_BODY, "INPUT_TOO_SHORT", 400);
  }

  if (requirement.length < MIN_REQUIREMENT_LENGTH) {
    return errorResponse(ERROR_MESSAGES.INPUT_TOO_SHORT, "INPUT_TOO_SHORT", 400);
  }
  if (requirement.length > MAX_REQUIREMENT_LENGTH) {
    return errorResponse(ERROR_MESSAGES.INPUT_TOO_LONG, "INPUT_TOO_LONG", 413);
  }

  try {
    const { proposal, renderedText } = await generateProposal(requirement);
    const body: GenerateResponse = { proposal, renderedText };
    return NextResponse.json(body);
  } catch (err) {
    if (err instanceof GenerationError) {
      const status = err.code === "MODEL_ERROR" ? 502 : 502;
      return errorResponse(err.message, err.code, status);
    }
    console.error("[POST /api/generate] unexpected:", err);
    return errorResponse(ERROR_MESSAGES.MODEL_ERROR, "MODEL_ERROR", 500);
  }
}

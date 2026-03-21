// Model adapter. Only file that imports groq-sdk.
// Everything else works with ModelResponse — not Groq-specific types.

import Groq from "groq-sdk";
import { MODEL_CONFIG } from "@/lib/domain/proposal/constants";

export interface ModelResponse {
  text:          string;
  latencyMs:     number;
  inputTokens?:  number;
  outputTokens?: number;
}

let _client: Groq | null = null;

function getClient(): Groq {
  if (!_client) {
    _client = new Groq({ apiKey: process.env.GROQ_API_KEY! });
  }
  return _client;
}

export async function callModel(
  systemPrompt: string,
  userMessage: string
): Promise<ModelResponse> {
  const start = Date.now();
  const completion = await getClient().chat.completions.create({
    model: MODEL_CONFIG.model,
    max_tokens: MODEL_CONFIG.maxTokens,
    temperature: MODEL_CONFIG.temperature,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "";

  // Strip markdown fences the model may add despite instructions
  const text = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return {
    text,
    latencyMs:    Date.now() - start,
    inputTokens:  completion.usage?.prompt_tokens,
    outputTokens: completion.usage?.completion_tokens,
  };
}

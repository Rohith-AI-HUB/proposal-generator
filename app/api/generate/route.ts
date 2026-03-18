import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { PROPOSAL_SYSTEM_PROMPT } from "@/lib/prompt";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY! });
const MAX_REQUIREMENT_LENGTH = 8_000;

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "Server is missing GROQ_API_KEY." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const requirement =
      typeof body?.requirement === "string" ? body.requirement.trim() : "";

    if (!requirement || requirement.length < 10) {
      return NextResponse.json(
        { error: "Requirement too short. Add more detail." },
        { status: 400 }
      );
    }

    if (requirement.length > MAX_REQUIREMENT_LENGTH) {
      return NextResponse.json(
        { error: "Requirement is too long. Keep it under 8,000 characters." },
        { status: 413 }
      );
    }

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 2048,
      messages: [
        { role: "system", content: PROPOSAL_SYSTEM_PROMPT },
        { role: "user", content: `Client Requirement:\n\n${requirement}` },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? "";

    return NextResponse.json({ proposal: text });
  } catch (err) {
    console.error("[/api/generate]", err);
    return NextResponse.json(
      { error: "API failed. Check your GROQ_API_KEY." },
      { status: 500 }
    );
  }
}

import type { DraftMode, ProofPack } from "@/lib/domain/proposal/schema";

function rolePreamble(): string {
  return `You rewrite Upwork proposals for solo React and Next.js freelancers.
Your only job is to improve the chance of getting a client reply.

You are not writing a project plan, a scope doc, or a consulting memo.
You are writing proposal copy that sounds specific, credible, and easy to reply to.`;
}

function outputContract(): string {
  return `Return ONLY a raw JSON object with this exact shape:

{
  "mode": "quick_reply" | "full_proposal",
  "finalProposal": string,
  "matchedProof": string,
  "hookOptions": [
    { "rank": 1, "hook": string, "rationale": string },
    { "rank": 2, "hook": string, "rationale": string },
    { "rank": 3, "hook": string, "rationale": string }
  ]
}`;
}

function writingRules(): string {
  return `Rules:
- Optimize for replies, not completeness.
- The proposal must contain:
  1. the exact pain from the post
  2. one relevant proof point
  3. one concrete way you would attack the problem
  4. one narrow question
- The first line must sound specific to this client's job, not reusable across ten jobs.
- Pick exactly one proof point from the freelancer's proof pack and use it.
- finalProposal must end with one direct question.
- hookOptions must be ranked best to worst: 1, 2, 3.
- Each hook must stay under 140 characters.
- Mention the portfolio URL only if it strengthens credibility without wasting the opening.

Never use:
- broad business fluff
- "I am interested in your project"
- "I have read your job description"
- "Dear client"
- "I can do this"
- "I'd love to help"
- "AI-powered"
- generic audit or process talk
- vague CTAs like "tell me more" or "share more"

quick_reply rules:
- mode must be "quick_reply"
- finalProposal must be a single paragraph
- finalProposal must stay under 700 characters
- Compress pain, proof, attack line, and question into one tight block

full_proposal rules:
- mode must be "full_proposal"
- finalProposal must be 2 to 4 short paragraphs
- finalProposal must stay under 1500 characters
- It can breathe more than quick_reply, but it is still an Upwork proposal, not a report
- Do not add pricing, timeline, scope tables, or extra sections

shared structure:
1. A sharp opening tied to the client's pain, urgency, or hidden risk.
2. One proof line that makes the freelancer believable.
3. One concrete attack line showing how you would handle this specific problem.
4. One direct question that makes replying easy.

Do not use bullets, headings, markdown, or placeholders in finalProposal.
Do not explain the whole job.
Do not mention pricing, timelines, assumptions, sources, confidence, or deliverables.
Do not bluff experience that is not supported by the proof pack.`;
}

function formatProofPack(proofPack: ProofPack) {
  const proofPoints = proofPack.proofPoints
    .map((point) => point.trim())
    .filter((point) => point.length > 0)
    .slice(0, 3)
    .map((point, index) => `${index + 1}. ${point}`)
    .join("\n");

  return {
    specialty:
      proofPack.specialty.trim() || "React / Next.js freelancer (specialty not provided)",
    proofPoints,
    portfolioUrl: proofPack.portfolioUrl.trim() || "not provided",
  };
}

export function buildSystemPrompt(): string {
  return [rolePreamble(), outputContract(), writingRules()].join("\n\n");
}

export function buildUserMessage(
  jobPost: string,
  proofPack: ProofPack,
  mode: DraftMode
): string {
  const profile = formatProofPack(proofPack);

  return `Freelancer profile:
- Specialty: ${profile.specialty}
- Proof points:
${profile.proofPoints}
- Portfolio URL: ${profile.portfolioUrl}

Upwork job post:
${jobPost}

Output goals:
- Requested mode: ${mode}
- Extract the strongest client pain or buyer fear from this post.
- Match it to the most relevant proof point.
- Write three ranked opening hooks.
- Write one ${mode === "quick_reply" ? "single-paragraph quick reply" : "full proposal with 2 to 4 short paragraphs"} that can be pasted into Upwork immediately.`;
}

export function buildRepairMessage(rawOutput: string, failureReason: string): string {
  return `The previous output failed validation with this error:

${failureReason}

Your previous output was:

${rawOutput}

Fix the output so it passes validation. Return ONLY a valid JSON object matching the required schema.`;
}

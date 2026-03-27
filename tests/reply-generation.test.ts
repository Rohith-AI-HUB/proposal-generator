import test from "node:test";
import assert from "node:assert/strict";
import {
  generateProposal,
  type GenerationDependencies,
} from "@/lib/server/generation";
import type { ReplyDraft } from "@/lib/domain/proposal/schema";

const VALID_FULL_DRAFT: ReplyDraft = {
  mode: "full_proposal",
  matchedProof:
    "Built a Next.js onboarding dashboard tied to Stripe and HubSpot for a SaaS ops team.",
  hookOptions: [
    {
      rank: 1,
      hook: "Your real risk is the Stripe and HubSpot handoff breaking onboarding again.",
      rationale: "Speaks to the buyer fear in the preview line.",
    },
    {
      rank: 2,
      hook: "This looks like a state-management problem before it is a dashboard redesign.",
      rationale: "Frames the hidden implementation issue quickly.",
    },
    {
      rank: 3,
      hook: "A cleaner UI will not help if the onboarding handoff is still brittle underneath it.",
      rationale: "Less direct, but still specific to the job.",
    },
  ],
  finalProposal:
    "Your real risk is the Stripe and HubSpot handoff breaking onboarding again.\n\nI rebuilt that workflow for a SaaS ops team and turned a messy React handoff into a clean admin flow.\n\nI would lock the failure states first, then rebuild the Next.js flow around the exact points where sales and ops lose time today.\n\nWhich part is hurting you most right now: lead creation, customer sync, or subscription status updates?",
};

const VALID_QUICK_DRAFT: ReplyDraft = {
  mode: "quick_reply",
  matchedProof:
    "Built a Next.js onboarding dashboard tied to Stripe and HubSpot for a SaaS ops team.",
  hookOptions: VALID_FULL_DRAFT.hookOptions,
  finalProposal:
    "Your real risk is the Stripe and HubSpot handoff breaking onboarding again, which is why sales and ops still do manual cleanup. I rebuilt that exact workflow for a SaaS team and would attack this by locking the failure states first, then rebuilding the Next.js flow around the real handoff points. Which part is hurting you most right now: lead creation, customer sync, or subscription status updates?",
};

function createDeps(
  responder: (attempt: number, userMessage: string) => string
): GenerationDependencies {
  let attempt = 0;

  return {
    async callModel(_systemPrompt, userMessage) {
      attempt += 1;
      return {
        text: responder(attempt, userMessage),
        latencyMs: 25,
        inputTokens: 150,
        outputTokens: 120,
      };
    },
  };
}

test("generateProposal returns a quick reply draft and passes proof-pack context to the prompt", async () => {
  let capturedUserMessage = "";

  const result = await generateProposal(
    {
      jobPost:
        "Need a React / Next.js freelancer to fix a flaky Stripe and HubSpot onboarding dashboard for our SaaS team.",
      mode: "quick_reply",
      proofPack: {
        specialty: "React / Next.js SaaS builds",
        proofPoints: [
          "Built a Next.js onboarding dashboard tied to Stripe and HubSpot for a SaaS ops team.",
          "Shipped a role-based React admin panel for internal support workflows.",
          "Cleaned up a brittle billing sync that was blocking account activation.",
        ],
        portfolioUrl: "https://example.com/case-study",
      },
    },
    createDeps((_attempt, userMessage) => {
      capturedUserMessage = userMessage;
      return JSON.stringify(VALID_QUICK_DRAFT);
    })
  );

  assert.equal(result.status, "ready");
  assert.equal(result.draft.hookOptions.length, 3);
  assert.equal(result.renderedText, VALID_QUICK_DRAFT.finalProposal);
  assert.equal(result.meta.hookCount, 3);
  assert.match(capturedUserMessage, /React \/ Next\.js SaaS builds/);
  assert.match(capturedUserMessage, /https:\/\/example\.com\/case-study/);
  assert.match(capturedUserMessage, /Requested mode: quick_reply/);
});

test("generateProposal retries once when the first model response is invalid", async () => {
  const result = await generateProposal(
    {
      jobPost:
        "Need a freelancer to rewrite our SaaS onboarding proposal copy for a brittle dashboard rebuild.",
      mode: "full_proposal",
      proofPack: {
        specialty: "React dashboards for SaaS teams",
        proofPoints: [
          "Reworked a slow onboarding dashboard for a B2B SaaS team.",
          "Fixed a billing sync issue that was blocking activations.",
          "Shipped internal ops tooling in Next.js.",
        ],
        portfolioUrl: "https://example.com/work",
      },
    },
    createDeps((attempt) =>
      attempt === 1 ? "{\"finalProposal\":\"bad\"}" : JSON.stringify(VALID_FULL_DRAFT)
    )
  );

  assert.equal(result.status, "ready");
  assert.equal(result.meta.repairUsed, true);
  assert.match(result.meta.firstFailReason ?? "", /hookOptions/);
  assert.equal(result.draft.mode, "full_proposal");
});

import test from "node:test";
import assert from "node:assert/strict";
import { ReplyDraftSchema } from "@/lib/domain/proposal/proposalSchema";

test("ReplyDraftSchema accepts a short reply-focused proposal with ranked hooks", () => {
  const result = ReplyDraftSchema.safeParse({
    mode: "quick_reply",
    matchedProof:
      "Built a Stripe and HubSpot onboarding flow that removed manual cleanup for a SaaS ops team.",
    hookOptions: [
      {
        rank: 1,
        hook: "Your real risk is the Stripe and HubSpot handoff breaking sales ops again.",
        rationale: "Names the workflow pain instead of opening with a generic intro.",
      },
      {
        rank: 2,
        hook: "This job looks less like a dashboard rebuild and more like a cleanup of brittle onboarding states.",
        rationale: "Frames the hidden implementation risk in the first line.",
      },
      {
        rank: 3,
        hook: "If the sync logic is unstable, a prettier UI will not fix the client frustration underneath it.",
        rationale: "Pushes urgency, but it is less specific than the top two hooks.",
      },
    ],
    finalProposal:
      "Your real risk is not the dashboard polish. It is the Stripe and HubSpot handoff breaking the onboarding flow again, which is why the ops team is still stuck doing manual cleanup. I rebuilt that exact SaaS workflow recently and cut the handoff noise by rebuilding the React flow around the real state transitions instead of patching screens. Which part is failing most often right now: lead creation, customer creation, or subscription updates?",
  });

  assert.equal(result.success, true);
});

test("ReplyDraftSchema accepts a constrained full proposal with short paragraphs", () => {
  const result = ReplyDraftSchema.safeParse({
    mode: "full_proposal",
    matchedProof:
      "Built a Stripe and HubSpot onboarding flow that removed manual cleanup for a SaaS ops team.",
    hookOptions: [
      {
        rank: 1,
        hook: "Your real risk is the Stripe and HubSpot handoff breaking sales ops again.",
        rationale: "Names the workflow pain instead of opening with a generic intro.",
      },
      {
        rank: 2,
        hook: "This job looks less like a dashboard rebuild and more like a cleanup of brittle onboarding states.",
        rationale: "Frames the hidden implementation risk in the first line.",
      },
      {
        rank: 3,
        hook: "If the sync logic is unstable, a prettier UI will not fix the client frustration underneath it.",
        rationale: "Pushes urgency, but it is less specific than the top two hooks.",
      },
    ],
    finalProposal:
      "Your issue is not the dashboard redesign. It is Stripe and HubSpot leaving customer status in conflicting states, which forces manual checks and makes the admin view hard to rely on.\n\nI fixed that exact kind of SaaS onboarding mess in a React dashboard by cleaning up a broken Stripe-to-HubSpot handoff and rebuilding the flow around the real state transitions instead of patching screens.\n\nI would start by tracing where the state drift happens, then rebuild the admin workflow so sales and ops are working from one reliable state. Which is breaking most often right now: subscription sync, HubSpot updates, or the admin state logic?",
  });

  assert.equal(result.success, true);
});

test("ReplyDraftSchema rejects generic filler in hooks and proposal copy", () => {
  const result = ReplyDraftSchema.safeParse({
    mode: "quick_reply",
    matchedProof: "Built dashboards before.",
    hookOptions: [
      {
        rank: 1,
        hook: "I am interested in your project and would love to help.",
        rationale: "Generic filler.",
      },
      {
        rank: 2,
        hook: "Second hook",
        rationale: "Fallback.",
      },
      {
        rank: 3,
        hook: "Third hook",
        rationale: "Fallback.",
      },
    ],
    finalProposal:
      "I have read your job description and I can do this.\n\nCan we talk?",
  });

  assert.equal(result.success, false);
  if (!result.success) {
    const reason = result.error.errors.map((issue) => issue.message).join("; ");
    assert.match(reason, /generic filler/);
  }
});

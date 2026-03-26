import test from "node:test";
import assert from "node:assert/strict";
import {
  generateProposal,
  type GenerationDependencies,
} from "@/lib/server/generation";
import type { Proposal } from "@/lib/domain/proposal/schema";
import {
  buildClarificationAnswers,
  buildModelResponse,
  buildPricingContext,
  buildProposalFixture,
  buildResearchFixture,
} from "./helpers/trustFixtures";

function createDeps(
  proposalFactory: (userMessage: string) => Proposal = () => buildProposalFixture()
): GenerationDependencies {
  return {
    async callModel(_systemPrompt, userMessage) {
      return buildModelResponse(proposalFactory(userMessage));
    },
    async researchRequirement(requirement) {
      return buildResearchFixture({
        summary: `Research completed for: ${requirement.slice(0, 60)}`,
      });
    },
  };
}

test("generateProposal gates vague briefs behind clarification questions", async () => {
  let modelCalled = false;
  let researchCalled = false;

  const result = await generateProposal(
    {
      requirement: "Need a website for my business.",
      pricingCtx: buildPricingContext(),
    },
    {
      async callModel() {
        modelCalled = true;
        throw new Error("model should not be called for vague input");
      },
      async researchRequirement() {
        researchCalled = true;
        throw new Error("research should not be called for vague input");
      },
    }
  );

  assert.equal(result.status, "needs_clarification");
  assert.equal(result.meta.clarificationIssued, true);
  assert.ok(result.questions.length >= 3);
  assert.ok(result.questions.some((question) => question.id === "budget"));
  assert.equal(modelCalled, false);
  assert.equal(researchCalled, false);
});

test("generateProposal turns a vague brief plus answers into a ready draft", async () => {
  let researchedRequirement = "";

  const result = await generateProposal(
    {
      requirement: "Need a booking app for my clinic.",
      pricingCtx: buildPricingContext(),
      clarificationAnswers: buildClarificationAnswers(),
    },
    {
      async callModel(_systemPrompt, userMessage) {
        assert.match(userMessage, /Clarification Answers:/);
        return buildModelResponse(buildProposalFixture());
      },
      async researchRequirement(requirement) {
        researchedRequirement = requirement;
        return buildResearchFixture();
      },
    }
  );

  assert.equal(result.status, "ready");
  assert.equal(result.meta.clarificationIssued, false);
  assert.match(researchedRequirement, /Clarification Answers:/);
  assert.match(result.renderedText, /Trust-First Project Draft/);
});

test("generateProposal applies domestic and international pricing contexts", async () => {
  const requirement =
    "Build a booking dashboard for a physiotherapy clinic with online payments and WhatsApp reminders.";
  const clarificationAnswers = buildClarificationAnswers();
  const deps = createDeps();

  const domestic = await generateProposal(
    {
      requirement,
      clarificationAnswers,
      pricingCtx: buildPricingContext({
        clientType: "domestic",
        currency: "INR",
        currencySymbol: "Rs",
        dayRate: 5000,
      }),
    },
    deps
  );

  const international = await generateProposal(
    {
      requirement,
      clarificationAnswers,
      pricingCtx: buildPricingContext({
        clientType: "international",
        currency: "USD",
        currencySymbol: "$",
        dayRate: 120,
      }),
    },
    deps
  );

  assert.equal(domestic.status, "ready");
  assert.equal(international.status, "ready");

  if (domestic.status === "ready" && international.status === "ready") {
    assert.equal(domestic.proposal.pricing.currency, "INR");
    assert.equal(domestic.proposal.pricing.totalMin, 60000);
    assert.equal(domestic.proposal.pricing.totalMax, 75000);
    assert.match(domestic.proposal.pricing.modules[0]?.cost ?? "", /20,000/);

    assert.equal(international.proposal.pricing.currency, "USD");
    assert.equal(international.proposal.pricing.totalMin, 1440);
    assert.equal(international.proposal.pricing.totalMax, 1800);
    assert.match(international.proposal.pricing.modules[0]?.cost ?? "", /\$480/);
  }
});

test("contradictory scope and deadline surface orange feasibility through the model stage", async () => {
  let capturedUserMessage = "";

  const result = await generateProposal(
    {
      requirement:
        "Need a full-stack marketplace platform for 2 admins and public buyers in the US with payments, chat, dashboards, and admin tools in 2 weeks with a $2,000 budget.",
      pricingCtx: buildPricingContext(),
    },
    createDeps((userMessage) => {
      capturedUserMessage = userMessage;
      return buildProposalFixture({
        overview: {
          summary:
            "The requested scope is materially larger than the budget and deadline support.",
          outcome:
            "This draft is intended to help the client either cut scope or extend the timeline before work starts.",
          feasibility: userMessage.includes("Conflict detected") ? "orange" : "green",
          feasibilityNote: userMessage.includes("Conflict detected")
            ? "The current scope, timeline, and budget do not align. Recommended: Option A because reducing the launch scope is the only credible path inside the current constraint."
            : null,
        },
      });
    })
  );

  assert.match(capturedUserMessage, /Conflict detected/);
  assert.equal(result.status, "ready");
  if (result.status === "ready") {
    assert.equal(result.proposal.overview.feasibility, "orange");
    assert.match(
      result.proposal.overview.feasibilityNote ?? "",
      /Recommended: Option A/
    );
  }
});

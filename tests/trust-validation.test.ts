import test from "node:test";
import assert from "node:assert/strict";
import { ProposalSchema } from "@/lib/domain/proposal/proposalSchema";
import type { RequirementSignals } from "@/lib/domain/proposal/signals";
import { applyTrustContext } from "@/lib/server/generation/trust";
import {
  buildProposalFixture,
  buildResearchFixture,
} from "./helpers/trustFixtures";

const STRONG_SIGNALS: RequirementSignals = {
  hasBudget: true,
  hasDeadline: true,
  isVague: false,
  wordCount: 78,
  hasBudgetTimelineConflict: false,
  extractedBudget: "$5,000",
  extractedDeadline: "8 weeks",
  specificity: "high",
};

test("ProposalSchema rejects numeric client costs without source metadata", () => {
  const proposal = buildProposalFixture({
    clientCosts: [
      {
        item: "Twilio SMS",
        category: "SMS / OTP Service",
        estimatedCost: "$0.0083 per message",
        mandatory: true,
        notes: null,
        sourceTitle: null,
        sourceUrl: null,
        sourceRationale: null,
        confidence: "medium",
      },
    ],
  });

  const result = ProposalSchema.safeParse(proposal);

  assert.equal(result.success, false);
  if (!result.success) {
    const reason = result.error.errors.map((issue) => issue.message).join("; ");
    assert.match(
      reason,
      /numeric client costs require sourceTitle, sourceUrl, and sourceRationale/
    );
  }
});

test("applyTrustContext sanitizes weak vendor costs and downgrades confidence", () => {
  const cost = {
    item: "Twilio SMS",
    category: "SMS / OTP Service",
    estimatedCost: "$0.0083 per message",
    mandatory: true,
    notes: null,
    sourceTitle: null,
    sourceUrl: null,
    sourceRationale: null,
    confidence: "medium" as const,
  };

  const trusted = applyTrustContext(
    buildProposalFixture({
      clientCosts: [cost],
      confidence: {
        overall: "high",
        note: "Initial draft note.",
        sections: [],
      },
    }),
    "Build a booking portal with online payments and reminder messages.",
    STRONG_SIGNALS,
    buildResearchFixture({
      dataQuality: "low",
      caveat: "Vendor pricing was inconsistent across regions for this run.",
      vendorCosts: [cost],
      openQuestions: ["Confirm expected reminder volume before locking messaging costs."],
    })
  );

  assert.equal(
    trusted.clientCosts[0]?.estimatedCost,
    "Varies - verify current vendor pricing."
  );
  assert.equal(trusted.clientCosts[0]?.sourceUrl, null);
  assert.notEqual(trusted.confidence.overall, "high");
  assert.equal(
    trusted.confidence.sections.find((section) => section.section === "clientCosts")
      ?.level,
    "low"
  );
  assert.ok(
    trusted.unsupportedClaims.some((claim) =>
      claim.reason.includes("Vendor pricing was inconsistent across regions")
    )
  );
  assert.ok(
    trusted.assumptions.some((item) =>
      item.includes("should be reviewed before sending")
    )
  );
});

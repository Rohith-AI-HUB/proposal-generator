import test from "node:test";
import assert from "node:assert/strict";
import { computeWarnings } from "@/lib/domain/proposal/warnings";

test("raw vague briefs surface missing-budget, missing-deadline, and vague-scope warnings", () => {
  const warnings = computeWarnings("Need a website for my business.");
  const warningIds = warnings.map((warning) => warning.id);

  assert.ok(warningIds.includes("missing-budget"));
  assert.ok(warningIds.includes("missing-deadline"));
  assert.ok(warningIds.includes("vague-scope"));
});

test("answered clarifications suppress resolved missing-detail warnings", () => {
  const warnings = computeWarnings("Need a website for my business.", {
    budget: "No fixed budget yet",
    deadline: "Flexible launch window",
    user_scope: "1 admin and 3 staff",
    operating_region: "US",
    payment_flow: "One-time payments",
  });
  const warningIds = warnings.map((warning) => warning.id);

  assert.ok(!warningIds.includes("missing-budget"));
  assert.ok(!warningIds.includes("missing-deadline"));
  assert.ok(!warningIds.includes("vague-scope"));
});

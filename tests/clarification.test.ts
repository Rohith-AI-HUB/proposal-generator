import test from "node:test";
import assert from "node:assert/strict";
import { evaluateClarifications } from "@/lib/server/generation/clarification";

test("vague brief returns clarification questions", () => {
  const result = evaluateClarifications("Need a website for my business.");

  assert.equal(result.needsClarification, true);
  assert.ok(result.questions.length >= 3);
  assert.ok(result.questions.some((question) => question.id === "budget"));
  assert.ok(result.questions.some((question) => question.id === "deadline"));
});

test("health-related brief asks for compliance details", () => {
  const result = evaluateClarifications(
    "Need a patient booking portal for a physiotherapy clinic with appointment reminders."
  );

  assert.equal(result.needsClarification, true);
  assert.ok(
    result.questions.some((question) => question.id === "compliance_constraints")
  );
});

test("detailed brief plus answers clears the clarification gate", () => {
  const result = evaluateClarifications(
    "Need a booking app for a clinic with online payments and WhatsApp reminders.",
    {
      budget: "$4k-$6k",
      deadline: "Launch within 8 weeks",
      user_scope: "1 admin and 4 staff",
      operating_region: "India",
      payment_flow: "Collect one-time booking payments",
      notification_volume: "Around 300 WhatsApp reminders per month",
      compliance_constraints: "No special compliance requirements known",
    }
  );

  assert.equal(result.needsClarification, false);
  assert.equal(result.questions.length, 0);
});

import test from "node:test";
import assert from "node:assert/strict";
import fixtures from "@/fixtures/trust-evals.json";

test("trust evaluation fixture set covers at least 25 briefs across the target categories", () => {
  assert.ok(fixtures.length >= 25);

  const categories = new Set(fixtures.map((fixture) => fixture.category));

  assert.ok(categories.has("brochure"));
  assert.ok(categories.has("booking"));
  assert.ok(categories.has("marketplace"));
  assert.ok(categories.has("dashboard"));
  assert.ok(categories.has("integration"));
});

test("fixtures that expect clarification also include follow-up answers", () => {
  for (const fixture of fixtures) {
    if ((fixture.expectedClarificationIds?.length ?? 0) === 0) continue;

    assert.ok(
      fixture.clarificationAnswers &&
        Object.keys(fixture.clarificationAnswers).length > 0,
      `${fixture.id} is missing clarificationAnswers`
    );
  }
});

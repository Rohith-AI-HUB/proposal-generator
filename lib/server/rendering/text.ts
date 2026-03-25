// Renders a Proposal into plain text for copy/paste export.
// The only file that knows how to format the domain object as text.
//
// Section numbers are derived from a running counter so conditionally-present
// sections (Feasibility Note, Risk Signals, Assumptions) do not create
// numbering collisions or gaps in the exported copy.

import { formatCurrencyAmount } from "@/lib/domain/proposal/currency";
import type { Proposal } from "@/lib/domain/proposal/schema";

export function renderProposalText(p: Proposal): string {
  const lines: string[] = [];
  const push  = (...s: string[]) => lines.push(...s);
  const blank = () => lines.push("");

  let n = 0;
  const section = (title: string) => {
    n += 1;
    blank();
    push(`## ${n}. ${title}`);
    blank();
  };
  const bullet = (items: string[]) => items.forEach((i) => push(`- ${i}`));

  push("# Project Proposal");
  blank();

  section("Project Overview");
  push(p.overview.summary);
  blank();
  push(p.overview.outcome);

  if (p.overview.feasibility !== "green" && p.overview.feasibilityNote) {
    section("Feasibility Note");
    push(p.overview.feasibilityNote);
  }

  section("Scope of Work");
  push("Phase 1 -- Core (Must-have)");
  bullet(p.scope.core);
  if (p.scope.extended.length > 0) {
    blank();
    push("Phase 2 -- Extended (Nice-to-have)");
    bullet(p.scope.extended);
  }

  if (p.deliverables.length > 0) {
    section("Deliverables");
    bullet(p.deliverables);
  }

  section("Timeline");
  p.timeline.phases.forEach((ph) => {
    const note = ph.notes ? ` -- ${ph.notes}` : "";
    push(`- ${ph.name}: ${ph.days} days${note}`);
  });
  blank();
  push(`Total: ${p.timeline.totalDays} days`);
  if (p.timeline.dependencies.length > 0) {
    blank();
    push("Dependencies:");
    bullet(p.timeline.dependencies);
  }

  section("Pricing Estimate");
  const isRange = p.pricing.totalMin !== p.pricing.totalMax;
  push(
    isRange
      ? `Total: ${formatCurrencyAmount(p.pricing.totalMin, p.pricing.currency)} - ${formatCurrencyAmount(p.pricing.totalMax, p.pricing.currency)} ${p.pricing.currency}`
      : `Total: ${formatCurrencyAmount(p.pricing.totalMin, p.pricing.currency)} ${p.pricing.currency}`
  );
  blank();
  p.pricing.modules.forEach((m) => push(`- ${m.module} (${m.rationale}): ${m.cost}`));
  blank();
  push(p.pricing.rationale);
  blank();
  push(p.pricing.valueJustification);
  blank();
  push(p.pricing.variabilityNote);

  if (p.clientCosts.length > 0) {
    section("Client-Borne Costs");
    push("Note: The following are the client's direct costs, separate from the development fee.");
    blank();
    p.clientCosts.forEach((c) => {
      const req  = c.mandatory ? " [REQUIRED]" : " [optional]";
      const note = c.notes ? ` - ${c.notes}` : "";
      push(`- ${c.category}${req}: ${c.item} - ${c.estimatedCost}${note}`);
    });
  }

  if (p.techStack.length > 0) {
    section("Tech Stack");
    p.techStack.forEach((t) => push(`- ${t.layer}: ${t.choice} -- ${t.reason}`));
  }

  if (p.boundaries.length > 0) {
    section("Scope Boundaries");
    bullet(p.boundaries);
  }

  if (p.risks.length > 0) {
    section("Risk Signals");
    p.risks.forEach((r, i) => push(`${i + 1}. ${r}`));
  }

  if (p.assumptions.length > 0) {
    section("Assumptions");
    p.assumptions.forEach((a) => push(`Assumed: ${a}`));
  }

  if (p.nextSteps.length > 0) {
    section("Next Steps");
    bullet(p.nextSteps);
  }

  return lines.join("\n");
}

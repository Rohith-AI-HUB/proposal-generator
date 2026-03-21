// Renders a Proposal into plain text for copy/paste export.
// The only file that knows how to format the domain object as text.
//
// Section numbers are derived from a running counter so conditionally-present
// sections (Feasibility Note, Risk Signals, Assumptions) do not create
// numbering collisions or gaps in the exported copy.

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

  // 1. Project Overview
  section("Project Overview");
  push(p.overview.summary);
  blank();
  push(p.overview.outcome);

  // 2. Feasibility Note (only for non-green proposals with a note)
  if (p.overview.feasibility !== "green" && p.overview.feasibilityNote) {
    section("Feasibility Note");
    push(p.overview.feasibilityNote);
  }

  // Scope of Work
  section("Scope of Work");
  push("Phase 1 -- Core (Must-have)");
  bullet(p.scope.core);
  if (p.scope.extended.length > 0) {
    blank();
    push("Phase 2 -- Extended (Nice-to-have)");
    bullet(p.scope.extended);
  }

  // Deliverables
  if (p.deliverables.length > 0) {
    section("Deliverables");
    bullet(p.deliverables);
  }

  // Timeline
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

  // Pricing Estimate
  section("Pricing Estimate");
  const fmt = (num: number) =>
    num.toLocaleString("en-US", {
      style: "currency",
      currency: p.pricing.currency,
      maximumFractionDigits: 0,
    });
  const isRange = p.pricing.totalMin !== p.pricing.totalMax;
  push(
    isRange
      ? `Total: ${fmt(p.pricing.totalMin)} - ${fmt(p.pricing.totalMax)} ${p.pricing.currency}`
      : `Total: ${fmt(p.pricing.totalMin)} ${p.pricing.currency}`
  );
  blank();
  p.pricing.modules.forEach((m) => push(`- ${m.module} (${m.rationale}): ${m.cost}`));
  blank();
  push(p.pricing.rationale);
  blank();
  push(p.pricing.valueJustification);
  blank();
  push(p.pricing.variabilityNote);

  // Tech Stack
  if (p.techStack.length > 0) {
    section("Tech Stack");
    p.techStack.forEach((t) => push(`- ${t.layer}: ${t.choice} -- ${t.reason}`));
  }

  // Scope Boundaries
  if (p.boundaries.length > 0) {
    section("Scope Boundaries");
    bullet(p.boundaries);
  }

  // Risk Signals
  if (p.risks.length > 0) {
    section("Risk Signals");
    p.risks.forEach((r, i) => push(`${i + 1}. ${r}`));
  }

  // Assumptions
  if (p.assumptions.length > 0) {
    section("Assumptions");
    p.assumptions.forEach((a) => push(`Assumed: ${a}`));
  }

  // Next Steps
  if (p.nextSteps.length > 0) {
    section("Next Steps");
    bullet(p.nextSteps);
  }

  return lines.join("\n");
}

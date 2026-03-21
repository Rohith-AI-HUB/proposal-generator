// Renders a Proposal into plain text for copy/paste export.
// The only file that knows how to format the domain object as text.

import type { Proposal } from "@/lib/domain/proposal/schema";

export function renderProposalText(p: Proposal): string {
  const lines: string[] = [];
  const push = (...s: string[]) => lines.push(...s);
  const blank = () => lines.push("");
  const section = (title: string) => { blank(); push(`## ${title}`); blank(); };
  const bullet = (items: string[]) => items.forEach((i) => push(`- ${i}`));

  push("# Project Proposal");
  blank();

  section("1. Project Overview");
  push(p.overview.summary);
  blank();
  push(p.overview.outcome);
  if (p.overview.feasibilityNote) {
    blank();
    push(`Note: ${p.overview.feasibilityNote}`);
  }

  if (p.overview.feasibility !== "green" && p.overview.feasibilityNote) {
    section("2b. Feasibility Note");
    push(p.overview.feasibilityNote);
  }

  section("2. Scope of Work");
  push("Phase 1 — Core (Must-have)");
  bullet(p.scope.core);
  if (p.scope.extended.length > 0) {
    blank();
    push("Phase 2 — Extended (Nice-to-have)");
    bullet(p.scope.extended);
  }

  section("3. Deliverables");
  bullet(p.deliverables);

  section("4. Timeline");
  p.timeline.phases.forEach((ph) => {
    const note = ph.notes ? ` — ${ph.notes}` : "";
    push(`- ${ph.name}: ${ph.days} days${note}`);
  });
  blank();
  push(`Total: ${p.timeline.totalDays} days`);
  if (p.timeline.dependencies.length > 0) {
    blank();
    push("Dependencies:");
    bullet(p.timeline.dependencies);
  }

  section("5. Pricing Estimate");
  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: p.pricing.currency, maximumFractionDigits: 0 });
  push(`Total: ${fmt(p.pricing.totalMin)} – ${fmt(p.pricing.totalMax)} ${p.pricing.currency}`);
  blank();
  p.pricing.modules.forEach((m) => push(`- ${m.module} (${m.rationale}): ${m.cost}`));
  blank();
  push(p.pricing.rationale);
  blank();
  push(p.pricing.valueJustification);
  blank();
  push(p.pricing.variabilityNote);

  section("6. Tech Stack");
  p.techStack.forEach((t) => push(`- ${t.layer}: ${t.choice} — ${t.reason}`));

  section("7. Scope Boundaries");
  bullet(p.boundaries);

  if (p.risks.length > 0) {
    section("8. Risk Signals");
    p.risks.forEach((r, i) => push(`${i + 1}. ${r}`));
  }

  if (p.assumptions.length > 0) {
    section("9. Assumptions");
    p.assumptions.forEach((a) => push(`Assumed: ${a}`));
  }

  section("10. Next Steps");
  bullet(p.nextSteps);

  return lines.join("\n");
}

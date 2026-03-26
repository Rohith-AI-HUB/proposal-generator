import { formatCurrencyAmount } from "@/lib/domain/proposal/currency";
import type { Proposal } from "@/lib/domain/proposal/schema";

export function renderProposalText(p: Proposal): string {
  const lines: string[] = [];
  const push = (...s: string[]) => lines.push(...s);
  const blank = () => lines.push("");

  let n = 0;
  const section = (title: string) => {
    n += 1;
    blank();
    push(`## ${n}. ${title}`);
    blank();
  };
  const bullet = (items: string[]) => items.forEach((i) => push(`- ${i}`));

  push("# Trust-First Project Draft");
  blank();

  section("Project Overview");
  push(p.overview.summary);
  blank();
  push(p.overview.outcome);
  blank();
  push(`Confidence: ${p.confidence.overall.toUpperCase()}`);
  push(p.confidence.note);

  if (p.overview.feasibility !== "green" && p.overview.feasibilityNote) {
    section("Feasibility Note");
    push(p.overview.feasibilityNote);
  }

  section("Scope of Work");
  push("Phase 1 - Core");
  bullet(p.scope.core);
  if (p.scope.extended.length > 0) {
    blank();
    push("Phase 2 - Extended");
    bullet(p.scope.extended);
  }

  if (p.deliverables.length > 0) {
    section("Deliverables");
    bullet(p.deliverables);
  }

  section("Timeline Estimate");
  push("This is a planning estimate, not a fixed delivery commitment.");
  blank();
  p.timeline.phases.forEach((ph) => {
    const note = ph.notes ? ` - ${ph.notes}` : "";
    push(`- ${ph.name}: ${ph.days} days${note}`);
  });
  blank();
  push(`Total estimate: ${p.timeline.totalDays} days`);
  if (p.timeline.dependencies.length > 0) {
    blank();
    push("Dependencies:");
    bullet(p.timeline.dependencies);
  }

  section("Pricing Estimate");
  push("This is a directional estimate, not a fixed quote.");
  blank();
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

  if (p.evidence.length > 0) {
    section("Verified Facts");
    p.evidence.forEach((item) => {
      push(`- ${item.claim}`);
      push(`  Source: ${item.sourceTitle} - ${item.sourceUrl}`);
      push(`  Why it matters: ${item.sourceRationale}`);
    });
  }

  if (p.unsupportedClaims.length > 0) {
    section("Uncertainty");
    p.unsupportedClaims.forEach((item) =>
      push(`- ${item.claim} - ${item.reason}`)
    );
  }

  if (p.clientCosts.length > 0) {
    section("Client-Borne Costs");
    push("These costs are separate from the development fee.");
    blank();
    p.clientCosts.forEach((c) => {
      const req = c.mandatory ? " [REQUIRED]" : " [optional]";
      const note = c.notes ? ` - ${c.notes}` : "";
      push(`- ${c.category}${req}: ${c.item} - ${c.estimatedCost}${note}`);
      if (c.sourceUrl && c.sourceTitle && c.sourceRationale) {
        push(`  Source: ${c.sourceTitle} - ${c.sourceUrl}`);
        push(`  Why it matters: ${c.sourceRationale}`);
      }
    });
  }

  if (p.techStack.length > 0) {
    section("Tech Stack");
    p.techStack.forEach((t) => push(`- ${t.layer}: ${t.choice} - ${t.reason}`));
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

  if (p.sources.length > 0) {
    section("Sources");
    p.sources.forEach((source) => {
      const snippet = source.snippet ? ` - ${source.snippet}` : "";
      push(`- ${source.title}: ${source.url}${snippet}`);
    });
  }

  return lines.join("\n");
}

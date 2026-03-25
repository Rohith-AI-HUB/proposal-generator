import { PRICING_GUARDRAILS } from "@/lib/domain/proposal/constants";
import { formatCurrencyAmount } from "@/lib/domain/proposal/currency";
import type {
  PricingModule,
  Proposal,
  TimelinePhase,
} from "@/lib/domain/proposal/schema";
import type { PricingContext } from "./prompt";

function clampPricing(value: number): number {
  return Math.min(
    Math.max(value, PRICING_GUARDRAILS.minUSD),
    PRICING_GUARDRAILS.maxUSD
  );
}

function buildModuleRationale(
  existing: PricingModule | undefined,
  phase: TimelinePhase
): string {
  const rationale = existing?.rationale?.trim();
  if (rationale) return rationale;
  if (phase.notes) return phase.notes;
  return `Work included in ${phase.name}.`;
}

function buildPhaseCost(days: number, pricingCtx: PricingContext): string {
  const rate = formatCurrencyAmount(pricingCtx.dayRate, pricingCtx.currency);
  const total = formatCurrencyAmount(days * pricingCtx.dayRate, pricingCtx.currency);
  return `${days} days x ${rate} = ${total}`;
}

function syncPricingModules(
  proposal: Proposal,
  pricingCtx: PricingContext
): PricingModule[] {
  return proposal.timeline.phases.map((phase, index) => {
    const existing = proposal.pricing.modules[index];
    const module = existing?.module?.trim() || phase.name;

    return {
      module,
      rationale: buildModuleRationale(existing, phase),
      cost: buildPhaseCost(phase.days, pricingCtx),
    };
  });
}

export function applyPricingContext(
  proposal: Proposal,
  pricingCtx: PricingContext
): Proposal {
  const totalMin = clampPricing(proposal.timeline.totalDays * pricingCtx.dayRate);
  const totalMax = clampPricing(Math.round(totalMin * 1.25));

  return {
    ...proposal,
    clientCosts: Array.isArray(proposal.clientCosts) ? proposal.clientCosts : [],
    pricing: {
      ...proposal.pricing,
      currency: pricingCtx.currency,
      totalMin,
      totalMax,
      modules: syncPricingModules(proposal, pricingCtx),
    },
  };
}

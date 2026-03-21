"use client";

import { SectionCard } from "./shared";
import type { ProposalPricing } from "@/lib/domain/proposal/schema";

export function PricingSection({
  pricing,
  id,
}: {
  pricing: ProposalPricing;
  id?: string;
}) {
  const fmt = (n: number) =>
    n.toLocaleString("en-US", {
      style: "currency",
      currency: pricing.currency,
      maximumFractionDigits: 0,
    });

  const isRange = pricing.totalMin !== pricing.totalMax;

  return (
    <SectionCard title="Pricing Estimate" id={id}>
      <div className="pricing-total">
        <span className="pricing-amount">
          {isRange
            ? `${fmt(pricing.totalMin)} – ${fmt(pricing.totalMax)}`
            : fmt(pricing.totalMin)}
        </span>
        <span className="pricing-currency">{pricing.currency}</span>
      </div>

      <div className="pricing-modules">
        {pricing.modules.map((m, i) => (
          <div key={i} className="pricing-module-row">
            <span>
              <span className="pricing-module-name">{m.module}</span>
              <span className="pricing-module-rationale"> — {m.rationale}</span>
            </span>
            <span className="pricing-module-cost">{m.cost}</span>
          </div>
        ))}
      </div>

      <div className="pricing-notes">
        <p className="pricing-rationale">{pricing.rationale}</p>
        <p className="pricing-value">{pricing.valueJustification}</p>
        <p className="pricing-variability">{pricing.variabilityNote}</p>
      </div>
    </SectionCard>
  );
}

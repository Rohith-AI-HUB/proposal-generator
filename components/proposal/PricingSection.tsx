"use client";

import { SectionCard } from "./shared";
import type { ProposalPricing } from "@/lib/domain/proposal/schema";

export function PricingSection({ pricing }: { pricing: ProposalPricing }) {
  const fmt = (n: number) =>
    n.toLocaleString("en-US", {
      style: "currency",
      currency: pricing.currency,
      maximumFractionDigits: 0,
    });

  const isRange = pricing.totalMin !== pricing.totalMax;

  return (
    <SectionCard title="Pricing Estimate">
      <div style={{ marginBottom: "16px" }}>
        <span style={{ fontSize: "24px", fontWeight: 800, color: "#f1f5f9" }}>
          {isRange
            ? `${fmt(pricing.totalMin)} – ${fmt(pricing.totalMax)}`
            : fmt(pricing.totalMin)}
        </span>
        <span style={{ color: "#64748b", fontSize: "13px", marginLeft: "6px" }}>
          {pricing.currency}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
        {pricing.modules.map((m, i) => (
          <div
            key={i}
            style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start" }}
          >
            <span style={{ color: "#94a3b8" }}>
              {m.module}
              <span style={{ color: "#475569", fontSize: "12.5px" }}> — {m.rationale}</span>
            </span>
            <span style={{ flexShrink: 0, fontWeight: 600, color: "#f1f5f9" }}>{m.cost}</span>
          </div>
        ))}
      </div>

      <div style={{
        paddingTop: "14px",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        display: "flex", flexDirection: "column", gap: "8px",
      }}>
        <p>{pricing.rationale}</p>
        <p style={{ color: "#94a3b8" }}>{pricing.valueJustification}</p>
        <p style={{ color: "#64748b", fontSize: "12.5px" }}>{pricing.variabilityNote}</p>
      </div>
    </SectionCard>
  );
}

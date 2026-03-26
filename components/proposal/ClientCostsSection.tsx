"use client";

import type { ClientCostItem, ConfidenceLevel } from "@/lib/domain/proposal/schema";
import { SectionCard } from "./shared";

export function ClientCostsSection({
  clientCosts,
  id,
  confidenceLevel,
  confidenceReason,
}: {
  clientCosts: ClientCostItem[];
  id?: string;
  confidenceLevel?: ConfidenceLevel;
  confidenceReason?: string;
}) {
  if (!clientCosts.length) return null;

  return (
    <SectionCard
      title="Client-Borne Costs"
      id={id}
      confidenceLevel={confidenceLevel}
      confidenceReason={confidenceReason}
    >
      <p className="tech-reason" style={{ marginBottom: "1rem" }}>
        These are direct client costs outside the freelancer fee. Numeric prices
        should be treated as source-backed only when a source link is shown.
      </p>
      <div className="tech-rows">
        {clientCosts.map((c, i) => (
          <div key={i} className="tech-row">
            <span className="tech-layer">
              {c.category}
              {c.mandatory && (
                <span
                  style={{
                    color: "var(--accent)",
                    fontSize: "0.7rem",
                    marginLeft: "0.4rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  required
                </span>
              )}
            </span>
            <span>
              <span className="tech-choice-name">{c.item}</span>
              <span className="tech-reason"> - {c.estimatedCost}</span>
              {c.notes && <span className="tech-reason"> - {c.notes}</span>}
              {(c.sourceUrl || c.sourceRationale) && (
                <span className="cost-source">
                  {c.sourceUrl ? (
                    <a href={c.sourceUrl} target="_blank" rel="noreferrer">
                      {c.sourceTitle ?? "Source"}
                    </a>
                  ) : (
                    <span>{c.sourceTitle ?? "Unlinked source note"}</span>
                  )}
                  {c.sourceRationale && (
                    <span className="tech-reason"> - {c.sourceRationale}</span>
                  )}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

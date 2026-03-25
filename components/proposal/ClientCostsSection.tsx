"use client";

import type { ClientCostItem } from "@/lib/domain/proposal/schema";
import { SectionCard } from "./shared";

export function ClientCostsSection({
  clientCosts,
  id,
}: {
  clientCosts: ClientCostItem[];
  id?: string;
}) {
  if (!clientCosts.length) return null;

  return (
    <SectionCard title="Client-Borne Costs" id={id}>
      <p className="tech-reason" style={{ marginBottom: "1rem" }}>
        The following costs are separate from the development fee and are the
        client&apos;s direct responsibility.
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
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

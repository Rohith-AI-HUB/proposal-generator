"use client";

import type { ConfidenceLevel, ProposalSource } from "@/lib/domain/proposal/schema";
import { SectionCard } from "./shared";

function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return url;
  }
}

export function SourcesSection({
  sources,
  id,
  confidenceLevel,
  confidenceReason,
}: {
  sources: ProposalSource[];
  id?: string;
  confidenceLevel?: ConfidenceLevel;
  confidenceReason?: string;
}) {
  if (!sources.length) return null;

  return (
    <SectionCard
      title="Sources"
      id={id}
      confidenceLevel={confidenceLevel}
      confidenceReason={confidenceReason}
    >
      <p className="tech-reason" style={{ marginBottom: "1rem" }}>
        These links back the current market and vendor facts. They do not make
        the build estimate itself factual.
      </p>
      <div className="tech-rows">
        {sources.map((source, i) => (
          <div key={`${source.url}-${i}`} className="tech-row">
            <span className="tech-layer">{domainFromUrl(source.url)}</span>
            <span>
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="tech-choice-name"
                style={{ textDecoration: "underline" }}
              >
                {source.title}
              </a>
              {source.snippet && (
                <span className="tech-reason"> - {source.snippet}</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

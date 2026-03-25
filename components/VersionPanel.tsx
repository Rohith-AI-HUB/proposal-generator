"use client";

import { useEffect } from "react";

interface VersionPanelProps {
  onClose: () => void;
}

const VERSION = "1.5.0";
const STATUS = "BETA";
const DATE = "2026-03-25";

const CHANGELOG: { version: string; date: string; entries: string[] }[] = [
  {
    version: "1.5.0",
    date: "2026-03-25",
    entries: [
      "Pricing context added to the input flow: client type toggle plus day-rate control before generation",
      "Prompt pricing rules tightened so every estimate is anchored to the supplied rate and explicit phase math",
      "Server-side pricing normalization now rewrites currency, totals, and pricing modules from route-provided context",
      "Client-borne costs added to the proposal schema, UI navigation, section rendering, and plain-text export",
      "Currency formatting centralized with INR using en-IN formatting and USD using en-US formatting",
      "Pricing guardrails expanded so large INR projects do not get clamped into unrealistic caps",
    ],
  },
  {
    version: "1.4.0",
    date: "2026-03-22",
    entries: [
      "Input quality warnings detect missing budget, deadline, vague scope, and budget or timeline conflicts while typing",
      "Repair retry makes one automatic correction pass when the model returns invalid JSON or fails schema validation",
      "Zod schema validation replaced the handwritten validator with nested type checks and semantic rules",
      "Rate limiting added with Upstash Redis sliding window and in-memory fallback for local development",
      "Structured request logging records requestId, latency, token counts, repairUsed, and failure class",
      "Unified signal module keeps browser warnings and server prompt hints on the same logic",
      "VisibilityMap keeps section navigation and rendered sections in sync",
      "Horizontal scroll fixed with layout containment and grid sizing corrections",
      "Feasibility note no longer appears twice in clipboard export",
      "Status code mapping corrected across 400, 413, 429, 500, and 502 cases",
      "Prompt text cleaned up to avoid non-ASCII mojibake in generated output",
    ],
  },
  {
    version: "1.0.0",
    date: "initial",
    entries: [
      "Core proposal generation via Groq llama-3.3-70b-versatile",
      "Structured output covering overview, feasibility, scope, deliverables, timeline, pricing, tech stack, boundaries, risks, assumptions, and next steps",
      "Feasibility spectrum with Green, Amber, Orange, and Red outcomes",
      "Pricing breakdown with rationale and value justification",
      "Theme support with warm cream styling",
      "Sticky section navigation with active section tracking",
      "Plain-text clipboard export",
    ],
  },
];

const STACK = [
  { layer: "Framework", value: "Next.js 16 - App Router" },
  { layer: "Language", value: "TypeScript 5" },
  { layer: "Styling", value: "Tailwind CSS 3 + custom CSS tokens" },
  { layer: "Model", value: "Groq - llama-3.3-70b-versatile" },
  { layer: "Validation", value: "Zod 3" },
  { layer: "Rate limit", value: "Upstash Redis - sliding window" },
  { layer: "Fonts", value: "Fraunces + DM Sans + DM Mono" },
];

export function VersionPanel({ onClose }: VersionPanelProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="vp-backdrop" onClick={onClose} aria-modal="true" role="dialog">
      <div className="vp-panel" onClick={(e) => e.stopPropagation()}>
        <div className="vp-header">
          <div className="vp-title-group">
            <span className="vp-name">ProposaIQ</span>
            <span className="vp-badge">
              v{VERSION} - {STATUS}
            </span>
          </div>
          <button className="vp-close" onClick={onClose} aria-label="Close">
            x
          </button>
        </div>

        <div className="vp-body">
          <section className="vp-section">
            <p className="vp-section-label">Changelog</p>
            {CHANGELOG.map((release) => (
              <div key={release.version} className="vp-release">
                <div className="vp-release-header">
                  <span className="vp-release-version">v{release.version}</span>
                  <span className="vp-release-date">{release.date}</span>
                </div>
                <ul className="vp-entry-list">
                  {release.entries.map((entry, i) => (
                    <li key={i} className="vp-entry">
                      {entry}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>

          <section className="vp-section">
            <p className="vp-section-label">Stack</p>
            <div className="vp-stack">
              {STACK.map((s) => (
                <div key={s.layer} className="vp-stack-row">
                  <span className="vp-stack-layer">{s.layer}</span>
                  <span className="vp-stack-value">{s.value}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="vp-footer">
          <span className="vp-footer-text">Last updated {DATE}</span>
          <button className="vp-close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

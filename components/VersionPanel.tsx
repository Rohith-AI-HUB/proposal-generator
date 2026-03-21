"use client";

import { useEffect } from "react";

interface VersionPanelProps {
  onClose: () => void;
}

const VERSION = "1.4.0";
const STATUS  = "BETA";
const DATE    = "2026-03-22";

const CHANGELOG: { version: string; date: string; entries: string[] }[] = [
  {
    version: "1.4.0",
    date:    "2026-03-22",
    entries: [
      "Input quality warnings — detects missing budget, deadline, vague scope, and budget/timeline conflicts as you type",
      "Repair retry — if the model returns invalid JSON or fails schema validation, one automatic repair attempt is made before failing",
      "Zod schema validation — replaced handwritten validator with a full Zod schema covering nested types, semantic rules, and normalization transforms",
      "Rate limiting — Upstash Redis sliding window (5 req / 15 min per IP) with in-memory fallback for local development",
      "Structured request logging — one JSON line per request with requestId, latency, token counts, repairUsed, and failure class",
      "Unified signal module — browser warnings and server prompt hints share identical detection logic and cannot drift",
      "Nav / render sync — VisibilityMap ensures section nav and rendered sections always agree",
      "Horizontal scroll fixed — grid minmax(0, 1fr) and overflow-x containment",
      "Feasibility note deduplication — note no longer rendered twice in clipboard export",
      "Status code correctness — proper 400 / 413 / 429 / 500 / 502 mapping, INVALID_BODY fix",
      "ASCII cleanup in prompt — box-drawing characters replaced to prevent mojibake",
    ],
  },
  {
    version: "1.0.0",
    date:    "initial",
    entries: [
      "Core proposal generation via Groq llama-3.3-70b-versatile",
      "11-section structured output: Overview, Feasibility, Scope, Deliverables, Timeline, Pricing, Tech Stack, Boundaries, Risks, Assumptions, Next Steps",
      "Feasibility spectrum — Green / Amber / Orange / Red with structured conflict notes",
      "Pricing with module breakdown, rationale, and value justification",
      "Dark / light theme with warm cream palette",
      "Sticky section nav with IntersectionObserver active tracking",
      "Plain-text clipboard export",
    ],
  },
];

const STACK = [
  { layer: "Framework",   value: "Next.js 16 — App Router" },
  { layer: "Language",    value: "TypeScript 5" },
  { layer: "Styling",     value: "Tailwind CSS 3 + custom CSS tokens" },
  { layer: "Model",       value: "Groq — llama-3.3-70b-versatile" },
  { layer: "Validation",  value: "Zod 3" },
  { layer: "Rate limit",  value: "Upstash Redis — sliding window" },
  { layer: "Fonts",       value: "Fraunces + DM Sans + DM Mono" },
];

export function VersionPanel({ onClose }: VersionPanelProps) {
  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="vp-backdrop" onClick={onClose} aria-modal="true" role="dialog">
      <div
        className="vp-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="vp-header">
          <div className="vp-title-group">
            <span className="vp-name">ProposaIQ</span>
            <span className="vp-badge">
              v{VERSION} — {STATUS}
            </span>
          </div>
          <button className="vp-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="vp-body">
          {/* Changelog */}
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
                    <li key={i} className="vp-entry">{entry}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>

          {/* Stack */}
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
          <button className="vp-close-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

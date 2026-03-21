"use client";

import { useState, useRef, useEffect } from "react";
import Logo from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProposalView } from "@/components/proposal/ProposalView";
import type {
  Proposal,
  GenerateResponse,
  GenerateErrorResponse,
} from "@/lib/domain/proposal/schema";
import { MAX_REQUIREMENT_LENGTH } from "@/lib/domain/proposal/constants";
import { computeWarnings, type InputWarning } from "@/lib/domain/proposal/warnings";
import { VersionPanel } from "@/components/VersionPanel";

export default function HomePage() {
  const [requirement, setRequirement] = useState("");
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [renderedText, setRenderedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [warnings, setWarnings] = useState<InputWarning[]>([]);
  const [showVersion, setShowVersion] = useState(false);
  const toolRef = useRef<HTMLDivElement>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced warning computation — runs 600ms after the user stops typing.
  // Avoids computing on every keystroke and avoids showing warnings mid-sentence.
  useEffect(() => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    warningTimerRef.current = setTimeout(() => {
      setWarnings(computeWarnings(requirement));
    }, 600);
    return () => {
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, [requirement]);

  async function generate(req: string) {
    setLoading(true);
    setError("");
    setProposal(null);
    setRenderedText("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirement: req }),
      });
      const data: GenerateResponse | GenerateErrorResponse = await res.json();
      if (!res.ok) {
        setError((data as GenerateErrorResponse).error || "Something went wrong.");
        return;
      }
      const ok = data as GenerateResponse;
      setProposal(ok.proposal);
      setRenderedText(ok.renderedText);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(renderedText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function scrollToTool() {
    toolRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const charCount = requirement.length;
  const overLimit = charCount > MAX_REQUIREMENT_LENGTH;

  return (
    <main>
      {showVersion && (
        <VersionPanel onClose={() => setShowVersion(false)} />
      )}

      {/* ── HEADER ── */}
      <header className="page-header">
        <Logo size="sm" />
        <div className="header-right">
          <ThemeToggle />
          <button
            className="version-btn"
            onClick={() => setShowVersion(true)}
            aria-label="View version info and changelog"
          >
            v1.4.0 — BETA
          </button>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="hero">
        <div>
          <h1 className="hero-headline">
            Turn messy client notes<br />
            into <em>proposals that close.</em>
          </h1>
          <button className="hero-scroll" onClick={scrollToTool}>
            <span className="hero-scroll-line" />
            Start generating
          </button>
        </div>
      </section>

      {/* ── TOOL ROOT ── */}
      <div className="tool-root" ref={toolRef}>

        {/* LEFT — Input panel */}
        <aside className="input-panel">
          <div>
            <label className="input-label" htmlFor="requirement">
              Client requirement
            </label>
            <textarea
              id="requirement"
              className="req-textarea"
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
              placeholder={"Describe what the client asked for.\nPaste an email, a Notion doc, a Slack message — anything."}
              rows={14}
            />
            {error && <p className="error-msg">{error}</p>}

            {/* ── WARNINGS ── shown after user has typed enough */}
            {warnings.length > 0 && !loading && (
              <ul className="warnings-list" aria-label="Input quality signals">
                {warnings.map((w) => (
                  <li key={w.id} className={`warning-badge warning-badge--${w.severity}`}>
                    <span className="warning-icon" aria-hidden="true">
                      {w.severity === "conflict" ? "!" : w.severity === "caution" ? "△" : "i"}
                    </span>
                    <span>
                      <span className="warning-label">{w.label}</span>
                      <span className="warning-detail">{w.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="input-footer">
            <span className="char-count">
              {charCount.toLocaleString()} / {MAX_REQUIREMENT_LENGTH.toLocaleString()}
            </span>
            <button
              className="generate-btn"
              onClick={() => generate(requirement)}
              disabled={loading || !requirement.trim() || overLimit}
            >
              {loading ? "Generating…" : "Generate proposal"}
            </button>
          </div>

          {loading && (
            <div className="status-line">
              <span className="status-dot" />
              Building proposal — this takes 10–20 seconds
            </div>
          )}
        </aside>

        {/* RIGHT — Output panel */}
        <div className="output-panel">
          {proposal ? (
            <ProposalView
              proposal={proposal}
              loading={loading}
              onRegenerate={() => generate(requirement)}
              onCopy={handleCopy}
              copied={copied}
            />
          ) : (
            <div className="empty-state">
              <p className="empty-label">Output</p>
              <p className="empty-hint">
                {loading
                  ? "Generating your proposal…"
                  : "Your proposal will appear here."}
              </p>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}

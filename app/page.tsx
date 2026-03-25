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

type ClientType = "domestic" | "international";

// Default day rates shown as placeholder when the user hasn't typed yet.
const DEFAULT_RATES: Record<ClientType, number> = {
  domestic:      5000,  // ₹5,000/day — mid-market India freelance rate
  international: 100,   // $100/day   — entry-level international rate
};

const CURRENCY_LABELS: Record<ClientType, string> = {
  domestic:      "INR (₹)",
  international: "USD ($)",
};

const CURRENCY_SYMBOLS: Record<ClientType, string> = {
  domestic:      "₹",
  international: "$",
};

export default function HomePage() {
  const [requirement, setRequirement]   = useState("");
  const [clientType, setClientType]     = useState<ClientType>("international");
  const [dayRate, setDayRate]           = useState<string>("");
  const [proposal, setProposal]         = useState<Proposal | null>(null);
  const [renderedText, setRenderedText] = useState("");
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [copied, setCopied]             = useState(false);
  const [warnings, setWarnings]         = useState<InputWarning[]>([]);
  const [showVersion, setShowVersion]   = useState(false);
  const toolRef         = useRef<HTMLDivElement>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced warning computation — runs 600ms after the user stops typing.
  useEffect(() => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    warningTimerRef.current = setTimeout(() => {
      setWarnings(computeWarnings(requirement));
    }, 600);
    return () => {
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, [requirement]);

  // When client type changes, clear the day rate so the new placeholder shows.
  function handleClientTypeChange(type: ClientType) {
    setClientType(type);
    setDayRate("");
  }

  function getEffectiveDayRate(): number {
    const parsed = parseInt(dayRate, 10);
    return Number.isFinite(parsed) && parsed > 0
      ? parsed
      : DEFAULT_RATES[clientType];
  }

  async function generate(req: string) {
    setLoading(true);
    setError("");
    setProposal(null);
    setRenderedText("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requirement: req,
          clientType,
          dayRate: getEffectiveDayRate(),
        }),
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
  const symbol    = CURRENCY_SYMBOLS[clientType];

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
            v1.5.0 — BETA
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

            {/* ── PRICING CONTEXT ── */}
            <div className="pricing-context">

              {/* Client type toggle */}
              <div className="pricing-context-row">
                <span className="pricing-context-label">Client</span>
                <div className="client-type-toggle" role="group" aria-label="Client type">
                  {(["international", "domestic"] as ClientType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={`client-type-btn${clientType === type ? " client-type-btn--active" : ""}`}
                      onClick={() => handleClientTypeChange(type)}
                      aria-pressed={clientType === type}
                    >
                      {type === "domestic" ? "Domestic (India)" : "International"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Day rate input */}
              <div className="pricing-context-row">
                <label className="pricing-context-label" htmlFor="dayRate">
                  Day rate
                </label>
                <div className="day-rate-input-wrap">
                  <span className="day-rate-currency" aria-hidden="true">
                    {symbol}
                  </span>
                  <input
                    id="dayRate"
                    className="day-rate-input"
                    type="number"
                    min={1}
                    step={clientType === "domestic" ? 500 : 10}
                    value={dayRate}
                    onChange={(e) => setDayRate(e.target.value)}
                    placeholder={String(DEFAULT_RATES[clientType])}
                    aria-label={`Day rate in ${CURRENCY_LABELS[clientType]}`}
                  />
                  <span className="day-rate-suffix">{CURRENCY_LABELS[clientType]} / day</span>
                </div>
              </div>

            </div>
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

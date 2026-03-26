"use client";

import { useState, useRef, useEffect } from "react";
import Logo from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProposalView } from "@/components/proposal/ProposalView";
import type {
  ClarificationQuestion,
  GenerateErrorResponse,
  GenerateResponse,
  Proposal,
} from "@/lib/domain/proposal/schema";
import { MAX_REQUIREMENT_LENGTH } from "@/lib/domain/proposal/constants";
import { computeWarnings, type InputWarning } from "@/lib/domain/proposal/warnings";
import { VersionPanel } from "@/components/VersionPanel";

type ClientType = "domestic" | "international";

const DEFAULT_RATES: Record<ClientType, number> = {
  domestic: 5000,
  international: 100,
};

const CURRENCY_LABELS: Record<ClientType, string> = {
  domestic: "INR (Rs)",
  international: "USD ($)",
};

const CURRENCY_SYMBOLS: Record<ClientType, string> = {
  domestic: "Rs",
  international: "$",
};

export default function HomePage() {
  const [requirement, setRequirement] = useState("");
  const [clientType, setClientType] = useState<ClientType>("international");
  const [dayRate, setDayRate] = useState<string>("");
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [renderedText, setRenderedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [warnings, setWarnings] = useState<InputWarning[]>([]);
  const [showVersion, setShowVersion] = useState(false);
  const [clarificationSummary, setClarificationSummary] = useState("");
  const [questions, setQuestions] = useState<ClarificationQuestion[]>([]);
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<string, string>>({});
  const toolRef = useRef<HTMLDivElement>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    warningTimerRef.current = setTimeout(() => {
      setWarnings(computeWarnings(requirement));
    }, 600);
    return () => {
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, [requirement]);

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

  function resetDraftState() {
    setProposal(null);
    setRenderedText("");
    setCopied(false);
  }

  function resetClarifications() {
    setClarificationSummary("");
    setQuestions([]);
    setClarificationAnswers({});
  }

  function clearClarificationPrompt() {
    setClarificationSummary("");
    setQuestions([]);
  }

  async function generate(req: string, answers: Record<string, string> = {}) {
    setLoading(true);
    setError("");
    resetDraftState();

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requirement: req,
          clientType,
          dayRate: getEffectiveDayRate(),
          clarificationAnswers: answers,
        }),
      });

      const data: GenerateResponse | GenerateErrorResponse = await res.json();

      if (!res.ok) {
        setError((data as GenerateErrorResponse).error || "Something went wrong.");
        return;
      }

      const ok = data as GenerateResponse;

      if (ok.status === "needs_clarification") {
        setProposal(null);
        setRenderedText("");
        setClarificationSummary(ok.summary);
        setQuestions(ok.questions);
        setClarificationAnswers((current) => {
          const next = { ...current };
          ok.questions.forEach((question) => {
            if (!(question.id in next)) next[question.id] = "";
          });
          return next;
        });
        return;
      }

      setProposal(ok.proposal);
      setRenderedText(ok.renderedText);
      clearClarificationPrompt();
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

  function handleRequirementChange(value: string) {
    setRequirement(value);
    if (questions.length > 0) resetClarifications();
    resetDraftState();
    setError("");
  }

  function handleClarificationChange(id: string, value: string) {
    setClarificationAnswers((current) => ({
      ...current,
      [id]: value,
    }));
  }

  const charCount = requirement.length;
  const overLimit = charCount > MAX_REQUIREMENT_LENGTH;
  const symbol = CURRENCY_SYMBOLS[clientType];
  const isClarificationStep = questions.length > 0;
  const allQuestionsAnswered = questions.every(
    (question) => clarificationAnswers[question.id]?.trim().length > 0
  );

  return (
    <main>
      {showVersion && <VersionPanel onClose={() => setShowVersion(false)} />}

      <header className="page-header">
        <Logo size="sm" />
        <div className="header-right">
          <ThemeToggle />
          <button
            className="version-btn"
            onClick={() => setShowVersion(true)}
            aria-label="View version info and changelog"
          >
            v1.6.0 - BETA
          </button>
        </div>
      </header>

      <section className="hero">
        <div>
          <h1 className="hero-headline">
            Turn messy client notes
            <br />
            into <em>a draft you can trust.</em>
          </h1>
          <p className="hero-subcopy">
            ProposaIQ now separates sourced facts from estimates and forces
            follow-up questions before vague briefs turn into bluff.
          </p>
          <button className="hero-scroll" onClick={scrollToTool}>
            <span className="hero-scroll-line" />
            Start drafting
          </button>
        </div>
      </section>

      <div className="tool-root" ref={toolRef}>
        <aside className="input-panel">
          <div>
            <label className="input-label" htmlFor="requirement">
              Client brief
            </label>
            <textarea
              id="requirement"
              className="req-textarea"
              value={requirement}
              onChange={(e) => handleRequirementChange(e.target.value)}
              placeholder={
                "Describe what the client asked for.\nPaste an email, a Notion doc, or a Slack thread."
              }
              rows={14}
            />
            {error && <p className="error-msg">{error}</p>}

            {warnings.length > 0 && !loading && !isClarificationStep && (
              <ul className="warnings-list" aria-label="Input quality signals">
                {warnings.map((w) => (
                  <li key={w.id} className={`warning-badge warning-badge--${w.severity}`}>
                    <span className="warning-icon" aria-hidden="true">
                      {w.severity === "conflict" ? "!" : w.severity === "caution" ? "^" : "i"}
                    </span>
                    <span>
                      <span className="warning-label">{w.label}</span>
                      <span className="warning-detail">{w.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="pricing-context">
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

            {isClarificationStep && (
              <div className="clarification-panel">
                <p className="clarification-title">Clarify before drafting</p>
                <p className="clarification-summary">{clarificationSummary}</p>
                <div className="clarification-list">
                  {questions.map((question) => (
                    <label key={question.id} className="clarification-item">
                      <span className="clarification-label">{question.label}</span>
                      <span className="clarification-question">{question.question}</span>
                      <textarea
                        className="clarification-input"
                        rows={2}
                        value={clarificationAnswers[question.id] ?? ""}
                        onChange={(e) =>
                          handleClarificationChange(question.id, e.target.value)
                        }
                        placeholder={question.placeholder}
                      />
                      <span className="clarification-reason">{question.reason}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="input-footer">
            <span className="char-count">
              {charCount.toLocaleString()} / {MAX_REQUIREMENT_LENGTH.toLocaleString()}
            </span>
            <button
              className="generate-btn"
              onClick={() =>
                generate(
                  requirement,
                  isClarificationStep ? clarificationAnswers : {}
                )
              }
              disabled={
                loading ||
                !requirement.trim() ||
                overLimit ||
                (isClarificationStep && !allQuestionsAnswered)
              }
            >
              {loading
                ? "Working..."
                : isClarificationStep
                  ? "Generate trust-first draft"
                  : "Review brief"}
            </button>
          </div>

          {loading && (
            <div className="status-line">
              <span className="status-dot" />
              Reviewing the brief, checking missing details, and grounding facts
            </div>
          )}
        </aside>

        <div className="output-panel">
          {proposal ? (
            <ProposalView
              proposal={proposal}
              loading={loading}
              onRegenerate={() => generate(requirement, clarificationAnswers)}
              onCopy={handleCopy}
              copied={copied}
            />
          ) : (
            <div className="empty-state">
              <p className="empty-label">Output</p>
              <p className="empty-hint">
                {loading
                  ? "Building your trust-first draft..."
                  : isClarificationStep
                    ? "Answer the missing items on the left to unlock the draft."
                    : "Your first draft will appear here."}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Logo from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import type {
  DraftMode,
  GenerateErrorResponse,
  GenerateResponse,
  ProofPack,
  ReplyDraft,
} from "@/lib/domain/proposal/schema";
import { MAX_REQUIREMENT_LENGTH } from "@/lib/domain/proposal/constants";

const STORAGE_KEY = "proposaiq-proof-pack-v1";
const DEFAULT_PURCHASE_URL =
  "mailto:rohithbrock9164@gmail.com?subject=Reply%20Sprint%20Pack%20-%20%2429";

const EMPTY_PROOF_PACK: ProofPack = {
  specialty: "",
  proofPoints: ["", "", ""],
  portfolioUrl: "",
};

function normalizeProofPack(raw: unknown): ProofPack {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return EMPTY_PROOF_PACK;
  }

  const value = raw as Record<string, unknown>;
  const proofPoints = Array.isArray(value.proofPoints)
    ? value.proofPoints
        .filter((item): item is string => typeof item === "string")
        .slice(0, 3)
    : [];

  while (proofPoints.length < 3) {
    proofPoints.push("");
  }

  return {
    specialty: typeof value.specialty === "string" ? value.specialty : "",
    proofPoints,
    portfolioUrl:
      typeof value.portfolioUrl === "string" ? value.portfolioUrl : "",
  };
}

export default function HomePage() {
  const builderRef = useRef<HTMLDivElement>(null);
  const purchaseUrl =
    process.env.NEXT_PUBLIC_REPLY_SPRINT_URL ?? DEFAULT_PURCHASE_URL;

  const [jobPost, setJobPost] = useState("");
  const [proofPack, setProofPack] = useState<ProofPack>(EMPTY_PROOF_PACK);
  const [draftMode, setDraftMode] = useState<DraftMode>("quick_reply");
  const [draft, setDraft] = useState<ReplyDraft | null>(null);
  const [renderedText, setRenderedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedTarget, setCopiedTarget] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setProofPack(normalizeProofPack(JSON.parse(saved)));
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(proofPack));
  }, [hydrated, proofPack]);

  function scrollToBuilder() {
    builderRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resetOutput() {
    setDraft(null);
    setRenderedText("");
    setCopiedTarget(null);
    setError("");
  }

  function updateProofField(field: "specialty" | "portfolioUrl", value: string) {
    setProofPack((current) => ({ ...current, [field]: value }));
    resetOutput();
  }

  function updateProofPoint(index: number, value: string) {
    setProofPack((current) => {
      const next = [...current.proofPoints];
      next[index] = value;
      return { ...current, proofPoints: next };
    });
    resetOutput();
  }

  async function handleGenerate(requestedMode: DraftMode = draftMode) {
    setLoading(true);
    setError("");
    setDraft(null);
    setRenderedText("");
    setCopiedTarget(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobPost,
          proofPack,
          mode: requestedMode,
        }),
      });

      const data: GenerateResponse | GenerateErrorResponse = await res.json();

      if (!res.ok) {
        setError((data as GenerateErrorResponse).error || "Something went wrong.");
        return;
      }

      const ready = data as GenerateResponse;
      setDraft(ready.draft);
      setRenderedText(ready.renderedText);
      setDraftMode(ready.draft.mode);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleJobPostChange(value: string) {
    setJobPost(value);
    resetOutput();
  }

  async function copyText(text: string, target: string) {
    await navigator.clipboard.writeText(text);
    setCopiedTarget(target);
    window.setTimeout(() => {
      setCopiedTarget((current) => (current === target ? null : current));
    }, 1800);
  }

  const charCount = jobPost.length;
  const overLimit = charCount > MAX_REQUIREMENT_LENGTH;
  const proofPackReady =
    proofPack.specialty.trim().length > 0 &&
    proofPack.portfolioUrl.trim().length > 0 &&
    proofPack.proofPoints.every((point) => point.trim().length > 0);
  const canGenerate = !loading && !overLimit && jobPost.trim().length > 0 && proofPackReady;
  const purchaseIsExternal = purchaseUrl.startsWith("http");

  return (
    <main className="page-shell">
      <header className="page-header">
        <Logo size="sm" />
        <div className="header-right">
          <span className="header-chip">Upwork reply sprint</span>
          <ThemeToggle />
        </div>
      </header>

      <section className="hero">
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="hero-eyebrow">For React and Next.js freelancers on Upwork</p>
            <h1 className="hero-headline">
              Your Upwork proposals are getting
              <br />
              <em>skipped in the preview.</em>
            </h1>
            <p className="hero-subcopy">
              Paste a job post and get a short, job-specific proposal built to earn
              a reply in under 30 seconds.
            </p>

            <ul className="hero-bullets">
              <li>Pulls the real buying trigger out of a messy job post.</li>
              <li>Matches that trigger to the one proof point that makes you look credible.</li>
              <li>Starts with a quick reply, then expands into a fuller proposal only if you need it.</li>
            </ul>

            <div className="hero-actions">
              <button className="primary-btn" onClick={scrollToBuilder}>
                Rewrite my next proposal
              </button>
              <a
                className="ghost-link"
                href={purchaseUrl}
                {...(purchaseIsExternal ? { target: "_blank", rel: "noreferrer" } : {})}
              >
                Buy Reply Sprint Pack
              </a>
            </div>
          </div>

          <div className="hero-stack">
            <article className="preview-card">
              <p className="card-kicker">Before / After</p>
              <div className="preview-block">
                <p className="preview-label">Skipped</p>
                <p className="preview-line preview-line--bad">
                  I am interested in your project and believe I can do this for you.
                </p>
              </div>
              <div className="preview-block">
                <p className="preview-label">Reply-worthy</p>
                <p className="preview-line preview-line--good">
                  Your first risk is not the dashboard build. It is getting clean
                  CRM and billing data into one workflow without slowing the sales team down.
                </p>
              </div>
            </article>

            <article className="offer-card">
              <p className="card-kicker">First paid offer</p>
              <h2 className="offer-title">Reply Sprint Pack</h2>
              <p className="offer-price">$29 one-time</p>
              <ul className="offer-list">
                <li>20 proposal generations</li>
                <li>1 saved proof pack</li>
                <li>3 ranked hook variants on every job</li>
              </ul>
              <a
                className="offer-link"
                href={purchaseUrl}
                {...(purchaseIsExternal ? { target: "_blank", rel: "noreferrer" } : {})}
              >
                Buy Reply Sprint Pack
              </a>
            </article>
          </div>
        </div>
      </section>

      <section className="builder-section" ref={builderRef}>
        <div className="section-heading">
          <p className="section-kicker">Builder</p>
          <h2 className="section-title">Paste the job. Match the proof. Send the bid.</h2>
          <p className="section-copy">
            The proof pack stays in this browser, so repeat use drops to one field and one button.
          </p>
        </div>

        <div className="builder-grid">
          <form
            className="form-card"
            onSubmit={(event) => {
              event.preventDefault();
              if (canGenerate) void handleGenerate();
            }}
          >
            <div className="field-group">
              <p className="field-label">Output mode</p>
              <div className="mode-toggle" role="group" aria-label="Output mode">
                <button
                  type="button"
                  className={`mode-btn${draftMode === "quick_reply" ? " mode-btn--active" : ""}`}
                  onClick={() => {
                    setDraftMode("quick_reply");
                    resetOutput();
                  }}
                >
                  Quick reply
                </button>
                <button
                  type="button"
                  className={`mode-btn${draftMode === "full_proposal" ? " mode-btn--active" : ""}`}
                  onClick={() => {
                    setDraftMode("full_proposal");
                    resetOutput();
                  }}
                >
                  Full proposal
                </button>
              </div>
              <p className="field-note">
                Quick reply is default. Full proposal keeps the same pain, proof,
                attack line, and question, but gives them more room.
              </p>
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="jobPost">
                Upwork job post
              </label>
              <textarea
                id="jobPost"
                className="job-input"
                value={jobPost}
                onChange={(event) => handleJobPostChange(event.target.value)}
                placeholder={
                  "Paste the full Upwork post here.\n\nExample: Looking for a React / Next.js freelancer to rebuild our B2B SaaS onboarding dashboard and clean up a flaky Stripe + HubSpot workflow."
                }
                rows={14}
              />
              <div className="hint-row">
                <span className="field-note">Paste the client post, not your summary.</span>
                <span className="char-count">
                  {charCount.toLocaleString()} / {MAX_REQUIREMENT_LENGTH.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="proof-pack-head">
              <div>
                <p className="field-label">Proof pack</p>
                <p className="field-note">Saved locally and reused on every bid.</p>
              </div>
              <span className="save-badge">{hydrated ? "Saved locally" : "Loading..."}</span>
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="specialty">
                Specialty
              </label>
              <input
                id="specialty"
                className="text-input"
                type="text"
                value={proofPack.specialty}
                onChange={(event) => updateProofField("specialty", event.target.value)}
                placeholder="React / Next.js SaaS builds for internal tools and dashboards"
              />
            </div>

            <div className="proof-grid">
              {proofPack.proofPoints.map((point, index) => (
                <div key={index} className="field-group">
                  <label className="field-label" htmlFor={`proof-${index}`}>
                    Proof point {index + 1}
                  </label>
                  <textarea
                    id={`proof-${index}`}
                    className="proof-input"
                    value={point}
                    onChange={(event) => updateProofPoint(index, event.target.value)}
                    rows={3}
                    placeholder={
                      index === 0
                        ? "Built a Stripe + HubSpot onboarding flow that cut manual ops work for a SaaS team."
                        : index === 1
                          ? "Shipped a Next.js admin dashboard with role-based workflows and audit history."
                          : "Cleaned up a flaky React data-sync flow that was blocking sales and support teams."
                    }
                  />
                </div>
              ))}
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="portfolioUrl">
                Portfolio link
              </label>
              <input
                id="portfolioUrl"
                className="text-input"
                type="url"
                value={proofPack.portfolioUrl}
                onChange={(event) => updateProofField("portfolioUrl", event.target.value)}
                placeholder="https://yourportfolio.com/case-study"
              />
            </div>

            {error && <p className="error-banner">{error}</p>}

            <div className="form-actions">
              <button className="primary-btn" type="submit" disabled={!canGenerate}>
                {loading
                  ? draftMode === "full_proposal"
                    ? "Building full proposal..."
                    : "Scoring hooks..."
                  : draftMode === "full_proposal"
                    ? "Build full proposal"
                    : "Rewrite my next proposal"}
              </button>
              <p className="action-note">
                {proofPackReady
                  ? "Ready to generate."
                  : "Complete the proof pack once, then reuse it on every bid."}
              </p>
            </div>

            {loading && (
              <div className="loading-badge">
                {draftMode === "full_proposal"
                  ? "Keeping the same pain, proof, attack line, and question while expanding the draft."
                  : "Pulling the buyer fear, matching your best proof, and tightening the opener."}
              </div>
            )}
          </form>

          <aside className="result-card">
            <div className="result-header">
              <div>
                <p className="card-kicker">Output</p>
                <h3 className="result-title">
                  {draft?.mode === "full_proposal"
                    ? "Paste-ready full proposal"
                    : "Paste-ready quick reply"}
                </h3>
              </div>
              {draft && (
                <div className="result-actions">
                  {draft.mode === "quick_reply" && (
                    <button
                      className="secondary-btn"
                      type="button"
                      onClick={() => void handleGenerate("full_proposal")}
                      disabled={loading}
                    >
                      Expand to full proposal
                    </button>
                  )}
                  <button
                    className="copy-btn"
                    type="button"
                    onClick={() => copyText(renderedText || draft.finalProposal, "proposal")}
                  >
                    {copiedTarget === "proposal" ? "Copied" : "Copy proposal"}
                  </button>
                </div>
              )}
            </div>

            {draft ? (
              <div className="result-body">
                <div className="result-block">
                  <p className="mini-label">Matched proof</p>
                  <p className="matched-proof">{draft.matchedProof}</p>
                </div>

                <div className="result-block">
                  <p className="mini-label">Hook options</p>
                  <div className="hook-list">
                    {draft.hookOptions.map((option) => (
                      <div key={option.rank} className="hook-card">
                        <div className="hook-top">
                          <span className="hook-rank">#{option.rank}</span>
                          <button
                            className="hook-copy-btn"
                            type="button"
                            onClick={() => copyText(option.hook, `hook-${option.rank}`)}
                          >
                            {copiedTarget === `hook-${option.rank}` ? "Copied" : "Copy hook"}
                          </button>
                        </div>
                        <p className="hook-text">{option.hook}</p>
                        <p className="hook-rationale">{option.rationale}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="result-block">
                  <p className="mini-label">Final proposal</p>
                  <div className="proposal-output">{draft.finalProposal}</div>
                </div>

                <p className="result-footnote">
                  {draft.mode === "full_proposal"
                    ? "Longer does not mean generic. This still needs to hit pain, proof, attack line, and one narrow question."
                    : "Paste this into Upwork, tweak one noun if needed, and send before the job fills up."}
                </p>
              </div>
            ) : (
              <div className="result-empty">
                <p className="result-empty-title">Your opener rewrite will show up here.</p>
                <p className="result-empty-copy">
                  You will get three ranked hooks, one matched proof point, and either a quick reply or a fuller proposal built from the same core argument.
                </p>

                <div className="sample-card">
                  <p className="mini-label">What strong output looks like</p>
                  <p className="sample-line">
                    Your first risk is not shipping the dashboard. It is giving your sales team another slow handoff between HubSpot and Stripe.
                  </p>
                  <p className="sample-line">
                    I recently rebuilt that exact handoff for a SaaS workflow and cut the manual cleanup that was blocking onboarding.
                  </p>
                  <p className="sample-line">
                    I would start by locking the data states, then rebuild the UI around the steps your ops team actually uses every day.
                  </p>
                  <p className="sample-line">
                    Do you already know where the sync is breaking most often: customer creation, subscription status, or internal task routing?
                  </p>
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}

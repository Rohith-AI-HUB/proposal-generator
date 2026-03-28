"use client";

import { useEffect, useRef, useState } from "react";
import Logo from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import type {
  TrackEventPayload,
  TrackedEventName,
  TrackedEventProperties,
} from "@/lib/analytics/events";
import type {
  DraftMode,
  GenerateErrorResponse,
  GenerateResponse,
  ProofPack,
  ReplyDraft,
} from "@/lib/domain/proposal/schema";
import { MAX_REQUIREMENT_LENGTH } from "@/lib/domain/proposal/constants";

const STORAGE_KEY = "proposaiq-proof-pack-v2";
const VISITOR_ID_KEY = "proposaiq-visitor-id-v1";
const SESSION_ID_KEY = "proposaiq-session-id-v1";
const ATTRIBUTION_KEY = "proposaiq-first-touch-v1";

const EMPTY_PROOF_PACK: ProofPack = {
  specialty: "",
  proofPoints: ["", "", ""],
  portfolioUrl: "",
};

type Attribution = {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
};

type AnalyticsContext = {
  visitorId: string;
  sessionId: string;
  page: string;
  attribution: Attribution;
};

const EMPTY_ATTRIBUTION: Attribution = {
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
  utmContent: null,
  utmTerm: null,
};

function createId() {
  return crypto.randomUUID();
}

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

function readAttributionFromSearch(): Attribution {
  const params = new URLSearchParams(window.location.search);

  return {
    utmSource: params.get("utm_source"),
    utmMedium: params.get("utm_medium"),
    utmCampaign: params.get("utm_campaign"),
    utmContent: params.get("utm_content"),
    utmTerm: params.get("utm_term"),
  };
}

function readStoredAttribution(): Attribution {
  try {
    const raw = window.localStorage.getItem(ATTRIBUTION_KEY);
    if (!raw) return EMPTY_ATTRIBUTION;

    const parsed = JSON.parse(raw) as Partial<Attribution>;
    return {
      utmSource: typeof parsed.utmSource === "string" ? parsed.utmSource : null,
      utmMedium: typeof parsed.utmMedium === "string" ? parsed.utmMedium : null,
      utmCampaign:
        typeof parsed.utmCampaign === "string" ? parsed.utmCampaign : null,
      utmContent:
        typeof parsed.utmContent === "string" ? parsed.utmContent : null,
      utmTerm: typeof parsed.utmTerm === "string" ? parsed.utmTerm : null,
    };
  } catch {
    return EMPTY_ATTRIBUTION;
  }
}

function hasAttribution(attribution: Attribution) {
  return Object.values(attribution).some(Boolean);
}

function toAttributionProperties(attribution: Attribution): TrackedEventProperties {
  const properties: TrackedEventProperties = {};

  if (attribution.utmSource) properties.utm_source = attribution.utmSource;
  if (attribution.utmMedium) properties.utm_medium = attribution.utmMedium;
  if (attribution.utmCampaign) properties.utm_campaign = attribution.utmCampaign;
  if (attribution.utmContent) properties.utm_content = attribution.utmContent;
  if (attribution.utmTerm) properties.utm_term = attribution.utmTerm;

  return properties;
}

function sendTrackingPayload(payload: TrackEventPayload) {
  const body = JSON.stringify(payload);

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/track", blob);
    return;
  }

  void fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  });
}

export default function HomePage() {
  const builderRef = useRef<HTMLDivElement>(null);
  const analyticsRef = useRef<AnalyticsContext | null>(null);
  const builderStartedRef = useRef(false);
  const checkoutUrl =
    process.env.NEXT_PUBLIC_REPLY_SPRINT_CHECKOUT_URL ??
    process.env.NEXT_PUBLIC_REPLY_SPRINT_URL ??
    "";
  const checkoutEnabled = checkoutUrl.trim().length > 0;
  const checkoutIsExternal = /^https?:\/\//.test(checkoutUrl);

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

  useEffect(() => {
    try {
      const existingVisitorId = window.localStorage.getItem(VISITOR_ID_KEY);
      const visitorId = existingVisitorId ?? createId();
      const returningVisitor = existingVisitorId !== null;

      if (!existingVisitorId) {
        window.localStorage.setItem(VISITOR_ID_KEY, visitorId);
      }

      const existingSessionId = window.sessionStorage.getItem(SESSION_ID_KEY);
      const sessionId = existingSessionId ?? createId();
      if (!existingSessionId) {
        window.sessionStorage.setItem(SESSION_ID_KEY, sessionId);
      }

      const urlAttribution = readAttributionFromSearch();
      const storedAttribution = readStoredAttribution();
      const attribution = hasAttribution(urlAttribution)
        ? urlAttribution
        : storedAttribution;

      if (hasAttribution(urlAttribution)) {
        window.localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(urlAttribution));
      }

      const page = window.location.pathname;
      const referrer = document.referrer || null;
      const attributionProps = toAttributionProperties(attribution);

      analyticsRef.current = {
        visitorId,
        sessionId,
        page,
        attribution,
      };

      sendTrackingPayload({
        event: "page_view",
        visitorId,
        sessionId,
        page,
        referrer,
        properties: {
          ...attributionProps,
          checkout_configured: checkoutEnabled,
          returning_visitor: returningVisitor,
        },
      });

      if (returningVisitor) {
        sendTrackingPayload({
          event: "return_visit",
          visitorId,
          sessionId,
          page,
          referrer,
          properties: attributionProps,
        });
      }
    } catch {
      analyticsRef.current = null;
    }
  }, [checkoutEnabled]);

  function trackEvent(
    event: TrackedEventName,
    properties: TrackedEventProperties = {}
  ) {
    const context = analyticsRef.current;
    if (!context) return;

    sendTrackingPayload({
      event,
      visitorId: context.visitorId,
      sessionId: context.sessionId,
      page: context.page,
      referrer: document.referrer || null,
      properties: {
        ...toAttributionProperties(context.attribution),
        ...properties,
      },
    });
  }

  function resetOutput() {
    setDraft(null);
    setRenderedText("");
    setCopiedTarget(null);
    setError("");
  }

  function markBuilderStarted(source: "hero_cta" | "job_post_focus") {
    if (builderStartedRef.current) return;
    builderStartedRef.current = true;
    trackEvent("builder_started", { source });
  }

  function scrollToBuilder() {
    markBuilderStarted("hero_cta");
    builderRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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

  const activeProofPoints = proofPack.proofPoints.filter(
    (point) => point.trim().length > 0
  );

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
      trackEvent("generate_success", {
        requested_mode: requestedMode,
        returned_mode: ready.draft.mode,
        proof_point_count: activeProofPoints.length,
        portfolio_included: proofPack.portfolioUrl.trim().length > 0,
      });
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

  function handleExpandToFull() {
    trackEvent("expand_to_full", {
      source_mode: "quick_reply",
      proof_point_count: activeProofPoints.length,
    });
    void handleGenerate("full_proposal");
  }

  async function copyText(text: string, target: string) {
    await navigator.clipboard.writeText(text);
    trackEvent(target === "proposal" ? "copy_proposal" : "copy_hook", {
      target,
      output_mode: draft?.mode ?? draftMode,
    });
    setCopiedTarget(target);
    window.setTimeout(() => {
      setCopiedTarget((current) => (current === target ? null : current));
    }, 1800);
  }

  function handleCheckoutClick(placement: "hero" | "offer_card") {
    trackEvent("purchase_click", {
      placement,
      checkout_configured: checkoutEnabled,
    });
  }

  function renderCheckoutCta(
    className: string,
    label: string,
    placement: "hero" | "offer_card"
  ) {
    if (!checkoutEnabled) {
      return null;
    }

    return (
      <a
        className={className}
        href={checkoutUrl}
        onClick={() => handleCheckoutClick(placement)}
        {...(checkoutIsExternal ? { target: "_blank", rel: "noreferrer" } : {})}
      >
        {label}
      </a>
    );
  }

  const charCount = jobPost.length;
  const overLimit = charCount > MAX_REQUIREMENT_LENGTH;
  const hasRequiredProof = activeProofPoints.length > 0;
  const canGenerate =
    !loading && !overLimit && jobPost.trim().length > 0 && hasRequiredProof;

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
            <p className="hero-eyebrow">For solo React and Next.js freelancers on Upwork</p>
            <h1 className="hero-headline">
              Your first line is getting
              <br />
              <em>skipped in the preview.</em>
            </h1>
            <p className="hero-subcopy">
              Paste the job post, add one real proof point, and get a reply-focused
              draft before the job fills up.
            </p>

            <ul className="hero-bullets">
              <li>Pulls the buyer fear out of a messy Upwork post.</li>
              <li>Matches it to one proof point that actually sounds believable.</li>
              <li>Starts short, then expands only if the job deserves a longer bid.</li>
            </ul>

            <div className="hero-actions">
              <button className="primary-btn" onClick={scrollToBuilder}>
                Rewrite my next proposal
              </button>
              {renderCheckoutCta("ghost-link", "Start paid sprint", "hero")}
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

            {checkoutEnabled && (
              <article className="offer-card">
                <p className="card-kicker">Checkout</p>
                <h2 className="offer-title">Reply Sprint Pack</h2>
                <p className="offer-price">$29 one-time</p>
                <ul className="offer-list">
                  <li>20 reply-draft credits</li>
                  <li>1 saved proof pack</li>
                  <li>Quick reply plus full-proposal expansion</li>
                </ul>
                {renderCheckoutCta("offer-link", "Open checkout", "offer_card")}
              </article>
            )}
          </div>
        </div>
      </section>

      <section className="builder-section" ref={builderRef}>
        <div className="section-heading">
          <p className="section-kicker">Builder</p>
          <h2 className="section-title">Paste the job. Match the proof. Send the bid.</h2>
          <p className="section-copy">
            One strong proof point is enough to start. Save the other two only if
            this earns repeat use.
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
                Quick reply stays tight. Full proposal keeps the same pain, proof,
                attack line, and question with more breathing room.
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
                onFocus={() => markBuilderStarted("job_post_focus")}
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
                <p className="field-note">
                  Saved locally. Proof point 1 is required. Specialty and portfolio are optional.
                </p>
              </div>
              <span className="save-badge">{hydrated ? "Saved locally" : "Loading..."}</span>
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="specialty">
                Specialty (optional)
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
                    {index === 0
                      ? "Proof point 1"
                      : `Proof point ${index + 1} (optional)`}
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
                Portfolio link (optional)
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
                {hasRequiredProof
                  ? activeProofPoints.length === 1
                    ? "Enough to start. Add more proof later if this is useful."
                    : "Ready to generate."
                  : "One proof point is required. Specialty and portfolio are optional."}
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
                      onClick={handleExpandToFull}
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
                    ? "Longer does not mean softer. It still needs pain, proof, attack line, and one narrow question."
                    : "Paste this into Upwork, tweak one noun if needed, and send before the job fills up."}
                </p>
              </div>
            ) : (
              <div className="result-empty">
                <p className="result-empty-title">Your reply draft will show up here.</p>
                <p className="result-empty-copy">
                  You will get three ranked hooks, one matched proof point, and either
                  a quick reply or a fuller proposal built from the same core argument.
                </p>

                <div className="sample-card">
                  <p className="mini-label">What strong output looks like</p>
                  <p className="sample-line">
                    Your first risk is not shipping the dashboard. It is giving your sales
                    team another slow handoff between HubSpot and Stripe.
                  </p>
                  <p className="sample-line">
                    I recently rebuilt that exact handoff for a SaaS workflow and cut the
                    manual cleanup that was blocking onboarding.
                  </p>
                  <p className="sample-line">
                    I would start by locking the data states, then rebuild the UI around
                    the steps your ops team actually uses every day.
                  </p>
                  <p className="sample-line">
                    Do you already know where the sync is breaking most often: customer
                    creation, subscription status, or internal task routing?
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

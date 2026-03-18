"use client";

import { useState, useRef } from "react";
import VersionBadge from "@/components/VersionBadge";

const SECTIONS = [
  "Project Overview",
  "Feasibility Note",
  "Scope of Work",
  "Deliverables",
  "Timeline",
  "Pricing Estimate",
  "Tech Stack",
  "Scope Boundaries",
  "Risk Signals",
  "Assumptions",
  "Next Steps",
] as const;

type ProposalSection = {
  title: (typeof SECTIONS)[number];
  content: string;
};

const SECTION_LOOKUP = new Map(
  SECTIONS.map((section) => [normalizeHeading(section), section]),
);

function normalizeHeading(value: string) {
  return value
    .replace(/^[#>\-\s*]+/, "")
    .replace(/^\d+[a-z]?[.)]?\s*/, "")
    .replace(/[:*]+$/, "")
    .trim()
    .toLowerCase();
}

function parseSections(text: string) {
  const result: ProposalSection[] = [];
  let current: ProposalSection | null = null;
  for (const line of text.split("\n")) {
    const match = SECTION_LOOKUP.get(normalizeHeading(line));
    if (match) {
      if (current) result.push(current);
      current = { title: match, content: "" };
      continue;
    }
    if (!current) continue;
    current.content += line + "\n";
  }
  if (current) result.push(current);
  return result;
}

export default function HomePage() {
  const [requirement, setRequirement] = useState("");
  const [proposal, setProposal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  async function generate(req: string) {
    setLoading(true);
    setError("");
    setProposal("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirement: req }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong."); return; }
      setProposal(data.proposal);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(proposal).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function scrollToInput() {
    inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    inputRef.current?.focus();
  }

  const sections = proposal ? parseSections(proposal) : [];

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center" }}>

      {/* ── LANDING SECTION ── */}
      <section style={{
        width: "100%",
        minHeight: "92vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "80px 24px 60px",
        position: "relative",
        overflow: "hidden",
      }}>

        {/* Subtle grid texture */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          backgroundImage: `
            linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
        }} />

        {/* Glow orb */}
        <div style={{
          position: "absolute", top: "30%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px", height: "400px",
          background: "radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)",
          zIndex: 0, pointerEvents: "none",
        }} />

        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: "680px" }}>

          {/* Pill badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            padding: "5px 14px", borderRadius: "999px", marginBottom: "32px",
            background: "rgba(99,102,241,0.1)",
            border: "1px solid rgba(99,102,241,0.25)",
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#6366f1", display: "inline-block" }} />
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#6366f1", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              For freelance developers
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: "clamp(32px, 6vw, 58px)",
            fontWeight: 800,
            color: "#f1f5f9",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            marginBottom: "20px",
          }}>
            Generate client-ready
            <br />
            <span style={{
              background: "linear-gradient(135deg, #818cf8, #6366f1)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              dev proposals in seconds
            </span>
          </h1>

          {/* Subtext */}
          <p style={{
            fontSize: "clamp(15px, 2vw, 17px)",
            color: "#64748b",
            lineHeight: 1.7,
            marginBottom: "40px",
            maxWidth: "480px",
            margin: "0 auto 40px",
          }}>
            Not generic AI output — structured, priced,
            and ready to send.
          </p>

          {/* CTA */}
          <button
            onClick={scrollToInput}
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "#6366f1", color: "#fff", border: "none",
              borderRadius: "10px", padding: "14px 28px",
              fontWeight: 700, fontSize: "15px",
              cursor: "pointer", letterSpacing: "0.01em",
              transition: "background 0.15s, transform 0.1s",
              boxShadow: "0 0 0 1px rgba(99,102,241,0.5), 0 8px 24px rgba(99,102,241,0.25)",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "#4f46e5";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "#6366f1";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Try with your client requirement
            <span style={{ fontSize: "16px", lineHeight: 1 }}>↓</span>
          </button>

          {/* Social proof strip */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: "24px", marginTop: "52px", flexWrap: "wrap",
          }}>
            {["10 sections auto-generated", "Pricing with rationale", "Scope boundaries included"].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                <span style={{ color: "#6366f1", fontSize: "13px" }}>✓</span>
                <span style={{ color: "#475569", fontSize: "12.5px", letterSpacing: "0.01em" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: "absolute", bottom: "28px", left: "50%",
          transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
          opacity: 0.3,
        }}>
          <div style={{ width: "1px", height: "32px", background: "linear-gradient(to bottom, transparent, #94a3b8)" }} />
        </div>
      </section>

      {/* ── TOOL SECTION ── */}
      <section style={{ width: "100%", padding: "0 16px 120px", display: "flex", flexDirection: "column", alignItems: "center", gap: "40px" }}>

        {/* Section A — Input */}
        <div className="glass" style={{ width: "100%", maxWidth: "680px", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <label style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Client Requirement
          </label>
          <textarea
            ref={inputRef}
            value={requirement}
            onChange={(e) => setRequirement(e.target.value)}
            placeholder="Paste client requirement…"
            rows={8}
            style={{
              width: "100%", background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px",
              color: "#f1f5f9", fontSize: "14px", lineHeight: 1.7,
              padding: "14px", resize: "vertical", outline: "none",
              fontFamily: "inherit", transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "rgba(99,102,241,0.45)")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
          />
          {error && (
            <p style={{ color: "#f87171", fontSize: "13px", padding: "10px 14px", background: "rgba(248,113,113,0.08)", borderRadius: "8px", border: "1px solid rgba(248,113,113,0.2)" }}>
              {error}
            </p>
          )}
          <button
            onClick={() => generate(requirement)}
            disabled={loading || !requirement.trim()}
            style={{
              alignSelf: "flex-end",
              background: loading ? "rgba(99,102,241,0.35)" : "#6366f1",
              color: "#fff", border: "none", borderRadius: "9px",
              padding: "11px 24px", fontWeight: 700, fontSize: "14px",
              cursor: loading || !requirement.trim() ? "not-allowed" : "pointer",
              letterSpacing: "0.02em", transition: "background 0.15s",
            }}
          >
            {loading ? "Generating…" : "Generate Proposal"}
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", border: "2.5px solid rgba(99,102,241,0.2)", borderTopColor: "#6366f1", animation: "spin 0.8s linear infinite" }} />
            <p style={{ color: "#64748b", fontSize: "13px" }}>Building your proposal…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Section B — Output */}
        {sections.length > 0 && (
          <div style={{ width: "100%", maxWidth: "680px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {sections.map((sec, index) => (
              <div key={`${sec.title}-${index}`} className="glass" style={{ borderRadius: "14px", overflow: "hidden" }}>
                <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#6366f1", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    {sec.title}
                  </span>
                </div>
                <pre style={{ padding: "18px 20px", color: "#cbd5e1", fontSize: "13.5px", lineHeight: 1.8, whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "inherit", margin: 0 }}>
                  {sec.content.trim()}
                </pre>
              </div>
            ))}
          </div>
        )}

        {/* Section C — Actions */}
        {proposal && (
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={handleCopy}
              style={{ background: "rgba(99,102,241,0.12)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "9px", padding: "10px 22px", fontWeight: 700, fontSize: "13px", cursor: "pointer", letterSpacing: "0.02em" }}
            >
              {copied ? "Copied!" : "Copy Proposal"}
            </button>
            <button
              onClick={() => generate(requirement)}
              disabled={loading}
              style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "9px", padding: "10px 22px", fontWeight: 700, fontSize: "13px", cursor: loading ? "not-allowed" : "pointer", letterSpacing: "0.02em" }}
            >
              Regenerate
            </button>
          </div>
        )}
      </section>

      <VersionBadge />
    </main>
  );
}

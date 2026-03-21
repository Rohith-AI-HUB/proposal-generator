"use client";

import { useState, useRef } from "react";
import Logo from "@/components/Logo";
import VersionBadge from "@/components/VersionBadge";
import { ProposalView } from "@/components/proposal/ProposalView";
import type {
  Proposal,
  GenerateResponse,
  GenerateErrorResponse,
} from "@/lib/domain/proposal/schema";

export default function HomePage() {
  const [requirement, setRequirement] = useState("");
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [renderedText, setRenderedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  function scrollToInput() {
    inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    inputRef.current?.focus();
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center" }}>

      {/* ── LANDING SECTION ── */}
      <section style={{
        width: "100%", minHeight: "92vh",
        display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center",
        padding: "80px 24px 60px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Grid texture */}
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
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "28px" }}>
            <Logo size="lg" showTagline />
          </div>

          <div style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            padding: "5px 14px", borderRadius: "999px", marginBottom: "32px",
            background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)",
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#6366f1", display: "inline-block" }} />
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#6366f1", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              For freelance developers
            </span>
          </div>

          <h1 style={{
            fontSize: "clamp(32px, 6vw, 58px)", fontWeight: 800, color: "#f1f5f9",
            lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: "20px",
          }}>
            Generate client-ready
            <br />
            <span style={{
              background: "linear-gradient(135deg, #818cf8, #6366f1)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>
              dev proposals in seconds
            </span>
          </h1>

          <p style={{
            fontSize: "clamp(15px, 2vw, 17px)", color: "#64748b",
            lineHeight: 1.7, maxWidth: "480px", margin: "0 auto 40px",
          }}>
            Not generic AI output — structured, priced, and ready to send.
          </p>

          <button
            onClick={scrollToInput}
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "#6366f1", color: "#fff", border: "none",
              borderRadius: "10px", padding: "14px 28px",
              fontWeight: 700, fontSize: "15px", cursor: "pointer",
              boxShadow: "0 0 0 1px rgba(99,102,241,0.5), 0 8px 24px rgba(99,102,241,0.25)",
            }}
          >
            Try with your client requirement
            <span style={{ fontSize: "16px" }}>↓</span>
          </button>

          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: "24px", marginTop: "52px", flexWrap: "wrap",
          }}>
            {["11 sections auto-generated", "Pricing with rationale", "Scope boundaries included"].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                <span style={{ color: "#6366f1", fontSize: "13px" }}>✓</span>
                <span style={{ color: "#475569", fontSize: "12.5px" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: "absolute", bottom: "28px", left: "50%", transform: "translateX(-50%)", opacity: 0.3 }}>
          <div style={{ width: "1px", height: "32px", background: "linear-gradient(to bottom, transparent, #94a3b8)" }} />
        </div>
      </section>

      {/* ── TOOL SECTION ── */}
      <section style={{
        width: "100%", padding: "0 16px 120px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: "40px",
      }}>

        {/* Input card */}
        <div className="glass" style={{
          width: "100%", maxWidth: "680px", borderRadius: "16px",
          padding: "24px", display: "flex", flexDirection: "column", gap: "16px",
        }}>
          <label style={{
            fontSize: "11px", fontWeight: 700, color: "#64748b",
            letterSpacing: "0.08em", textTransform: "uppercase",
          }}>
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
            <p style={{
              color: "#f87171", fontSize: "13px",
              padding: "10px 14px", borderRadius: "8px",
              background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)",
            }}>
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

        {/* Loading state */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "50%",
              border: "2.5px solid rgba(99,102,241,0.2)", borderTopColor: "#6366f1",
              animation: "spin 0.8s linear infinite",
            }} />
            <p style={{ color: "#64748b", fontSize: "13px" }}>Building your proposal…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Proposal output — rendered from structured data */}
        {proposal && <ProposalView proposal={proposal} />}

        {/* Action buttons */}
        {proposal && (
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={handleCopy}
              style={{
                background: "rgba(99,102,241,0.12)", color: "#6366f1",
                border: "1px solid rgba(99,102,241,0.3)", borderRadius: "9px",
                padding: "10px 22px", fontWeight: 700, fontSize: "13px", cursor: "pointer",
              }}
            >
              {copied ? "Copied!" : "Copy Proposal"}
            </button>
            <button
              onClick={() => generate(requirement)}
              disabled={loading}
              style={{
                background: "rgba(255,255,255,0.05)", color: "#94a3b8",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: "9px",
                padding: "10px 22px", fontWeight: 700, fontSize: "13px",
                cursor: loading ? "not-allowed" : "pointer",
              }}
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

"use client";

import { useState } from "react";
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
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
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

  const sections = proposal ? parseSections(proposal) : [];

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "48px 16px 120px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "40px",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", maxWidth: "560px" }}>
        <p
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#6366f1",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: "12px",
          }}
        >
          Proposal Generator
        </p>
        <h1
          style={{
            fontSize: "clamp(26px, 5vw, 42px)",
            fontWeight: 800,
            color: "#f1f5f9",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            marginBottom: "12px",
          }}
        >
          Paste requirement.
          <br />
          <span style={{ color: "#6366f1" }}>Get a proposal.</span>
        </h1>
        <p style={{ color: "#64748b", fontSize: "14px", lineHeight: 1.6 }}>
          No fluff. No filler. Client-ready in seconds.
        </p>
      </div>

      {/* Section A — Input */}
      <div
        className="glass"
        style={{
          width: "100%",
          maxWidth: "680px",
          borderRadius: "16px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <label
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#64748b",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Client Requirement
        </label>
        <textarea
          value={requirement}
          onChange={(e) => setRequirement(e.target.value)}
          placeholder="Paste client requirement…"
          rows={8}
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "10px",
            color: "#f1f5f9",
            fontSize: "14px",
            lineHeight: 1.7,
            padding: "14px",
            resize: "vertical",
            outline: "none",
            fontFamily: "inherit",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) =>
            (e.target.style.borderColor = "rgba(99,102,241,0.45)")
          }
          onBlur={(e) =>
            (e.target.style.borderColor = "rgba(255,255,255,0.08)")
          }
        />
        {error && (
          <p
            style={{
              color: "#f87171",
              fontSize: "13px",
              padding: "10px 14px",
              background: "rgba(248,113,113,0.08)",
              borderRadius: "8px",
              border: "1px solid rgba(248,113,113,0.2)",
            }}
          >
            {error}
          </p>
        )}
        <button
          onClick={() => generate(requirement)}
          disabled={loading || !requirement.trim()}
          style={{
            alignSelf: "flex-end",
            background: loading ? "rgba(99,102,241,0.35)" : "#6366f1",
            color: "#fff",
            border: "none",
            borderRadius: "9px",
            padding: "11px 24px",
            fontWeight: 700,
            fontSize: "14px",
            cursor: loading || !requirement.trim() ? "not-allowed" : "pointer",
            letterSpacing: "0.02em",
            transition: "background 0.15s",
          }}
        >
          {loading ? "Generating…" : "Generate Proposal"}
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "3px solid rgba(99,102,241,0.2)",
              borderTopColor: "#6366f1",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <p style={{ color: "#64748b", fontSize: "13px" }}>
            Building your proposal…
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Section B — Output */}
      {sections.length > 0 && (
        <div
          style={{
            width: "100%",
            maxWidth: "680px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {sections.map((sec, index) => (
            <div
              key={`${sec.title}-${index}`}
              className="glass"
              style={{ borderRadius: "14px", overflow: "hidden" }}
            >
              <div
                style={{
                  padding: "12px 20px",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#6366f1",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {sec.title}
                </span>
              </div>
              <pre
                style={{
                  padding: "18px 20px",
                  color: "#cbd5e1",
                  fontSize: "13.5px",
                  lineHeight: 1.8,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontFamily: "inherit",
                  margin: 0,
                }}
              >
                {sec.content.trim()}
              </pre>
            </div>
          ))}
        </div>
      )}

      {/* Section C — Actions */}
      {proposal && (
        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <button
            onClick={handleCopy}
            style={{
              background: "rgba(99,102,241,0.12)",
              color: "#6366f1",
              border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: "9px",
              padding: "10px 22px",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
              letterSpacing: "0.02em",
              transition: "background 0.15s",
            }}
          >
            {copied ? "Copied!" : "Copy Proposal"}
          </button>
          <button
            onClick={() => generate(requirement)}
            disabled={loading}
            style={{
              background: "rgba(255,255,255,0.05)",
              color: "#94a3b8",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "9px",
              padding: "10px 22px",
              fontWeight: 700,
              fontSize: "13px",
              cursor: loading ? "not-allowed" : "pointer",
              letterSpacing: "0.02em",
            }}
          >
            Regenerate
          </button>
        </div>
      )}

      <VersionBadge />
    </main>
  );
}

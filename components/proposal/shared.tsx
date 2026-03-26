"use client";

import React from "react";
import type { ConfidenceLevel } from "@/lib/domain/proposal/schema";

export function SectionCard({
  title,
  id,
  confidenceLevel,
  confidenceReason,
  children,
}: {
  title: string;
  id?: string;
  confidenceLevel?: ConfidenceLevel;
  confidenceReason?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="section-card" id={id}>
      <div className="section-header">
        <span className="section-label">{title}</span>
        {confidenceLevel && (
          <span className={`confidence-pill confidence-pill--${confidenceLevel}`}>
            {confidenceLevel}
          </span>
        )}
      </div>
      <div className="section-body">
        {confidenceReason && (
          <p className="confidence-reason">{confidenceReason}</p>
        )}
        {children}
      </div>
    </div>
  );
}

export function BulletList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="bullet-list">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}

export function NumberedList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ol className="numbered-list">
      {items.map((item, i) => (
        <li key={i}>
          <span className="list-num">{i + 1}.</span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

export function SubHeading({ children }: { children: React.ReactNode }) {
  return <p className="sub-heading">{children}</p>;
}

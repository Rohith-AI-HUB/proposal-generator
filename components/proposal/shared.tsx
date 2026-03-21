"use client";

import React from "react";

export function SectionCard({
  title,
  id,
  children,
}: {
  title: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="section-card" id={id}>
      <div className="section-header">
        <span className="section-label">{title}</span>
      </div>
      <div className="section-body">{children}</div>
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

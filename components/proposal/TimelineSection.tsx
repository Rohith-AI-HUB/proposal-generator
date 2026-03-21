"use client";

import { SectionCard, BulletList, SubHeading } from "./shared";
import type { ProposalTimeline } from "@/lib/domain/proposal/schema";

export function TimelineSection({
  timeline,
  id,
}: {
  timeline: ProposalTimeline;
  id?: string;
}) {
  return (
    <SectionCard title="Timeline" id={id}>
      <div className="timeline-rows">
        {timeline.phases.map((ph, i) => (
          <div key={i} className="timeline-row">
            <span className="timeline-row-name">
              {ph.name}
              {ph.notes && (
                <span className="timeline-note"> — {ph.notes}</span>
              )}
            </span>
            <span className="timeline-days">{ph.days}d</span>
          </div>
        ))}
        <div className="timeline-total">
          <span>Total</span>
          <span className="timeline-total-val">{timeline.totalDays} days</span>
        </div>
      </div>
      {timeline.dependencies.length > 0 && (
        <div className="timeline-deps">
          <SubHeading>Dependencies</SubHeading>
          <BulletList items={timeline.dependencies} />
        </div>
      )}
    </SectionCard>
  );
}

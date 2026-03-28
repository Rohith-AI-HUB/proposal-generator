export const TRACKED_EVENTS = [
  "page_view",
  "return_visit",
  "builder_started",
  "generate_success",
  "expand_to_full",
  "copy_proposal",
  "copy_hook",
  "purchase_click",
] as const;

export type TrackedEventName = (typeof TRACKED_EVENTS)[number];
export type TrackedEventProperty = string | number | boolean | null;
export type TrackedEventProperties = Record<string, TrackedEventProperty>;

export interface TrackEventPayload {
  event: TrackedEventName;
  visitorId: string;
  sessionId: string;
  page: string;
  properties?: TrackedEventProperties;
  referrer?: string | null;
}

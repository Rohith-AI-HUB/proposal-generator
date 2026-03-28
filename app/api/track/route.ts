import { NextRequest, NextResponse } from "next/server";
import {
  TRACKED_EVENTS,
  type TrackEventPayload,
  type TrackedEventName,
  type TrackedEventProperty,
  type TrackedEventProperties,
} from "@/lib/analytics/events";

export const runtime = "nodejs";

function extractIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function isTrackedEventName(value: string): value is TrackedEventName {
  return (TRACKED_EVENTS as readonly string[]).includes(value);
}

function isTrackableProperty(value: unknown): value is TrackedEventProperty {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function sanitizeProperties(raw: unknown): TrackedEventProperties {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }

  const input = raw as Record<string, unknown>;
  const properties: TrackedEventProperties = {};

  for (const [key, value] of Object.entries(input)) {
    if (!isTrackableProperty(value)) continue;
    properties[key] = typeof value === "string" ? value.slice(0, 240) : value;
  }

  return properties;
}

export async function POST(req: NextRequest) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const event =
    typeof raw.event === "string" && isTrackedEventName(raw.event) ? raw.event : null;
  const visitorId =
    typeof raw.visitorId === "string" ? raw.visitorId.trim().slice(0, 80) : "";
  const sessionId =
    typeof raw.sessionId === "string" ? raw.sessionId.trim().slice(0, 80) : "";
  const page = typeof raw.page === "string" ? raw.page.trim().slice(0, 120) : "";
  const referrer =
    typeof raw.referrer === "string" && raw.referrer.trim().length > 0
      ? raw.referrer.trim().slice(0, 240)
      : null;

  if (!event || !visitorId || !sessionId || !page) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const payload: TrackEventPayload = {
    event,
    visitorId,
    sessionId,
    page,
    referrer,
    properties: sanitizeProperties(raw.properties),
  };

  console.log(
    JSON.stringify({
      kind: "funnel_event",
      timestamp: new Date().toISOString(),
      ip: extractIp(req),
      userAgent: req.headers.get("user-agent"),
      ...payload,
    })
  );

  return NextResponse.json({ ok: true }, { status: 202 });
}

// Server-side adapter for requirement signal analysis.
// All logic and patterns live in lib/domain/proposal/signals.ts,
// which is shared with the client-side warnings layer.
// Nothing here can drift from what the browser shows the user.

export type { RequirementSignals } from "@/lib/domain/proposal/signals";
export { analyzeRequirement as preprocessRequirement } from "@/lib/domain/proposal/signals";

import type { ReplyDraft } from "@/lib/domain/proposal/schema";

export function renderReplyDraftText(draft: ReplyDraft): string {
  return draft.finalProposal;
}

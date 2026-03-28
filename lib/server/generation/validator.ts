import { ReplyDraftSchema } from "@/lib/domain/proposal/proposalSchema";
import type { ReplyDraft } from "@/lib/domain/proposal/schema";

export type ValidateReplyDraftResult =
  | { success: true; data: ReplyDraft }
  | { success: false; reason: string };

export function validateReplyDraft(raw: unknown): ValidateReplyDraftResult {
  const result = ReplyDraftSchema.safeParse(raw);

  if (result.success) {
    return { success: true, data: result.data as ReplyDraft };
  }

  const reason = result.error.errors
    .map((issue) => {
      const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
      return `${path}${issue.message}`;
    })
    .join("; ");

  console.warn("[validateReplyDraft] rejected:", reason);
  return { success: false, reason };
}

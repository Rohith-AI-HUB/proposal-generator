import { z } from "zod";

const GENERIC_FILLER_PATTERNS = [
  /i am interested in your project/i,
  /i have read your job description/i,
  /dear (?:sir|client|hiring manager)/i,
  /i can do this/i,
  /i'?d love to help/i,
  /ai-powered/i,
  /can you share more about/i,
  /tell me more/i,
  /let me know more/i,
  /i(?: would|'d) approach\b/i,
  /audit(?:ing)? the current flow/i,
  /can cripple/i,
] as const;

const nonEmptyStr = z
  .string()
  .transform((value) => value.trim())
  .refine((value) => value.length > 0, { message: "must not be empty" });

const HookOptionSchema = z.object({
  rank: z.number().int().min(1).max(3),
  hook: nonEmptyStr,
  rationale: nonEmptyStr,
});

function addGenericFillerIssues(
  value: string,
  path: (string | number)[],
  ctx: z.RefinementCtx
) {
  for (const pattern of GENERIC_FILLER_PATTERNS) {
    if (!pattern.test(value)) continue;

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path,
      message: `contains generic filler: ${pattern.source}`,
    });
    return;
  }
}

export const ReplyDraftSchema = z
  .object({
    mode: z.enum(["quick_reply", "full_proposal"]),
    finalProposal: nonEmptyStr,
    matchedProof: nonEmptyStr,
    hookOptions: z
      .array(HookOptionSchema)
      .length(3, "hookOptions must contain exactly 3 items")
      .transform((options) => [...options].sort((a, b) => a.rank - b.rank)),
  })
  .superRefine((draft, ctx) => {
    if (draft.mode === "quick_reply" && draft.finalProposal.length > 700) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["finalProposal"],
        message: "finalProposal must stay under 700 characters",
      });
    }

    if (draft.mode === "full_proposal" && draft.finalProposal.length > 1500) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["finalProposal"],
        message: "full_proposal must stay under 1500 characters",
      });
    }

    if (!draft.finalProposal.endsWith("?")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["finalProposal"],
        message: "finalProposal must end with a direct question",
      });
    }

    if (draft.matchedProof.length > 240) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["matchedProof"],
        message: "matchedProof must stay under 240 characters",
      });
    }

    const ranks = draft.hookOptions.map((option) => option.rank);
    const expectedRanks = [1, 2, 3];
    if (
      ranks.length !== expectedRanks.length ||
      ranks.some((rank, index) => rank !== expectedRanks[index])
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hookOptions"],
        message: "hookOptions must be ranked 1, 2, 3 in order",
      });
    }

    const paragraphCount = draft.finalProposal
      .split(/\n\s*\n/)
      .map((part) => part.trim())
      .filter(Boolean).length;

    if (draft.mode === "quick_reply" && paragraphCount !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["finalProposal"],
        message: "quick_reply must be a single paragraph",
      });
    }

    if (draft.mode === "full_proposal" && paragraphCount < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["finalProposal"],
        message: "full_proposal must contain at least 2 short paragraphs",
      });
    }

    addGenericFillerIssues(draft.finalProposal, ["finalProposal"], ctx);

    draft.hookOptions.forEach((option, index) => {
      if (option.hook.length > 140) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["hookOptions", index, "hook"],
          message: "hook must stay under 140 characters",
        });
      }

      addGenericFillerIssues(option.hook, ["hookOptions", index, "hook"], ctx);
    });
  });

export type ParsedReplyDraft = z.output<typeof ReplyDraftSchema>;

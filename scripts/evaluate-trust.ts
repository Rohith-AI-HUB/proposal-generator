import { loadEnvConfig } from "@next/env";
import fixtures from "@/fixtures/trust-evals.json";
import {
  generateProposal,
  type GenerationResult,
} from "@/lib/server/generation";
import type { Proposal } from "@/lib/domain/proposal/schema";
import type { PricingContext } from "@/lib/server/generation/prompt";

type FixtureCategory =
  | "brochure"
  | "booking"
  | "marketplace"
  | "dashboard"
  | "integration";

interface TrustEvalFixture {
  id: string;
  category: FixtureCategory;
  title: string;
  clientType: "domestic" | "international";
  dayRate: number;
  requirement: string;
  expectedClarificationIds?: string[];
  clarificationAnswers?: Record<string, string>;
  forbiddenTerms?: string[];
}

interface FixtureRun {
  fixture: TrustEvalFixture;
  firstResult: GenerationResult | null;
  finalResult: GenerationResult | null;
  questionCoverage: number | null;
  unsourcedNumericClientCosts: number;
  falseCertainty: boolean;
  inventedFeatureHits: string[];
  sourceCoverage: number;
  error: string | null;
}

const FALSE_CERTAINTY_PATTERNS = [
  /\bguaranteed?\b/i,
  /\bdefinitely\b/i,
  /\bcertainly\b/i,
  /\bwill\s+(?:be|deliver|launch|handle|solve)\b/i,
  /\bno\s+risk\b/i,
  /\bready\s+to\s+send\b/i,
] as const;

function parseLimit(args: string[]): number | null {
  const raw = args.find((arg) => arg.startsWith("--limit="));
  if (!raw) return null;

  const value = Number(raw.slice("--limit=".length));
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : null;
}

function buildPricingContext(fixture: TrustEvalFixture): PricingContext {
  const clientType = fixture.clientType;

  return {
    clientType,
    dayRate: fixture.dayRate,
    currency: clientType === "domestic" ? "INR" : "USD",
    currencySymbol: clientType === "domestic" ? "Rs" : "$",
  };
}

function flattenProposalText(proposal: Proposal): string {
  return [
    proposal.overview.summary,
    proposal.overview.outcome,
    proposal.scope.core.join(" "),
    proposal.scope.extended.join(" "),
    proposal.deliverables.join(" "),
    proposal.boundaries.join(" "),
    proposal.risks.join(" "),
    proposal.assumptions.join(" "),
    proposal.nextSteps.join(" "),
  ]
    .join(" ")
    .toLowerCase();
}

function countUnsourcedNumericClientCosts(proposal: Proposal): number {
  return proposal.clientCosts.filter((cost) => {
    const hasNumericCost = /\d|%/.test(cost.estimatedCost);
    const hasSourceMeta =
      !!cost.sourceTitle && !!cost.sourceUrl && !!cost.sourceRationale;

    return hasNumericCost && !hasSourceMeta;
  }).length;
}

function hasFalseCertainty(proposal: Proposal): boolean {
  if (proposal.confidence.overall === "high") return false;

  const haystack = flattenProposalText(proposal);
  return FALSE_CERTAINTY_PATTERNS.some((pattern) => pattern.test(haystack));
}

function findInventedFeatureHits(
  proposal: Proposal,
  fixture: TrustEvalFixture
): string[] {
  const forbiddenTerms = fixture.forbiddenTerms ?? [];
  const haystack = flattenProposalText(proposal);

  return forbiddenTerms.filter((term) => haystack.includes(term.toLowerCase()));
}

function computeSourceCoverage(proposal: Proposal): number {
  const supported = proposal.evidence.length;
  const unresolved = proposal.unsupportedClaims.length;
  const total = supported + unresolved;

  if (total === 0) return 0;
  return supported / total;
}

function computeQuestionCoverage(
  result: GenerationResult,
  fixture: TrustEvalFixture
): number | null {
  const expected = fixture.expectedClarificationIds ?? [];
  if (expected.length === 0 || result.status !== "needs_clarification") {
    return null;
  }

  const asked = new Set(result.questions.map((question) => question.id));
  const hits = expected.filter((id) => asked.has(id)).length;
  return hits / expected.length;
}

async function runFixture(fixture: TrustEvalFixture): Promise<FixtureRun> {
  const pricingCtx = buildPricingContext(fixture);
  const firstResult = await generateProposal({
    requirement: fixture.requirement,
    pricingCtx,
  });

  const questionCoverage = computeQuestionCoverage(firstResult, fixture);

  let finalResult = firstResult;
  if (
    firstResult.status === "needs_clarification" &&
    fixture.clarificationAnswers &&
    Object.keys(fixture.clarificationAnswers).length > 0
  ) {
    finalResult = await generateProposal({
      requirement: fixture.requirement,
      pricingCtx,
      clarificationAnswers: fixture.clarificationAnswers,
    });
  }

  if (finalResult.status !== "ready") {
    return {
      fixture,
      firstResult,
      finalResult,
      questionCoverage,
      unsourcedNumericClientCosts: 0,
      falseCertainty: false,
      inventedFeatureHits: [],
      sourceCoverage: 0,
      error: null,
    };
  }

  return {
    fixture,
    firstResult,
    finalResult,
    questionCoverage,
    unsourcedNumericClientCosts: countUnsourcedNumericClientCosts(
      finalResult.proposal
    ),
    falseCertainty: hasFalseCertainty(finalResult.proposal),
    inventedFeatureHits: findInventedFeatureHits(finalResult.proposal, fixture),
    sourceCoverage: computeSourceCoverage(finalResult.proposal),
    error: null,
  };
}

async function main() {
  loadEnvConfig(process.cwd());

  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is required for trust evaluation runs.");
  }

  const limit = parseLimit(process.argv.slice(2));
  const selected = (fixtures as TrustEvalFixture[]).slice(
    0,
    limit ?? fixtures.length
  );

  const runs: FixtureRun[] = [];

  for (const fixture of selected) {
    let run: FixtureRun;

    try {
      run = await runFixture(fixture);
    } catch (error) {
      run = {
        fixture,
        firstResult: null,
        finalResult: null,
        questionCoverage: null,
        unsourcedNumericClientCosts: 0,
        falseCertainty: false,
        inventedFeatureHits: [],
        sourceCoverage: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }

    runs.push(run);

    if (run.error) {
      console.log(`[${fixture.category}] ${fixture.id}: error=${run.error}`);
    } else {
      const coverage =
        run.questionCoverage == null
          ? "n/a"
          : `${Math.round(run.questionCoverage * 100)}%`;

      console.log(
        `[${fixture.category}] ${fixture.id}: first=${run.firstResult?.status} final=${run.finalResult?.status} questions=${coverage}`
      );
    }
  }

  const readyRuns = runs.filter((run) => run.finalResult?.status === "ready");
  const clarificationRuns = runs.filter(
    (run) => run.firstResult?.status === "needs_clarification"
  );
  const generationErrors = runs.filter((run) => run.error);
  const questionCoverageValues = runs
    .map((run) => run.questionCoverage)
    .filter((value): value is number => value != null);
  const avgQuestionCoverage =
    questionCoverageValues.length === 0
      ? 0
      : questionCoverageValues.reduce((sum, value) => sum + value, 0) /
        questionCoverageValues.length;
  const avgSourceCoverage =
    readyRuns.length === 0
      ? 0
      : readyRuns.reduce((sum, run) => sum + run.sourceCoverage, 0) /
        readyRuns.length;
  const avgUnsupportedClaims =
    readyRuns.length === 0
      ? 0
      : readyRuns.reduce(
          (sum, run) =>
            sum +
            (run.finalResult?.status === "ready"
              ? run.finalResult.proposal.unsupportedClaims.length
              : 0),
          0
        ) / readyRuns.length;
  const unsourcedNumericFailures = readyRuns.filter(
    (run) => run.unsourcedNumericClientCosts > 0
  );
  const falseCertaintyFailures = readyRuns.filter((run) => run.falseCertainty);
  const inventedFeatureFailures = readyRuns.filter(
    (run) => run.inventedFeatureHits.length > 0
  );

  const summary = {
    fixturesRun: runs.length,
    clarificationRate:
      runs.length === 0 ? 0 : clarificationRuns.length / runs.length,
    finalReadyRate: runs.length === 0 ? 0 : readyRuns.length / runs.length,
    averageQuestionCoverage: avgQuestionCoverage,
    averageSourceCoverage: avgSourceCoverage,
    averageUnsupportedClaims: avgUnsupportedClaims,
    generationErrors: generationErrors.length,
    unsourcedNumericCostFailures: unsourcedNumericFailures.length,
    falseCertaintyFailures: falseCertaintyFailures.length,
    inventedFeatureFailures: inventedFeatureFailures.length,
  };

  console.log("\nTrust evaluation summary");
  console.log(JSON.stringify(summary, null, 2));

  const failures = [
    ...unsourcedNumericFailures.map((run) => ({
      id: run.fixture.id,
      reason: "unsourced numeric client costs",
    })),
    ...falseCertaintyFailures.map((run) => ({
      id: run.fixture.id,
      reason: "false certainty at medium/low confidence",
    })),
    ...inventedFeatureFailures.map((run) => ({
      id: run.fixture.id,
      reason: `forbidden terms present: ${run.inventedFeatureHits.join(", ")}`,
    })),
    ...generationErrors.map((run) => ({
      id: run.fixture.id,
      reason: `generation error: ${run.error}`,
    })),
  ];

  if (failures.length > 0) {
    console.log("\nRelease-gating failures");
    failures.forEach((failure) =>
      console.log(`- ${failure.id}: ${failure.reason}`)
    );
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

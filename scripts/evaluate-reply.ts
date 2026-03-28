import { loadEnvConfig } from "@next/env";
import { generateProposal } from "@/lib/server/generation";

interface ReplySprintFixture {
  id: string;
  jobPost: string;
}

const DEFAULT_PROOF_PACK = {
  specialty: "React / Next.js SaaS builds",
  proofPoints: [
    "Built a Next.js onboarding dashboard tied to Stripe and HubSpot for a SaaS ops team.",
    "Shipped a role-based React admin panel for internal support workflows.",
    "Cleaned up a brittle billing sync that was blocking account activation.",
  ],
  portfolioUrl: "",
};

const FIXTURES: ReplySprintFixture[] = [
  {
    id: "saas-dashboard",
    jobPost:
      "Looking for a React / Next.js freelancer to rebuild our SaaS onboarding dashboard and fix a brittle Stripe plus HubSpot handoff.",
  },
  {
    id: "internal-tool",
    jobPost:
      "Need a senior React freelancer to replace a flaky internal ops dashboard that handles approvals, billing states, and task routing.",
  },
];

function parseLimit(args: string[]): number | null {
  const raw = args.find((arg) => arg.startsWith("--limit="));
  if (!raw) return null;

  const value = Number(raw.slice("--limit=".length));
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : null;
}

async function main() {
  loadEnvConfig(process.cwd());

  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is required for reply draft evaluation runs.");
  }

  const limit = parseLimit(process.argv.slice(2));
  const selected = FIXTURES.slice(0, limit ?? FIXTURES.length);

  for (const fixture of selected) {
    const result = await generateProposal({
      jobPost: fixture.jobPost,
      proofPack: DEFAULT_PROOF_PACK,
      mode: "quick_reply",
    });

    console.log(`\n[${fixture.id}]`);
    console.log(`hooks=${result.draft.hookOptions.length} repair=${result.meta.repairUsed}`);
    console.log(result.draft.hookOptions[0]?.hook ?? "No hook generated.");
    console.log(result.draft.finalProposal);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

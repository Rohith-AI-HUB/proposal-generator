export type ClarificationAnswers = Record<string, string>;

export function hasClarificationAnswer(
  answers: ClarificationAnswers,
  id: string
): boolean {
  return typeof answers[id] === "string" && answers[id].trim().length > 0;
}

export function buildClarificationContext(
  requirement: string,
  answers: ClarificationAnswers = {}
): string {
  const baseRequirement = requirement.trim();
  const entries = Object.entries(answers)
    .map(([key, value]) => [key.trim(), value.trim()] as const)
    .filter(([, value]) => value.length > 0);

  if (entries.length === 0) return baseRequirement;

  const sections: string[] = [];

  if (baseRequirement.length > 0) {
    sections.push(baseRequirement);
  }

  sections.push(
    `Clarification Answers:\n${entries.map(([key, value]) => `- ${key}: ${value}`).join("\n")}`
  );

  return sections.join("\n\n");
}

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import type { GitHubContributions } from '../github/types.ts';
import { formatDate } from '../utils/dates.ts';

export type Provider = 'anthropic' | 'openai' | 'ollama';

const DEFAULT_MODELS: Record<Provider, string> = {
  anthropic: 'claude-opus-4-6',
  openai: 'gpt-4o',
  ollama: 'qwen2.5-coder:7b',
};

export function defaultModel(provider: Provider): string {
  return DEFAULT_MODELS[provider];
}

export async function summarize(
  contributions: GitHubContributions,
  goalsContent: string | null,
  achievementsContent: string | null,
  provider: Provider,
  model?: string,
): Promise<string> {
  const resolvedModel = model ?? DEFAULT_MODELS[provider];
  const prompt = buildPrompt(contributions, goalsContent, achievementsContent);

  if (provider === 'anthropic') {
    const client = new Anthropic();
    const message = await client.messages.create({
      model: resolvedModel,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });
    const content = message.content[0];
    if (!content || content.type !== 'text') throw new Error('Unexpected response from Claude');
    return content.text;
  }

  // Both openai and ollama use the OpenAI-compatible chat completions API.
  // Ollama exposes it at localhost:11434/v1 with no auth required.
  const client =
    provider === 'ollama'
      ? new OpenAI({ baseURL: 'http://localhost:11434/v1', apiKey: 'ollama' })
      : new OpenAI();

  const response = await client.chat.completions.create({
    model: resolvedModel,
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });
  const text = response.choices[0]?.message.content;
  if (!text) throw new Error(`Unexpected response from ${provider}`);
  return text;
}

function buildPrompt(contributions: GitHubContributions, goalsContent: string | null, achievementsContent: string | null): string {
  const { authoredPRs, reviewedPRs, commits, dateRange, username } = contributions;

  const authoredSection =
    authoredPRs.length === 0
      ? '_No merged PRs in this period._'
      : authoredPRs
          .map(
            (pr) =>
              `### ${pr.title} (${pr.repo}#${pr.number})\n${pr.body?.trim() || '_No description_'}\n${pr.url}`,
          )
          .join('\n\n');

  const reviewedSection =
    reviewedPRs.length === 0
      ? '_No reviewed PRs in this period._'
      : reviewedPRs.map((pr) => `- [${pr.repo}#${pr.number}] ${pr.title}`).join('\n');

  const commitsSection =
    commits.length === 0
      ? ''
      : `\n### Direct Commits (${commits.length})\n` +
        commits.map((c) => `- \`${c.sha}\` ${c.message} (${c.repo})`).join('\n') + '\n';

  const goalsSection = goalsContent
    ? `\n## Organizational / Team Goals\n\n${goalsContent}\n`
    : '';

  const achievementsSection = achievementsContent
    ? `\n## Additional Achievements\n\n${achievementsContent}\n`
    : '';

  const alignmentInstructions = goalsContent
    ? `1. Group contributions by the organizational goals listed above, citing specific PRs as evidence\n2. Add an "Other Contributions" section for work that doesn't map to a stated goal`
    : `1. Group contributions by theme or project area`;

  const achievementsInstruction = achievementsContent
    ? `\n7. Incorporate the additional achievements naturally alongside GitHub contributions — treat them as equally valid evidence of impact`
    : '';

  return `You are helping an engineer (@${username}) write a professional performance review.

## Review Period
${formatDate(dateRange.from)} – ${formatDate(dateRange.to)}

## GitHub Contributions

### Authored & Merged Pull Requests (${authoredPRs.length})
${authoredSection}

### Pull Requests Reviewed / Commented On (${reviewedPRs.length})
${reviewedSection}
${commitsSection}${goalsSection}${achievementsSection}
## Instructions

Write a professional performance review in first person. The review should:
${alignmentInstructions}
3. Include a "Collaboration & Code Review" section highlighting review activity
4. Be honest about scope — if the period was light, reflect that professionally
5. Use clear markdown headers and bullet points
6. Use first person ("I shipped...", "I collaborated on...", "I reviewed...")${achievementsInstruction}

Output only the review document as markdown. No preamble or explanation.`;
}

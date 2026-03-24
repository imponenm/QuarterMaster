import type { FetchOptions, GitHubContributions, PullRequest, ReviewedPR } from './types.ts';

interface GhPR {
  number: number;
  title: string;
  body: string;
  url: string;
  repository: { nameWithOwner: string };
  mergedAt: string | null;
}

function buildQuery(
  qualifier: 'author' | 'commenter',
  username: string,
  opts: FetchOptions,
  excludeAuthor = false,
): string {
  const parts = [
    `${qualifier}:${username}`,
    'is:pr',
    'is:merged',
    `merged:${opts.from}..${opts.to}`,
  ];

  if (opts.repos && opts.repos.length > 0) {
    for (const repo of opts.repos) parts.push(`repo:${repo}`);
  } else if (opts.org) {
    parts.push(`org:${opts.org}`);
  }

  if (excludeAuthor) parts.push(`-author:${username}`);

  return parts.join(' ');
}

async function getUsername(): Promise<string> {
  const result = await Bun.$`gh api user --jq '.login'`.text();
  return result.trim();
}

async function fetchAuthoredPRs(username: string, opts: FetchOptions): Promise<PullRequest[]> {
  const query = buildQuery('author', username, opts);
  const raw = await Bun.$`gh search prs ${query} --json number,title,body,url,repository,mergedAt --limit 100`.text();
  const prs = JSON.parse(raw) as GhPR[];
  return prs.map((pr) => ({
    number: pr.number,
    title: pr.title,
    body: pr.body ?? '',
    url: pr.url,
    repo: pr.repository.nameWithOwner,
    mergedAt: pr.mergedAt,
  }));
}

async function fetchReviewedPRs(username: string, opts: FetchOptions): Promise<ReviewedPR[]> {
  const query = buildQuery('commenter', username, opts, true);
  const raw = await Bun.$`gh search prs ${query} --json number,title,url,repository --limit 100`.text();
  const prs = JSON.parse(raw) as Array<{ number: number; title: string; url: string; repository: { nameWithOwner: string } }>;
  return prs.map((pr) => ({
    number: pr.number,
    title: pr.title,
    url: pr.url,
    repo: pr.repository.nameWithOwner,
  }));
}

export async function fetchContributions(opts: FetchOptions): Promise<GitHubContributions> {
  opts.onProgress?.('Fetching GitHub username...');
  const username = await getUsername();

  opts.onProgress?.('Fetching authored PRs...');
  const authoredPRs = await fetchAuthoredPRs(username, opts);

  opts.onProgress?.(`Found ${authoredPRs.length} authored PRs — fetching reviewed PRs...`);
  const reviewedPRs = await fetchReviewedPRs(username, opts);

  opts.onProgress?.(`Found ${reviewedPRs.length} reviewed PRs. Done.`);

  return {
    username,
    authoredPRs,
    reviewedPRs,
    dateRange: { from: opts.from, to: opts.to, label: '' },
  };
}

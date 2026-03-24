import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { Commit, FetchOptions, GitHubContributions, PullRequest, ReviewedPR } from './types.ts';

const execFileAsync = promisify(execFile);

interface GhPR {
  number: number;
  title: string;
  body: string;
  url: string;
  repository: { nameWithOwner: string };
  closedAt: string | null;
}

interface GhCommit {
  sha: string;
  commit: {
    message: string;
    author: { date: string };
  };
  html_url: string;
}

async function gh(...args: string[]): Promise<string> {
  try {
    const { stdout } = await execFileAsync('gh', args);
    return stdout;
  } catch (err: any) {
    const stderr = err.stderr?.toString().trim();
    throw new Error(stderr || err.message);
  }
}

async function getUsername(): Promise<string> {
  return (await gh('api', 'user', '--jq', '.login')).trim();
}

// Build the positional search qualifiers (date range, scope).
// Username and merge state are passed as flags instead, which is more reliable.
function buildScopeQuery(opts: FetchOptions, extraParts: string[] = []): string {
  const parts = [`merged:${opts.from}..${opts.to}`, ...extraParts];

  if (opts.repos && opts.repos.length > 0) {
    for (const repo of opts.repos) parts.push(`repo:${repo}`);
  } else if (opts.org) {
    parts.push(`org:${opts.org}`);
  }

  return parts.join(' ');
}

async function fetchAuthoredPRs(username: string, opts: FetchOptions): Promise<PullRequest[]> {
  const query = buildScopeQuery(opts);
  const fields = 'number,title,body,url,repository,closedAt';

  const raw = await gh('search', 'prs', query, '--author', username, '--merged', '--json', fields, '--limit', '100');
  const prs = JSON.parse(raw) as GhPR[];
  return prs.map((pr) => ({
    number: pr.number,
    title: pr.title,
    body: pr.body ?? '',
    url: pr.url,
    repo: pr.repository.nameWithOwner,
    mergedAt: pr.closedAt,
  }));
}

async function fetchReviewedPRs(username: string, opts: FetchOptions): Promise<ReviewedPR[]> {
  // Find merged PRs the user commented on but didn't author
  const query = buildScopeQuery(opts, [`-author:${username}`]);
  const fields = 'number,title,url,repository';

  const raw = await gh('search', 'prs', query, '--commenter', username, '--merged', '--json', fields, '--limit', '100');
  const prs = JSON.parse(raw) as Array<{
    number: number;
    title: string;
    url: string;
    repository: { nameWithOwner: string };
  }>;
  return prs.map((pr) => ({
    number: pr.number,
    title: pr.title,
    url: pr.url,
    repo: pr.repository.nameWithOwner,
  }));
}

async function fetchCommitsForRepo(
  repo: string,
  username: string,
  opts: FetchOptions,
): Promise<Commit[]> {
  const url = `repos/${repo}/commits?author=${username}&since=${opts.from}T00:00:00Z&until=${opts.to}T23:59:59Z&per_page=100`;
  const raw = await gh('api', url);
  const commits = JSON.parse(raw) as GhCommit[];
  return commits.map((c) => ({
    sha: c.sha.slice(0, 7),
    message: c.commit.message.split('\n')[0] ?? c.commit.message,
    url: c.html_url,
    repo,
    date: c.commit.author.date,
  }));
}

async function fetchDirectCommits(username: string, opts: FetchOptions): Promise<Commit[]> {
  if (!opts.repos || opts.repos.length === 0) return [];

  const results = await Promise.all(
    opts.repos.map((repo) => fetchCommitsForRepo(repo, username, opts)),
  );
  return results.flat();
}

export async function fetchContributions(opts: FetchOptions): Promise<GitHubContributions> {
  opts.onProgress?.('Fetching GitHub username...');
  const username = await getUsername();

  opts.onProgress?.('Fetching authored PRs...');
  const authoredPRs = await fetchAuthoredPRs(username, opts);

  opts.onProgress?.(`Found ${authoredPRs.length} authored PRs — fetching reviewed PRs...`);
  const reviewedPRs = await fetchReviewedPRs(username, opts);

  const repoCount = opts.repos?.length ?? 0;
  if (repoCount > 0) {
    opts.onProgress?.(`Found ${reviewedPRs.length} reviewed PRs — fetching direct commits...`);
  } else {
    opts.onProgress?.(`Found ${reviewedPRs.length} reviewed PRs. Done.`);
  }

  const commits = await fetchDirectCommits(username, opts);

  if (repoCount > 0) {
    opts.onProgress?.(`Found ${commits.length} direct commits. Done.`);
  }

  return {
    username,
    authoredPRs,
    reviewedPRs,
    commits,
    dateRange: { from: opts.from, to: opts.to, label: '' },
  };
}

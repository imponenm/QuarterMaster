export interface PullRequest {
  number: number;
  title: string;
  body: string;
  url: string;
  repo: string;
  mergedAt: string | null; // populated from closedAt (gh search prs doesn't expose mergedAt)
}

export interface ReviewedPR {
  number: number;
  title: string;
  url: string;
  repo: string;
}

export interface Commit {
  sha: string;
  message: string; // first line only
  url: string;
  repo: string;
  date: string;
}

export interface GitHubContributions {
  username: string;
  authoredPRs: PullRequest[];
  reviewedPRs: ReviewedPR[];
  commits: Commit[];
  dateRange: { from: string; to: string; label: string };
}

export interface FetchOptions {
  from: string;
  to: string;
  repos?: string[];
  org?: string;
  onProgress?: (message: string) => void;
}

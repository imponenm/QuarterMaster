export interface PullRequest {
  number: number;
  title: string;
  body: string;
  url: string;
  repo: string;
  mergedAt: string | null;
}

export interface ReviewedPR {
  number: number;
  title: string;
  url: string;
  repo: string;
}

export interface GitHubContributions {
  username: string;
  authoredPRs: PullRequest[];
  reviewedPRs: ReviewedPR[];
  dateRange: { from: string; to: string; label: string };
}

export interface FetchOptions {
  from: string;
  to: string;
  repos?: string[];
  org?: string;
  onProgress?: (message: string) => void;
}

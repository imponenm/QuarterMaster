# ⚓ QuarterMaster

> Automate your quarterly, semi-annual, and annual performance reviews using GitHub contributions.

QuarterMaster fetches your merged PRs and code review activity from GitHub, then uses Claude to write a structured review — optionally aligned to your team's goals.

## Prerequisites

- [Bun](https://bun.sh) `>= 1.0`
- [GitHub CLI](https://cli.github.com) (`gh`) — authenticated via `gh auth login`
- An [Anthropic API key](https://console.anthropic.com)

## Setup

```bash
git clone https://github.com/you/quartermaster
cd quartermaster
bun install
```

Add your Anthropic API key to a `.env` file (Bun loads it automatically):

```bash
echo "ANTHROPIC_API_KEY=sk-ant-..." >> .env
```

## Usage

```bash
bun run src/cli.tsx
```

QuarterMaster will prompt you to select a review period and optionally provide a goals file.

### Options

```
--repo, -r   GitHub repo to include (owner/repo). Repeatable.
--org,  -o   Scope to a GitHub organization

Examples:
  bun run src/cli.tsx
  bun run src/cli.tsx --org acme-corp
  bun run src/cli.tsx --repo acme-corp/api --repo acme-corp/web
```

### Goals File

Create a markdown file listing your team's or company's goals, then provide its path when prompted:

```markdown
# Q1 2026 Goals

## Team Goals
- Reduce API p99 latency by 20%
- Launch self-serve onboarding

## Company Goals
- Reach $10M ARR
- Improve developer experience
```

QuarterMaster will align your contributions to these goals in the generated review.

## Output

The review is saved as `review-YYYY-MM-DD-YYYY-MM-DD.md` in the current directory and printed to stdout (so you can pipe it: `bun run src/cli.tsx > review.md`).

## Contributing

PRs welcome. Please open an issue before starting large changes.

# ⚓ QuarterMaster

> Automate your quarterly, semi-annual, and annual performance reviews using GitHub contributions.

I built this to solve my own problem. Every quarter at work, I'd spend time manually digging through GitHub, copying PR titles and descriptions into whatever LLM was handy, and prompting it to turn everything into a performance review. It works, but it's tedious having to re-run scripts and re-prompt whatever LLM I'm given access to.

QuarterMaster automates that whole process. It fetches your merged PRs, code review activity, and direct commits, then passes them to an LLM to generate a structured review. If your team has written down their goals, you can point it at a markdown file and it'll align your work to those goals automatically. If you have other accomplishments besides GitHub contributions, you can add those as well.

## Prerequisites

- [Bun](https://bun.sh) `>= 1.0`
- [GitHub CLI](https://cli.github.com) (`gh`) — authenticated via `gh auth login`
- An API key for your chosen LLM provider (see [LLM Providers](#llm-providers))

## Setup

```bash
git clone https://github.com/you/quartermaster
cd quartermaster
bun install
```

## LLM Providers

QuarterMaster supports Anthropic, OpenAI, and Ollama. The provider is auto-detected from your environment, or you can specify it explicitly with `--provider`.

### Anthropic (default)

```bash
echo "ANTHROPIC_API_KEY=sk-ant-..." >> .env
```

Default model: `claude-opus-4-6`

### OpenAI

```bash
echo "OPENAI_API_KEY=sk-..." >> .env
```

Default model: `gpt-4o`

### Ollama (local, no API key required)

Install and run [Ollama](https://ollama.com), then pull a model:

```bash
ollama pull qwen2.5-coder:7b
```

Default model: `qwen2.5-coder:7b` — understands code context while producing readable prose. Requires ~8GB RAM. Other good options: `mistral` (better prose), `qwen2.5:7b` (general purpose).

---

If both `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` are set, Anthropic is used unless you pass `--provider openai`.

## Usage

```bash
bun run src/cli.tsx
```

QuarterMaster will walk you through selecting a review period, optionally providing a goals file, and optionally providing an achievements file, then fetch your contributions and generate a review.

## Options

```
--repo,     -r   GitHub repo to include (owner/repo). Repeatable.
--org,      -o   Scope to a GitHub organization
--provider, -p   LLM provider: anthropic, openai, or ollama
--model,    -m   Model override (uses provider default if omitted)
```

### Examples

```bash
# Interactive — auto-detects provider from env
bun run src/cli.tsx

# Scope to a specific repo
bun run src/cli.tsx --repo acme-corp/api

# Multiple repos
bun run src/cli.tsx --repo acme-corp/api --repo acme-corp/web

# Scope to an entire org
bun run src/cli.tsx --org acme-corp

# Use OpenAI instead of Anthropic
bun run src/cli.tsx --provider openai

# Use a specific model
bun run src/cli.tsx --model claude-haiku-4-5-20251001
bun run src/cli.tsx --provider openai --model gpt-4-turbo
bun run src/cli.tsx --provider ollama --model mistral
```

## What Gets Fetched

| Source | How |
|---|---|
| Authored & merged PRs | `gh search prs --author` |
| PRs you reviewed / commented on | `gh search prs --commenter` |
| Direct commits to main/master | `gh api repos/{owner}/{repo}/commits` (only when `--repo` is specified) |

> **Note:** Direct commit fetching requires `--repo` to be set. Without it, there's no practical way to enumerate every repo you've pushed to.

## Goals File

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

## Achievements File

Create a markdown file with accomplishments that don't show up in GitHub — mentoring, design work, on-call incidents, cross-team collaboration, presentations, interviews, etc. Provide its path when prompted after the goals step:

```markdown
# Q1 2026 Achievements

- Mentored two new engineers through onboarding over 6 weeks
- Led the incident post-mortem for the Feb 12 outage; published runbook improvements
- Interviewed 8 candidates for the platform team
- Presented the API reliability roadmap to the engineering org
- On-call primary for 3 weeks; resolved 12 pages
```

These are included in the generated review alongside your GitHub contributions and treated as equally valid evidence of impact.

## Output

The review is saved as `review-YYYY-MM-DD-YYYY-MM-DD.md` in the current directory and printed to stdout (pipeable: `bun run src/cli.tsx > review.md`).

## Contributing

PRs welcome. Please open an issue before starting large changes.

## License

MIT — see [LICENSE](./LICENSE).

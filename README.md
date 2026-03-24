# ⚓ QuarterMaster

> Automate your quarterly, semi-annual, and annual performance reviews using GitHub contributions.

QuarterMaster fetches your merged PRs, code review activity, and direct commits from GitHub, then uses an LLM to write a structured review — optionally aligned to your team's goals.

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

QuarterMaster will walk you through selecting a review period and optionally providing a goals file, then fetch your contributions and generate a review.

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

## Output

The review is saved as `review-YYYY-MM-DD-YYYY-MM-DD.md` in the current directory and printed to stdout (pipeable: `bun run src/cli.tsx > review.md`).

## Contributing

PRs welcome. Please open an issue before starting large changes.

## License

MIT — see [LICENSE](./LICENSE).

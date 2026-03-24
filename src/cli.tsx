import React from 'react';
import { render } from 'ink';
import meow from 'meow';
import { App } from './app.tsx';
import type { Provider } from './llm/summarize.ts';

const PROVIDERS: Provider[] = ['anthropic', 'openai', 'ollama'];

const cli = meow(
  `
  Usage
    $ quartermaster

  Options
    --repo,     -r   GitHub repo to include (owner/repo). Repeatable.
    --org,      -o   Scope to a GitHub organization
    --provider, -p   LLM provider: anthropic, openai, or ollama (auto-detected from env)
    --model,    -m   Model to use (overrides default for the selected provider)

  Examples
    $ quartermaster
    $ quartermaster --org acme-corp
    $ quartermaster --repo acme-corp/api --repo acme-corp/web
    $ quartermaster --provider openai
    $ quartermaster --provider ollama --model mistral
`,
  {
    importMeta: import.meta,
    flags: {
      repo: { type: 'string', shortFlag: 'r', isMultiple: true },
      org: { type: 'string', shortFlag: 'o' },
      provider: { type: 'string', shortFlag: 'p' },
      model: { type: 'string', shortFlag: 'm' },
    },
  },
);

const { flags } = cli;

// Resolve provider: explicit flag → env var detection → error
function resolveProvider(): Provider {
  if (flags.provider) {
    if (!PROVIDERS.includes(flags.provider as Provider)) {
      console.error(`Error: --provider must be one of: ${PROVIDERS.join(', ')}`);
      process.exit(1);
    }
    const provider = flags.provider as Provider;
    if (provider === 'anthropic' && !process.env['ANTHROPIC_API_KEY']) {
      console.error('Error: ANTHROPIC_API_KEY is not set.');
      process.exit(1);
    }
    if (provider === 'openai' && !process.env['OPENAI_API_KEY']) {
      console.error('Error: OPENAI_API_KEY is not set.');
      process.exit(1);
    }
    // ollama needs no API key — it runs locally
    return provider;
  }

  if (process.env['ANTHROPIC_API_KEY']) return 'anthropic';
  if (process.env['OPENAI_API_KEY']) return 'openai';

  console.error(
    'Error: No API key found. Set ANTHROPIC_API_KEY or OPENAI_API_KEY, or pass --provider ollama.',
  );
  process.exit(1);
}

const provider = resolveProvider();

let finalSummary = '';
let finalPath = '';

const { waitUntilExit } = render(
  <App
    repos={flags.repo && flags.repo.length > 0 ? flags.repo : undefined}
    org={flags.org}
    provider={provider}
    model={flags.model}
    onComplete={(summary, path) => {
      finalSummary = summary;
      finalPath = path;
    }}
  />,
);

await waitUntilExit();

// Print summary to stdout after TUI exits so it can be piped/scrolled
console.log('\n' + finalSummary);
console.log(`\n---\nSaved to ${finalPath}`);

import React from 'react';
import { Box, Text } from 'ink';
import type { GitHubContributions } from '../github/types.ts';

interface Props {
  contributions: GitHubContributions;
  outputPath: string;
}

export function ReviewSummary({ contributions, outputPath }: Props) {
  const { authoredPRs, reviewedPRs, dateRange } = contributions;

  return (
    <Box flexDirection="column" gap={1}>
      <Text color="green" bold>
        ✓ Review generated!
      </Text>
      <Box flexDirection="column">
        <Text>
          <Text bold>{authoredPRs.length}</Text>
          <Text dimColor> authored PRs  ·  </Text>
          <Text bold>{reviewedPRs.length}</Text>
          <Text dimColor> reviewed PRs  ·  </Text>
          <Text dimColor>{dateRange.label || `${dateRange.from} → ${dateRange.to}`}</Text>
        </Text>
      </Box>
      <Text>
        Saved to <Text color="cyan">{outputPath}</Text>
      </Text>
    </Box>
  );
}

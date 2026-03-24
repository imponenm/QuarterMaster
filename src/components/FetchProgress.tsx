import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

interface Props {
  messages: string[];
}

export function FetchProgress({ messages }: Props) {
  const completed = messages.slice(0, -1);
  const current = messages.at(-1) ?? 'Starting...';

  return (
    <Box flexDirection="column" gap={1}>
      {completed.map((msg, i) => (
        <Text key={i} dimColor>
          {'✓ '}
          {msg}
        </Text>
      ))}
      <Box>
        <Text color="green">
          <Spinner type="dots" />
        </Text>
        <Text>{'  '}{current}</Text>
      </Box>
    </Box>
  );
}

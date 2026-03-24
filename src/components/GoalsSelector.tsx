import React, { useState } from 'react';
import { readFile } from 'node:fs/promises';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';

interface Props {
  onSubmit: (content: string | null) => void;
}

export function GoalsSelector({ onSubmit }: Props) {
  const [awaitingPath, setAwaitingPath] = useState(false);
  const [path, setPath] = useState('');
  const [error, setError] = useState('');

  useInput((input) => {
    if (awaitingPath) return;
    if (input === 'y' || input === 'Y') setAwaitingPath(true);
    if (input === 'n' || input === 'N') onSubmit(null);
  });

  async function handlePathSubmit(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
      onSubmit(null);
      return;
    }
    try {
      const content = await readFile(trimmed, 'utf-8');
      onSubmit(content);
    } catch {
      setError(`Could not read file: ${trimmed}`);
      onSubmit(null);
    }
  }

  if (awaitingPath) {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold>Path to goals file:</Text>
        {error && <Text color="red">{error}</Text>}
        <TextInput
          value={path}
          onChange={setPath}
          onSubmit={handlePathSubmit}
          placeholder="~/goals.md  (enter to skip)"
        />
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text bold>
        Do you have a goals file to align your review?{'  '}
        <Text dimColor>(y/n)</Text>
      </Text>
    </Box>
  );
}

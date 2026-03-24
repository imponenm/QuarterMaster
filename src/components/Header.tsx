import React from 'react';
import { Box, Text } from 'ink';

export function Header() {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text bold color="cyan">
        ⚓  QuarterMaster
      </Text>
      <Text dimColor>Automate your performance review using GitHub contributions</Text>
    </Box>
  );
}

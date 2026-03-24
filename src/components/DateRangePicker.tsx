import React from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import { getPresets, type DateRange } from '../utils/dates.ts';

interface Props {
  onSelect: (range: DateRange) => void;
}

export function DateRangePicker({ onSelect }: Props) {
  const items = getPresets().map((p) => ({ label: p.label, value: p.range }));

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>Select review period:</Text>
      <SelectInput items={items} onSelect={(item) => onSelect(item.value)} />
    </Box>
  );
}

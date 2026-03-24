import React, { useState, useEffect } from 'react';
import { writeFile } from 'node:fs/promises';
import { Box, Text, useApp } from 'ink';
import { Header } from './components/Header.tsx';
import { DateRangePicker } from './components/DateRangePicker.tsx';
import { GoalsSelector } from './components/GoalsSelector.tsx';
import { AchievementsSelector } from './components/AchievementsSelector.tsx';
import { FetchProgress } from './components/FetchProgress.tsx';
import { ReviewSummary } from './components/ReviewSummary.tsx';
import { fetchContributions } from './github/fetch.ts';
import { summarize, defaultModel, type Provider } from './llm/summarize.ts';
import type { DateRange } from './utils/dates.ts';
import type { GitHubContributions } from './github/types.ts';

type Step = 'date-range' | 'goals' | 'achievements' | 'working' | 'done' | 'error';

interface AppProps {
  repos?: string[];
  org?: string;
  provider: Provider;
  model?: string;
  onComplete: (summary: string, outputPath: string) => void;
}

export function App({ repos, org, provider, model, onComplete }: AppProps) {
  const { exit } = useApp();
  const [step, setStep] = useState<Step>('date-range');
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [goalsContent, setGoalsContent] = useState<string | null>(null);
  const [achievementsContent, setAchievementsContent] = useState<string | null>(null);
  const [goalsReady, setGoalsReady] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const [contributions, setContributions] = useState<GitHubContributions | null>(null);
  const [outputPath, setOutputPath] = useState('');
  const [error, setError] = useState('');

  function handleDateSelect(range: DateRange) {
    setDateRange(range);
    setStep('goals');
  }

  function handleGoalsSubmit(content: string | null) {
    setGoalsContent(content);
    setStep('achievements');
  }

  function handleAchievementsSubmit(content: string | null) {
    setAchievementsContent(content);
    setGoalsReady(true);
    setStep('working');
  }

  useEffect(() => {
    if (step !== 'working' || !dateRange || !goalsReady) return;

    const addProgress = (msg: string) => setProgress((prev) => [...prev, msg]);

    (async () => {
      try {
        const data = await fetchContributions({
          from: dateRange.from,
          to: dateRange.to,
          repos,
          org,
          onProgress: addProgress,
        });
        setContributions(data);

        const resolvedModel = model ?? defaultModel(provider);
        addProgress(`Generating review with ${resolvedModel}...`);
        const text = await summarize(data, goalsContent, achievementsContent, provider, model);

        const filename = `review-${dateRange.from}-${dateRange.to}.md`;
        await writeFile(filename, text);
        setOutputPath(filename);

        setStep('done');
        onComplete(text, filename);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setStep('error');
      }
    })();
  }, [step, goalsReady]);

  useEffect(() => {
    if (step === 'done' || step === 'error') {
      setTimeout(() => exit(), 100);
    }
  }, [step]);

  return (
    <Box flexDirection="column" padding={1}>
      <Header />
      {step === 'date-range' && <DateRangePicker onSelect={handleDateSelect} />}
      {step === 'goals' && <GoalsSelector onSubmit={handleGoalsSubmit} />}
      {step === 'achievements' && <AchievementsSelector onSubmit={handleAchievementsSubmit} />}
      {step === 'working' && <FetchProgress messages={progress} />}
      {step === 'done' && contributions && (
        <ReviewSummary contributions={contributions} outputPath={outputPath} />
      )}
      {step === 'error' && <Text color="red">Error: {error}</Text>}
    </Box>
  );
}

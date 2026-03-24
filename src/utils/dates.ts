export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string;
  label: string;
}

export interface Preset {
  label: string;
  range: DateRange;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function quarterBounds(q: 1 | 2 | 3 | 4, year: number): DateRange {
  const bounds: Record<number, { from: string; to: string }> = {
    1: { from: `${year}-01-01`, to: `${year}-03-31` },
    2: { from: `${year}-04-01`, to: `${year}-06-30` },
    3: { from: `${year}-07-01`, to: `${year}-09-30` },
    4: { from: `${year}-10-01`, to: `${year}-12-31` },
  };
  return { ...bounds[q]!, label: `Q${q} ${year}` };
}

export function getPresets(): Preset[] {
  const now = new Date();
  const year = now.getFullYear();
  const currentQ = (Math.floor(now.getMonth() / 3) + 1) as 1 | 2 | 3 | 4;
  const lastQ = currentQ === 1 ? 4 : ((currentQ - 1) as 1 | 2 | 3 | 4);
  const lastQYear = currentQ === 1 ? year - 1 : year;

  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  return [
    { label: `This quarter (Q${currentQ} ${year})`, range: quarterBounds(currentQ, year) },
    { label: `Last quarter (Q${lastQ} ${lastQYear})`, range: quarterBounds(lastQ, lastQYear) },
    {
      label: 'Last 6 months',
      range: { from: isoDate(sixMonthsAgo), to: isoDate(now), label: 'Last 6 months' },
    },
    { label: `This year (${year})`, range: { from: `${year}-01-01`, to: `${year}-12-31`, label: String(year) } },
    { label: `Last year (${year - 1})`, range: { from: `${year - 1}-01-01`, to: `${year - 1}-12-31`, label: String(year - 1) } },
  ];
}

export function formatDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

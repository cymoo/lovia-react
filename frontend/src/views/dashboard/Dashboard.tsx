import { Activity, CheckCircle2, Clock, Coins, Plus } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useT, type T } from '@/lib/i18n';
import { lovia } from '@/lib/lovia';
import type { ViewProps } from '@/lib/view';

import {
  useChatTitles,
  useLiveRuns,
  useLiveUpdates,
  useRunHistory,
  WINDOW_DAYS,
  type RunRecord,
  type RunStatus,
} from './api';

export function Dashboard(_: ViewProps) {
  const { t, lang } = useT();
  useLiveUpdates();
  const history = useRunHistory();
  const live = useLiveRuns();
  const titles = useChatTitles();
  const runs = history.data ?? [];
  const stats = useMemo(() => summarize(runs), [runs]);
  const fmt = useMemo(() => formatters(lang), [lang]);
  const titleOf = (id: string | null) => (id && titles.data?.get(id)) || t('untitled');

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{lovia.t('app.dashboard')}</h1>
          <p className="text-muted-foreground">{t('dashboard.subtitle')}</p>
        </div>
        <Button onClick={() => lovia.newChat()}>
          <Plus /> {t('dashboard.newChat')}
        </Button>
      </header>

      {history.isError && (
        <p className="text-destructive">
          {t('dashboard.loadFailed', { message: history.error.message })}
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={<Activity />} label={t('dashboard.runs')} loading={history.isPending}>
          {fmt.number(stats.total)}
        </Kpi>
        <Kpi icon={<CheckCircle2 />} label={t('dashboard.successRate')} loading={history.isPending}>
          {stats.total ? fmt.percent(stats.completed / stats.total) : '—'}
        </Kpi>
        <Kpi icon={<Clock />} label={t('dashboard.avgDuration')} loading={history.isPending}>
          {stats.avgDuration === null ? '—' : fmt.duration(stats.avgDuration)}
        </Kpi>
        <Kpi icon={<Coins />} label={t('dashboard.tokens')} loading={history.isPending}>
          {fmt.compact(stats.tokens)}
        </Kpi>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('dashboard.perDay')}</CardTitle>
          </CardHeader>
          <CardContent>
            <RunsPerDay runs={runs} t={t} lang={lang} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.live')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {live.data?.length ? (
              live.data.map((run) => (
                <button
                  key={run.run_id}
                  type="button"
                  onClick={() => lovia.openSession(run.session_id)}
                  className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left hover:bg-accent"
                >
                  <span className="truncate">{titleOf(run.session_id)}</span>
                  <StatusBadge status={run.status} t={t} />
                </button>
              ))
            ) : (
              <p className="text-muted-foreground">{t('dashboard.noLive')}</p>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.recent')}</CardTitle>
          <CardDescription>
            {stats.failed > 0 && `${t('status.failed')}: ${fmt.number(stats.failed)}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {runs.length === 0 && !history.isPending ? (
            <p className="text-muted-foreground">{t('dashboard.noRuns')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('col.started')}</TableHead>
                  <TableHead>{t('col.chat')}</TableHead>
                  <TableHead>{t('col.source')}</TableHead>
                  <TableHead>{t('col.status')}</TableHead>
                  <TableHead className="text-right">{t('col.duration')}</TableHead>
                  <TableHead className="text-right">{t('col.tokens')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.slice(0, 20).map((run) => (
                  <TableRow
                    key={run.run_id}
                    className={run.session_id ? 'cursor-pointer' : undefined}
                    onClick={() => run.session_id && lovia.openSession(run.session_id)}
                  >
                    <TableCell className="text-muted-foreground">
                      {fmt.time(run.started_at)}
                    </TableCell>
                    <TableCell className="max-w-64 truncate" title={run.error ?? undefined}>
                      {titleOf(run.session_id)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{run.source}</TableCell>
                    <TableCell>
                      <StatusBadge status={run.status} t={t} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {run.finished_at ? fmt.duration(run.finished_at - run.started_at) : '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {run.usage?.total_tokens ? fmt.number(run.usage.total_tokens) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi(props: { icon: ReactNode; label: string; loading: boolean; children: ReactNode }) {
  return (
    <Card className="gap-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardDescription>{props.label}</CardDescription>
        <span className="text-muted-foreground [&_svg]:size-4">{props.icon}</span>
      </CardHeader>
      <CardContent className="text-2xl font-semibold tabular-nums">
        {props.loading ? <Skeleton className="h-8 w-20" /> : props.children}
      </CardContent>
    </Card>
  );
}

const STATUS_VARIANT = {
  completed: 'secondary',
  failed: 'destructive',
  running: 'default',
  blocked_on_approval: 'default',
} as const;

function StatusBadge({ status, t }: { status: RunStatus | 'blocked_on_approval'; t: T }) {
  const variant = STATUS_VARIANT[status as keyof typeof STATUS_VARIANT] ?? 'outline';
  return <Badge variant={variant}>{t(`status.${status}`)}</Badge>;
}

const chartConfig = {
  completed: { label: 'completed', color: 'var(--lv-chart-1)' },
  other: { label: 'other', color: 'var(--lv-chart-4)' },
} satisfies ChartConfig;

function RunsPerDay({ runs, t, lang }: { runs: RunRecord[]; t: T; lang: string }) {
  const data = useMemo(() => perDay(runs, lang), [runs, lang]);
  const config = {
    completed: { ...chartConfig.completed, label: t('status.completed') },
    other: { ...chartConfig.other, label: t('status.failed') },
  };
  return (
    <ChartContainer config={config} className="h-56 w-full">
      <BarChart data={data} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="day" tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="completed" stackId="runs" fill="var(--color-completed)" />
        <Bar dataKey="other" stackId="runs" fill="var(--color-other)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

function summarize(runs: RunRecord[]) {
  const finished = runs.filter((r) => r.finished_at !== null);
  const durations = finished.map((r) => r.finished_at! - r.started_at);
  return {
    total: runs.length,
    completed: runs.filter((r) => r.status === 'completed').length,
    failed: runs.filter((r) => r.status === 'failed').length,
    avgDuration: durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : null,
    tokens: runs.reduce((sum, r) => sum + (r.usage?.total_tokens ?? 0), 0),
  };
}

/** One bar per local day of the window, oldest first; "other" is every non-completed run. */
function perDay(runs: RunRecord[], lang: string) {
  const label = new Intl.DateTimeFormat(lang, { month: 'numeric', day: 'numeric' });
  const days = Array.from({ length: WINDOW_DAYS }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (WINDOW_DAYS - 1 - i));
    return { start: d.getTime() / 1000, day: label.format(d), completed: 0, other: 0 };
  });
  for (const run of runs) {
    const bucket = days.findLast((d) => run.started_at >= d.start);
    if (bucket) bucket[run.status === 'completed' ? 'completed' : 'other'] += 1;
  }
  return days;
}

function formatters(lang: string) {
  const number = new Intl.NumberFormat(lang);
  const compact = new Intl.NumberFormat(lang, { notation: 'compact' });
  const percent = new Intl.NumberFormat(lang, { style: 'percent', maximumFractionDigits: 1 });
  const time = new Intl.DateTimeFormat(lang, { dateStyle: 'short', timeStyle: 'short' });
  return {
    number: (n: number) => number.format(n),
    compact: (n: number) => compact.format(n),
    percent: (n: number) => percent.format(n),
    time: (epoch: number) => time.format(epoch * 1000),
    duration: (s: number) => (s < 60 ? `${s.toFixed(1)}s` : `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`),
  };
}

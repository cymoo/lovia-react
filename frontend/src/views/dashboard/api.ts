// The lovia HTTP API the dashboard reads (docs: http-api.md), as TanStack
// queries, kept fresh by the server's lifecycle events.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { apiJson, lovia } from '@/lib/lovia';

export type RunStatus = 'running' | 'completed' | 'failed' | 'cancelled' | 'interrupted';

export interface RunRecord {
  run_id: string;
  session_id: string | null;
  agent: string | null;
  source: string;
  status: RunStatus;
  error: string | null;
  started_at: number;
  finished_at: number | null;
  usage: Record<string, number> | null;
}

export interface LiveRun {
  session_id: string;
  run_id: string;
  agent: string;
  status: 'running' | 'blocked_on_approval';
  turns: number;
  source: string;
  started_at: number | null;
}

export interface ChatSession {
  id: string;
  title: string | null;
}

export const WINDOW_DAYS = 7;

export function useRunHistory() {
  return useQuery({
    queryKey: ['runs', 'history', WINDOW_DAYS],
    queryFn: () => {
      const since = Date.now() / 1000 - WINDOW_DAYS * 86_400;
      return apiJson<RunRecord[]>(`/api/runs/history?since=${since}&limit=500`);
    },
  });
}

export function useLiveRuns() {
  return useQuery({
    queryKey: ['runs', 'live'],
    queryFn: () => apiJson<LiveRun[]>('/api/runs'),
  });
}

/** Chat titles by id, for labelling runs. */
export function useChatTitles() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const sessions = await apiJson<ChatSession[]>('/api/sessions?limit=1000');
      return new Map(sessions.map((s) => [s.id, s.title]));
    },
  });
}

/**
 * Refetch on the server's lifecycle events (`GET /api/events`). The stream
 * replays nothing, so every (re)connection refetches first — that is how a
 * client catches up on what happened while it was away.
 */
export function useLiveUpdates(): void {
  const client = useQueryClient();
  useEffect(() => {
    // EventSource can't send headers; a token-guarded server reads the
    // lovia_token cookie the chat page has already set.
    const source = new EventSource(lovia.url('/api/events'));
    const refresh = (keys: string[][]) =>
      keys.forEach((queryKey) => client.invalidateQueries({ queryKey }));
    source.onopen = () => refresh([['runs'], ['sessions']]);
    source.addEventListener('run_started', () => refresh([['runs', 'live']]));
    source.addEventListener('run_finished', () => refresh([['runs']]));
    source.addEventListener('session_created', () => refresh([['sessions']]));
    source.addEventListener('session_retitled', () => refresh([['sessions']]));
    return () => source.close();
  }, [client]);
}

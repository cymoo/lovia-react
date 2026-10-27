// React bindings for `window.lovia`, the chat page's extension API. Its types
// (LoviaApi, LoviaState, …) are globals from lovia's lovia.d.ts — see
// tsconfig.json's include.
import { useEffect, useRef, useSyncExternalStore } from 'react';

export const lovia: LoviaApi = window.lovia;

// Every event that can change `lovia.state`.
const STATE_EVENTS = ['session', 'agent', 'run-start', 'run-end', 'theme', 'view'] as const;

// `lovia.state` hands out a fresh frozen object per read, so cache it:
// useSyncExternalStore needs a stable snapshot between changes.
let snapshot = lovia.state;

function subscribe(onChange: () => void): () => void {
  const offs = STATE_EVENTS.map((event) =>
    lovia.on(event, () => {
      snapshot = lovia.state;
      onChange();
    }),
  );
  return () => offs.forEach((off) => off());
}

/** The page's state (chat on screen, agent, theme, busy, …), kept current. */
export function useLoviaState(): LoviaState {
  return useSyncExternalStore(subscribe, () => snapshot);
}

/** Listen for a `window.lovia` event while the component is mounted. */
export function useLoviaEvent<E extends keyof LoviaEvents>(
  event: E,
  fn: (payload: LoviaEvents[E]) => void,
): void {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => lovia.on(event, (payload) => ref.current(payload)), [event]);
}

/** An error from the lovia HTTP API: `{detail: {code, message, hint}}`. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly hint?: string,
  ) {
    super(message);
  }
}

/** GET/POST an app route as JSON, through `lovia.fetch` (prefix + sign-in handling). */
export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await lovia.fetch(path, init);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail = body?.detail;
    if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
      throw new ApiError(detail.message ?? res.statusText, res.status, detail.code, detail.hint);
    }
    throw new ApiError(res.statusText || `HTTP ${res.status}`, res.status);
  }
  return res.json() as Promise<T>;
}

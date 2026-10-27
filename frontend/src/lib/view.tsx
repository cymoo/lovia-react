import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';

// One cache for every view: reopening a view shows its data at once.
export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 10_000, retry: 1 } },
});

export interface ViewProps {
  /** What follows the id in `?view=<id>/<path>`; '' when nothing does. */
  path: string;
}

/**
 * A lovia view drawn by a React component. lovia calls `render` on each
 * opening and each change of the path, after running the previous cleanup,
 * so every draw is a fresh root (state that must survive a path change
 * belongs in the URL or the query cache).
 */
export function reactView(title: string, Component: ComponentType<ViewProps>): View {
  return {
    title,
    render(el, ctx) {
      const host = document.createElement('div');
      host.className = 'lr-root';
      el.replaceChildren(host);
      const root = createRoot(host);
      root.render(
        <StrictMode>
          <QueryClientProvider client={queryClient}>
            <Component path={ctx.path} />
          </QueryClientProvider>
        </StrictMode>,
      );
      return () => root.unmount();
    },
  };
}

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureGridTheme } from "@matthewhsu1/datagrid";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

import "@matthewhsu1/datagrid/radix-styles";
import "@matthewhsu1/datagrid/datagrid.css";
import "./index.css";

import { store } from "./store";
import { DEMO_ACCENT, startColorSchemeWatcher } from "./appearance";
import { DemoTheme } from "./theme";
import { TestGridPage } from "./grid/TestGridPage";

// Told once, before the first grid renders. The accent matches <DemoTheme>, so
// a date or enum popup — which portals out of the React tree and mounts its own
// <Theme> — looks like it belongs to the page around it.
configureGridTheme({ accentColor: DEMO_ACCENT, grayColor: "slate" });

startColorSchemeWatcher();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Row pages are cached by the engine's own row store, and a refetch on
      // focus would fight the window it is holding.
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

/**
 * The rows come from a Mock Service Worker, not a server, so nothing renders
 * until the worker has claimed the page — a request that races the worker's
 * activation would fall through to a real 404.
 */
async function start() {
  const { worker } = await import("./mocks/browser");

  await worker.start({ onUnhandledRequest: "bypass" });

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <DemoTheme>
            <TestGridPage />
          </DemoTheme>
        </QueryClientProvider>
      </Provider>
    </StrictMode>,
  );
}

start();

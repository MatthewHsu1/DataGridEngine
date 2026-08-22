import { setupWorker } from "msw/browser";
import { testGridHandlers } from "../grid/mocks/handlers";

/** Serves the demo's 100,000 synthetic rows from inside the browser. */
export const worker = setupWorker(...testGridHandlers);

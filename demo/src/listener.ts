import { createListenerMiddleware } from "@reduxjs/toolkit";

/**
 * The demo app's one listener middleware.
 *
 * `@matthewhsu1/datagrid` ships none of its own: a listener already
 * discriminates by action type, so a middleware per library would buy nothing
 * and force every host to `.concat` another entry. A grid is handed this one
 * through `createGridInstance(descriptor, { startListening })`.
 */
export const appListener = createListenerMiddleware();

export const startAppListening = appListener.startListening;

import "@testing-library/jest-dom";

/**
 * jsdom ships no `ResizeObserver`, and Radix's popovers construct one on mount.
 * A stub that observes nothing is enough: the tests that mount a popover assert
 * on what is IN it, never on where it was placed.
 */
if (!("ResizeObserver" in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

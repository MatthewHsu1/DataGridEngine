/**
 * The element glide-data-grid draws every cell overlay editor into.
 *
 * glide looks this up BY ID at the moment an editor opens. If it is missing,
 * glide logs "Cannot open Data Grid overlay editor, because portal not found"
 * and no cell can be edited — the grid otherwise looks perfectly healthy, which
 * makes it a genuinely hard failure to trace.
 */
const PORTAL_ID = "portal";

/**
 * Makes sure the overlay portal exists, creating it if the host app has not.
 *
 * The engine does this itself rather than documenting a `<div id="portal" />`
 * the host must remember: a required DOM node with no compile-time and no
 * runtime signal is the same kind of silent contract as a magic store key, and
 * the only symptom is "editing does nothing".
 *
 * An element the host already provides is left exactly as it is — a host that
 * positions its own portal knows something we do not. Nothing is ever removed:
 * a second grid, or a later mount, needs the same node.
 */
export function ensureGridPortal(): void {
  if (typeof document === "undefined") {
    return;
  }

  if (document.getElementById(PORTAL_ID)) {
    return;
  }

  const portal = document.createElement("div");

  portal.id = PORTAL_ID;
  portal.style.position = "fixed";
  portal.style.left = "0";
  portal.style.top = "0";
  // Above the grid, and above most app chrome. An editor that opens behind the
  // canvas is indistinguishable from one that never opened.
  portal.style.zIndex = "9999";

  // Appended last so it paints over everything already in the body.
  document.body.appendChild(portal);
}

import { afterEach, describe, expect, it } from "vitest";
import { ensureGridPortal } from "./ensurePortal";

afterEach(() => {
  document.getElementById("portal")?.remove();
});

describe("ensureGridPortal", () => {
  it("creates the overlay portal when the host app has not, so cells stay editable", () => {
    expect(document.getElementById("portal")).toBeNull();

    ensureGridPortal();

    expect(document.getElementById("portal")).not.toBeNull();
  });

  it("puts the portal last in the body, so an editor paints above the grid", () => {
    document.body.appendChild(document.createElement("main"));

    ensureGridPortal();

    expect(document.body.lastElementChild?.id).toBe("portal");
  });

  it("positions it fixed and above app chrome", () => {
    ensureGridPortal();

    const portal = document.getElementById("portal")!;

    expect(portal.style.position).toBe("fixed");
    expect(portal.style.zIndex).toBe("9999");
  });

  it("leaves a portal the host already provided completely alone", () => {
    // A host that positions its own portal knows something the engine does not.
    const existing = document.createElement("div");
    existing.id = "portal";
    existing.dataset.owner = "host";
    existing.style.zIndex = "1";
    document.body.appendChild(existing);

    ensureGridPortal();

    const portal = document.getElementById("portal")!;

    expect(portal.dataset.owner).toBe("host");
    expect(portal.style.zIndex).toBe("1");
  });

  it("never adds a second portal, however many grids mount", () => {
    ensureGridPortal();
    ensureGridPortal();
    ensureGridPortal();

    expect(document.querySelectorAll("#portal")).toHaveLength(1);
  });
});

import { describe, expect, it } from "vitest";
import { dateToMask, maskToDate } from "./dateMask";

describe("maskToDate", () => {
  it("reads eight digits as a local-midnight MM/DD/YYYY date", () => {
    expect(maskToDate("06202026")).toEqual(new Date(2026, 5, 20));
  });

  it("accepts a leap day that exists", () => {
    expect(maskToDate("02292024")).toEqual(new Date(2024, 1, 29));
  });

  it("rejects an empty string", () => {
    expect(maskToDate("")).toBeUndefined();
  });

  it("rejects a partially typed date", () => {
    expect(maskToDate("0620202")).toBeUndefined();
  });

  it("rejects a month above twelve", () => {
    expect(maskToDate("13012026")).toBeUndefined();
  });

  it("rejects a zero month", () => {
    expect(maskToDate("00012026")).toBeUndefined();
  });

  it("rejects a zero day", () => {
    expect(maskToDate("06002026")).toBeUndefined();
  });

  it("rejects a day the month does not have", () => {
    expect(maskToDate("02302026")).toBeUndefined();
  });

  it("rejects a leap day in a non-leap year", () => {
    expect(maskToDate("02292026")).toBeUndefined();
  });

  it("rejects non-digit characters", () => {
    expect(maskToDate("06/20/20")).toBeUndefined();
  });
});

describe("dateToMask", () => {
  it("writes a date as eight zero-padded digits", () => {
    expect(dateToMask(new Date(2026, 5, 20))).toBe("06202026");
  });

  it("pads a single-digit month and day", () => {
    expect(dateToMask(new Date(2026, 0, 1))).toBe("01012026");
  });

  it("returns an empty string for no date", () => {
    expect(dateToMask(undefined)).toBe("");
  });

  it("round-trips with maskToDate", () => {
    const date = new Date(2001, 10, 9);

    expect(maskToDate(dateToMask(date))).toEqual(date);
  });
});

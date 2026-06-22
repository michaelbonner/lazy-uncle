import { addDays, addWeeks, subYears } from "date-fns";
import { describe, expect, it } from "vitest";
import type { Birthday } from "../lib/trpc";
import { getDaysUntilNextBirthday } from "./getDaysUntilNextBirthday";

const baseBirthDay = {
  id: "1",
  name: "John Doe",
  year: null,
};

const today = new Date();
const todayBirthday = {
  month: today.getMonth() + 1,
  day: today.getDate(),
  ...baseBirthDay,
} as unknown as Birthday;

const oneYearAgo = subYears(new Date(), 1);
const oneYearAgoBirthday = {
  month: oneYearAgo.getMonth() + 1,
  day: oneYearAgo.getDate(),
  ...baseBirthDay,
} as unknown as Birthday;

const oneYearAgoTomorrow = subYears(addDays(new Date(), 1), 1);
const oneYearAgoTomorrowBirthday = {
  month: oneYearAgoTomorrow.getMonth() + 1,
  day: oneYearAgoTomorrow.getDate(),
  ...baseBirthDay,
} as unknown as Birthday;

const oneYearAgoThreeDays = subYears(addDays(new Date(), 3), 1);
const oneYearAgoThreeDaysFromNowBirthday = {
  month: oneYearAgoThreeDays.getMonth() + 1,
  day: oneYearAgoThreeDays.getDate(),
  ...baseBirthDay,
} as unknown as Birthday;

const oneYearAgoThreeWeeks = subYears(addWeeks(new Date(), 3), 1);
const oneYearAgoThreeWeeksFromNowBirthday = {
  month: oneYearAgoThreeWeeks.getMonth() + 1,
  day: oneYearAgoThreeWeeks.getDate(),
  ...baseBirthDay,
} as unknown as Birthday;

describe("get age for humans", () => {
  it("a date of today returns 0", () => {
    expect(getDaysUntilNextBirthday(todayBirthday)).toEqual(0);
  });
  it("a date of a year ago returns 0", () => {
    expect(getDaysUntilNextBirthday(oneYearAgoBirthday)).toEqual(0);
  });
  it("a date of a year ago from tomorrow returns 1", () => {
    expect(getDaysUntilNextBirthday(oneYearAgoTomorrowBirthday)).toEqual(1);
  });
  it("a date of a year ago from 3 days from now returns 3", () => {
    expect(
      getDaysUntilNextBirthday(oneYearAgoThreeDaysFromNowBirthday),
    ).toEqual(3);
  });
  it("a date of a year ago from 3 weeks from now returns 21", () => {
    expect(
      getDaysUntilNextBirthday(oneYearAgoThreeWeeksFromNowBirthday),
    ).toEqual(21);
  });
  it("a birthday with no month returns positive infinity", () => {
    expect(
      getDaysUntilNextBirthday({ day: 15 } as unknown as Birthday),
    ).toBe(Number.POSITIVE_INFINITY);
  });
  it("a birthday with no day returns positive infinity", () => {
    expect(
      getDaysUntilNextBirthday({ month: 5 } as unknown as Birthday),
    ).toBe(Number.POSITIVE_INFINITY);
  });
  it("a birthday with null date components returns positive infinity", () => {
    expect(
      getDaysUntilNextBirthday({
        month: null,
        day: null,
      } as unknown as Birthday),
    ).toBe(Number.POSITIVE_INFINITY);
  });
});

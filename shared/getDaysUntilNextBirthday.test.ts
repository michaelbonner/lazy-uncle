import { addDays, addWeeks, subYears } from "date-fns";
import { describe, expect, it } from "vitest";
import { NexusGenObjects } from "../generated/nexus-typegen";
import { getDaysUntilNextBirthday } from "./getDaysUntilNextBirthday";

const baseBirthDay = {
  id: "1",
  name: "John Doe",
  year: null,
};

const today = new Date();
const todayBirthday: NexusGenObjects["Birthday"] = {
  month: today.getMonth() + 1,
  day: today.getDate(),
  ...baseBirthDay,
};

const oneYearAgo = subYears(new Date(), 1);
const oneYearAgoBirthday: NexusGenObjects["Birthday"] = {
  month: oneYearAgo.getMonth() + 1,
  day: oneYearAgo.getDate(),
  ...baseBirthDay,
};

const oneYearAgoTomorrow = subYears(addDays(new Date(), 1), 1);
const oneYearAgoTomorrowBirthday: NexusGenObjects["Birthday"] = {
  month: oneYearAgoTomorrow.getMonth() + 1,
  day: oneYearAgoTomorrow.getDate(),
  ...baseBirthDay,
};

const oneYearAgoThreeDays = subYears(addDays(new Date(), 3), 1);
const oneYearAgoThreeDaysFromNowBirthday: NexusGenObjects["Birthday"] = {
  month: oneYearAgoThreeDays.getMonth() + 1,
  day: oneYearAgoThreeDays.getDate(),
  ...baseBirthDay,
};

const oneYearAgoThreeWeeks = subYears(addWeeks(new Date(), 3), 1);
const oneYearAgoThreeWeeksFromNowBirthday: NexusGenObjects["Birthday"] = {
  month: oneYearAgoThreeWeeks.getMonth() + 1,
  day: oneYearAgoThreeWeeks.getDate(),
  ...baseBirthDay,
};

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
});

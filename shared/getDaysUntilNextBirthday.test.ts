import { addDays, addWeeks, format, subYears } from "date-fns";
import { NexusGenObjects } from "../generated/nexus-typegen";
import { getDaysUntilNextBirthday } from "./getDaysUntilNextBirthday";

const baseBirthDay = {
  id: "1",
  name: "John Doe",
};

const todayBirthday: NexusGenObjects["Birthday"] = {
  date: format(new Date(), "yyyy-MM-dd"),
  ...baseBirthDay,
};

const oneYearAgoBirthday: NexusGenObjects["Birthday"] = {
  date: format(subYears(new Date(), 1), "yyyy-MM-dd"),
  ...baseBirthDay,
};

const oneYearAgoTomorrowBirthday: NexusGenObjects["Birthday"] = {
  date: format(subYears(addDays(new Date(), 1), 1), "yyyy-MM-dd"),
  ...baseBirthDay,
};

const oneYearAgoThreeDaysFromNowBirthday: NexusGenObjects["Birthday"] = {
  date: format(subYears(addDays(new Date(), 3), 1), "yyyy-MM-dd"),
  ...baseBirthDay,
};

const oneYearAgoThreeWeeksFromNowBirthday: NexusGenObjects["Birthday"] = {
  date: format(subYears(addWeeks(new Date(), 3), 1), "yyyy-MM-dd"),
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
      getDaysUntilNextBirthday(oneYearAgoThreeDaysFromNowBirthday)
    ).toEqual(3);
  });
  it("a date of a year ago from 3 weeks from now returns 21", () => {
    expect(
      getDaysUntilNextBirthday(oneYearAgoThreeWeeksFromNowBirthday)
    ).toEqual(21);
  });
});

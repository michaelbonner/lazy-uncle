import { subMonths, subWeeks, subYears } from "date-fns";
import getAgeForHumans from "./getAgeForHumans";

describe("get age for humans", () => {
  it("a date of 5 months ago returns weeks", () => {
    expect(getAgeForHumans(subWeeks(new Date(), 20))).toEqual("20 weeks");
  });
  it("a date of 7 months ago returns months", () => {
    expect(getAgeForHumans(subMonths(new Date(), 7))).toEqual("7 months");
  });
  it("a date of 14 months ago returns months", () => {
    expect(getAgeForHumans(subMonths(new Date(), 14))).toEqual("14 months");
  });
  it("a date of 23 months ago returns months", () => {
    expect(getAgeForHumans(subMonths(new Date(), 23))).toEqual("23 months");
  });
  it("a date of 2 years ago returns years", () => {
    expect(getAgeForHumans(subYears(new Date(), 2))).toEqual("2");
  });
  it("a date of 20 years ago returns years", () => {
    expect(getAgeForHumans(subYears(new Date(), 20))).toEqual("20");
  });
  it("a date of 30 years ago returns nothing", () => {
    expect(getAgeForHumans(subYears(new Date(), 30))).toEqual("");
  });
  it("a date of 30 years ago returns age if alwaysShow is set to true", () => {
    expect(getAgeForHumans(subYears(new Date(), 30), true)).toEqual("30");
  });
});

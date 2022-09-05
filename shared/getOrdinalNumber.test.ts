import { describe, expect, it } from "vitest";
import { getOrdinalNumber } from "./getOrdinalNumber";

describe("get ordinal number for number", () => {
  it("1 returns 1st", () => {
    expect(getOrdinalNumber(1)).toEqual("1st");
  });
  it("2 returns 2nd", () => {
    expect(getOrdinalNumber(2)).toEqual("2nd");
  });
  it("3 returns 3rd", () => {
    expect(getOrdinalNumber(3)).toEqual("3rd");
  });
  it("4 returns 4th", () => {
    expect(getOrdinalNumber(4)).toEqual("4th");
  });
  it("11 returns 11th", () => {
    expect(getOrdinalNumber(11)).toEqual("11th");
  });
  it("22 returns 22nd", () => {
    expect(getOrdinalNumber(22)).toEqual("22nd");
  });
  it("33 returns 33rd", () => {
    expect(getOrdinalNumber(33)).toEqual("33rd");
  });
  it("55 returns 55th", () => {
    expect(getOrdinalNumber(55)).toEqual("55th");
  });
  it("77 returns 77th", () => {
    expect(getOrdinalNumber(77)).toEqual("77th");
  });
  it("99 returns 99th", () => {
    expect(getOrdinalNumber(99)).toEqual("99th");
  });
  it("100 returns 100th", () => {
    expect(getOrdinalNumber(100)).toEqual("100th");
  });
  it("101 returns 101st", () => {
    expect(getOrdinalNumber(101)).toEqual("101st");
  });
});

import getZodiacSignForDate from "./getZodiacSignForDateYmdString";

describe("get zodiac sign for date", () => {
  it("a date of 2000-03-21 returns Aries", () => {
    expect(getZodiacSignForDate("2000-03-21")).toEqual("Aries");
  });
  it("a date of 2000-04-20 returns Aries", () => {
    expect(getZodiacSignForDate("2000-04-20")).toEqual("Aries");
  });

  it("a date of 2000-04-21 returns Taurus", () => {
    expect(getZodiacSignForDate("2000-04-21")).toEqual("Taurus");
  });

  it("a date of 2000-05-20 returns Taurus", () => {
    expect(getZodiacSignForDate("2000-05-20")).toEqual("Taurus");
  });

  it("a date of 2000-05-21 returns Gemini", () => {
    expect(getZodiacSignForDate("2000-05-21")).toEqual("Gemini");
  });

  it("a date of 2000-06-20 returns Gemini", () => {
    expect(getZodiacSignForDate("2000-06-20")).toEqual("Gemini");
  });

  it("a date of 2000-06-21 returns Cancer", () => {
    expect(getZodiacSignForDate("2000-06-21")).toEqual("Cancer");
  });

  it("a date of 2000-07-22 returns Cancer", () => {
    expect(getZodiacSignForDate("2000-07-22")).toEqual("Cancer");
  });

  it("a date of 2000-07-23 returns Leo", () => {
    expect(getZodiacSignForDate("2000-07-23")).toEqual("Leo");
  });

  it("a date of 2000-08-22 returns Leo", () => {
    expect(getZodiacSignForDate("2000-08-22")).toEqual("Leo");
  });

  it("a date of 2000-08-23 returns Virgo", () => {
    expect(getZodiacSignForDate("2000-08-23")).toEqual("Virgo");
  });

  it("a date of 2000-09-22 returns Virgo", () => {
    expect(getZodiacSignForDate("2000-09-22")).toEqual("Virgo");
  });

  it("a date of 2000-09-23 returns Libra", () => {
    expect(getZodiacSignForDate("2000-09-23")).toEqual("Libra");
  });

  it("a date of 2000-10-22 returns Libra", () => {
    expect(getZodiacSignForDate("2000-10-22")).toEqual("Libra");
  });

  it("a date of 2000-10-23 returns Scorpio", () => {
    expect(getZodiacSignForDate("2000-10-23")).toEqual("Scorpio");
  });

  it("a date of 2000-11-22 returns Scorpio", () => {
    expect(getZodiacSignForDate("2000-11-22")).toEqual("Scorpio");
  });

  it("a date of 2000-11-23 returns Sagittarius", () => {
    expect(getZodiacSignForDate("2000-11-23")).toEqual("Sagittarius");
  });

  it("a date of 2000-12-21 returns Sagittarius", () => {
    expect(getZodiacSignForDate("2000-12-21")).toEqual("Sagittarius");
  });

  it("a date of 2000-12-22 returns Capricorn", () => {
    expect(getZodiacSignForDate("2000-12-22")).toEqual("Capricorn");
  });

  it("a date of 2000-01-19 returns Capricorn", () => {
    expect(getZodiacSignForDate("2000-01-19")).toEqual("Capricorn");
  });

  it("a date of 2000-01-20 returns Aquarius", () => {
    expect(getZodiacSignForDate("2000-01-20")).toEqual("Aquarius");
  });

  it("a date of 2000-02-19 returns Aquarius", () => {
    expect(getZodiacSignForDate("2000-02-19")).toEqual("Aquarius");
  });

  it("a date of 2000-02-20 returns Pisces", () => {
    expect(getZodiacSignForDate("2000-02-20")).toEqual("Pisces");
  });

  it("a date of 2000-03-20 returns Pisces", () => {
    expect(getZodiacSignForDate("2000-03-20")).toEqual("Pisces");
  });
});

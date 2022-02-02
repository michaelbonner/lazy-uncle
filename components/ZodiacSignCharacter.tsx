import React, { ReactElement } from "react";

interface ZodiacSignMap {
  [key: string]: string;
}

const ZodiacSignCharacter = ({
  className = "",
  name,
}: {
  className?: string;
  name: string;
}): ReactElement => {
  const signToUnicodeMap = {
    Aries: "♈",
    Taurus: "♉",
    Gemini: "♊",
    Cancer: "♋",
    Leo: "♌",
    Virgo: "♍",
    Libra: "♎",
    Scorpio: "♏",
    Sagittarius: "♐",
    Capricorn: "♑️",
    Aquarius: "♒️",
    Pisces: "♓️",
  } as ZodiacSignMap;

  return (
    <span className={className} title={name}>
      {signToUnicodeMap[name]}
    </span>
  );
};
export default ZodiacSignCharacter;

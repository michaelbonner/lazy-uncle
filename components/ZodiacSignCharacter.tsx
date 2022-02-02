import Image from "next/image";
import React, { ReactElement } from "react";

const ZodiacSignCharacter = ({ name }: { name: string }): ReactElement => {
  return (
    <Image
      src={`/zodiac-symbols/${name}.svg`}
      alt={name}
      width="14"
      height="14"
    />
  );
};
export default ZodiacSignCharacter;

import prisma from "../../lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

const CHECK_FREQUENCY = 10000;
let dbCheckVal: Boolean | Promise<Boolean> = false;
setInterval(() => {
  dbCheckVal = checkDatabase();
}, CHECK_FREQUENCY);

const main = (
  req: NextApiRequest,
  resp: NextApiResponse<{
    message: string;
  }>,
) => {
  const message = [];

  if (!dbCheckVal) {
    message.push("DB CHECK FAILED");
  }

  if (message.length > 0) {
    resp.status(500).json({ message: message.join(";\n") });
    return;
  }
  resp.status(200).json({ message: "OK" });
};

export default main;

const checkDatabase = async () => {
  try {
    const val = await prisma.$queryRaw<{ okay: number }[]>`SELECT 1 as okay`;

    return val.at(0)?.["okay"] === 1;
  } catch (error) {
    return false;
  }
};

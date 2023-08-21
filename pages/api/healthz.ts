import prisma from "../../lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

const CHECK_FREQUENCY = 10000;
let pgCheckVal: Boolean | Promise<Boolean> = false;
setInterval(() => {
  pgCheckVal = checkPostgres();
}, CHECK_FREQUENCY);

const main = (
  req: NextApiRequest,
  resp: NextApiResponse<{
    message: string;
  }>,
) => {
  const message = [];

  if (!pgCheckVal) {
    message.push("PG CHECK FAILED");
  }

  if (message.length > 0) {
    resp.status(500).json({ message: message.join(";\n") });
    return;
  }
  resp.status(200).json({ message: "OK" });
};

export default main;

const checkPostgres = async () => {
  try {
    const val = await prisma.$queryRaw<{ "?column?": number }[]>`SELECT 1`;

    return val.at(0)?.["?column?"] === 1;
  } catch (error) {
    return false;
  }
};

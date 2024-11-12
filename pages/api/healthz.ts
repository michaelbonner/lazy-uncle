import prisma from "../../lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

const main = async (
  req: NextApiRequest,
  resp: NextApiResponse<{
    message: string;
  }>,
) => {
  const message = [];

  const checkDbResult = await checkDB();
  if (!checkDbResult) {
    message.push("DB CHECK FAILED");
  }

  if (message.length > 0) {
    resp.status(500).json({ message: message.join(";\n") });
    return;
  }
  resp.status(200).json({ message: "OK" });
};

export default main;

const checkDB = async () => {
  try {
    const val = await prisma.$queryRaw<{ okay: number }[]>`SELECT 1 as okay`;

    return `${val?.at(0)?.["okay"]}` === "1";
  } catch (error) {
    console.error(error);
    return false;
  }
};

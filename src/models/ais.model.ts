import { Prisma } from "../../generated/prisma";
import prisma from "../config/db";

const create = async (_data: Prisma.AISDataCreateInput) => {
  try {
    //console.log(_data);
    await prisma.aISData.create({ data: _data });
  } catch (error) {
    console.error("Failed to store AIS Data:", error);
    return [];
  }
};

const list = async (minutesAgo: number, timeUtc: string) => {
  try {
    // Query to get vessels updated in the last 2 minutes and that do not repeat mmsi
    const query = `
        SELECT DISTINCT ON (mmsi) mmsi, cog, sog, latitude, longitude, "shipName", "trueHeading"
        FROM public."AISData"
        WHERE CAST("timeUtc" AS TIMESTAMP) >= CAST('${timeUtc}' AS TIMESTAMP)
        ORDER BY "mmsi", "timeUtc" DESC;
    `;

    const result = await prisma.$queryRawUnsafe(query);
    return result;
  } catch (error) {
    console.error("Failed to fetch AIS Data:", error);
    return [];
  }
};

export const AISModel = {
  create,
  list,
};

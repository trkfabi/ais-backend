import { AISData } from "../../generated/prisma";
import prisma from "../config/db";
import { getVesselsByTime } from "../../generated/prisma/sql";

const create = async (_data: AISData) => {
  try {
    prisma.aISData.create({ data: _data });
  } catch (error) {
    console.error("Failed to store AIS Data:", error);
    return [];
  }
};

const list = async (minutesAgo: number, timeUtc: string) => {
  try {
    // Consulta para obtener barcos actualizados en los últimos 2 minutos y que no se repitan mmsi
    // not used
    minutesAgo = minutesAgo || 0;

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

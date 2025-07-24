import { Request, Response } from "express";
import { AISModel } from "../models/ais.model";
import { registerBoundingBox } from "../services/ws.service";
import { Message } from "../config/types";

const AIS_WS_APIKEY = process.env.AIS_WS_APIKEY;

const list = async (req: Request, res: Response): Promise<void> => {
  try {
    const forwarded = req.headers["x-forwarded-for"];

    const ip =
      typeof forwarded === "string"
        ? forwarded.split(",")[0]
        : Array.isArray(forwarded)
        ? forwarded[0]
        : req.socket?.remoteAddress;

    // Get deviceId from header or query
    let deviceId =
      (req.headers["x-device-id"] as string) ||
      (req.query.deviceId as string) ||
      "unknown";
    deviceId += `-${ip}`;

    // Calculate the time threshold (2 minutes ago)
    const minutesAgo = parseInt(req.query.minutes_ago as string, 10) || 2;
    const timeUtc = (req.query.timeUtc as string) || "";
    const bounds = req.query.bounds;
    if (bounds) {
      try {
        let boundsJSON;
        if (typeof bounds === "string") {
          boundsJSON = JSON.parse(bounds);
        } else {
          throw new Error("Invalid bounds format");
        }
        const bbox: [[number, number], [number, number]] = [
          [boundsJSON.ne[0], boundsJSON.ne[1]],
          [boundsJSON.sw[0], boundsJSON.sw[1]],
        ];
        // Use deviceId as the unique key for bounding box registration
        registerBoundingBox(deviceId, bbox);
      } catch (_err) {
        console.error(_err);
      }
    }

    console.log("Fetching fresh vessels from device:", deviceId);
    // Query to get vessels updated in the last N minutes
    const freshVessels = await AISModel.list(minutesAgo, timeUtc);

    res.status(200).json({
      success: true,
      message: `List of vessels updated in the last ${minutesAgo} minutes.`,
      results: freshVessels,
    });
  } catch (error) {
    console.error("Error fetching fresh vessels:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch fresh vessels.",
      results: null,
    });
  }
};

export const VesselController = {
  list,
};

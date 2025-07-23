import { Request, Response } from "express";
import { AISModel } from "../models/ais.model";
import { updateAISMessage } from "../services/ws.service";
import { Message } from "../config/types";

const AIS_WS_APIKEY = process.env.AIS_WS_APIKEY;

const list = async (req: Request, res: Response): Promise<void> => {
  try {
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
        const AIS_WS_SUBSCRIPTION_MESSAGE: Message = {
          APIKey: AIS_WS_APIKEY!,
          BoundingBoxes: [
            [
              [boundsJSON.ne[0], boundsJSON.ne[1]],
              [boundsJSON.sw[0], boundsJSON.sw[1]],
            ],
          ],
          FilterMessageTypes: ["PositionReport"],
        };
        // Update the subscription message to the w-service with the new bounding box
        updateAISMessage(AIS_WS_SUBSCRIPTION_MESSAGE);
      } catch (_err) {
        console.error(_err);
      }
    }

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

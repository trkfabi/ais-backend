"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VesselController = void 0;
const ais_model_1 = require("../models/ais.model");
const ws_service_1 = require("../services/ws.service");
const AIS_WS_APIKEY = process.env.AIS_WS_APIKEY;
const list = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Calculate the time threshold (2 minutes ago)
        const minutesAgo = parseInt(req.query.minutes_ago, 10) || 2;
        const timeUtc = req.query.timeUtc || "";
        const bounds = req.query.bounds;
        if (bounds) {
            try {
                let boundsJSON;
                if (typeof bounds === "string") {
                    boundsJSON = JSON.parse(bounds);
                }
                else {
                    throw new Error("Invalid bounds format");
                }
                const AIS_WS_SUBSCRIPTION_MESSAGE = {
                    APIKey: AIS_WS_APIKEY,
                    BoundingBoxes: [
                        [
                            [boundsJSON.ne[0], boundsJSON.ne[1]],
                            [boundsJSON.sw[0], boundsJSON.sw[1]],
                        ],
                    ],
                    FilterMessageTypes: ["PositionReport"],
                };
                // Update the subscription message to the w-service with the new bounding box
                (0, ws_service_1.updateAISMessage)(AIS_WS_SUBSCRIPTION_MESSAGE);
            }
            catch (_err) {
                console.error(_err);
            }
        }
        // Query to get vessels updated in the last N minutes
        const freshVessels = yield ais_model_1.AISModel.list(minutesAgo, timeUtc);
        res.status(200).json({
            success: true,
            message: `List of vessels updated in the last ${minutesAgo} minutes.`,
            results: freshVessels,
        });
    }
    catch (error) {
        console.error("Error fetching fresh vessels:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch fresh vessels.",
            results: null,
        });
    }
});
exports.VesselController = {
    list,
};

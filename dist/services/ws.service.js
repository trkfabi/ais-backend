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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startAISService = exports.updateAISMessage = void 0;
const ws_1 = __importDefault(require("ws"));
const ais_model_1 = require("../models/ais.model");
const lodash_1 = require("lodash");
const AIS_WS_URL = process.env.AIS_WS_URL;
const AIS_WS_APIKEY = process.env.AIS_WS_APIKEY;
let ws = null;
let keepAliveInterval = null;
let lastSentMessage = null;
let reconnectTimeout = null;
// Mensaje de suscripción actual
let AIS_WS_SUBSCRIPTION_MESSAGE = {
    APIKey: AIS_WS_APIKEY,
    BoundingBoxes: [
        [
            [40.58414931032215, -74.13776170255952],
            [40.70866541137741, -74.06223069743936],
        ],
    ], //NY
    FilterMessageTypes: ["PositionReport"],
};
function expandBoundingBox(bbox, margin = 0.5) {
    const [[lat1, lon1], [lat2, lon2]] = bbox;
    return [
        [lat1 - margin, lon1 - margin],
        [lat2 + margin, lon2 + margin],
    ];
}
function expandBoundingBoxes(boxes, margin = 0.5) {
    return boxes.map((bbox) => expandBoundingBox(bbox, margin));
}
// Throttle to limit the frequency of sending messages. Avoid spamming the w-service.
const throttledWsSendMessage = (0, lodash_1.throttle)(() => {
    if (!ws || ws.readyState !== ws_1.default.OPEN) {
        console.error("WebSocket is not open. Cannot send message.");
        return;
    }
    const serializedMessage = JSON.stringify(AIS_WS_SUBSCRIPTION_MESSAGE);
    if (serializedMessage === lastSentMessage) {
        console.log("No changes in subscription. Skipping send.");
        return;
    }
    ws.send(serializedMessage, (err) => {
        if (err) {
            //console.error("Error while sending subscription message:", err);
        }
        else {
            console.log("Subscription message sent:", serializedMessage);
            lastSentMessage = serializedMessage;
        }
    });
}, 3000); // 1 message every 3 seconds?
// Update the subscription message when the user changes the bounding box.
const updateAISMessage = (message) => {
    // Expande todos los bounding boxes recibidos
    const expandedBoxes = expandBoundingBoxes(message.BoundingBoxes, 0.5); // 0.5 es el margen, ajústalo a tu gusto
    AIS_WS_SUBSCRIPTION_MESSAGE = Object.assign(Object.assign({}, message), { BoundingBoxes: expandedBoxes });
    throttledWsSendMessage();
};
exports.updateAISMessage = updateAISMessage;
// Initialize WebSocket
const startAISService = () => {
    console.log("Connecting to AIS WebSocket:", AIS_WS_URL);
    ws = new ws_1.default(AIS_WS_URL);
    ws.on("open", () => {
        console.log("WebSocket connected.");
        throttledWsSendMessage();
        keepAliveInterval = setInterval(() => {
            if ((ws === null || ws === void 0 ? void 0 : ws.readyState) === ws_1.default.OPEN) {
                ws.ping();
                console.log("WebSocket ping (keep alive)");
            }
        }, 30000); // ping every 30 seconds to keep the connection alive
    });
    ws.on("message", (data) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const message = JSON.parse(data.toString());
            //console.log("Received message:", message);
            if ((message === null || message === void 0 ? void 0 : message.MessageType) === "PositionReport") {
                const positionReport = (_a = message.Message) === null || _a === void 0 ? void 0 : _a.PositionReport;
                const metaData = message.MetaData;
                const normalizedTime = metaData.time_utc
                    .replace(" ", "T")
                    .replace(" +0000 UTC", "Z");
                const dateObj = new Date(normalizedTime);
                const aisData = {
                    cog: positionReport.Cog,
                    communicationState: positionReport.CommunicationState,
                    latitude: positionReport.Latitude,
                    longitude: positionReport.Longitude,
                    messageId: positionReport.MessageID,
                    navigationalStatus: positionReport.NavigationStatus,
                    positionAccuracy: positionReport.PositionAccuracy,
                    raim: positionReport.Raim,
                    rateOfTurn: positionReport.RateOfTerm,
                    repeatIndicator: positionReport.RepeatIndicator,
                    sog: positionReport.Sog,
                    spare: positionReport.Spare,
                    specialManoeuvreIndicator: positionReport.SpecialManoeuvreIndicator,
                    timestamp: positionReport.Timestamp,
                    trueHeading: positionReport.TrueHeading,
                    userId: positionReport.UserID,
                    valid: positionReport.Valid,
                    mmsi: metaData.MMSI,
                    mmsiString: metaData.MMSI_String.toString(),
                    shipName: metaData.ShipName,
                    timeUtc: dateObj,
                    position: {
                        latitude: positionReport.Latitude,
                        longitude: positionReport.Longitude,
                    },
                };
                yield ais_model_1.AISModel.create(aisData);
            }
        }
        catch (err) {
            console.error("Failed to process incoming message:", err);
        }
    }));
    ws.on("close", (code, reason) => {
        console.warn(`WebSocket closed: code=${code}, reason=${reason.toString()}`);
        cleanup();
        attemptReconnection(code);
    });
    ws.on("error", (error) => {
        console.error("WebSocket error:", error);
    });
};
exports.startAISService = startAISService;
// Clean up intervals and timeouts before reconnecting
function cleanup() {
    if (keepAliveInterval)
        clearInterval(keepAliveInterval);
    if (reconnectTimeout)
        clearTimeout(reconnectTimeout);
}
// Attempt reconnection
function attemptReconnection(code) {
    if (code === 1006 || code === 1000) {
        console.log("Attempting reconnection in 5 seconds...");
        reconnectTimeout = setTimeout(() => {
            (0, exports.startAISService)();
        }, 5000);
    }
    else {
        console.warn("Not reconnecting automatically for code:", code);
    }
}

import WebSocket from "ws";
import { AISModel } from "../models/ais.model";
import { Prisma } from "../../generated/prisma";
import { Message } from "../config/types";
import { throttle } from "lodash";

const AIS_WS_URL = process.env.AIS_WS_URL!;
const AIS_WS_APIKEY = process.env.AIS_WS_APIKEY!;

let ws: WebSocket | null = null;
let keepAliveInterval: NodeJS.Timeout | null = null;
let lastSentMessage: string | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;

// subscription message
let AIS_WS_SUBSCRIPTION_MESSAGE: Message = {
  APIKey: AIS_WS_APIKEY,
  BoundingBoxes: [
    [
      [40.58414931032215, -74.13776170255952],
      [40.70866541137741, -74.06223069743936],
    ],
  ], //NY
  FilterMessageTypes: ["PositionReport"],
};

type ActiveBox = {
  bbox: [[number, number], [number, number]];
  lastSeen: number; // timestamp
};
const activeBoundingBoxes: { [ip: string]: ActiveBox } = {};
const BBOX_TIMEOUT = 1 * 60 * 1000; // 1 minute in ms

// Expand the bounding box by a margin so that the w-service can send more data.
function expandBoundingBox(
  bbox: [[number, number], [number, number]],
  margin = 0.5
): [[number, number], [number, number]] {
  const [[lat1, lon1], [lat2, lon2]] = bbox;
  return [
    [lat1 - margin, lon1 - margin],
    [lat2 + margin, lon2 + margin],
  ];
}

function expandBoundingBoxes(
  boxes: ([number, number][] | [[number, number], [number, number]])[],
  margin = 0.5
): Array<[[number, number], [number, number]]> {
  return boxes.map((bbox) =>
    expandBoundingBox(bbox as [[number, number], [number, number]], margin)
  );
}

// Throttle to limit the frequency of sending messages. Avoid spamming the w-service.
const throttledWsSendMessage = throttle(() => {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
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
    } else {
      console.log("Subscription message sent:", serializedMessage);
      lastSentMessage = serializedMessage;
    }
  });
}, 3000); // 1 message every 3 seconds?

// Update the subscription message when the user changes the bounding box.
export const updateAISMessage = (message: Message) => {
  const expandedBoxes = expandBoundingBoxes(message.BoundingBoxes, 0.5); // expand the bounding box by a margin so that the w-service can send more data.

  AIS_WS_SUBSCRIPTION_MESSAGE = {
    ...message,
    BoundingBoxes: expandedBoxes,
  };
  throttledWsSendMessage();
};

// periodic cleanup
setInterval(() => {
  const now = Date.now();
  let changed = false;
  for (const ip in activeBoundingBoxes) {
    if (now - activeBoundingBoxes[ip].lastSeen > BBOX_TIMEOUT) {
      console.warn("Bounding box expired for ip:", ip);
      delete activeBoundingBoxes[ip];
      changed = true;
    }
  }
  if (changed) {
    updateWsSubscription();
  }
}, 60 * 1000); // every minute

function updateWsSubscription() {
  const boxes = Object.values(activeBoundingBoxes).map((entry) => entry.bbox);

  const expandedBoxes = expandBoundingBoxes(boxes, 0.5);
  AIS_WS_SUBSCRIPTION_MESSAGE = {
    ...AIS_WS_SUBSCRIPTION_MESSAGE,
    BoundingBoxes: expandedBoxes,
  };
  throttledWsSendMessage();
}

export function registerBoundingBox(
  ip: string,
  bbox: [[number, number], [number, number]]
) {
  activeBoundingBoxes[ip] = { bbox, lastSeen: Date.now() };
  updateWsSubscription();
}

// Initialize WebSocket
export const startAISService = () => {
  console.log("Connecting to AIS WebSocket:", AIS_WS_URL);
  ws = new WebSocket(AIS_WS_URL);

  ws.on("open", () => {
    console.log("WebSocket connected.");
    throttledWsSendMessage();

    keepAliveInterval = setInterval(() => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.ping();
        console.log("WebSocket ping (keep alive)");
      }
    }, 30000); // ping every 30 seconds to keep the connection alive
  });

  ws.on("message", async (data) => {
    try {
      const message = JSON.parse(data.toString());
      //console.log("Received message:", message);

      if (message?.MessageType === "PositionReport") {
        const positionReport = message.Message?.PositionReport;
        const metaData = message.MetaData;
        const normalizedTime = metaData.time_utc
          .replace(" ", "T")
          .replace(" +0000 UTC", "Z");
        const dateObj = new Date(normalizedTime);

        const aisData: Prisma.AISDataCreateInput = {
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

        await AISModel.create(aisData);
      }
    } catch (err) {
      console.error("Failed to process incoming message:", err);
    }
  });

  ws.on("close", (code, reason) => {
    console.warn(`WebSocket closed: code=${code}, reason=${reason.toString()}`);
    cleanup();
    attemptReconnection(code);
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
};

// Clean up intervals and timeouts before reconnecting
function cleanup() {
  if (keepAliveInterval) clearInterval(keepAliveInterval);
  if (reconnectTimeout) clearTimeout(reconnectTimeout);
}

// Attempt reconnection
function attemptReconnection(code: number) {
  if (code === 1006 || code === 1000) {
    console.log("Attempting reconnection in 5 seconds...");
    reconnectTimeout = setTimeout(() => {
      startAISService();
    }, 5000);
  } else {
    console.warn("Not reconnecting automatically for code:", code);
  }
}

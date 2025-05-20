import WebSocket from "ws";
import { AISModel } from "../models/ais.model";
import { AISData } from "../../generated/prisma";
import { Message } from "../config/types";

const AIS_WS_URL = process.env.AIS_WS_URL;
const AIS_WS_APIKEY = process.env.AIS_WS_APIKEY;

let AIS_WS_SUBSCRIPTION_MESSAGE: Message = {
  APIKey: AIS_WS_APIKEY!,
  BoundingBoxes: [[[0, 0]], [[0, 0]]],
  FilterMessageTypes: ["PositionReport"],
};

let ws: WebSocket | null = null;
let keepAliveInterval: NodeJS.Timeout | null = null;

export const updateAISMessage = (message: Message) => {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.error("WebSocket is not open. Cannot update message.");
    return;
  }
  console.log("[ws.service] updateAISMessage()");
  AIS_WS_SUBSCRIPTION_MESSAGE = message;
  wsSendMessage();
};

const wsSendMessage = () => {
  ws?.send(JSON.stringify(AIS_WS_SUBSCRIPTION_MESSAGE), (err) => {
    if (err) {
      console.error("Error while sending subscription message: ", err);
    } else {
      console.log(
        "Subscription message sent:",
        JSON.stringify(AIS_WS_SUBSCRIPTION_MESSAGE)
      );
    }
  });
};

export const startAISService = () => {
  ws = new WebSocket(AIS_WS_URL!);

  ws.on("open", () => {
    console.log("WebSocket connected.");
    wsSendMessage();

    keepAliveInterval = setInterval(() => {
      console.log("WebSocket keep alive");
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.error("WebSocket is not open. Cannot send ping message.");
        return;
      }
      //updateAISMessage(AIS_WS_SUBSCRIPTION_MESSAGE);
    }, 30000);
  });

  ws.on("message", async (data) => {
    const message = JSON.parse(data.toString());
    console.log(message);
    if (message?.MessageType == "PositionReport") {
      const positionReport = message.Message?.PositionReport;
      const metaData = message.MetaData;
      const normalized = metaData.time_utc
        .replace(" ", "T")
        .replace(" +0000 UTC", "Z");
      const dateObj = new Date(normalized);

      const aisData: AISData = {
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

      AISModel.create(aisData);
    }
  });

  ws.on("close", (event: WebSocket.CloseEvent) => {
    console.log("WebSocket connection closed:", JSON.stringify(event));
    clearInterval(keepAliveInterval!);
    // if (event == 1006) {
    //   console.log("Reconnecting...");
    //   setTimeout(forceReconnection, 5000); // Intenta reconectar en 5 segundos
    // }
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });

  function forceReconnection() {
    if (ws?.readyState == 3) {
      ws = new WebSocket(AIS_WS_URL!);
    } else {
      setTimeout(forceReconnection, 5000);
    }
  }
};

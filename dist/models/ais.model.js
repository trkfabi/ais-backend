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
exports.AISModel = void 0;
const db_1 = __importDefault(require("../config/db"));
const create = (_data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        //console.log(_data);
        yield db_1.default.aISData.create({ data: _data });
    }
    catch (error) {
        console.error("Failed to store AIS Data:", error);
        return [];
    }
});
const list = (minutesAgo, timeUtc) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Query to get vessels updated in the last 2 minutes and that do not repeat mmsi
        const query = `
        SELECT DISTINCT ON (mmsi) mmsi, cog, sog, latitude, longitude, "shipName", "trueHeading"
        FROM public."AISData"
        WHERE CAST("timeUtc" AS TIMESTAMP) >= CAST('${timeUtc}' AS TIMESTAMP)
        ORDER BY "mmsi", "timeUtc" DESC;
    `;
        const result = yield db_1.default.$queryRawUnsafe(query);
        return result;
    }
    catch (error) {
        console.error("Failed to fetch AIS Data:", error);
        return [];
    }
});
exports.AISModel = {
    create,
    list,
};

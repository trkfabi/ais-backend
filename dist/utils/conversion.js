"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertToDate = void 0;
const convertToDate = (date) => {
    const rawTimeUtc = date; //"2025-05-21 12:04:56.352365531 +0000 UTC";
    const cleanTimeUtc = rawTimeUtc.replace(" +0000 UTC", "Z");
    const timeUtc = new Date(cleanTimeUtc).toISOString();
    return new Date(timeUtc);
};
exports.convertToDate = convertToDate;

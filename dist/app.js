"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const ws_service_1 = require("./services/ws.service");
const vessels_route_1 = __importDefault(require("./routes/vessels.route"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use(express_1.default.json());
// public endpoint to verify it is listening
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: `Api is running in port ${PORT}`,
        results: null,
    });
});
app.use("/api/vessels", vessels_route_1.default);
// init ws
(0, ws_service_1.startAISService)();
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

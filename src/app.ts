import express from "express";
import dotenv from "dotenv";
dotenv.config();
import prisma from "./config/db";
import { startAISService } from "./services/ws.service";
import vesselsRoute from "./routes/vessels.route";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// verify it is listening
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: `Api is running in port ${PORT}`,
    results: null,
  });
});

app.use("/api/vessels", vesselsRoute);

// init ws
startAISService();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

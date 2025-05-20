import { Router } from "express";
import { VesselController } from "../controllers/vessels.controller";

const router = Router();

router.get("/", VesselController.list);

//router.get("/:id", vesselsController.getById);

export default router;

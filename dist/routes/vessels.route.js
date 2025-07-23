"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vessels_controller_1 = require("../controllers/vessels.controller");
const router = (0, express_1.Router)();
router.get("/", vessels_controller_1.VesselController.list);
//router.get("/:id", vesselsController.getById);
exports.default = router;

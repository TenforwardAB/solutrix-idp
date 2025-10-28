/**
 * Copyright (C) 2024 [TSEI]
 *
 * Created on 2024-10-26 :: 09:22 BY andrek
 */
import express from "express";
import { createLicenseKey, validateLicenseKey, deactivateLicenseKey, logActivity } from "../controllers/licenseController";
import { authMiddleware } from "../middleware/authMiddleware";
import {checkUserHasRole} from "../middleware/checkUserRoleMiddleware";

const router = express.Router();

router.post("/create", authMiddleware, checkUserHasRole("Admiral"), createLicenseKey);
router.post("/validate", validateLicenseKey);
router.post("/activity", authMiddleware, logActivity);
router.post("/deactivate", authMiddleware, checkUserHasRole("Admiral"), deactivateLicenseKey);

export default router;

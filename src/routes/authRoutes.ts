import { Router } from "express";
import { abortInteraction, login_wd, showInteraction } from "../controllers/authController.js";

const router = Router();

router.get("/:uid", showInteraction);
router.post("/:uid/login", login_wd);
router.post("/:uid/abort", abortInteraction);
router.get("/:uid/abort", abortInteraction);

export default router;

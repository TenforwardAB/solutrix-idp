import express from "express";
import {
  logout,
  refreshToken,
  wd_login,
  preAuth,
  resolveAddressInfo,
  getUserPermissions,
  sendVerificationCode,
  verifyCode
} from "../controllers/authController";
import { updateUserPassword } from "../controllers/userController";

import { getJWKS } from "../controllers/jwksController";
import { authMiddleware } from "../middleware/authMiddleware";
import { verifySystemMiddleware } from "../middleware/verifySystemMiddleware";
import { checkUserHasRole} from "../middleware/checkUserRoleMiddleware";

const router = express.Router();

router.post("/login", wd_login);
router.post("/wd_login",wd_login)
router.post("/logout", authMiddleware, logout);
router.get("/.well-known/jwks.json", getJWKS);
router.post("/refresh", refreshToken);
router.put("/change-password/:id", authMiddleware, updateUserPassword);
router.get("/permissions", authMiddleware, getUserPermissions);
router.post("/preauth", authMiddleware, preAuth);
router.post("/getadressinfo", verifySystemMiddleware, resolveAddressInfo);
router.post("/sendverificationcode",verifySystemMiddleware, sendVerificationCode);
router.post("/verifycode",verifySystemMiddleware, verifyCode)

export default router;

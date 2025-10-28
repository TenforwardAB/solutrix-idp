/**
 * Copyright (C) 2024 [TSEI]
 *
 * Created on 2024-09-23 :: 14:00 BY andrek
 */
import express from "express";
import * as userController from "../controllers/userController";
import { authMiddleware } from "../middleware/authMiddleware";
import { checkUserHasRole } from "../middleware/checkUserRoleMiddleware";
import * as jwksController from "../controllers/jwksController";

const router = express.Router();

router.get(
  "/customers",
  authMiddleware,
  checkUserHasRole("Admiral"),
  userController.getAllCustomers
);
router.get(
  "/customers/:id",
  authMiddleware,
  checkUserHasRole("Admiral"),
  userController.getCustomerById
);
router.post(
  "/customers",
  authMiddleware,
  checkUserHasRole("Admiral"),
  userController.createCustomer
);
router.put(
  "/customers/:id",
  authMiddleware,
  checkUserHasRole("Admiral"),
  userController.updateCustomer
);
router.delete(
  "/customers/:id",
  authMiddleware,
  checkUserHasRole("Admiral"),
  userController.deleteCustomer
);

router.get(
  "/users",
  authMiddleware,
  checkUserHasRole("Admiral"),
  userController.getAllUsers
);
router.get(
  "/users/:id",
  authMiddleware,
  checkUserHasRole("Admiral"),
  userController.getUserById
);
router.post(
  "/users",
  authMiddleware,
  checkUserHasRole("Admiral"),
  userController.createUser
);
router.put(
  "/users/:id",
  authMiddleware,
  checkUserHasRole("Admiral"),
  userController.updateUser
);
router.delete(
  "/users/:id",
  authMiddleware,
  checkUserHasRole("Admiral"),
  userController.deleteUser
);

router.post(
  "/keys/generate",
  authMiddleware,
  checkUserHasRole("Admiral"),
  jwksController.generateKey
);
router.post(
  "/keys/generate/:customerId",
  authMiddleware,
  checkUserHasRole("Admiral"),
  jwksController.addKeyForCustomer
);
router.delete(
  "/keys/:keyId",
  authMiddleware,
  checkUserHasRole("Admiral"),
  jwksController.deleteKeyByKeyId
);
router.delete(
  "/keys/customer/:customerId",
  authMiddleware,
  checkUserHasRole("Admiral"),
  jwksController.deleteKeysByCustomerId
);

export default router;

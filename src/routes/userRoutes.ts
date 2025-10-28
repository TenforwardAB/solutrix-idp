/**
 * This file is licensed under the European Union Public License (EUPL) v1.2.
 * You may only use this work in compliance with the License.
 * You may obtain a copy of the License at:
 *
 * https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed "as is",
 * without any warranty or conditions of any kind.
 *
 * Copyright (c) 2024- Tenforward AB. All rights reserved.
 *
 * Created on 5/24/25 :: 9:44 PM BY joyider <andre(-at-)sess.se>
 *
 * This file :: userRoutes.ts is part of the solutrix-api project.
 */
import express from "express";
import * as userController from "../controllers/userController";
import {authMiddleware} from "../middleware/authMiddleware";
import {checkUserHasRole} from "../middleware/checkUserRoleMiddleware";
import { verifySystemMiddleware } from "../middleware/verifySystemMiddleware";


const router = express.Router();

router.post(
    "/create",
    verifySystemMiddleware,
    userController.createUser
);

export default router;
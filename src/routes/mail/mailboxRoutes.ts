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
 * Created on 12/20/24 :: 11:24AM BY joyider <andre(-at-)sess.se>
 *
 * This file :: mailboxRoutes.ts is part of the solutrix-api project.
 */

import { Router } from "express";
import { MailboxController } from "../../controllers/mail/mailboxController";
import { authMiddleware } from "../../middleware/authMiddleware";

const mailboxrouter = Router();
const mailboxController = new MailboxController();

/**
 * Route: GET /mailboxes/:userId
 * Description: Fetch all mailboxes for a given user.
 * Query Parameters:
 * - specialUse: boolean
 * - showHidden: boolean
 * - counters: boolean
 * - sizes: boolean
 */
mailboxrouter.get("/", authMiddleware, mailboxController.listMailboxes);

export default mailboxrouter;

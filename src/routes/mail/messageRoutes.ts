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
 * Created on 12/20/24 :: 12:44PM BY joyider <andre(-at-)sess.se>
 *
 * This file :: messageRoutes.ts is part of the solutrix-api project.
 */

import { Router } from "express";

import bodyParser from "body-parser";
import { MessageController } from "../../controllers/mail/messageController";
import {authMiddleware} from "../../middleware/authMiddleware";

const messagerouter = Router();
const messageController = new MessageController();

//const largeBodyParser = bodyParser.json({ limit: "50mb" });
//const largeRawParser = express.json({  limit: "50mb" });

messagerouter.get("/search", authMiddleware, messageController.searchMessages);

/**
 * Route: GET /messages/:mailboxId
 * Description: Fetch messages for a specific mailbox and user.
 * Query Parameters:
 * - unseen: boolean
 * - metaData: boolean
 * - threadCounters: boolean
 * - limit: number
 * - order: "asc" or "desc"
 * - next: string
 * - previous: string
 * - includeHeaders: string
 */
messagerouter.get("/:mailboxId([0-9a-fA-F]{24})", authMiddleware, messageController.listMessages);
messagerouter.put("/:mailboxId([0-9a-fA-F]{24})/messages", authMiddleware, messageController.updateMessages);
messagerouter.get('/:mailboxId([0-9a-fA-F]{24})/attachment/:messageId/:attachmentId', authMiddleware, messageController.getAttachment);
messagerouter.get("/:mailboxId([0-9a-fA-F]{24})/:messageId", authMiddleware, messageController.getMessage);

/**
 * Route: POST /send
 * Description: Súbmits a message for transmistion.
 * Payload Parameters:
 * - payload
 */
messagerouter.post("/send",  authMiddleware, messageController.sendMessage);

messagerouter.delete("/:mailboxId([0-9a-fA-F]{24})/:messageId", authMiddleware, messageController.deleteMessage);



export default messagerouter;

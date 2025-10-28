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
 * Created on 12/20/24 :: 12:43PM BY joyider <andre(-at-)sess.se>
 *
 * This file :: messageController.ts is part of the solutrix-api project.
 */
import { Request, Response } from "express";
import { MessageService } from "../../services/mail/messageService";
import { logger} from "../../services/loggerService";

const messageService = new MessageService();

export class MessageController {
    async listMessages(req: Request, res: Response) {
        // @ts-ignore
        const userId = req['X-API-UserID'];
        const mailboxId = req.params.mailboxId;
        const params = req.query;

        try {
            const messages = await messageService.getMessages(userId, mailboxId, params);
            res.status(200).json({ success: true, messages });
        } catch (error) {
            console.error("Error fetching messages:", error);
            res.status(500).json({ success: false, message: error });
        }
    }

    async getMessage(req: Request, res: Response) {
        // @ts-ignore
        const userId = req['X-API-UserID'];
        const mailboxId = req.params.mailboxId;
        const messageId = parseInt(req.params.messageId, 10);
        const params = req.query;

        if (isNaN(messageId)) {
            return res.status(400).json({ success: false, message: "Invalid message ID" });
        }

        try {
            const message = await messageService.getMessage(userId, mailboxId, messageId, params);
            res.status(200).json({ success: true, message });
        } catch (error) {
            console.error("Error fetching message details:", error);
            res.status(500).json({ success: false, message: error });
        }
    }

     async sendMessage(req: Request, res: Response): Promise<Response | void> {
        // @ts-ignore
        const userId = req['X-API-UserID'];
        const payload = req.body;

        if (!payload || !payload.mailbox || !payload.from || !payload.to ) {
            return res.status(400).json({ success: false, message: "Missing required fields in payload" });
        }

        try {
            const result = await messageService.sendMessage(userId, payload);
            return res.status(200).json({ success: true, message: result.message });
        } catch (error: any) {
            console.error("Error sending message:", error);
            return res.status(500).json({ success: false, message: error.message || "Error sending message" });
        }
    }

    async getAttachment(req: Request, res: Response) {
        // @ts-ignore
        const userId = req['X-API-UserID'];
        const mailboxId = req.params.mailboxId;
        const messageId = parseInt(req.params.messageId, 10);
        const attachmentId = req.params.attachmentId;
        const sendAsString = req.query.sendAsString === 'true';

        if (isNaN(messageId)) {
            return res.status(400).json({ success: false, message: "Invalid message ID" });
        }

        if (!attachmentId) {
            return res.status(400).json({ success: false, message: "Missing attachment ID" });
        }

        try {
            const attachmentData = await messageService.getAttachment(userId, mailboxId, messageId, attachmentId, sendAsString);


            res.set('Content-Type', 'application/octet-stream');


            if (attachmentData instanceof Buffer) {
                res.send(attachmentData);
            } else if (attachmentData && typeof attachmentData.pipe === 'function') {
                attachmentData.pipe(res);
            } else {

                res.send(attachmentData);
            }
        } catch (error) {
            console.error("Error fetching attachment:", error);
            res.status(500).json({ success: false, message: error });
        }
    }

    async deleteMessage(req: Request, res: Response) {
        // @ts-ignore
        const userId = req['X-API-UserID'];
        const mailboxId = req.params.mailboxId;
        const messageId = parseInt(req.params.messageId, 10);
        const params = req.query;

        if (isNaN(messageId)) {
            return res.status(400).json({ success: false, message: "Invalid message ID" });
        }

        try {
            const message = await messageService.deleteMessage(userId, mailboxId, messageId, params);
            res.status(200).json({ success: true, message });
        } catch (error) {
            console.error("Error deleting Message:", error);
            res.status(500).json({ success: false, message: error });
        }
    }

    async updateMessages(req: Request, res: Response) {
        // @ts-ignore
        const userId = req['X-API-UserID'];
        const mailboxId = req.params.mailboxId;
        const data = req.body;

        if (!data || !data.message) {
            return res.status(400).json({ success: false, message: "Missing required field: message" });
        }

        try {
            const result = await messageService.updateMessages(userId, mailboxId, data);
            res.status(200).json({ success: true, result });
        } catch (error) {
            console.error("Error updating messages:", error);
            res.status(500).json({ success: false, message: error });
        }
    }

    /**
     * Searches for messages for a user.
     */
    async searchMessages(req: Request, res: Response) {
        console.log("Params:");
        // @ts-ignore
        const userId: string = req['X-API-UserID'];
        const params = req.query as Record<string, any>;


        try {
            const results = await messageService.searchMessages(userId, params);
            res.status(200).json(results);
        } catch (error: any) {
            console.log('Error searching messages: ', error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    }


}


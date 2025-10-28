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
 * Created on 12/20/24 :: 11:16AM BY joyider <andre(-at-)sess.se>
 *
 * This file :: mailboxController.ts is part of the solutrix-api project.
 */

import { logger } from "../../services/loggerService";

import { Request, Response } from "express";
import { MailboxService } from "../../services/mail/mailboxService";

const mailboxService = new MailboxService();

export class MailboxController {
    async listMailboxes(req: Request, res: Response) {
        // @ts-ignore
        const userId = req['X-API-UserID'];
        const params = req.query;

        try {
            const mailboxes = await mailboxService.getMailboxes(userId, params);
            res.status(200).json({ success: true, mailboxes });
        } catch (error) {
            // @ts-ignore
            logger.info('Error fetching mailboxes:', error.message);
            res.status(500).json({ success: false, message: error });
        }
    }
}

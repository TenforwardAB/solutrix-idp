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
 * Created on 12/20/24 :: 11:17AM BY joyider <andre(-at-)sess.se>
 *
 * This file :: mailboxService.ts is part of the solutrix-api project.
 */

import { wds } from "../../config/db";

export class MailboxService {
    async getMailboxes(userId: string, params?: object) {
        try {
            const response = await wds.mailboxes.listMailboxes(userId, params);
            if (response.success) {
                return response.results;
            } else {
                throw new Error("Failed to fetch mailboxes.");
            }
        } catch (error) {
            throw new Error(`Error fetching mailboxes: ${error}`);
        }
    }
}

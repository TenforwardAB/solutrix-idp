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
 * Created on 12/20/24 :: 12:41PM BY joyider <andre(-at-)sess.se>
 *
 * This file :: messageService.ts is part of the solutrix-api project.
 */

import {wds} from "../../config/db";
import type { UpdateMessageData, SearchParams,SearchResults } from "../../types"

export class MessageService {
    async getMessages(userId: string, mailboxId: string, params?: object) {
        try {
            return await wds.messages.listMessages(userId, mailboxId, params);
        } catch (error) {
            throw new Error(`Error fetching messages: ${error}`);
        }
    }

    async getMessage(
        userId: string,
        mailboxId: string,
        messageId: number,
        params: { markAsSeen?: boolean } = {}
    ): Promise<any> {
        params = { markAsSeen: true, ...params };

        try {
            const response = await wds.messages.getMessageInfo(userId, mailboxId, messageId, params);
            if (response.success) {
                return response;
            } else {
                throw new Error('Failed to fetch message details');
            }
        } catch (error) {
            throw new Error(`Error fetching message details: ${error}`);
        }
    }

    /**
     * Submits an email message for delivery (or upload-only) from a user account.
     *
     * @param userId - The ID of the user sending the email.
     * @param payload - An object containing all email details (recipients, subject, body, attachments, etc.).
     * @returns A Promise that resolves to an object containing a success flag and message details.
     *
     * @example
     * const payload = {
     *   mailbox: "mailbox123",
     *   from: { name: "John Doe", address: "john@example.com" },
     *   to: [{ name: "Jane Doe", address: "jane@example.com" }],
     *   subject: "Hello from WildDuck",
     *   text: "This is a test email.",
     *   // ... other properties as needed
     * };
     *
     * sendMessage("507f1f77bcf86cd799439011", payload)
     *    .then(response => console.log(response))
     *    .catch(error => console.error(error));
     */
    async  sendMessage(
        userId: string,
        payload: {
            mailbox: string;
            from: { name: string; address: string };
            replyTo?: { name: string; address: string };
            to: { name: string; address: string }[];
            cc?: { name: string; address: string }[];
            bcc?: { name: string; address: string }[];
            headers?: { key: string; value: string }[];
            subject: string;
            text: string;
            html?: string;
            attachments?: {
                filename: string;
                contentType: string;
                encoding?: string;
                contentTransferEncoding?: string;
                contentDisposition?: "inline" | "attachment";
                content: string;
                cid?: string;
            }[];
            meta?: Record<string, any>;
            sess?: string;
            ip?: string;
            reference?: {
                mailbox: string;
                id: number;
                action: "reply" | "replyAll" | "forward";
            };
            isDraft?: boolean;
            draft?: { mailbox: string; id: number };
            sendTime?: string;
            uploadOnly?: boolean;
            envelope?: {
                from: { name?: string; address: string };
                to: { name?: string; address: string }[];
            };
        }
    ): Promise<{
        success: boolean;
        message: {
            mailbox: string;
            id: number;
            queueId: string;
        };
    }> {
        console.log(payload);
        return new Promise(async (resolve, reject) => {
            try {
                const response = await wds.submission.submitMessage(userId, payload);

                if (response.success) {
                    resolve(response);
                } else {
                    reject(new Error("Failed to send message"));
                }
            } catch (error) {
                reject(new Error(`Error sending message: ${error}`));
            }
        });
    }

    async getAttachment(userId: string, mailboxId: string, messageId: number, attachmentId: string, sendAsString: boolean = false): Promise<any> {
        try {
            return await wds.messages.downloadAttachment(userId, mailboxId, messageId, attachmentId, sendAsString);
        } catch (error) {
            throw new Error(`Error fetching messages: ${error}`);
        }
    }

    async deleteMessage(userId: string, mailboxId: string, messageId: number,params?: object): Promise<any> {
        try {
            return await wds.messages.deleteMessage(userId, mailboxId, messageId, params);
        } catch (error) {
            throw new Error(`Error deleting message: ${error}`);
        }
    }

    async updateMessages(userId: string, mailboxId: string, data: UpdateMessageData): Promise<any> {
        try {
            return await wds.messages.updateMessages(userId, mailboxId, data);
        } catch (error) {
            throw new Error(`Error updating messages: ${error}`);
        }
    }

    /**
     * Searches for messages matching specified criteria.
     *
     * @param {string} userId - The user's ID.
     * @param {SearchParams} [params] - Optional parameters to filter and page through the results.
     * @param {string} [params.q] - Additional query string.
     * @param {string} [params.mailbox] - ID of the mailbox.
     * @param {string} [params.id] - Message ID values (used with mailbox).
     * @param {string} [params.thread] - Thread ID.
     * @param {string} [params.query] - Full-text search string.
     * @param {string} [params.datestart] - Earliest message store date.
     * @param {string} [params.dateend] - Latest message store date.
     * @param {string} [params.from] - Partial match on "From" header.
     * @param {string} [params.to] - Partial match on "To" or "Cc" headers.
     * @param {string} [params.subject] - Partial match on "Subject" header.
     * @param {number} [params.minSize] - Minimum message size in bytes.
     * @param {number} [params.maxSize] - Maximum message size in bytes.
     * @param {boolean} [params.attachments] - Only messages with attachments.
     * @param {boolean} [params.flagged] - Only flagged messages.
     * @param {boolean} [params.unseen] - Only unseen messages.
     * @param {boolean} [params.searchable] - Exclude Junk/Trash folders.
     * @param {string} [params.includeHeaders] - Comma-separated headers to include.
     * @param {boolean} [params.threadCounters] - Include thread message counts.
     * @param {number} [params.limit] - Max number of records to return.
     * @param {string} [params.order] - Sort by insert date (`"asc"` or `"desc"`).
     * @param {string} [params.next] - Cursor for next page.
     * @param {string} [params.previous] - Cursor for previous page.
     * @param {number} [params.page] - Current page number.
     * @param {string} [params.sess] - Optional session ID for logging.
     * @param {string} [params.ip] - Optional IP for logging.
     * @returns {Promise<SearchResults>} The full search response, including pagination cursors and an array of messages.
     * @throws {Error} If the API request fails or returns success=false.
     */
    async searchMessages(userId: string, params?: SearchParams): Promise<SearchResults> {
        console.log("SearchM Service");
        try {
            const response = await wds.messages.searchMessages(userId, params);
            if (!response.success) {
                throw new Error('Failed to search messages.');
            }
            return response as SearchResults;
        } catch (err) {
            throw new Error(`Error searching messages: ${err}`);
        }
    }


}

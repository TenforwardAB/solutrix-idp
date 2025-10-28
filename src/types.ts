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
 * Created on 12/11/24 :: 8:43AM BY joyider <andre(-at-)sess.se>
 *
 * This file :: types.ts is part of the fileTrekker project.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';
export type LoggerPlugin = {
    write: (level: LogLevel, message: string, meta?: Record<string, any>) => void;
};
export type UpdateMessageData = {
    message: string;
    moveTo?: string;
    seen?: boolean;
    deleted?: boolean;
    flagged?: boolean;
    draft?: boolean;
    expires?: string | boolean;
    metaData?: object;
    sess?: string;
    ip?: string;
};

/**
 * Partial recipient (To/Cc/Bcc) information.
 */
export interface Recipient {
    name?: string;
    address: string;
}

/**
 * Parameters you can pass to searchMessages.
 */
export interface SearchParams {
    q?: string;
    mailbox?: string;
    id?: string;
    thread?: string;
    query?: string;
    datestart?: string;
    dateend?: string;
    from?: string;
    to?: string;
    subject?: string;
    minSize?: number;
    maxSize?: number;
    attachments?: boolean;
    flagged?: boolean;
    unseen?: boolean;
    searchable?: boolean;
    includeHeaders?: string;
    threadCounters?: boolean;
    limit?: number;
    order?: 'asc' | 'desc';
    next?: string;
    previous?: string;
    page?: number;
    sess?: string;
    ip?: string;
}

/**
 * Each message returned in the search.results array.
 */
export interface MessageResult {
    id: number;
    mailbox: string;
    thread: string;
    threadMessageCount?: number;
    from: Recipient;
    to: Recipient[];
    cc: Recipient[];
    bcc: Recipient[];
    messageId: string;
    subject: string;
    date: string;
    idate?: string;
    intro: string;
    attachments: boolean;
    size: number;
    seen: boolean;
    deleted: boolean;
    flagged: boolean;
    draft: boolean;
    answered: boolean;
    forwarded: boolean;
    metaData?: Record<string, any>;
    headers?: Record<string, any>;
}

/**
 * The full envelope returned by searchMessages().
 */
export interface SearchResults {
    success: boolean;
    query: string;
    total: number;
    page: number;
    previousCursor: string | false;
    nextCursor: string | false;
    results: MessageResult[];
}


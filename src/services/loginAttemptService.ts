import { QueryTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const FAILURE_THRESHOLD = Number(process.env.LOGIN_FAILURE_THRESHOLD || 5);
const FAILURE_RESET_MS = Number(process.env.LOGIN_FAILURE_RESET_MINUTES || 15) * 60 * 1000;
const BACKOFF_SECONDS = [30, 60, 300, 900];

type AttemptKey = {
    key: string;
    type: "username" | "ip" | "username_ip";
};

type AttemptRow = {
    attemptKey: string;
    failureCount: number;
    lockedUntil: Date | string | null;
    lastFailureAt: Date | string;
};

const toDate = (value: Date | string | null | undefined): Date | null => {
    if (!value) {
        return null;
    }
    return value instanceof Date ? value : new Date(value);
};

export const normalizeLoginUsername = (username: string): string => username.trim().toLowerCase();

const buildAttemptKeys = (username: string, ip?: string): AttemptKey[] => {
    const normalizedUsername = normalizeLoginUsername(username);
    const normalizedIp = ip?.trim() || "unknown";

    return [
        { key: `username:${normalizedUsername}`, type: "username" },
        { key: `ip:${normalizedIp}`, type: "ip" },
        { key: `username_ip:${normalizedUsername}:${normalizedIp}`, type: "username_ip" },
    ];
};

const getBackoffSeconds = (failureCount: number): number | null => {
    if (failureCount < FAILURE_THRESHOLD) {
        return null;
    }
    const index = Math.min(failureCount - FAILURE_THRESHOLD, BACKOFF_SECONDS.length - 1);
    return BACKOFF_SECONDS[index];
};

export const getLoginBackoff = async (
    username: string,
    ip?: string,
): Promise<{ locked: boolean; lockedUntil?: Date }> => {
    const keys = buildAttemptKeys(username, ip).map((entry) => entry.key);
    const rows = await sequelize.query<Pick<AttemptRow, "lockedUntil">>(
        `
            SELECT "lockedUntil"
              FROM login_attempts
             WHERE "attemptKey" IN (:keys)
               AND "lockedUntil" IS NOT NULL
               AND "lockedUntil" > NOW()
             ORDER BY "lockedUntil" DESC
             LIMIT 1
        `,
        {
            replacements: { keys },
            type: QueryTypes.SELECT,
        },
    );

    const lockedUntil = toDate(rows[0]?.lockedUntil);
    return lockedUntil ? { locked: true, lockedUntil } : { locked: false };
};

export const recordLoginFailure = async (
    username: string,
    ip: string | undefined,
    context?: { clientId?: string; userAgent?: string },
): Promise<void> => {
    const keys = buildAttemptKeys(username, ip);
    const now = new Date();

    await sequelize.transaction(async (transaction) => {
        for (const entry of keys) {
            const rows = await sequelize.query<AttemptRow>(
                `
                    SELECT "attemptKey", "failureCount", "lockedUntil", "lastFailureAt"
                      FROM login_attempts
                     WHERE "attemptKey" = :attemptKey
                     FOR UPDATE
                `,
                {
                    replacements: { attemptKey: entry.key },
                    type: QueryTypes.SELECT,
                    transaction,
                },
            );

            const existing = rows[0];
            const lastFailureAt = toDate(existing?.lastFailureAt);
            const expired = !lastFailureAt || now.getTime() - lastFailureAt.getTime() > FAILURE_RESET_MS;
            const failureCount = existing && !expired ? existing.failureCount + 1 : 1;
            const backoffSeconds = getBackoffSeconds(failureCount);
            const lockedUntil = backoffSeconds ? new Date(now.getTime() + backoffSeconds * 1000) : null;

            await sequelize.query(
                `
                    INSERT INTO login_attempts (
                        "attemptKey", "keyType", "failureCount", "lockedUntil",
                        "firstFailureAt", "lastFailureAt", "createdAt", "updatedAt"
                    )
                    VALUES (
                        :attemptKey, :keyType, :failureCount, :lockedUntil,
                        NOW(), NOW(), NOW(), NOW()
                    )
                    ON CONFLICT ("attemptKey") DO UPDATE SET
                        "failureCount" = EXCLUDED."failureCount",
                        "lockedUntil" = EXCLUDED."lockedUntil",
                        "firstFailureAt" = CASE
                            WHEN login_attempts."lastFailureAt" < :resetCutoff THEN NOW()
                            ELSE login_attempts."firstFailureAt"
                        END,
                        "lastFailureAt" = NOW(),
                        "updatedAt" = NOW()
                `,
                {
                    replacements: {
                        attemptKey: entry.key,
                        keyType: entry.type,
                        failureCount,
                        lockedUntil,
                        resetCutoff: new Date(now.getTime() - FAILURE_RESET_MS),
                    },
                    transaction,
                },
            );
        }
    });

    console.warn("login failure recorded", {
        username: normalizeLoginUsername(username),
        ip: ip || "unknown",
        clientId: context?.clientId,
        userAgent: context?.userAgent,
    });
};

export const resetLoginFailures = async (username: string, ip?: string): Promise<void> => {
    const normalizedUsername = normalizeLoginUsername(username);
    const normalizedIp = ip?.trim() || "unknown";
    const keys = [`username:${normalizedUsername}`, `username_ip:${normalizedUsername}:${normalizedIp}`];

    await sequelize.query(
        `
            DELETE FROM login_attempts
             WHERE "attemptKey" IN (:keys)
        `,
        {
            replacements: { keys },
            type: QueryTypes.DELETE,
        },
    );
};

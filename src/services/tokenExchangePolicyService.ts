import models from "../config/db.js";
import type { token_exchange_policiesAttributes } from "../models/token_exchange_policies.js";
import type { token_exchange_eventsAttributes } from "../models/token_exchange_events.js";

const NORMALIZED_WILDCARD = "*";

/**
 * Normalize a string or array value into a deduplicated string array.
 *
 * @param value - Value to normalize.
 * @returns Array of trimmed strings.
 */
const normalizeArray = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value
            .map((item) => String(item).trim())
            .filter((item) => item.length > 0);
    }
    if (typeof value === "string") {
        return value
            .split(/[\s,]+/)
            .map((item) => item.trim())
            .filter((item) => item.length > 0);
    }
    return [];
};

export interface FindPolicyOptions {
    clientId: string;
    subject: string | undefined;
    subjectTokenType: string;
    requestedAudience: string;
    actorPresent: boolean;
}

type TokenExchangePolicyAttributes = Omit<
    token_exchange_policiesAttributes,
    "subjectTokenTypes" | "audiences" | "scopes"
> & {
    subjectTokenTypes: string[];
    audiences: string[];
    scopes?: string[] | null;
};

type TokenExchangeEventAttributes = Omit<
    token_exchange_eventsAttributes,
    "requestedScopes" | "grantedScopes"
> & {
    requestedScopes?: string[] | null;
    grantedScopes?: string[] | null;
};

/**
 * Convert the raw Sequelize record into a typed policy object.
 */
const coercePolicy = (record: any): TokenExchangePolicyAttributes => {
    const base = record.get({ plain: true }) as token_exchange_policiesAttributes;
    return {
        ...base,
        subjectTokenTypes: normalizeArray(base.subjectTokenTypes),
        audiences: normalizeArray(base.audiences),
        scopes: base.scopes ? normalizeArray(base.scopes) : null,
    };
};

export interface PolicyMatch {
    policy: TokenExchangePolicyAttributes;
}

/**
 * Check if the subject matches policy requirements.
 */
const matchesSubject = (policySubject: string | null, subject: string | undefined): boolean => {
    if (!policySubject || policySubject === NORMALIZED_WILDCARD) {
        return true;
    }
    if (!subject) {
        return false;
    }
    return policySubject === subject;
};

/**
 * Check if the subject token type satisfies policy constraints.
 */
const matchesTokenType = (policyTypes: string[], presentedType: string): boolean => {
    const normalized = normalizeArray(policyTypes);
    if (normalized.length === 0 || normalized.includes(NORMALIZED_WILDCARD)) {
        return true;
    }
    return normalized.includes(presentedType);
};

/**
 * Determine whether the requested audience is allowed.
 */
const matchesAudience = (policyAudiences: string[], requestedAudience: string): boolean => {
    const normalized = normalizeArray(policyAudiences);
    if (normalized.length === 0 || normalized.includes(NORMALIZED_WILDCARD)) {
        return true;
    }
    return normalized.includes(requestedAudience);
};

/**
 * Validate whether an actor token presence matches policy expectations.
 */
const matchesActorRequirement = (actorRequired: boolean, actorPresent: boolean): boolean => {
    if (!actorRequired) {
        return true;
    }
    return actorPresent;
};

/**
 * Locate the highest priority policy that matches the request.
 */
export const findApplicablePolicy = async (options: FindPolicyOptions): Promise<PolicyMatch | null> => {
    const records = await models.token_exchange_policies.findAll({
        where: {
            clientId: options.clientId,
            enabled: true,
        },
        order: [
            ["priority", "DESC"],
            ["createdAt", "ASC"],
        ],
    });

    for (const record of records) {
        const policy = coercePolicy(record);
        if (
            matchesSubject(policy.subject ?? null, options.subject) &&
            matchesTokenType(policy.subjectTokenTypes, options.subjectTokenType) &&
            matchesAudience(policy.audiences, options.requestedAudience) &&
            matchesActorRequirement(policy.actorTokenRequired, options.actorPresent)
        ) {
            return { policy };
        }
    }

    return null;
};

export interface ExchangeEventLog {
    clientId: string;
    policyId?: string | null;
    subject?: string | null;
    subjectTokenType: string;
    subjectTokenId?: string | null;
    requestedAudience?: string | null;
    grantedAudience?: string | null;
    requestedScopes?: string[];
    grantedScopes?: string[];
    actorSubject?: string | null;
    success: boolean;
    error?: string | null;
    issuedTokenId?: string | null;
}

/**
 * Persist a token exchange audit event.
 */
export const logTokenExchangeEvent = async (entry: ExchangeEventLog): Promise<void> => {
    try {
        const payload: Partial<TokenExchangeEventAttributes> = {
            clientId: entry.clientId,
            policyId: entry.policyId ?? undefined,
            subject: entry.subject ?? undefined,
            subjectTokenType: entry.subjectTokenType,
            subjectTokenId: entry.subjectTokenId ?? undefined,
            requestedAudience: entry.requestedAudience ?? undefined,
            grantedAudience: entry.grantedAudience ?? undefined,
            requestedScopes: entry.requestedScopes ?? undefined,
            grantedScopes: entry.grantedScopes ?? undefined,
            actorSubject: entry.actorSubject ?? undefined,
            success: entry.success,
            error: entry.error ?? undefined,
            issuedTokenId: entry.issuedTokenId ?? undefined,
        };
        await models.token_exchange_events.create(payload as any);
    } catch (error) {
        console.error("Failed to log token exchange event", error);
    }
};

import models from "../config/db.js";
import type { TokenExchangePolicyAttributes } from "../models/token_exchange_policy.js";
import type { TokenExchangeEventAttributes } from "../models/token_exchange_event.js";

const NORMALIZED_WILDCARD = "*";

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

export interface PolicyMatch {
    policy: TokenExchangePolicyAttributes;
}

const matchesSubject = (policySubject: string | null, subject: string | undefined): boolean => {
    if (!policySubject || policySubject === NORMALIZED_WILDCARD) {
        return true;
    }
    if (!subject) {
        return false;
    }
    return policySubject === subject;
};

const matchesTokenType = (policyTypes: string[], presentedType: string): boolean => {
    const normalized = normalizeArray(policyTypes);
    if (normalized.length === 0 || normalized.includes(NORMALIZED_WILDCARD)) {
        return true;
    }
    return normalized.includes(presentedType);
};

const matchesAudience = (policyAudiences: string[], requestedAudience: string): boolean => {
    const normalized = normalizeArray(policyAudiences);
    if (normalized.length === 0 || normalized.includes(NORMALIZED_WILDCARD)) {
        return true;
    }
    return normalized.includes(requestedAudience);
};

const matchesActorRequirement = (actorRequired: boolean, actorPresent: boolean): boolean => {
    if (!actorRequired) {
        return true;
    }
    return actorPresent;
};

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
        const policy = record.get({ plain: true }) as TokenExchangePolicyAttributes;
        if (
            matchesSubject(policy.subject, options.subject) &&
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

export const logTokenExchangeEvent = async (entry: ExchangeEventLog): Promise<void> => {
    try {
        const payload: Partial<TokenExchangeEventAttributes> = {
            clientId: entry.clientId,
            policyId: entry.policyId ?? null,
            subject: entry.subject ?? null,
            subjectTokenType: entry.subjectTokenType,
            subjectTokenId: entry.subjectTokenId ?? null,
            requestedAudience: entry.requestedAudience ?? null,
            grantedAudience: entry.grantedAudience ?? null,
            requestedScopes: entry.requestedScopes ?? null,
            grantedScopes: entry.grantedScopes ?? null,
            actorSubject: entry.actorSubject ?? null,
            success: entry.success,
            error: entry.error ?? null,
            issuedTokenId: entry.issuedTokenId ?? null,
        };
        await models.token_exchange_events.create(payload as any);
    } catch (error) {
        console.error("Failed to log token exchange event", error);
    }
};
